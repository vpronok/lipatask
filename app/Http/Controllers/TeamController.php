<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class TeamController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        
        // Fetch all users who signed up with this user's code
        $referrals = $user->referrals()->orderBy('created_at', 'desc')->get();
        
        $activeCount = $referrals->where('is_active', true)->count();
        $inactiveCount = $referrals->count() - $activeCount;

        return Inertia::render('Team', [
            'referrals' => $referrals,
            'stats' =>[
                'total' => $referrals->count(),
                'active' => $activeCount,
                'inactive' => $inactiveCount,
            ],
            'referralLink' => url('/register?ref=' . $user->referral_code),
        ]);
    }
}