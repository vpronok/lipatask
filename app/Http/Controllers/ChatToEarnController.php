<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;

class ChatToEarnController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $chatEarnings = $user->transactions()->where('type', 'earning')->where('description', 'like', '%Chat%')->sum('amount');
        $chatsDone = $user->transactions()->where('type', 'earning')->where('description', 'like', '%Chat%')->count();

        return Inertia::render('Tasks/ChatToEarn', [
            'stats' =>['tasks_available' => 1, 'done' => $chatsDone, 'earned' => number_format($chatEarnings, 2)],
            'pay_per_message' => 15.00,
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
        $earnPerMsg = 15.00;

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

    // --- BULLETPROOF M-PESA LOGIC ---
    public function buyCredits(Request $request)
    {
        $request->validate(['amount' => 'required|numeric|min:10|max:49']); 
        $user = $request->user();

        $username = config('services.payhero.username');
        $password = config('services.payhero.password');
        $channelId = config('services.payhero.channel_id');

        if (!$username || !$password || !$channelId) return back()->withErrors(['pay' => 'Gateway not configured.']);

        // 1. Generate the unique reference
        $reference = 'CRE_' . $user->id . '_' . time(); 
        
        // 2. STORE THIS IN THE SESSION TO POLL ACCURATELY!
        $request->session()->put('pending_credit_ref', $reference);

        $callbackUrl = url('/api/payhero/callback');

        try {
            $payload =[
                'amount' => (float) $request->amount, 
                'phone_number' => $user->phone, 
                'channel_id' => (int) $channelId, 
                'provider' => 'm-pesa', 
                'external_reference' => $reference, 
                'callback_url' => $callbackUrl,
            ];

            $response = Http::withBasicAuth($username, $password)
                ->acceptJson()
                ->asJson()
                ->post('https://backend.payhero.co.ke/api/v2/payments', $payload);
            
            $result = $response->json();

            if (!$response->successful() || (isset($result['success']) && $result['success'] === false)) {
                return back()->withErrors(['pay' => 'PayHero Error: ' . ($result['message'] ?? 'Invalid request.')]);
            }
            return back()->with('success', 'Prompt Sent');
        } catch (\Exception $e) {
            return back()->withErrors(['pay' => 'Connection failed.']);
        }
    }

    public function checkCreditStatus(Request $request)
    {
        $user = $request->user();
        
        // Retrieve the exact reference we are waiting for
        $reference = $request->session()->get('pending_credit_ref');

        if (!$reference) {
            // Fallback: If session is lost, just check if the webhook credited them recently
            $recent = $user->transactions()->where('description', 'like', 'Credit Purchase%')->where('created_at', '>=', now()->subMinutes(5))->first();
            if ($recent) return response()->json(['status' => 'success']);
            return response()->json(['status' => 'pending']);
        }

        // 1. Check local DB first (in case the Webhook beat the polling)
        if ($user->transactions()->where('description', "Credit Purchase ($reference)")->exists()) {
            $request->session()->forget('pending_credit_ref');
            return response()->json(['status' => 'success']);
        }

        // 2. Safely Poll PayHero Direct History
        try {
            $username = config('services.payhero.username');
            $password = config('services.payhero.password');

            // Pass the exact reference in the GET request parameters so PayHero bypasses limits
            $response = Http::withBasicAuth($username, $password)
                ->get('https://backend.payhero.co.ke/api/v2/transactions',[
                    'external_reference' => $reference
                ]);

            if ($response->successful()) {
                $transactions = $response->json()['data'] ??[];

                foreach ($transactions as $tx) {
                    $txRef = $tx['external_reference'] ?? $tx['ExternalReference'] ?? '';
                    $txStatus = strtoupper($tx['status'] ?? $tx['Status'] ?? '');
                    $txAmount = $tx['amount'] ?? $tx['Amount'] ?? 0;

                    // Match strictly against our known reference!
                    if ($txRef === $reference) {
                        if ($txStatus === 'SUCCESS') {
                            
                            // Double verify to prevent exploiting
                            if (!$user->transactions()->where('description', "Credit Purchase ($reference)")->exists()) {
                                $user->increment('credits', $txAmount);
                                $user->transactions()->create([
                                    'amount' => $txAmount, 
                                    'type' => 'purchase', 
                                    'wallet' => 'system', 
                                    'status' => 'completed', 
                                    'description' => "Credit Purchase ($reference)"
                                ]);
                            }
                            
                            $request->session()->forget('pending_credit_ref');
                            return response()->json(['status' => 'success']);
                        }

                        if (in_array($txStatus,['FAILED', 'CANCELLED', 'REJECTED'])) {
                            $request->session()->forget('pending_credit_ref');
                            return response()->json(['status' => 'failed']);
                        }
                    }
                }
            }
            
            // Still waiting for Safaricom to complete the processing...
            return response()->json(['status' => 'pending']);

        } catch (\Exception $e) {
            // Silently fail and wait for the next 4-second poll loop
            return response()->json(['status' => 'pending']);
        }
    }
}