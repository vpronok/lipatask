<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Transaction;
use App\Models\Setting;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AdminController extends Controller
{
    public function index()
    {
        // 1. Get Summary Stats
        $totalUsers = User::count();
        $totalPendingWithdrawals = Transaction::where('type', 'withdrawal')->where('status', 'pending')->sum('amount');
        $totalPaidOut = Transaction::where('type', 'withdrawal')->where('status', 'completed')->sum('amount');

        // 2. PENDING Withdrawals (Needs Action)
        $pendingWithdrawals = Transaction::with('user:id,name,email,username,phone')
            ->where('type', 'withdrawal')
            ->where('status', 'pending')
            ->latest()
            ->get();

        // 3. HISTORY Withdrawals (Already Processed - Approved/Rejected)
        $historyWithdrawals = Transaction::with('user:id,name,email,username,phone')
            ->where('type', 'withdrawal')
            ->whereIn('status',['completed', 'rejected'])
            ->latest()
            ->take(50) // Limit to latest 50 to prevent slow load times
            ->get();

        // 4. Get User Statistics (Referrals & Balances)
        $users = User::withCount('referrals')
            ->orderBy('id', 'desc')
            ->get()
            ->map(function ($user) {
                $mainBalance = $user->transactions()->where('wallet', 'main')->whereIn('type',['earning', 'commission', 'bonus'])->sum('amount') 
                             - $user->transactions()->where('wallet', 'main')->where('type', 'withdrawal')->sum('amount');
                             
                return[
                    'id' => $user->id,
                    'name' => $user->name,
                    'username' => $user->username,
                    'phone' => $user->phone, // Added for Edit Modal
                    'is_active' => $user->is_active, // Added for Edit Modal
                    'referrals_count' => $user->referrals_count,
                    'balance' => number_format($mainBalance, 2),
                    'role' => $user->role,
                ];
            });

        // 5. Fetch ALL Settings (PayHero Keys, Fees, WhatsApp Link)
        $settings = Setting::pluck('value', 'key')->toArray();

        return Inertia::render('Admin/Dashboard',[
            'stats' =>[
                'total_users' => $totalUsers,
                'pending_payouts' => number_format($totalPendingWithdrawals, 2),
                'total_paid' => number_format($totalPaidOut, 2),
            ],
            'withdrawals' => $pendingWithdrawals,
            'withdrawal_history' => $historyWithdrawals, // Added to pass to React
            'users' => $users,
            'settings' => $settings,
        ]);
    }

    // --- WITHDRAWAL APPROVAL/REJECTION ---
    public function approveWithdrawal($id)
    {
        $transaction = Transaction::findOrFail($id);
        $transaction->update(['status' => 'completed']);
        return back();
    }

    public function rejectWithdrawal($id)
    {
        $transaction = Transaction::findOrFail($id);
        $transaction->update(['status' => 'rejected']);
        return back();
    }

    // --- MEGA SAVER: Mass update for any setting ---
    public function updateSettings(Request $request)
    {
        $data = $request->except(['_token']);
        
        foreach($data as $key => $value) {
            if ($value !== null) {
                Setting::updateOrCreate(
                    ['key' => $key],['value' => $value]
                );
            }
        }

        return back();
    }

    // --- USER MANAGEMENT METHODS ---
    public function updateUser(Request $request, $id)
    {
        $user = User::findOrFail($id);
        
        $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string',
            'email' => 'required|email',
            'role' => 'required|in:admin,user',
        ]);

        $user->update([
            'name' => $request->name,
            'phone' => $request->phone,
            'email' => $request->email,
            'role' => $request->role,
            // Cast strictly to boolean to prevent type errors
            'is_active' => filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN),
        ]);

        return back();
    }

    public function deleteUser($id)
    {
        $user = User::findOrFail($id);
        
        // Safety check: Prevent the admin from deleting themselves!
        if (auth()->id() !== $user->id) {
            $user->delete();
        }
        
        return back();
    }
}