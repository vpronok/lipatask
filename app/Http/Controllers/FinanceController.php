<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Transaction;
use App\Models\Setting;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;

class FinanceController extends Controller
{
    // --- WITHDRAWAL LOGIC ---
    public function withdraw(Request $request)
    {
        $user = $request->user();

        $teamEarnings = $user->transactions()->where('wallet', 'team')->whereIn('type',['earning', 'commission', 'bonus'])->sum('amount');
        $teamWithdrawals = $user->transactions()->where('wallet', 'team')->where('type', 'withdrawal')->whereIn('status',['completed', 'pending'])->sum('amount');
        $teamBalance = $teamEarnings - $teamWithdrawals;

        $mainEarnings = $user->transactions()->where('wallet', 'main')->whereIn('type',['earning', 'commission', 'bonus'])->sum('amount');
        $mainWithdrawals = $user->transactions()->where('wallet', 'main')->where('type', 'withdrawal')->whereIn('status',['completed', 'pending'])->sum('amount');
        $mainBalance = $mainEarnings - $mainWithdrawals;

        $taskEarnings = $user->transactions()->where('wallet', 'task')->sum('amount');
        $taskWithdrawals = $user->transactions()->where('wallet', 'task')->where('type', 'withdrawal')->whereIn('status',['completed', 'pending'])->sum('amount');
        $taskBalance = $taskEarnings - $taskWithdrawals;

        $taskWithdrawalsEnabled = Setting::where('key', 'task_withdraw_active')->first()?->value === '1';
        $withdrawalFee = Setting::where('key', 'withdrawal_fee')->first()?->value ?? 20;
        
        $withdrawalFeeTiers = Setting::where('key', 'withdrawal_fee_tiers')->first()?->value;

        return Inertia::render('Finance/Withdraw',[
            'balances' =>['team' => max(0, $teamBalance), 'main' => max(0, $mainBalance), 'task' => max(0, $taskBalance)],
            'min_withdrawals' =>['team' => 170, 'main' => 155, 'task' => 155], 
            'task_enabled' => $taskWithdrawalsEnabled,
            'withdrawal_fee' => (float) $withdrawalFee,
            'withdrawal_fee_tiers' => $withdrawalFeeTiers
        ]);
    }

    public function storeWithdrawal(Request $request)
    {
        $request->validate(['wallet' => 'required|in:team,main,task', 'amount' => 'required|numeric']);
        
        $minimums =['team' => 170, 'main' => 155, 'task' => 155];
        $wallet = $request->wallet;
        $amount = (float) $request->amount;

        if ($amount < $minimums[$wallet]) {
            return back()->withErrors(['amount' => "Minimum withdrawal for {$wallet} wallet is Ksh {$minimums[$wallet]}."]);
        }
        
        if ($wallet === 'task') {
            $enabled = Setting::where('key', 'task_withdraw_active')->first()?->value === '1';
            if (!$enabled) return back()->withErrors(['amount' => 'Task wallet withdrawals are currently disabled by the admin.']);
        }
        
        $user = $request->user();
        
        $tiersJson = Setting::where('key', 'withdrawal_fee_tiers')->first()?->value;
        $feeTiers = $tiersJson ? json_decode($tiersJson, true) :[];
        $fee = (float) (Setting::where('key', 'withdrawal_fee')->first()?->value ?? 20);

        foreach($feeTiers as $tier) {
            if ($amount >= (float)$tier['min'] && $amount <= (float)$tier['max']) {
                $fee = (float)$tier['fee'];
                break; 
            }
        }

        if ($amount <= $fee) {
            return back()->withErrors(['amount' => "Amount must be greater than the Ksh {$fee} withdrawal fee."]);
        }

        $earnings = $user->transactions()->where('wallet', $wallet)->whereIn('type',['earning', 'commission', 'bonus'])->sum('amount');
        $withdrawals = $user->transactions()->where('wallet', $wallet)->where('type', 'withdrawal')->whereIn('status',['completed', 'pending'])->sum('amount');
        $balance = $earnings - $withdrawals;

        if ($amount > $balance) {
            return back()->withErrors(['amount' => 'Insufficient funds in the selected wallet.']);
        }

        $netPayout = $amount - $fee;

        $user->transactions()->create([
            'amount' => $amount, 
            'type' => 'withdrawal', 
            'wallet' => $wallet, 
            'status' => 'pending', 
            'description' => "Withdrawal Request (Fee: Ksh {$fee}, Payout: Ksh {$netPayout})",
        ]);

        return back()->with('success', 'Request submitted successfully! Net payout of Ksh ' . $netPayout . ' is pending.');
    }

    // --- RECHARGE LOGIC (PAYHERO API) ---
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
        $channelId = config('services.payhero.channel_id');

        if (!$username || !$password || !$channelId) {
            return back()->withErrors(['pay' => 'Payment gateway not configured.']);
        }

        $reference = 'RCH_' . $user->id . '_' . time(); 
        
        // Phone formatting (2547...)
        $msisdn = preg_replace('/^\+/', '', preg_replace('/^0/', '254', trim($user->phone)));
        $callbackUrl = secure_url(route('payhero.callback', [], false));

        try {
            $token = base64_encode("$username:$password");
            $response = Http::withoutVerifying()->withHeaders([
                'Authorization' => 'Basic ' . $token,
                'Content-Type' => 'application/json'
            ])->post('https://backend.payhero.co.ke/api/v2/payments', [
                'amount' => (float) $request->amount,
                'phone_number' => $msisdn,
                'channel_id' => (int) $channelId,
                'provider' => 'm-pesa',
                'external_reference' => $reference,
                'callback_url' => $callbackUrl,
            ]);

            $result = $response->json();

            if (!$response->successful() || (isset($result['success']) && $result['success'] === false)) {
                $errorMsg = $result['message'] ?? $result['error'] ?? 'Invalid payment request.';
                Log::error('PayHero Recharge API Failed: ' . $response->body());
                return back()->withErrors(['pay' => 'Payment Error: ' . $errorMsg]);
            }

            // Save specific PayHero transaction ID to poll instantly
            $txnId = $result['reference'] ?? $result['transaction_id'] ?? $reference;
            $request->session()->put('payhero_rch_txn', $txnId);

            return back()->with('success', 'Prompt Sent');

        } catch (\Exception $e) {
            Log::error('PayHero Connection Error: ' . $e->getMessage());
            return back()->withErrors(['pay' => 'Failed to connect. Try again.']);
        }
    }

    public function checkRechargeStatus(Request $request)
    {
        $user = $request->user();
        
        // Check if Webhook got it
        $recentDeposit = $user->transactions()
            ->where('wallet', 'main')
            ->where('description', 'like', 'M-Pesa Deposit (RCH_%')
            ->where('created_at', '>=', now()->subMinutes(5))
            ->first();

        if ($recentDeposit) {
            return response()->json(['status' => 'success']);
        }

        // Direct Polling to PayHero
        $txnId = $request->session()->get('payhero_rch_txn');
        if (!$txnId) {
            return response()->json(['status' => 'pending']);
        }

        try {
            $username = config('services.payhero.username');
            $password = config('services.payhero.password');
            $token = base64_encode("$username:$password");

            $response = Http::withoutVerifying()->withHeaders(['Authorization' => 'Basic ' . $token])
                ->get('https://backend.payhero.co.ke/api/v2/transaction-status', [
                    'reference' => $txnId
                ]);

            if ($response->successful()) {
                $result = $response->json();
                
                if (isset($result['success']) && $result['success']) {
                    $txStatus = strtoupper($result['status'] ?? '');
                    
                    if ($txStatus === 'SUCCESS') {
                        $txRef = $result['external_reference'] ?? $result['reference'] ?? '';
                        $txAmount = $result['amount'] ?? 0;

                        $exists = $user->transactions()->where('description', "M-Pesa Deposit ($txRef)")->exists();
                        if (!$exists) {
                            $user->transactions()->create([
                                'amount' => $txAmount, 'type' => 'earning', 'wallet' => 'main', 'status' => 'completed', 'description' => "M-Pesa Deposit ($txRef)"
                            ]);
                        }
                        $request->session()->forget('payhero_rch_txn');
                        return response()->json(['status' => 'success']);
                    }
                    if (in_array($txStatus, ['FAILED', 'CANCELLED'])) {
                        $request->session()->forget('payhero_rch_txn');
                        return response()->json(['status' => 'failed']);
                    }
                }
            }
            return response()->json(['status' => 'pending']);
        } catch (\Exception $e) {
            return response()->json(['status' => 'pending']);
        }
    }

    // --- HISTORY LOGIC ---
    public function history(Request $request)
    {
        $user = $request->user();
        
        $transactions = $user->transactions()->latest()->get();
        $paidOut = $user->transactions()->where('type', 'withdrawal')->where('status', 'completed')->sum('amount');
        $paidCount = $user->transactions()->where('type', 'withdrawal')->where('status', 'completed')->count();
        $pendingCount = $user->transactions()->where('type', 'withdrawal')->where('status', 'pending')->count();
        $totalCount = $user->transactions()->count();

        return Inertia::render('Finance/History',[
            'transactions' => $transactions,
            'stats' =>[
                'paid_out' => number_format($paidOut, 2),
                'paid_count' => $paidCount,
                'pending_count' => $pendingCount,
                'total_count' => $totalCount
            ]
        ]);
    }

    // --- BONUSES LOGIC ---
    public function bonuses(Request $request)
    {
        $user = $request->user();
        
        $activeRefs = $user->referrals()->where('is_active', true)->count();
        $bonusEarned = $user->transactions()->where('type', 'bonus')->sum('amount');

        $tiers = [['id' => 1, 'name' => 'Silver', 'required' => 65, 'reward' => 30],['id' => 2, 'name' => 'Bronze', 'required' => 150, 'reward' => 150],['id' => 3, 'name' => 'Gold', 'required' => 300, 'reward' => 300],
        ];

        $nextTier = null;
        $progressPercent = 100;

        foreach ($tiers as $tier) {
            if ($activeRefs < $tier['required']) {
                $nextTier = $tier;
                $progressPercent = ($activeRefs / $tier['required']) * 100;
                break;
            }
        }

        return Inertia::render('Finance/Bonuses',[
            'active_refs' => $activeRefs,
            'bonus_earned' => number_format($bonusEarned, 2),
            'tiers' => $tiers,
            'next_tier' => $nextTier ? $nextTier['name'] : 'Maxed Out',
            'progress_percent' => min(100, round($progressPercent, 1)),
            'bonus_history' => $user->transactions()->where('type', 'bonus')->where('description', 'like', '%Tier%')->latest()->get()
        ]);
    }
}