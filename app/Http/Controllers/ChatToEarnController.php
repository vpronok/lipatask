<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use App\Models\Setting;

class ChatToEarnController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $chatEarnings = $user->transactions()->where('type', 'earning')->where('description', 'like', '%Chat%')->sum('amount');
        $chatsDone = $user->transactions()->where('type', 'earning')->where('description', 'like', '%Chat%')->count();

        // Fetch dynamic rate from settings if admin set it, otherwise fallback to 15.00
        $payPerMessage = Setting::where('key', 'pay_per_message')->first()?->value ?? 15.00;

        return Inertia::render('Tasks/ChatToEarn',[
            'stats' =>['tasks_available' => 1, 'done' => $chatsDone, 'earned' => number_format($chatEarnings, 2)],
            'pay_per_message' => (float) $payPerMessage,
            'cost_per_message' => 2.00,
            'credits' => $user->credits,
        ]);
    }

    public function completeTask(Request $request)
    {
        $request->validate(['message_count' => 'required|integer|min:1']);
        
        $user = $request->user();
        $messageCount = $request->message_count;
        $costPerMsg = 2.00;
        
        $payPerMessage = Setting::where('key', 'pay_per_message')->first()?->value ?? 15.00;
        $earnPerMsg = (float) $payPerMessage;

        $totalCost = $messageCount * $costPerMsg;
        $totalEarned = $messageCount * $earnPerMsg;

        if ($user->credits < $totalCost) {
            $messageCount = floor($user->credits / $costPerMsg);
            $totalCost = $messageCount * $costPerMsg;
            $totalEarned = $messageCount * $earnPerMsg;
        }

        if ($messageCount > 0) {
            $user->decrement('credits', $totalCost);
            $user->transactions()->create([
                'amount' => $totalEarned, 'type' => 'earning', 'wallet' => 'task', 'status' => 'completed',
                'description' => "Chat Task Completed ({$messageCount} messages)"
            ]);
            return back()->with('success', "Chat completed! You spent Ksh {$totalCost} credits and earned Ksh {$totalEarned} in your Task Wallet.");
        }

        return back()->withErrors(['chat' => 'Not enough credits to claim earnings.']);
    }

    // --- PAYHERO LOGIC FOR BUYING CREDITS ---
    public function buyCredits(Request $request)
    {
        $request->validate(['amount' => 'required|numeric|min:55']); 
        $user = $request->user();

        $username = config('services.payhero.username');
        $password = config('services.payhero.password');
        $channelId = config('services.payhero.channel_id');

        if (!$username || !$password || !$channelId) {
            return back()->withErrors(['pay' => 'Gateway not configured. Check .env']);
        }

        $reference = 'CRE_' . $user->id . '_' . time(); 
        $msisdn = preg_replace('/^\+/', '', preg_replace('/^0/', '254', trim($user->phone)));
        
        // Force strictly HTTPS so Nginx doesn't strip the webhook payload!
        $callbackUrl = secure_url(route('payhero.callback', [], false));

        try {
            $payload =[
                'amount' => (float) $request->amount, 
                'phone_number' => $msisdn, 
                'external_reference' => $reference, 
                'channel_id' => (int) $channelId,
                'provider' => 'm-pesa',
                'callback_url' => $callbackUrl,
            ];

            $token = base64_encode("$username:$password");
            $response = Http::withoutVerifying()
                ->withHeaders([
                    'Authorization' => 'Basic ' . $token,
                    'Content-Type' => 'application/json'
                ])->post('https://backend.payhero.co.ke/api/v2/payments', $payload);

            $result = $response->json();

            if (!$response->successful() || (isset($result['success']) && $result['success'] === false)) {
                return back()->withErrors(['pay' => 'Payment Error: ' . ($result['message'] ?? $result['error'] ?? 'Invalid request.')]);
            }
            
            $txnId = $result['reference'] ?? $result['transaction_id'] ?? $reference;

            $user->transactions()->create([
                'amount' => $request->amount,
                'type' => 'activation',
                'wallet' => 'store',
                'status' => 'pending',
                'description' => "Credit Purchase ({$reference}) [TXN:{$txnId}]"
            ]);
            
            return back()->with('success', 'Prompt Sent');
        } catch (\Exception $e) {
            Log::error('PayHero Init Error: ' . $e->getMessage());
            return back()->withErrors(['pay' => 'Connection failed.']);
        }
    }

    public function checkCreditStatus(Request $request)
    {
        $user = $request->user();
        
        // 1. Find the pending transaction in the database
        $pendingTx = $user->transactions()
            ->where('description', 'like', 'Credit Purchase%[TXN:%')
            ->where('status', 'pending')
            ->latest()
            ->first();

        // 2. If a pending transaction exists, extract the PayHero ID and ask PayHero directly
        if ($pendingTx) {
            preg_match('/\[TXN:(.+?)\]/', $pendingTx->description, $matches);
            $txnId = $matches[1] ?? null;

            if ($txnId) {
                try {
                    $username = config('services.payhero.username');
                    $password = config('services.payhero.password');
                    $token = base64_encode("$username:$password");
                    
                    $response = Http::withoutVerifying()
                        ->withHeaders(['Authorization' => 'Basic ' . $token])
                        ->get('https://backend.payhero.co.ke/api/v2/transaction-status', ['reference' => $txnId]);

                    if ($response->successful()) {
                        $result = $response->json();
                        $status = strtoupper($result['status'] ?? '');
                        
                        if ($status === 'SUCCESS') {
                            $cleanDesc = preg_replace('/ \[TXN:.+?\]/', '', $pendingTx->description);
                            
                            $pendingTx->update([
                                'status' => 'completed',
                                'description' => $cleanDesc
                            ]);
                            $user->increment('credits', $pendingTx->amount);
                            
                            return response()->json(['status' => 'success']);
                        }
                        
                        if (in_array($status, ['FAILED', 'CANCELLED', 'REJECTED'])) {
                            $pendingTx->update(['status' => 'rejected']);
                            return response()->json(['status' => 'failed']);
                        }
                    }
                } catch (\Exception $e) {
                    // FIX: Catch PHP errors and send to React so it stops spinning forever!
                    Log::error("Credit Polling Error: " . $e->getMessage());
                    return response()->json(['status' => 'error', 'message' => $e->getMessage()]);
                }
            }
        } else {
            // 3. FALLBACK: Check if webhook activated it in the background recently
            $recentlyCompleted = $user->transactions()
                ->where('description', 'like', 'Credit Purchase%')
                ->where('status', 'completed')
                ->where('created_at', '>=', now()->subMinutes(5))
                ->exists();

            if ($recentlyCompleted) {
                return response()->json(['status' => 'success']);
            }
        }

        // Keep polling...
        return response()->json(['status' => 'pending']);
    }
}