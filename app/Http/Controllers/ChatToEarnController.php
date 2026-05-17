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

    // --- LIPALINK LOGIC FOR BUYING CREDITS ---
    public function buyCredits(Request $request)
    {
        $user = $request->user();
        
        // STRICT RULE: Hardcoded to exactly Ksh 49.00
        $fixedAmount = 49.00; 

        $apiKey = config('services.lipalink.key');
        $businessId = config('services.lipalink.business_id');

        if (!$apiKey || !$businessId) return back()->withErrors(['pay' => 'Gateway not configured.']);

        $reference = 'CRE_' . $user->id . '_' . time(); 
        
        // Format Phone Number to strictly start with 254 for LipaLink
        $msisdn = preg_replace('/^\+/', '', preg_replace('/^0/', '254', trim($user->phone)));
        
        $callbackUrl = route('lipalink.callback');

        try {
            $response = Http::withHeaders([
                'X-Api-Key' => $apiKey,
                'Content-Type' => 'application/json'
            ])->post('http://lipalink.co.ke/api/stk_push.php', [
                'amount' => $fixedAmount, 
                'msisdn' => $msisdn, 
                'reference' => $reference, 
                'business_id' => (int) $businessId,
            ]);

            $result = $response->json();

            // LipaLink uses {"success": false, "error": "..."} for rejections
            if (!$response->successful() || (isset($result['success']) && $result['success'] === false)) {
                return back()->withErrors(['pay' => 'Payment Error: ' . ($result['error'] ?? 'Invalid request.')]);
            }
            
            // Save the exact LipaLink Transaction ID to poll instantly
            $request->session()->put('lipalink_cre_txn', $result['transaction_id']);
            
            return back()->with('success', 'Prompt Sent');
        } catch (\Exception $e) {
            return back()->withErrors(['pay' => 'Connection failed.']);
        }
    }

    public function checkCreditStatus(Request $request)
    {
        $user = $request->user();
        $txnId = $request->session()->get('lipalink_cre_txn');

        if (!$txnId) {
            if ($user->transactions()->where('description', "like", "Credit Purchase%")->where('created_at', '>=', now()->subMinutes(5))->exists()) {
                return response()->json(['status' => 'success']);
            }
            return response()->json(['status' => 'pending']);
        }

        try {
            // Direct Polling to LipaLink using the specific Transaction ID
            $response = Http::withHeaders(['X-Api-Key' => config('services.lipalink.key')])
                ->get('http://lipalink.co.ke/api/transaction_status.php', ['transaction_id' => $txnId]);

            if ($response->successful()) {
                $result = $response->json();
                
                if (isset($result['success']) && $result['success']) {
                    $txStatus = strtoupper($result['status'] ?? '');
                    
                    if ($txStatus === 'SUCCESS') {
                        $txRef = $result['reference'] ?? '';
                        $txAmount = $result['amount'] ?? 0;
                        
                        $exists = $user->transactions()->where('description', "Credit Purchase ($txRef)")->exists();
                        if (!$exists) {
                            $user->increment('credits', $txAmount);
                            $user->transactions()->create([
                                'amount' => $txAmount, 'type' => 'purchase', 'wallet' => 'system', 'status' => 'completed', 'description' => "Credit Purchase ($txRef)"
                            ]);
                        }
                        $request->session()->forget('lipalink_cre_txn');
                        return response()->json(['status' => 'success']);
                    }
                    if (in_array($txStatus, ['FAILED', 'CANCELLED', 'REJECTED'])) {
                        $request->session()->forget('lipalink_cre_txn');
                        return response()->json(['status' => 'failed']);
                    }
                }
            }
            return response()->json(['status' => 'pending']);
        } catch (\Exception $e) {
            return response()->json(['status' => 'pending']);
        }
    }
}