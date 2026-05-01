<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create(Request $request): Response
    {
        $referrerName = 'Admin'; // Default inviter
        $refCode = $request->query('ref');

        // If a referral link is used, look up that user's name
        if ($refCode) {
            $referrer = User::where('referral_code', $refCode)->first();
            if ($referrer) {
                $referrerName = $referrer->username; // Or $referrer->name
            }
        }

        return Inertia::render('Auth/Register', [
            'referrerName' => $referrerName,
            'refCode' => $refCode ?? '',
        ]);
    }

    /**
     * Handle an incoming registration request.
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            // Laravel defaults require 'name', so we will duplicate username into name behind the scenes
            'username' => 'required|string|max:255|unique:users',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            // Ensure Kenyan number starting with 07 or 01 and exactly 10 digits
            'phone' => ['required', 'string', 'regex:/^(07|01)[0-9]{8}$/'], 
            'password' => ['required', Rules\Password::defaults()],
            'terms' => 'accepted', // Validate the checkbox
        ], [
            'phone.regex' => 'Please enter a valid Kenyan phone number (e.g. 0712345678).',
            'terms.accepted' => 'You must agree to the Terms of Service.',
        ]);

        // Default to Admin ID (Assumes your first user created is the admin. Adjust if necessary)
        $adminUser = User::where('role', 'admin')->first();
        $referredBy = $adminUser ? $adminUser->id : null; 

        if ($request->filled('referring_code')) {
            $referrer = User::where('referral_code', $request->referring_code)->first();
            if ($referrer) {
                $referredBy = $referrer->id;
            }
        }

        $user = User::create([
            'name' => $request->username, // Using username as their name to keep UI clean
            'username' => $request->username,
            'email' => $request->email,
            'phone' => $request->phone,
            'password' => Hash::make($request->password),
            'referred_by' => $referredBy,
        ]);

        event(new Registered($user));

        Auth::login($user);

        return redirect(route('dashboard', absolute: false));
    }
}
