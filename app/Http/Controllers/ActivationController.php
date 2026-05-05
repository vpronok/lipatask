<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Setting;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use App\Mail\WelcomeEmail;
use App\Mail\ReferralEarned;

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

        $username = config('services.payhero.username');
        $password = config('services.payhero.password');
        $channelIdValue = config('services.payhero.channel_id');

        if (!$username || !$password || !$channelIdValue) {
            return back()->withErrors(['pay' => 'Payment gateway is not configured correctly on the server.']);
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
                Log::error('PayHero API Package Error: ' . $response);
                return back()->withErrors(['pay' => 'PayHero Error: ' . $errorMsg]);
            }

            if (isset($result['error_code']) && $result['error_code'] === 'NOT_FOUND') {
                return back()->withErrors(['pay' => 'PayHero Error: Your Channel ID (' . $channelIdValue . ') was not found.']);
            }

            return back()->with('success', 'Prompt Sent');

        } catch (\Exception $e) {
            Log::error('PayHero Connection Error: ' . $e->getMessage());
            return back()->withErrors(['pay' => 'Failed to connect to PayHero servers. Please try again.']);
        }
    }

    public function checkStatus(Request $request)
    {
        $user = $request->user();
        
        if ($user->is_active) {
            return response()->json(['status' => 'success']);
        }

        $username = config('services.payhero.username');
        $password = config('services.payhero.password');

        try {
            $response = \Illuminate\Support\Facades\Http::withBasicAuth($username, $password)
                ->get('https://backend.payhero.co.ke/api/v2/transactions');

            if ($response->successful()) {
                $transactions = $response->json()['data'] ??[];
                $phoneSuffix = substr(trim($user->phone), -9);

                foreach ($transactions as $tx) {
                    $txPhone = $tx['sender_phone'] ?? $tx['phone_number'] ?? $tx['Phone'] ?? '';
                    $txStatus = strtoupper($tx['status'] ?? $tx['Status'] ?? '');

                    if (str_contains($txPhone, $phoneSuffix)) {
                        if ($txStatus === 'SUCCESS') {
                            $this->activateUser($user);
                            return response()->json(['status' => 'success']);
                        }

                        if (in_array($txStatus, ['FAILED', 'CANCELLED'])) {
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
        $data = $request->all();
        Log::info('PayHero Webhook Received: ', $data);

        $payload = $request->input('response') ?? $data;

        $status = $payload['Status'] ?? $payload['status'] ?? $payload['ResultDesc'] ?? '';
        $reference = $payload['ExternalReference'] ?? $payload['external_reference'] ?? '';
        $amount = $payload['Amount'] ?? $payload['amount'] ?? $payload['TransAmount'] ?? 0;

        $isSuccess = stripos((string)$status, 'Success') !== false || stripos((string)$status, 'processed successfully') !== false;

        if ($isSuccess) {
            
            // 1. Handle Account Activations (ACT_)
            if (str_starts_with($reference, 'ACT_')) {
                $parts = explode('_', $reference);
                $userId = $parts[1] ?? null;

                if ($userId) {
                    $user = User::find($userId);
                    if ($user && !$user->is_active) {
                        $this->activateUser($user);
                    }
                }
            } 
            
            // 2. Handle Wallet Recharges (RCH_)
            elseif (str_starts_with($reference, 'RCH_')) {
                $parts = explode('_', $reference);
                $userId = $parts[1] ?? null;

                if ($userId && $amount > 0) {
                    $user = User::find($userId);
                    if ($user) {
                        $exists = $user->transactions()->where('description', "M-Pesa Deposit ($reference)")->exists();
                        if (!$exists) {
                            $user->transactions()->create([
                                'amount' => $amount,
                                'type' => 'earning',
                                'wallet' => 'main',
                                'status' => 'completed',
                                'description' => "M-Pesa Deposit ($reference)"
                            ]);
                        }
                    }
                }
            }

            // 3. Handle Chat Credit Purchases (CRE_)
            elseif (str_starts_with($reference, 'CRE_')) {
                $parts = explode('_', $reference);
                $userId = $parts[1] ?? null;

                if ($userId && $amount > 0) {
                    $user = User::find($userId);
                    if ($user) {
                        $exists = $user->transactions()->where('description', "Credit Purchase ($reference)")->exists();
                        if (!$exists) {
                            $user->increment('credits', $amount);
                            $user->transactions()->create([
                                'amount' => $amount,
                                'type' => 'purchase', // Marked as purchase to avoid inflating cash balances
                                'wallet' => 'system',
                                'status' => 'completed',
                                'description' => "Credit Purchase ($reference)"
                            ]);
                        }
                    }
                }
            }

        }

        return response()->json(['status' => 'received']);
    }

    private function activateUser(User $user)
    {
        $user->update(['is_active' => true]);

        // Send Welcome Email
        try {
            Mail::to($user->email)->send(new WelcomeEmail($user));
        } catch (\Exception $e) {
            Log::error("Failed to send welcome email to {$user->email}: " . $e->getMessage());
        }

        $signupBonus = Setting::where('key', 'signup_bonus')->first()?->value ?? 0;
        if ($signupBonus > 0 && !$user->transactions()->where('description', 'Welcome Signup Bonus')->exists()) {
            $user->transactions()->create([
                'amount' => $signupBonus, 
                'type' => 'bonus', 
                'wallet' => 'main', 
                'status' => 'completed', 
                'description' => 'Welcome Signup Bonus'
            ]);
        }

        if ($user->referred_by) {
            $refBonus = Setting::where('key', 'referral_bonus')->first()?->value ?? 0;
            if ($refBonus > 0) {
                $referrer = User::find($user->referred_by);
                if ($referrer && !$referrer->transactions()->where('description', 'Activation commission for ' . $user->username)->exists()) {
                    
                    // Award Commission
                    $referrer->transactions()->create([
                        'amount' => $refBonus, 
                        'type' => 'commission', 
                        'wallet' => 'team', 
                        'status' => 'completed', 
                        'description' => 'Activation commission for ' . $user->username
                    ]);

                    // Send Email to Referrer
                    try {
                        $earnings = $referrer->transactions()->where('wallet', 'team')->whereIn('type',['earning', 'commission', 'bonus'])->sum('amount');
                        $withdrawals = $referrer->transactions()->where('wallet', 'team')->where('type', 'withdrawal')->whereIn('status',['completed', 'pending'])->sum('amount');
                        $newBalance = $earnings - $withdrawals;

                        Mail::to($referrer->email)->send(new ReferralEarned($referrer, $user->username, $refBonus, $newBalance));
                    } catch (\Exception $e) {
                        Log::error("Failed to send referral email to {$referrer->email}: " . $e->getMessage());
                    }
                }
            }
        }
    }
}