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

    // --- PAYHERO LOGIC FOR ACTIVATION (DATABASE DRIVEN) ---
    public function initiatePayment(Request $request)
    {
        $user = $request->user();
        $feeValue = Setting::where('key', 'activation_fee')->first()?->value ?? 0;

        $username = config('services.payhero.username');
        $password = config('services.payhero.password');
        $channelId = config('services.payhero.channel_id');

        if (!$username || !$password || !$channelId) {
            return back()->withErrors(['pay' => 'Payment gateway is not configured correctly on the server.']);
        }

        $reference = 'ACT_' . $user->id . '_' . time(); 
        $msisdn = preg_replace('/^\+/', '', preg_replace('/^0/', '254', trim($user->phone)));

        // Bypass Nginx redirect blocks
        $callbackUrl = secure_url(route('payhero.callback', [], false));

        try {
            $token = base64_encode("$username:$password");
            // Bypass SSL verifications that can block outgoing Curl requests
            $response = Http::withoutVerifying()->withHeaders([
                'Authorization' => 'Basic ' . $token,
                'Content-Type' => 'application/json'
            ])->post('https://backend.payhero.co.ke/api/v2/payments', [
                'amount' => (float) $feeValue,
                'phone_number' => $msisdn,
                'channel_id' => (int) $channelId,
                'provider' => 'm-pesa',
                'external_reference' => $reference,
                'callback_url' => $callbackUrl,
            ]);

            $result = $response->json();

            if (!$response->successful() || (isset($result['success']) && $result['success'] === false)) {
                $errorMsg = $result['message'] ?? $result['error'] ?? 'Invalid payment request.';
                Log::error('PayHero API Error: ' . $response->body());
                return back()->withErrors(['pay' => 'Payment Error: ' . $errorMsg]);
            }

            // Fallback to our reference if they don't return a specific transaction id
            $txnId = $result['reference'] ?? $result['transaction_id'] ?? $reference;

            // FIX: CREATE PENDING TRANSACTION IN DB TO AVOID SESSION LOSS
            // We use activation/store enums to prevent MySQL column constraint crashes
            $user->transactions()->create([
                'amount' => $feeValue,
                'type' => 'activation',
                'wallet' => 'store',
                'status' => 'pending',
                'description' => "Account Activation ({$reference}) [TXN:{$txnId}]"
            ]);

            return back()->with('success', 'Prompt Sent');

        } catch (\Exception $e) {
            Log::error('PayHero Connection/DB Error: ' . $e->getMessage());
            return back()->withErrors(['pay' => 'Failed to connect to payment servers. Please try again.']);
        }
    }

    public function checkStatus(Request $request)
    {
        $user = $request->user();
        
        if ($user->is_active) {
            return response()->json(['status' => 'success']);
        }

        // 1. Find the pending transaction in the database
        $pendingTx = $user->transactions()
            ->where('description', 'like', 'Account Activation%[TXN:%')
            ->where('status', 'pending')
            ->latest()
            ->first();

        // 2. If we found it, pull the specific transaction ID and poll PayHero
        if ($pendingTx) {
            preg_match('/\[TXN:(.+?)\]/', $pendingTx->description, $matches);
            $txnId = $matches[1] ?? null;

            if ($txnId) {
                try {
                    $username = config('services.payhero.username');
                    $password = config('services.payhero.password');
                    $token = base64_encode("$username:$password");

                    $response = Http::withoutVerifying()->withHeaders(['Authorization' => 'Basic ' . $token])
                        ->get('https://backend.payhero.co.ke/api/v2/transaction-status', [
                            'reference' => $txnId
                        ]);

                    if ($response->successful()) {
                        $result = $response->json();
                        $status = strtoupper($result['status'] ?? '');
                        
                        if ($status === 'SUCCESS') {
                            $cleanDesc = preg_replace('/ \[TXN:.+?\]/', '', $pendingTx->description);
                            $pendingTx->update([
                                'status' => 'completed',
                                'description' => $cleanDesc
                            ]);
                            
                            $this->activateUser($user);
                            return response()->json(['status' => 'success']);
                        }
                        
                        if (in_array($status, ['FAILED', 'CANCELLED', 'REJECTED'])) {
                            $pendingTx->update(['status' => 'rejected']);
                            return response()->json(['status' => 'failed']);
                        }
                    }
                } catch (\Exception $e) {
                    // Silently fail and wait for next interval
                }
            }
        }

        return response()->json(['status' => 'pending']);
    }

    // THE UNIFIED MASTER WEBHOOK
    public function callback(Request $request)
    {
        $payload = $request->all();
        Log::info('PayHero Webhook Received: ', $payload);

        $status = $payload['status'] ?? '';
        $reference = $payload['external_reference'] ?? $payload['reference'] ?? '';
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
                        // Mark the pending db record as completed
                        $pendingTx = $user->transactions()->where('description', 'like', "Account Activation ({$reference})%")->first();
                        if ($pendingTx) {
                            $cleanDesc = preg_replace('/ \[TXN:.+?\]/', '', $pendingTx->description);
                            $pendingTx->update(['status' => 'completed', 'description' => $cleanDesc]);
                        }
                        
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
                        } else {
                            // If it exists but is pending, mark complete
                            $pendingTx = $user->transactions()->where('description', 'like', "M-Pesa Deposit ({$reference})%")->where('status', 'pending')->first();
                            if ($pendingTx) {
                                $cleanDesc = preg_replace('/ \[TXN:.+?\]/', '', $pendingTx->description);
                                $pendingTx->update(['status' => 'completed', 'description' => $cleanDesc]);
                            }
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
                        $exists = $user->transactions()->where('description', "like", "Credit Purchase ($reference)%")->where('status', 'completed')->exists();
                        
                        if (!$exists) {
                            $user->increment('credits', $amount);
                            
                            $pendingTx = $user->transactions()->where('description', 'like', "Credit Purchase ({$reference})%")->where('status', 'pending')->first();
                            if ($pendingTx) {
                                $cleanDesc = preg_replace('/ \[TXN:.+?\]/', '', $pendingTx->description);
                                $pendingTx->update(['status' => 'completed', 'description' => $cleanDesc]);
                            } else {
                                $user->transactions()->create([
                                    'amount' => $amount, 'type' => 'activation', 'wallet' => 'store', 'status' => 'completed',
                                    'description' => "Credit Purchase ($reference)"
                                ]);
                            }
                        }
                    }
                }
            }
        }

        return response()->json(['success' => true]);
    }

    private function activateUser(User $user)
    {
        $user->update(['is_active' => true]);

        try { Mail::to($user->email)->send(new WelcomeEmail($user)); } catch (\Exception $e) {}

        $signupBonus = Setting::where('key', 'signup_bonus')->first()?->value ?? 0;
        if ($signupBonus > 0 && !$user->transactions()->where('description', 'Welcome Signup Bonus')->exists()) {
            $user->transactions()->create(['amount' => $signupBonus, 'type' => 'bonus', 'wallet' => 'main', 'status' => 'completed', 'description' => 'Welcome Signup Bonus']);
        }

        if ($user->referred_by) {
            $refBonus = Setting::where('key', 'referral_bonus')->first()?->value ?? 0;
            if ($refBonus > 0) {
                $referrer = User::find($user->referred_by);
                if ($referrer && !$referrer->transactions()->where('description', 'Activation commission for ' . $user->username)->exists()) {
                    
                    $referrer->transactions()->create(['amount' => $refBonus, 'type' => 'commission', 'wallet' => 'team', 'status' => 'completed', 'description' => 'Activation commission for ' . $user->username]);

                    try {
                        $earnings = $referrer->transactions()->where('wallet', 'team')->whereIn('type',['earning', 'commission', 'bonus'])->sum('amount');
                        $withdrawals = $referrer->transactions()->where('wallet', 'team')->where('type', 'withdrawal')->whereIn('status',['completed', 'pending'])->sum('amount');
                        Mail::to($referrer->email)->send(new ReferralEarned($referrer, $user->username, $refBonus, ($earnings - $withdrawals)));
                    } catch (\Exception $e) {}
                }
            }
        }
    }
}