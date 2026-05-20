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

    // --- LIPALINK LOGIC FOR BUYING CREDITS (DATABASE DRIVEN) ---
    public function buyCredits(Request $request)
    {
        $request->validate(['amount' => 'required|numeric|min:55']); 
        $user = $request->user();

        // Use env() directly as a fail-safe in case config cache breaks
        $apiKey = env('LIPALINK_API_KEY', config('services.lipalink.key'));
        $businessId = env('LIPALINK_BUSINESS_ID', config('services.lipalink.business_id'));

        if (!$apiKey || !$businessId) {
            return back()->withErrors(['pay' => 'Gateway not configured. Check .env']);
        }

        $reference = 'CRE_' . $user->id . '_' . time(); 
        $msisdn = preg_replace('/^\+/', '', preg_replace('/^0/', '254', trim($user->phone)));
        
        try {
            $payload =[
                'amount' => (float) $request->amount, 
                'msisdn' => $msisdn, 
                'reference' => $reference, 
                'business_id' => (int) $businessId,
            ];

            // withoutVerifying() bypasses strict SSL blocks that sometimes cause curl 60 errors
            $response = Http::withoutVerifying()
                ->withHeaders([
                    'X-Api-Key' => $apiKey,
                    'Content-Type' => 'application/json'
                ])->post('http://lipalink.co.ke/api/stk_push.php', $payload);

            $result = $response->json();

            if (!$response->successful() || (isset($result['success']) && $result['success'] === false)) {
                return back()->withErrors(['pay' => 'Payment Error: ' . ($result['error'] ?? 'Invalid request.')]);
            }
            
            $txnId = $result['transaction_id'];

            // --- THE FIX: USE EXISTING ENUM TYPES TO PREVENT MYSQL CRASHES ---
            // We append the TXN ID into the description so we can safely extract it during polling
            $user->transactions()->create([
                'amount' => $request->amount,
                'type' => 'activation', // Safe fallback within ENUM rules
                'wallet' => 'store',    // Safe fallback within ENUM rules
                'status' => 'pending',
                'description' => "Credit Purchase ({$reference}) [TXN:{$txnId}]"
            ]);
            
            return back()->with('success', 'Prompt Sent');
        } catch (\Exception $e) {
            Log::error('LipaLink Init Error: ' . $e->getMessage());
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

        // 2. If a pending transaction exists, extract the LipaLink ID and ask LipaLink directly
        if ($pendingTx) {
            preg_match('/\[TXN:(.+?)\]/', $pendingTx->description, $matches);
            $txnId = $matches[1] ?? null;

            if ($txnId) {
                try {
                    $apiKey = env('LIPALINK_API_KEY', config('services.lipalink.key'));
                    
                    $response = Http::withoutVerifying()
                        ->withHeaders(['X-Api-Key' => $apiKey])
                        ->get('http://lipalink.co.ke/api/transaction_status.php', ['transaction_id' => $txnId]);

                    if ($response->successful()) {
                        $result = $response->json();
                        $status = strtoupper($result['status'] ?? '');
                        
                        if ($status === 'SUCCESS') {
                            // Clean up the description
                            $cleanDesc = preg_replace('/ \[TXN:.+?\]/', '', $pendingTx->description);
                            
                            // Mark as Complete & Add Credits!
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
                    Log::error("Polling Error: " . $e->getMessage());
                    // Keep waiting
                }
            }
        } else {
            // 3. FALLBACK: If no pending transaction exists, check if it was completed recently!
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