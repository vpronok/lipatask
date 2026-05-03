<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\UserDashboardController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\TeamController;
use App\Http\Controllers\LeaderboardController;
use App\Http\Controllers\FinanceController;
use App\Http\Controllers\ActivationController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// 1. MAKE LOGIN THE HOMEPAGE
Route::get('/', function () {
    return redirect()->route('login');
});

// 2. Unprotected Auth Routes (Activation Page)
Route::middleware(['auth', 'verified'])->name('activation.')->group(function () {
    Route::get('/activation',[ActivationController::class, 'index'])->name('index');
    Route::post('/activation/pay',[ActivationController::class, 'initiatePayment'])->name('pay');
    Route::post('/activation/check', [ActivationController::class, 'checkStatus'])->name('check');
});

// 3. Fully Protected User Routes (Requires User to be Active)
Route::middleware(['auth', 'verified', 'active'])->group(function () {
    Route::get('/dashboard',[UserDashboardController::class, 'index'])->name('dashboard');
    
    // Profile
    Route::get('/profile',[ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile',[ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile',[ProfileController::class, 'destroy'])->name('profile.destroy');
    
    // Network & Tournament
    Route::get('/team',[TeamController::class, 'index'])->name('team');
    Route::get('/leaderboard',[LeaderboardController::class, 'index'])->name('leaderboard');
        // --- LIVE TASKS ---
    Route::get('/chat-to-earn',[\App\Http\Controllers\ChatToEarnController::class, 'index'])->name('chat-to-earn');
    // SUBMISSION ROUTES:
    Route::post('/chat-to-earn/complete', [\App\Http\Controllers\ChatToEarnController::class, 'completeTask'])->name('chat-to-earn.complete');

    // --- FINANCE ROUTES ---
    Route::get('/withdraw', [FinanceController::class, 'withdraw'])->name('withdraw');
    Route::post('/withdraw',[FinanceController::class, 'storeWithdrawal'])->name('withdraw.store');
    
    // New Recharge Routes
    Route::get('/recharge', [FinanceController::class, 'recharge'])->name('recharge');
    Route::post('/recharge/pay', [FinanceController::class, 'initiateRecharge'])->name('recharge.pay');
    Route::post('/recharge/check', [FinanceController::class, 'checkRechargeStatus'])->name('recharge.check');
    // ----------------------

    //HISTORY routes
    Route::get('/history', [\App\Http\Controllers\FinanceController::class, 'history'])->name('history');
    Route::get('/bonuses',[\App\Http\Controllers\FinanceController::class, 'bonuses'])->name('bonuses');
});

// 4. Chatwazungu Admin Dashboard
Route::middleware(['auth', 'admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/dashboard', [AdminController::class, 'index'])->name('dashboard');
    Route::post('/withdrawals/{id}/approve',[AdminController::class, 'approveWithdrawal'])->name('withdrawals.approve');
    Route::post('/withdrawals/{id}/reject',[AdminController::class, 'rejectWithdrawal'])->name('withdrawals.reject');
    Route::post('/settings/update', [AdminController::class, 'updateSettings'])->name('settings.update');
    // Users Management
    Route::post('/users/{id}/update',[AdminController::class, 'updateUser'])->name('users.update');
    Route::delete('/users/{id}/delete',[AdminController::class, 'deleteUser'])->name('users.delete');
});

require __DIR__.'/auth.php';