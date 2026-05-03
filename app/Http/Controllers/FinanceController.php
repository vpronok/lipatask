<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Transaction;
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

        // ADD: Task Wallet Balance
        $taskEarnings = $user->transactions()->where('wallet', 'task')->sum('amount');
        $taskWithdrawals = $user->transactions()->where('wallet', 'task')->where('type', 'withdrawal')->whereIn('status',['completed', 'pending'])->sum('amount');
        $taskBalance = $taskEarnings - $taskWithdrawals;

        // ADD: Admin Toggle Check
        $taskWithdrawalsEnabled = \App\Models\Setting::where('key', 'task_withdraw_active')->first()?->value === '1';

        return Inertia::render('Finance/Withdraw',[
            'balances' =>['team' => max(0, $teamBalance), 'main' => max(0, $mainBalance), 'task' => max(0, $taskBalance)],
            'min_withdrawal' => 155,
            'task_enabled' => $taskWithdrawalsEnabled
        ]);
    }

    public function storeWithdrawal(Request $request)
    {
        $request->validate(['wallet' => 'required|in:team,main,task', 'amount' => 'required|numeric|min:155']);
        
        if ($request->wallet === 'task') {
            $enabled = \App\Models\Setting::where('key', 'task_withdraw_active')->first()?->value === '1';
            if (!$enabled) return back()->withErrors(['amount' => 'Task wallet withdrawals are currently disabled by the admin.']);
        }
        
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
            'amount' => $amount, 'type' => 'withdrawal', 'wallet' => $wallet, 'status' => 'pending', 'description' => 'Withdrawal Request',
        ]);

        return back()->with('success', 'Your withdrawal request has been submitted successfully!');
    }

    // --- RECHARGE LOGIC ---
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
            // STRICT CASTING: Ensuring the PayHero API gets exact numbers, not strings
            $payload =[
                'amount' => (float) $request->amount,
                'phone_number' => $user->phone,
                'channel_id' => (int) $channelIdValue,
                'provider' => 'm-pesa',
                'external_reference' => $reference,
                'callback_url' => $callbackUrl,
            ];

            // Use Laravel Native HTTP to guarantee request formatting and catch errors properly
            $response = Http::withBasicAuth($username, $password)
                ->acceptJson()
                ->asJson()
                ->post('https://backend.payhero.co.ke/api/v2/payments', $payload);

            $result = $response->json();

            // Catch PayHero Rejection (e.g. Invalid channel or downtime)
            if (!$response->successful() || (isset($result['success']) && $result['success'] === false)) {
                $errorMsg = $result['message'] ?? $result['error'] ?? $response->body() ?? 'Invalid payment request.';
                Log::error('PayHero Recharge API Failed: ' . $response->body());
                return back()->withErrors(['pay' => 'PayHero Error: ' . $errorMsg]);
            }

            return back()->with('success', 'Prompt Sent');

        } catch (\Exception $e) {
            Log::error('PayHero Connection Error: ' . $e->getMessage());
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