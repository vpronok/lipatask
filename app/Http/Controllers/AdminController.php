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
    public function index(Request $request)
    {
        $today = Carbon::today();
        
        $settings = Setting::pluck('value', 'key')->toArray();
        $activationFee = (float) ($settings['activation_fee'] ?? 0);

        // Daily Analytics
        $dailySignups = User::whereDate('updated_at', $today)->where('is_active', true)->count();
        $dailyRevenue = $dailySignups * $activationFee;

        // Historical Analytics
        $totalActiveUsers = User::where('is_active', true)->count();
        $historicalRevenue = $totalActiveUsers * $activationFee;
        $totalUsers = User::count();
        
        $totalPendingWithdrawals = Transaction::where('type', 'withdrawal')->where('status', 'pending')->sum('amount');
        $totalPaidOut = Transaction::where('type', 'withdrawal')->where('status', 'completed')->sum('amount');

        // Withdrawals (Kept limits to protect memory)
        $pendingWithdrawals = Transaction::with('user:id,name,email,username,phone')
            ->where('type', 'withdrawal')->where('status', 'pending')->latest()->get();

        $historyWithdrawals = Transaction::with('user:id,name,email,username,phone')
            ->where('type', 'withdrawal')->whereIn('status',['completed', 'rejected'])->latest()->take(100)->get();

        // --- ENTERPRISE SCALING: Server-Side Search & Pagination ---
        $search = $request->query('search');
        $status = $request->query('status');

        $usersQuery = User::with(['referrals:id,name,username,phone,is_active,created_at', 'referrer:id,name'])
            ->withCount('referrals')
            ->withSum(['transactions as main_earnings' => function ($query) {
                $query->where('wallet', 'main')->whereIn('type',['earning', 'commission', 'bonus', 'recharge']);
            }], 'amount')
            ->withSum(['transactions as main_withdrawals' => function ($query) {
                $query->where('wallet', 'main')->where('type', 'withdrawal')->whereIn('status', ['completed', 'pending']);
            }], 'amount')
            ->withSum(['transactions as total_income' => function ($query) {
                $query->whereIn('type',['earning', 'commission', 'bonus']);
            }], 'amount')
            ->orderBy('id', 'desc');

        // 1. Apply Search Filter via MySQL
        if (!empty($search)) {
            $usersQuery->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('username', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        // 2. Apply Status Filter via MySQL
        if (!empty($status) && $status !== 'all') {
            $isActive = $status === 'active' ? true : false;
            $usersQuery->where('is_active', $isActive);
        }

        // 3. Paginate exactly 15 records at a time to prevent RAM crashing
        $users = $usersQuery->paginate(15)->appends($request->query())->through(function ($user) {
            $mainBalance = ($user->main_earnings ?? 0) - ($user->main_withdrawals ?? 0);
            return[
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'phone' => $user->phone,
                'email' => $user->email,
                'is_active' => $user->is_active,
                'role' => $user->role,
                'balance' => number_format(max(0, $mainBalance), 2, '.', ''),
                'total_income' => number_format($user->total_income ?? 0, 2, '.', ''),
                'referrals_count' => $user->referrals_count,
                'upline' => $user->referrer ? $user->referrer->name : 'Admin',
                'team' => $user->referrals,
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
            'users' => $users, // Now contains pagination data (.data and .links)
            'settings' => $settings,
            'filters' => $request->only(['search', 'status', 'tab']), // Pass back to frontend to keep state alive
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
    public function storeUser(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'username' => 'required|string|max:255|unique:users',
            'phone' => 'required|string|unique:users',
            'email' => 'required|email|unique:users',
            'password' => 'required|string|min:6',
            'role' => 'required|in:admin,user',
        ]);

        User::create([
            'name' => $request->name,
            'username' => $request->username,
            'phone' => $request->phone,
            'email' => $request->email,
            'password' => \Illuminate\Support\Facades\Hash::make($request->password),
            'role' => $request->role,
            'is_active' => filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN),
            // Auto-generate their referral code
            'referral_code' => strtoupper(substr(uniqid(), -8)), 
        ]);

        return back();
    }
}