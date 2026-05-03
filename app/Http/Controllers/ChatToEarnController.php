<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Transaction;
use App\Models\Setting;

class ChatToEarnController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        // Calculate stats for the user's chat history
        $chatEarnings = $user->transactions()
            ->where('type', 'earning')
            ->where('description', 'like', '%Chat%')
            ->sum('amount');
            
        $chatsDone = $user->transactions()
            ->where('type', 'earning')
            ->where('description', 'like', '%Chat%')
            ->count();

        // Fetch rate from settings, default to 5.00 if admin hasn't set it yet
        $payPerMessage = Setting::where('key', 'pay_per_message')->first()?->value ?? 5.00;

        return Inertia::render('Tasks/ChatToEarn', [
            'stats' =>[
                'tasks_available' => 1,
                'done' => $chatsDone,
                'earned' => number_format($chatEarnings, 2),
            ],
            'pay_per_message' => (float) $payPerMessage,
        ]);
    }

    public function completeTask(Request $request)
    {
        $request->validate([
            'message_count' => 'required|integer|min:1'
        ]);

        $user = $request->user();
        $messageCount = $request->message_count;
        
        $rate = \App\Models\Setting::where('key', 'pay_per_message')->first()?->value ?? 5.00;
        $totalEarned = $messageCount * $rate;

        // CHANGED 'wallet' => 'task'
        $user->transactions()->create([
            'amount' => $totalEarned,
            'type' => 'earning',
            'wallet' => 'task', 
            'status' => 'completed',
            'description' => "Chat Task Completed ({$messageCount} messages sent)"
        ]);

        return back()->with('success', "Chat completed successfully! You earned KSh {$totalEarned} in your Task Wallet.");
    }
}