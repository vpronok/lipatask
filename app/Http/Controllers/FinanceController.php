<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Transaction;

class FinanceController extends Controller
{
    /**
     * Display the Withdrawal Page
     */
    public function withdraw(Request $request)
    {
        $user = $request->user();

        // 1. Calculate Team (Affiliate) Balance
        $teamEarnings = $user->transactions()->where('wallet', 'team')->whereIn('type', ['earning', 'commission', 'bonus'])->sum('amount');
        $teamWithdrawals = $user->transactions()->where('wallet', 'team')->where('type', 'withdrawal')->whereIn('status',['completed', 'pending'])->sum('amount');
        $teamBalance = $teamEarnings - $teamWithdrawals;

        // 2. Calculate Main Balance
        $mainEarnings = $user->transactions()->where('wallet', 'main')->whereIn('type',['earning', 'commission', 'bonus'])->sum('amount');
        $mainWithdrawals = $user->transactions()->where('wallet', 'main')->where('type', 'withdrawal')->whereIn('status',['completed', 'pending'])->sum('amount');
        $mainBalance = $mainEarnings - $mainWithdrawals;

        return Inertia::render('Finance/Withdraw', [
            'balances' =>[
                'team' => max(0, $teamBalance),
                'main' => max(0, $mainBalance),
            ],
            'min_withdrawal' => 155, // The minimum threshold from your screenshot
            'flash' => session('success') // For success messages
        ]);
    }

    /**
     * Process the Withdrawal Request
     */
    public function storeWithdrawal(Request $request)
    {
        $request->validate([
            'wallet' => 'required|in:team,main',
            'amount' => 'required|numeric|min:155', // Enforce minimum securely
        ]);

        $user = $request->user();
        $wallet = $request->wallet;
        $amount = $request->amount;

        // Double-check the exact balance at the moment of request to prevent double-spending
        $earnings = $user->transactions()->where('wallet', $wallet)->whereIn('type',['earning', 'commission', 'bonus'])->sum('amount');
        $withdrawals = $user->transactions()->where('wallet', $wallet)->where('type', 'withdrawal')->whereIn('status',['completed', 'pending'])->sum('amount');
        $balance = $earnings - $withdrawals;

        if ($amount > $balance) {
            return back()->withErrors(['amount' => 'Insufficient funds in the selected wallet.']);
        }

        // Create the Pending Withdrawal Transaction
        $user->transactions()->create([
            'amount' => $amount,
            'type' => 'withdrawal',
            'wallet' => $wallet,
            'status' => 'pending',
            'description' => 'M-Pesa Withdrawal Request',
        ]);

        return back()->with('success', 'Your withdrawal request has been submitted successfully! It is now pending admin approval.');
    }
}