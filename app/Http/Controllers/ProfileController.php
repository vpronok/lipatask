<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Display the user's profile form with custom Lipatask data.
     */
    public function edit(Request $request): Response
    {
        $user = $request->user();
        
        // 1. Get Upline (Referrer)
        $user->load('referrer');
        $upline = $user->referrer ?[
            'name' => $user->referrer->username,
            'role' => $user->referrer->role,
        ] :[
            'name' => 'Admin',
            'role' => 'admin',
        ];

        // 2. Get User Stats
        $activeRefs = $user->referrals()->where('is_active', true)->count();
        $withdrawn = $user->transactions()->where('type', 'withdrawal')->where('status', 'completed')->sum('amount');
        $transactionsCount = $user->transactions()->count();

        // 3. Get Recent Activity
        $recentActivity = $user->transactions()->latest()->take(5)->get();

        return Inertia::render('Profile/Edit',[
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => session('status'),
            'stats' =>[
                'active_refs' => $activeRefs,
                'withdrawn' => number_format($withdrawn, 2),
                'transactions_count' => number_format($transactionsCount),
            ],
            'upline' => $upline,
            'recent_activity' => $recentActivity,
            'referral_link' => url('/register?ref=' . $user->referral_code),
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $request->user()->fill($request->validated());

        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }

        $request->user()->save();

        return Redirect::route('profile.edit');
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }
}