<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class UserDashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        // 1. Team Wallet Balance (Referrals)
        $teamEarnings = $user->transactions()->where('wallet', 'team')->whereIn('type',['earning', 'commission', 'bonus'])->sum('amount');
        $teamWithdrawals = $user->transactions()->where('wallet', 'team')->where('type', 'withdrawal')->whereIn('status', ['completed', 'pending'])->sum('amount');
        $teamBalance = max(0, $teamEarnings - $teamWithdrawals);

        // 2. Main Wallet Balance (Deposits & Signup Bonus)
        $mainEarnings = $user->transactions()->where('wallet', 'main')->whereIn('type', ['earning', 'commission', 'bonus', 'recharge'])->sum('amount');
        $mainWithdrawals = $user->transactions()->where('wallet', 'main')->where('type', 'withdrawal')->whereIn('status', ['completed', 'pending'])->sum('amount');
        $mainBalance = max(0, $mainEarnings - $mainWithdrawals);

        // 3. Task Wallet Balance (Chat To Earn)
        $taskEarnings = $user->transactions()->where('wallet', 'task')->whereIn('type', ['earning', 'commission', 'bonus'])->sum('amount');
        $taskWithdrawals = $user->transactions()->where('wallet', 'task')->where('type', 'withdrawal')->whereIn('status',['completed', 'pending'])->sum('amount');
        $taskBalance = max(0, $taskEarnings - $taskWithdrawals);

        // 4. Global Platform Stats
        $totalWithdrawn = $user->transactions()->where('type', 'withdrawal')->where('status', 'completed')->sum('amount');
        $totalEarned = $user->transactions()->whereIn('type', ['earning', 'commission', 'bonus'])->sum('amount');
        $todayEarnings = $user->transactions()->whereIn('type', ['earning', 'commission', 'bonus'])->whereDate('created_at', today())->sum('amount');
        $commissions = $user->transactions()->where('type', 'commission')->sum('amount');

        return Inertia::render('Dashboard',[
            'wallets' =>[
                'main' => number_format($mainBalance, 2, '.', ''),
                'team' => number_format($teamBalance, 2, '.', ''),
                'task' => number_format($taskBalance, 2, '.', ''),
                'withdrawn' => number_format($totalWithdrawn, 2, '.', ''),
                'total' => number_format($totalEarned, 2, '.', ''),
                'today' => number_format($todayEarnings, 2, '.', ''),
                'commissions' => number_format($commissions, 2, '.', ''),
            ],
            'referral_stats' =>[
                'invited' => $user->referrals()->count(),
                'activated' => $user->referrals()->where('is_active', true)->count(),
                'link' => url('/register?ref=' . $user->referral_code),
            ]
        ]);
    }
}