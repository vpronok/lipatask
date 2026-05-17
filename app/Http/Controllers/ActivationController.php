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
use Illuminate\Support\Facades\Http;

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

        $apiKey = config('services.lipalink.key');
        $businessId = config('services.lipalink.business_id');

        if (!$apiKey || !$businessId) {
            return back()->withErrors(['pay' => 'Payment gateway is not configured correctly on the server.']);
        }

        $reference = 'ACT_' . $user->id . '_' . time(); 
        
        // Format Phone Number to strictly start with 254 for LipaLink
        $msisdn = preg_replace('/^0/', '254', trim($user->phone));
        $msisdn = preg_replace('/^\+/', '', $msisdn);

        try {
            $response = Http::withHeaders([
                'X-Api-Key' => $apiKey,
                'Content-Type' => 'application/json'
            ])->post('http://lipalink.co.ke/api/stk_push.php', [
                'amount' => (float) $feeValue,
                'msisdn' => $msisdn,
                'reference' => $reference,
                'business_id' => (int) $businessId,
            ]);

            $result = $response->json();

            // LipaLink uses {"success": false, "error": "..."} for rejections
            if (!$response->successful() || (isset($result['success']) && $result['success'] === false)) {
                $errorMsg = $result['error'] ?? 'Invalid payment request.';
                Log::error('LipaLink API Error: ' . $response->body());
                return back()->withErrors(['pay' => 'Payment Error: ' . $errorMsg]);
            }

            // Save the exact LipaLink Transaction ID to poll instantly!
            $request->session()->put('lipalink_act_txn', $result['transaction_id']);

            return back()->with('success', 'Prompt Sent');

        } catch (\Exception $e) {
            Log::error('LipaLink Connection Error: ' . $e->getMessage());
            return back()->withErrors(['pay' => 'Failed to connect to payment servers. Please try again.']);
        }
    }

    public function checkStatus(Request $request)
    {
        $user = $request->user();
        
        // 1. Check if the webhook already activated them
        if ($user->is_active) {
            return response()->json(['status' => 'success']);
        }

        // 2. Poll the exact transaction ID we saved during initiation
        $txnId = $request->session()->get('lipalink_act_txn');
        if (!$txnId) {
            return response()->json(['status' => 'pending']);
        }

        try {
            $response = Http::withHeaders(['X-Api-Key' => config('services.lipalink.key')])
                ->get('http://lipalink.co.ke/api/transaction_status.php', [
                    'transaction_id' => $txnId
                ]);

            if ($response->successful()) {
                $result = $response->json();
                
                if (isset($result['success']) && $result['success']) {
                    $status = strtoupper($result['status'] ?? '');
                    
                    if ($status === 'SUCCESS') {
                        $this->activateUser($user);
                        $request->session()->forget('lipalink_act_txn');
                        return response()->json(['status' => 'success']);
                    }
                    if (in_array($status, ['FAILED', 'CANCELLED'])) {
                        $request->session()->forget('lipalink_act_txn');
                        return response()->json(['status' => 'failed']);
                    }
                }
            }
            return response()->json(['status' => 'pending']);

        } catch (\Exception $e) {
            return response()->json(['status' => 'pending']);
        }
    }

    // THE UNIFIED MASTER WEBHOOK
    public function callback(Request $request)
    {
        $payload = $request->all();
        Log::info('LipaLink Webhook Received: ', $payload);

        // LipaLink sends clean keys at the top level of the JSON payload
        $status = $payload['status'] ?? '';
        $reference = $payload['reference'] ?? '';
        $amount = $payload['amount'] ?? 0;

        $isSuccess = strcasecmp($status, 'Success') === 0;

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
                                'amount' => $amount, 'type' => 'earning', 'wallet' => 'main', 'status' => 'completed',
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
                                'amount' => $amount, 'type' => 'purchase', 'wallet' => 'system', 'status' => 'completed',
                                'description' => "Credit Purchase ($reference)"
                            ]);
                        }
                    }
                }
            }
        }

        // LipaLink requires a clean HTTP 200 JSON success response to confirm receipt
        return response()->json(['success' => true]);
    }

    private function activateUser(User $user)
    {
        $user->update(['is_active' => true]);

        // Send Welcome Email gracefully
        try { 
            Mail::to($user->email)->send(new WelcomeEmail($user)); 
        } catch (\Exception $e) {
            Log::error("Failed to send welcome email to {$user->email}: " . $e->getMessage());
        }

        $signupBonus = Setting::where('key', 'signup_bonus')->first()?->value ?? 0;
        if ($signupBonus > 0 && !$user->transactions()->where('description', 'Welcome Signup Bonus')->exists()) {
            $user->transactions()->create([
                'amount' => $signupBonus, 'type' => 'bonus', 'wallet' => 'main', 'status' => 'completed', 'description' => 'Welcome Signup Bonus'
            ]);
        }

        if ($user->referred_by) {
            $refBonus = Setting::where('key', 'referral_bonus')->first()?->value ?? 0;
            if ($refBonus > 0) {
                $referrer = User::find($user->referred_by);
                if ($referrer && !$referrer->transactions()->where('description', 'Activation commission for ' . $user->username)->exists()) {
                    
                    $referrer->transactions()->create([
                        'amount' => $refBonus, 'type' => 'commission', 'wallet' => 'team', 'status' => 'completed', 'description' => 'Activation commission for ' . $user->username
                    ]);

                    try {
                        $earnings = $referrer->transactions()->where('wallet', 'team')->whereIn('type',['earning', 'commission', 'bonus'])->sum('amount');
                        $withdrawals = $referrer->transactions()->where('wallet', 'team')->where('type', 'withdrawal')->whereIn('status',['completed', 'pending'])->sum('amount');
                        Mail::to($referrer->email)->send(new ReferralEarned($referrer, $user->username, $refBonus, ($earnings - $withdrawals)));
                    } catch (\Exception $e) {
                        Log::error("Failed to send referral email to {$referrer->email}: " . $e->getMessage());
                    }
                }
            }
        }
    }
}