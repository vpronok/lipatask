<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Transaction;
use App\Models\Setting;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class AdminController extends Controller
{
    public function index()
    {
        $today = Carbon::today();
        
        // 1. Fetch Master Settings to calculate Revenue
        $settings = Setting::pluck('value', 'key')->toArray();
        $activationFee = (float) ($settings['activation_fee'] ?? 0);

        // 2. Platform Analytics (Daily & Historical)
        $dailySignups = User::whereDate('updated_at', $today)->where('is_active', true)->count();
        $dailyRevenue = $dailySignups * $activationFee;

        $totalActiveUsers = User::where('is_active', true)->count();
        $historicalRevenue = $totalActiveUsers * $activationFee;

        $totalUsers = User::count();
        $totalPendingWithdrawals = Transaction::where('type', 'withdrawal')->where('status', 'pending')->sum('amount');
        $totalPaidOut = Transaction::where('type', 'withdrawal')->where('status', 'completed')->sum('amount');

        // 3. Withdrawals
        $pendingWithdrawals = Transaction::with('user:id,name,email,username,phone')
            ->where('type', 'withdrawal')->where('status', 'pending')->latest()->get();

        $historyWithdrawals = Transaction::with('user:id,name,email,username,phone')
            ->where('type', 'withdrawal')->whereIn('status', ['completed', 'rejected'])->latest()->take(100)->get();

        // 4. Advanced User Data (Includes Total Income and Team List)
        $users = User::with(['referrals:id,name,username,phone,is_active,created_at', 'referrer:id,name'])
            ->orderBy('id', 'desc')
            ->get()
            ->map(function ($user) {
                // Calculate Balances
                $mainBalance = $user->transactions()->where('wallet', 'main')->whereIn('type',['earning', 'commission', 'bonus'])->sum('amount') 
                             - $user->transactions()->where('wallet', 'main')->where('type', 'withdrawal')->sum('amount');
                             
                $totalIncome = $user->transactions()->whereIn('type', ['earning', 'commission', 'bonus'])->sum('amount');

                return[
                    'id' => $user->id,
                    'name' => $user->name,
                    'username' => $user->username,
                    'phone' => $user->phone,
                    'email' => $user->email,
                    'is_active' => $user->is_active,
                    'role' => $user->role,
                    'balance' => number_format($mainBalance, 2),
                    'total_income' => number_format($totalIncome, 2),
                    'referrals_count' => $user->referrals->count(),
                    'upline' => $user->referrer ? $user->referrer->name : 'Admin',
                    'team' => $user->referrals, // Their specific downline
                    'created_at' => $user->created_at,
                ];
            });

        return Inertia::render('Admin/Dashboard',[
            'analytics' =>[
                'daily_signups' => $dailySignups,
                'daily_revenue' => number_format($dailyRevenue, 2),
                'total_users' => $totalUsers,
                'active_users' => $totalActiveUsers,
                'historical_revenue' => number_format($historicalRevenue, 2),
                'pending_payouts' => number_format($totalPendingWithdrawals, 2),
                'total_paid' => number_format($totalPaidOut, 2),
            ],
            'withdrawals' => $pendingWithdrawals,
            'withdrawal_history' => $historyWithdrawals,
            'users' => $users,
            'settings' => $settings,
        ]);
    }

    public function approveWithdrawal($id) { Transaction::findOrFail($id)->update(['status' => 'completed']); return back(); }
    public function rejectWithdrawal($id) { Transaction::findOrFail($id)->update(['status' => 'rejected']); return back(); }

    public function updateUser(Request $request, $id)
    {
        $user = User::findOrFail($id);
        $request->validate(['name' => 'required|string', 'phone' => 'required|string', 'email' => 'required|email', 'role' => 'required|in:admin,user']);

        $user->update([
            'name' => $request->name, 'phone' => $request->phone, 'email' => $request->email, 
            'role' => $request->role, 'is_active' => filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN),
        ]);
        return back();
    }

    public function deleteUser($id)
    {
        $user = User::findOrFail($id);
        if (auth()->id() !== $user->id) { $user->delete(); }
        return back();
    }

    public function updateSettings(Request $request)
    {
        $data = $request->except(['_token']);
        foreach($data as $key => $value) {
            if ($value !== null) Setting::updateOrCreate(['key' => $key],['value' => $value]);
        }
        return back();
    }
}