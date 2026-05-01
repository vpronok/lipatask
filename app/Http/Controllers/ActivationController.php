<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Setting;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;

class ActivationController extends Controller
{
    public function index(Request $request)
    {
        if ($request->user()->is_active) {
            return redirect()->route('dashboard');
        }

        $fee = Setting::where('key', 'activation_fee')->first()?->value ?? 0;
        
        return Inertia::render('Auth/Activation',[
            'fee' => $fee,
            'phone' => $request->user()->phone
        ]);
    }

    public function initiatePayment(Request $request)
    {
        $user = $request->user();
        $feeValue = Setting::where('key', 'activation_fee')->first()?->value ?? 0;

        $username = env('PAYHERO_USERNAME');
        $password = env('PAYHERO_PASSWORD');
        $channelIdValue = env('PAYHERO_CHANNEL_ID');

        if (!$username || !$password || !$channelIdValue) {
            return back()->withErrors(['pay' => 'Payment gateway is not configured in the .env file yet.']);
        }

        $reference = 'ACT_' . $user->id . '_' . time(); 
        $callbackUrl = url('/api/payhero/callback');

        try {
            require_once base_path('vendor/payherokenya/payhero-php/ph-class.php');
            $payHeroAPI = new \PayHeroAPI($username, $password);
            
            $response = $payHeroAPI->SendCustomerMpesaStkPush(
                (float) $feeValue, 
                $user->phone, 
                (int) $channelIdValue, 
                $reference, 
                $callbackUrl
            );

            $result = json_decode($response, true);

            if (isset($result['success']) && $result['success'] === false) {
                $errorMsg = $result['message'] ?? 'Invalid payment request.';
                return back()->withErrors(['pay' => 'PayHero Error: ' . $errorMsg]);
            }

            if (isset($result['error_code']) && $result['error_code'] === 'NOT_FOUND') {
                return back()->withErrors(['pay' => 'PayHero Error: Channel ID (' . $channelIdValue . ') not found.']);
            }

            return back()->with('success', 'Prompt Sent');

        } catch (\Exception $e) {
            return back()->withErrors(['pay' => 'Failed to connect to PayHero servers. Please try again.']);
        }
    }

    // --- NEW METHOD FOR REACT TO POLL CONTINUOUSLY ---
    public function checkStatus(Request $request)
    {
        $user = $request->user();
        
        // If the webhook already caught it, return success immediately
        if ($user->is_active) {
            return response()->json(['status' => 'success']);
        }

        $username = env('PAYHERO_USERNAME');
        $password = env('PAYHERO_PASSWORD');

        try {
            // Check PayHero manually for recent transactions
            $response = \Illuminate\Support\Facades\Http::withBasicAuth($username, $password)
                ->get('https://backend.payhero.co.ke/api/v2/transactions');

            if ($response->successful()) {
                $transactions = $response->json()['data'] ??[];

                foreach ($transactions as $tx) {
                    // If we find a successful transaction matching this phone number
                    if (str_contains($tx['sender_phone'] ?? '', substr($user->phone, -9))) {
                        
                        if (strtoupper($tx['status']) === 'SUCCESS') {
                            
                            $user->update(['is_active' => true]);

                            // Award Signup Bonus
                            $signupBonus = Setting::where('key', 'signup_bonus')->first()?->value ?? 0;
                            if ($signupBonus > 0 && !$user->transactions()->where('description', 'Welcome Signup Bonus')->exists()) {
                                $user->transactions()->create(['amount' => $signupBonus, 'type' => 'bonus', 'wallet' => 'main', 'status' => 'completed', 'description' => 'Welcome Signup Bonus']);
                            }

                            // Award Referrer Bonus
                            if ($user->referred_by) {
                                $refBonus = Setting::where('key', 'referral_bonus')->first()?->value ?? 0;
                                if ($refBonus > 0) {
                                    $referrer = User::find($user->referred_by);
                                    if ($referrer && !$referrer->transactions()->where('description', 'Activation commission for ' . $user->username)->exists()) {
                                        $referrer->transactions()->create(['amount' => $refBonus, 'type' => 'commission', 'wallet' => 'team', 'status' => 'completed', 'description' => 'Activation commission for ' . $user->username]);
                                    }
                                }
                            }
                            return response()->json(['status' => 'success']);
                        }

                        if (strtoupper($tx['status']) === 'FAILED' || strtoupper($tx['status']) === 'CANCELLED') {
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

    public function callback(Request $request)
    {
        // (Keep the existing callback method intact just in case the server is live and catches it first)
        $status = $request->input('status') ?? $request->input('ResultDesc');
        $reference = $request->input('external_reference') ?? '';
        $isSuccess = stripos((string)$status, 'Success') !== false;

        if ($isSuccess && str_starts_with($reference, 'ACT_')) {
            $parts = explode('_', $reference);
            $userId = $parts[1] ?? null;

            if ($userId) {
                $user = User::find($userId);
                if ($user && !$user->is_active) {
                    $user->update(['is_active' => true]);
                    
                    $signupBonus = Setting::where('key', 'signup_bonus')->first()?->value ?? 0;
                    if ($signupBonus > 0) {
                        $user->transactions()->create(['amount' => $signupBonus, 'type' => 'bonus', 'wallet' => 'main', 'status' => 'completed', 'description' => 'Welcome Signup Bonus']);
                    }

                    if ($user->referred_by) {
                        $refBonus = Setting::where('key', 'referral_bonus')->first()?->value ?? 0;
                        if ($refBonus > 0) {
                            $referrer = User::find($user->referred_by);
                            if ($referrer) {
                                $referrer->transactions()->create(['amount' => $refBonus, 'type' => 'commission', 'wallet' => 'team', 'status' => 'completed', 'description' => 'Activation commission for ' . $user->username]);
                            }
                        }
                    }
                }
            }
        }
        return response()->json(['status' => 'received']);
    }
}