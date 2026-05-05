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
            'pay_per_message' => 15.00, // Earnings per message
            'cost_per_message' => 2.00, // Cost per message
            'credits' => $user->credits, // Current available credits
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

        // Security check: Make sure they actually have the credits they claim they spent
        if ($user->credits < $totalCost) {
            // Cap the earnings to whatever they could actually afford
            $messageCount = floor($user->credits / $costPerMsg);
            $totalCost = $messageCount * $costPerMsg;
            $totalEarned = $messageCount * $earnPerMsg;
        }

        if ($messageCount > 0) {
            // Deduct Credits
            $user->decrement('credits', $totalCost);

            // Award Earnings to Task Wallet
            $user->transactions()->create([
                'amount' => $totalEarned, 'type' => 'earning', 'wallet' => 'task', 'status' => 'completed',
                'description' => "Chat Task Completed ({$messageCount} messages)"
            ]);
            return back()->with('success', "Chat completed! You spent Ksh {$totalCost} credits and earned Ksh {$totalEarned} in your Task Wallet.");
        }

        return back()->withErrors(['chat' => 'Not enough credits to claim earnings.']);
    }

    // --- M-PESA LOGIC FOR BUYING CREDITS ---
    public function buyCredits(Request $request)
    {
        // Enforce the strict 10 to 49 KSh limit securely on the backend
        $request->validate(['amount' => 'required|numeric|min:10|max:49']); 
        
        $user = $request->user();

        $username = config('services.payhero.username');
        $password = config('services.payhero.password');
        $channelId = config('services.payhero.channel_id');

        if (!$username || !$password || !$channelId) return back()->withErrors(['pay' => 'Gateway not configured.']);

        $reference = 'CRE_' . $user->id . '_' . time(); 
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

            $response = \Illuminate\Support\Facades\Http::withBasicAuth($username, $password)
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
        
        try {
            $response = Http::withBasicAuth(config('services.payhero.username'), config('services.payhero.password'))->get('https://backend.payhero.co.ke/api/v2/transactions');

            if ($response->successful()) {
                $transactions = $response->json()['data'] ??[];
                $phoneSuffix = substr(trim($user->phone), -9);

                foreach ($transactions as $tx) {
                    $txPhone = $tx['sender_phone'] ?? '';
                    $txStatus = strtoupper($tx['status'] ?? '');
                    $txRef = $tx['external_reference'] ?? '';
                    $txAmount = $tx['amount'] ?? 0;

                    if (str_contains($txPhone, $phoneSuffix) && str_starts_with($txRef, 'CRE_')) {
                        if ($txStatus === 'SUCCESS') {
                            // Check if this credit was already awarded
                            $exists = $user->transactions()->where('description', "Credit Purchase ($txRef)")->exists();
                            if (!$exists) {
                                // Add to credits AND log the transaction
                                $user->increment('credits', $txAmount);
                                $user->transactions()->create([
                                    'amount' => $txAmount, 'type' => 'recharge', 'wallet' => 'main', 'status' => 'completed', 'description' => "Credit Purchase ($txRef)"
                                ]);
                            }
                            return response()->json(['status' => 'success']);
                        }
                        if ($txStatus === 'FAILED' || $txStatus === 'CANCELLED') return response()->json(['status' => 'failed']);
                    }
                }
            }
            return response()->json(['status' => 'pending']);
        } catch (\Exception $e) {
            return response()->json(['status' => 'pending']);
        }
    }
}