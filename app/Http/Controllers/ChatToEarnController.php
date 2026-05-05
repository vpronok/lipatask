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

        return Inertia::render('Tasks/ChatToEarn',[
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

    public function buyCredits(Request $request)
    {
        $user = $request->user();
        
        // STRICT RULE: Hardcoded to exactly Ksh 49.00
        $fixedAmount = 49.00; 

        $username = config('services.payhero.username');
        $password = config('services.payhero.password');
        $channelId = config('services.payhero.channel_id');

        if (!$username || !$password || !$channelId) return back()->withErrors(['pay' => 'Gateway not configured.']);

        $reference = 'CRE_' . $user->id . '_' . time(); 
        $request->session()->put('pending_credit_ref', $reference);

        // POINTING TO THE CSRF-EXEMPT WEBHOOK TUNNEL
        $callbackUrl = route('payhero.callback');

        try {
            $payload =[
                'amount' => $fixedAmount, 
                'phone_number' => $user->phone, 
                'channel_id' => (int) $channelId, 
                'provider' => 'm-pesa', 
                'external_reference' => $reference, 
                'callback_url' => $callbackUrl,
            ];

            $response = Http::withBasicAuth($username, $password)->acceptJson()->asJson()->post('https://backend.payhero.co.ke/api/v2/payments', $payload);
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
        $reference = $request->session()->get('pending_credit_ref');

        // 1. Did the webhook catch it?
        if ($user->transactions()->where('description', "Credit Purchase ($reference)")->exists()) {
            $request->session()->forget('pending_credit_ref');
            return response()->json(['status' => 'success']);
        }

        // 2. Poll fallback (Manual Check)
        try {
            $response = Http::withBasicAuth(config('services.payhero.username'), config('services.payhero.password'))->get('https://backend.payhero.co.ke/api/v2/transactions');

            if ($response->successful()) {
                $transactions = $response->json()['data'] ??[];
                $phoneSuffix = substr(trim($user->phone), -9);

                foreach ($transactions as $tx) {
                    $txPhone = $tx['sender_phone'] ?? $tx['phone_number'] ?? '';
                    $txStatus = strtoupper($tx['status'] ?? $tx['Status'] ?? '');
                    $txRef = $tx['external_reference'] ?? '';
                    $txAmount = $tx['amount'] ?? 0;

                    // Match strictly against the phone and success status
                    if (str_contains($txPhone, $phoneSuffix) && $txStatus === 'SUCCESS') {
                        
                        // Make sure we didn't already process this in the last 5 minutes
                        $exists = $user->transactions()->where('description', 'like', 'Credit Purchase%')->where('created_at', '>=', now()->subMinutes(5))->exists();
                        
                        if (!$exists) {
                            $user->increment('credits', $txAmount);
                            $user->transactions()->create([
                                'amount' => $txAmount, 'type' => 'purchase', 'wallet' => 'system', 'status' => 'completed', 'description' => "Credit Purchase ($reference)"
                            ]);
                            $request->session()->forget('pending_credit_ref');
                            return response()->json(['status' => 'success']);
                        }
                    }
                }
            }
            return response()->json(['status' => 'pending']);
        } catch (\Exception $e) {
            return response()->json(['status' => 'pending']);
        }
    }
}