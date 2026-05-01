<?php
namespace App\Http\Controllers;
use Illuminate\Http\Request;
use Inertia\Inertia;

class UserDashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        return Inertia::render('Dashboard', [
            'wallets' => [
                'main' => number_format($user->transactions()->where('wallet', 'main')->sum('amount'), 2),
                'team' => number_format($user->transactions()->where('wallet', 'team')->sum('amount'), 2),
                'withdrawn' => number_format($user->transactions()->where('type', 'withdrawal')->where('status', 'completed')->sum('amount'), 2),
                'total' => number_format($user->transactions()->where('type', '!=', 'withdrawal')->sum('amount'), 2),
                'today' => number_format($user->transactions()->where('type', '!=', 'withdrawal')->whereDate('created_at', today())->sum('amount'), 2),
                'commissions' => number_format($user->transactions()->where('type', 'commission')->sum('amount'), 2),
            ],
            'referral_stats' => [
                'invited' => $user->referrals()->count(),
                'activated' => $user->referrals()->where('is_active', true)->count(),
                'link' => url('/register?ref=' . $user->referral_code),
            ]
        ]);
    }
}