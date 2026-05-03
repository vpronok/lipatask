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

        // 2. Get Pending Withdrawals with User Data
        $withdrawals = Transaction::with('user:id,name,email,username')
            ->where('type', 'withdrawal')
            ->where('status', 'pending')
            ->latest()
            ->get();

        // 3. Get User Statistics (Referrals & Balances)
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
                    'referrals_count' => $user->referrals_count,
                    'balance' => number_format($mainBalance, 2),
                    'role' => $user->role,
                ];
            });

        // 4. Fetch ALL Settings (PayHero Keys, Fees, WhatsApp Link)
        $settings = Setting::pluck('value', 'key')->toArray();

        return Inertia::render('Admin/Dashboard',[
            'stats' =>[
                'total_users' => $totalUsers,
                'pending_payouts' => number_format($totalPendingWithdrawals, 2),
                'total_paid' => number_format($totalPaidOut, 2),
            ],
            'withdrawals' => $withdrawals,
            'users' => $users,
            
            // Pass all settings as a single array object to the React view
            'settings' => $settings,
        ]);
    }

    // Action to Approve Withdrawal
    public function approveWithdrawal($id)
    {
        $transaction = Transaction::findOrFail($id);
        $transaction->update(['status' => 'completed']);
        return back();
    }

    // Action to Reject Withdrawal
    public function rejectWithdrawal($id)
    {
        $transaction = Transaction::findOrFail($id);
        $transaction->update(['status' => 'rejected']);
        return back();
    }

    // MEGA SAVER: Mass update for any setting submitted from the Admin Panel
    public function updateSettings(Request $request)
    {
        // Exclude internal framework tokens
        $data = $request->except(['_token']);
        
        // Loop through everything sent from the form and save it to the database
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
            'is_active' => $request->is_active ? true : false,
        ]);

        return back();
    }

    public function deleteUser($id)
    {
        $user = User::findOrFail($id);
        // Prevent deleting yourself
        if (auth()->id() !== $user->id) {
            $user->delete();
        }
        return back();
    }
}