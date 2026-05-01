<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class LeaderboardController extends Controller
{
    public function index(Request $request)
    {
        $currentUser = $request->user();

        // Get top 50 users ranked by ACTIVE referrals
        $rankings = User::withCount(['referrals as active_referrals' => function ($query) {
            $query->where('is_active', true);
        }])
        ->orderByDesc('active_referrals')
        ->orderBy('id', 'asc') // Tie-breaker
        ->take(50)
        ->get()
        ->map(function ($user, $index) {
            return[
                'id' => $user->id,
                'rank' => $index + 1,
                'username' => $user->username,
                'active_referrals' => $user->active_referrals,
            ];
        });

        // Find current user's rank
        $userRank = $rankings->search(fn($u) => $u['id'] === $currentUser->id);
        $userRankDisplay = $userRank !== false ? ($userRank + 1) : '50+';
        $userActiveRefs = $currentUser->referrals()->where('is_active', true)->count();

        // Calculate Week Start and End Dates for the UI
        $now = Carbon::now();
        $weekStart = $now->copy()->startOfWeek()->format('M d');
        $weekEnd = $now->copy()->endOfWeek()->format('M d, Y');
        $timerEnd = $now->copy()->endOfWeek()->toIso8601String();

        return Inertia::render('Leaderboard',[
            'rankings' => $rankings,
            'currentUserStat' =>[
                'rank' => $userRankDisplay,
                'referrals' => $userActiveRefs,
            ],
            'timeframe' =>[
                'display' => "{$weekStart} - {$weekEnd}",
                'end_date' => $timerEnd,
            ]
        ]);
    }
}