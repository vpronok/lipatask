<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Transaction;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;

class FinanceController extends Controller
{
    // --- WITHDRAWAL LOGIC (Existing) ---
    public function withdraw(Request $request)
    {
        $user = $request->user();

        $teamEarnings = $user->transactions()->where('wallet', 'team')->whereIn('type', ['earning', 'commission', 'bonus'])->sum('amount');
        $teamWithdrawals = $user->transactions()->where('wallet', 'team')->where('type', 'withdrawal')->whereIn('status',['completed', 'pending'])->sum('amount');
        $teamBalance = $teamEarnings - $teamWithdrawals;

        $mainEarnings = $user->transactions()->where('wallet', 'main')->whereIn('type',['earning', 'commission', 'bonus'])->sum('amount');
        $mainWithdrawals = $user->transactions()->where('wallet', 'main')->where('type', 'withdrawal')->whereIn('status',['completed', 'pending'])->sum('amount');
        $mainBalance = $mainEarnings - $mainWithdrawals;

        return Inertia::render('Finance/Withdraw', [
            'balances' =>['team' => max(0, $teamBalance), 'main' => max(0, $mainBalance)],
            'min_withdrawal' => 155,
        ]);
    }

    public function storeWithdrawal(Request $request)
    {
        $request->validate(['wallet' => 'required|in:team,main', 'amount' => 'required|numeric|min:155']);
        $user = $request->user();
        $wallet = $request->wallet;
        $amount = $request->amount;

        $earnings = $user->transactions()->where('wallet', $wallet)->whereIn('type',['earning', 'commission', 'bonus'])->sum('amount');
        $withdrawals = $user->transactions()->where('wallet', $wallet)->where('type', 'withdrawal')->whereIn('status',['completed', 'pending'])->sum('amount');
        $balance = $earnings - $withdrawals;

        if ($amount > $balance) {
            return back()->withErrors(['amount' => 'Insufficient funds in the selected wallet.']);
        }

        $user->transactions()->create([
            'amount' => $amount, 'type' => 'withdrawal', 'wallet' => $wallet, 'status' => 'pending', 'description' => 'M-Pesa Withdrawal Request',
        ]);

        return back()->with('success', 'Your withdrawal request has been submitted successfully! It is now pending admin approval.');
    }

    // --- NEW RECHARGE LOGIC ---
    public function recharge(Request $request)
    {
        $user = $request->user();
        
        $mainEarnings = $user->transactions()->where('wallet', 'main')->whereIn('type',['earning', 'commission', 'bonus'])->sum('amount');
        $mainWithdrawals = $user->transactions()->where('wallet', 'main')->where('type', 'withdrawal')->whereIn('status',['completed', 'pending'])->sum('amount');
        $mainBalance = max(0, $mainEarnings - $mainWithdrawals);

        return Inertia::render('Finance/Recharge',[
            'main_balance' => number_format($mainBalance, 2),
            'phone' => $user->phone
        ]);
    }

    public function initiateRecharge(Request $request)
    {
        $request->validate(['amount' => 'required|numeric|min:50|max:50000']);
        
        $user = $request->user();
        $username = config('services.payhero.username');
        $password = config('services.payhero.password');
        $channelIdValue = config('services.payhero.channel_id');

        if (!$username || !$password || !$channelIdValue) {
            return back()->withErrors(['pay' => 'Payment gateway not configured.']);
        }

        $reference = 'RCH_' . $user->id . '_' . time(); 
        $callbackUrl = url('/api/payhero/callback');

        try {
            require_once base_path('vendor/payherokenya/payhero-php/ph-class.php');
            $payHeroAPI = new \PayHeroAPI($username, $password);
            
            $response = $payHeroAPI->SendCustomerMpesaStkPush((float) $request->amount, $user->phone, (int) $channelIdValue, $reference, $callbackUrl);
            $result = json_decode($response, true);

            if (isset($result['success']) && $result['success'] === false) {
                return back()->withErrors(['pay' => 'PayHero Error: ' . ($result['message'] ?? 'Failed')]);
            }
            return back()->with('success', 'Prompt Sent');
        } catch (\Exception $e) {
            return back()->withErrors(['pay' => 'Failed to connect. Try again.']);
        }
    }

    public function checkRechargeStatus(Request $request)
    {
        $user = $request->user();
        
        // 1. Check if the Webhook already deposited the money in the last 5 minutes
        $recentDeposit = $user->transactions()
            ->where('wallet', 'main')
            ->where('description', 'like', 'M-Pesa Deposit (RCH_%')
            ->where('created_at', '>=', now()->subMinutes(5))
            ->first();

        if ($recentDeposit) {
            return response()->json(['status' => 'success']);
        }

        // 2. Manual Fallback Polling
        try {
            $response = Http::withBasicAuth(config('services.payhero.username'), config('services.payhero.password'))
                ->get('https://backend.payhero.co.ke/api/v2/transactions');

            if ($response->successful()) {
                $transactions = $response->json()['data'] ??[];
                $phoneSuffix = substr(trim($user->phone), -9);

                foreach ($transactions as $tx) {
                    $txPhone = $tx['sender_phone'] ?? $tx['phone_number'] ?? $tx['Phone'] ?? '';
                    $txStatus = strtoupper($tx['status'] ?? $tx['Status'] ?? '');
                    $txRef = $tx['external_reference'] ?? $tx['ExternalReference'] ?? '';
                    $txAmount = $tx['amount'] ?? $tx['Amount'] ?? 0;

                    if (str_contains($txPhone, $phoneSuffix) && str_starts_with($txRef, 'RCH_')) {
                        if ($txStatus === 'SUCCESS') {
                            $exists = $user->transactions()->where('description', "M-Pesa Deposit ($txRef)")->exists();
                            if (!$exists) {
                                $user->transactions()->create([
                                    'amount' => $txAmount, 'type' => 'earning', 'wallet' => 'main', 'status' => 'completed', 'description' => "M-Pesa Deposit ($txRef)"
                                ]);
                            }
                            return response()->json(['status' => 'success']);
                        }
                        if ($txStatus === 'FAILED' || $txStatus === 'CANCELLED') {
                            return response()->json(['status' => 'failed']);
                        }
                    }
                }
            }
            return response()->json(['status' => 'pending']);
        } catch (\Exception $e) {
            return response()->json(['status' => 'pending']);
        }
    }
}