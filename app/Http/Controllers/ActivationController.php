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

    // --- LIPALINK LOGIC FOR ACTIVATION (DATABASE DRIVEN) ---
    public function initiatePayment(Request $request)
    {
        $user = $request->user();
        $feeValue = Setting::where('key', 'activation_fee')->first()?->value ?? 0;

        $apiKey = env('LIPALINK_API_KEY', config('services.lipalink.key'));
        $businessId = env('LIPALINK_BUSINESS_ID', config('services.lipalink.business_id'));

        if (!$apiKey || !$businessId) {
            return back()->withErrors(['pay' => 'Payment gateway is not configured correctly on the server.']);
        }

        $reference = 'ACT_' . $user->id . '_' . time();
        
        $msisdn = preg_replace('/[^0-9]/', '', $user->phone);
        if (strlen($msisdn) >= 9) $msisdn = '254' . substr($msisdn, -9);

        // Bypass Nginx redirect blocks
        $callbackUrl = secure_url(route('lipalink.callback', [], false));

        try {
            // Bypass SSL verifications that can block outgoing Curl requests
            $response = Http::withoutVerifying()->withHeaders([
                'X-Api-Key' => $apiKey,
                'Content-Type' => 'application/json'
            ])->post('http://lipalink.co.ke/api/stk_push.php', [
                'amount' => (float) $feeValue,
                'msisdn' => $msisdn,
                'reference' => $reference,
                'business_id' => (int) $businessId,
            ]);

            $result = $response->json();

            if (!$response->successful() || (isset($result['success']) && $result['success'] === false)) {
                $errorMsg = $result['error'] ?? 'Invalid payment request.';
                Log::error('LipaLink API Error: ' . $response->body());
                return back()->withErrors(['pay' => 'Payment Error: ' . $errorMsg]);
            }

            $txnId = $result['transaction_id'];

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
            Log::error('LipaLink Connection/DB Error: ' . $e->getMessage());
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

        // 2. If we found it, pull the specific transaction ID and poll LipaLink
        if ($pendingTx) {
            preg_match('/\[TXN:(.+?)\]/', $pendingTx->description, $matches);
            $txnId = $matches[1] ?? null;

            if ($txnId) {
                try {
                    $apiKey = env('LIPALINK_API_KEY', config('services.lipalink.key'));

                    $response = Http::withoutVerifying()->withHeaders(['X-Api-Key' => $apiKey])
                        ->get('http://lipalink.co.ke/api/transaction_status.php', [
                            'transaction_id' => $txnId
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
        Log::info('LipaLink Webhook Received: ', $payload);

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
            
            // 4. Handle Book Purchases (BOK_)
            elseif (str_starts_with($reference, 'BOK_')) {
                $parts = explode('_', $reference);
                $userId = $parts[1] ?? null;
                $bookId = $parts[2] ?? null;

                if ($userId && $bookId && $amount > 0) {
                    $user = User::find($userId);
                    if ($user) {
                        $purchase = \App\Models\Purchase::where('user_id', $userId)->where('book_id', $bookId)->where('reference', $reference)->first();
                        if ($purchase) {
                            $purchase->update(['status' => 'completed']);
                            
                            $exists = $user->transactions()->where('description', "Book Purchase ($bookId)")->exists();
                            if (!$exists) {
                                $user->transactions()->create([
                                    'amount' => $amount, 
                                    'type' => 'withdrawal', 
                                    'wallet' => 'main', 
                                    'status' => 'completed', 
                                    'description' => "Book Purchase ($bookId)"
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