<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\UserDashboardController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\TeamController;
use App\Http\Controllers\LeaderboardController;
use App\Http\Controllers\FinanceController;
use App\Http\Controllers\ActivationController;
use App\Http\Controllers\ChatToEarnController;
use App\Http\Controllers\ShopController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// 1. MAKE LOGIN THE HOMEPAGE
Route::get('/', function () {
    return redirect()->route('login');
});

Route::get('/privacy', function () {
    return Inertia::render('Privacy');
})->name('privacy');

// =========================================================
// 2. THE MASTER PAYHERO WEBHOOK (Exempt from CSRF!)
// =========================================================
Route::post('/api/payhero/callback', [ActivationController::class, 'callback'])
    ->withoutMiddleware([\Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class])
    ->name('payhero.callback');

// 3. Unprotected Auth Routes (Activation Page)
Route::middleware(['auth', 'verified'])->name('activation.')->group(function () {
    Route::get('/activation',[ActivationController::class, 'index'])->name('index');
    Route::post('/activation/pay',[ActivationController::class, 'initiatePayment'])->name('pay');
    
    // --- CHANGED TO GET: Prevents HTTPS Redirect blocking ---
    Route::get('/activation/check', [ActivationController::class, 'checkStatus'])->name('check');
});

// 4. Fully Protected User Routes (Requires User to be Active)
Route::middleware(['auth', 'verified', 'active'])->group(function () {
    Route::get('/dashboard',[UserDashboardController::class, 'index'])->name('dashboard');
    
    // Profile
    Route::get('/profile',[ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile',[ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    
    // Network & Tournament
    Route::get('/team',[TeamController::class, 'index'])->name('team');
    Route::get('/leaderboard',[LeaderboardController::class, 'index'])->name('leaderboard');
    
    // --- LIVE TASKS ---
    Route::get('/chat-to-earn', [ChatToEarnController::class, 'index'])->name('chat-to-earn');
    Route::post('/chat-to-earn/complete',[ChatToEarnController::class, 'completeTask'])->name('chat-to-earn.complete');
    
    // Credit Purchase Routes
    Route::post('/chat-to-earn/buy-credits',[ChatToEarnController::class, 'buyCredits'])->name('chat.credits.pay');
    
    // --- CHANGED TO GET ---
    Route::get('/chat-to-earn/check-credits', [ChatToEarnController::class, 'checkCreditStatus'])->name('chat.credits.check');

    // --- FINANCE ROUTES ---
    Route::get('/withdraw',[FinanceController::class, 'withdraw'])->name('withdraw');
    Route::post('/withdraw', [FinanceController::class, 'storeWithdrawal'])->name('withdraw.store');
    
    // Recharge Routes
    Route::get('/recharge',[FinanceController::class, 'recharge'])->name('recharge');
    Route::post('/recharge/pay', [FinanceController::class, 'initiateRecharge'])->name('recharge.pay');
    
    // --- CHANGED TO GET ---
    Route::get('/recharge/check', [FinanceController::class, 'checkRechargeStatus'])->name('recharge.check');
    // ----------------------

    // HISTORY routes
    Route::get('/history',[FinanceController::class, 'history'])->name('history');
    Route::get('/bonuses',[FinanceController::class, 'bonuses'])->name('bonuses');

    // --- SHOP ROUTES ---
    Route::get('/shop', [ShopController::class, 'index'])->name('shop');
    Route::get('/shop/my-books', [ShopController::class, 'myBooks'])->name('shop.my-books');
    Route::post('/shop/buy', [ShopController::class, 'buyBook'])->name('shop.buy');
    Route::get('/shop/check', [ShopController::class, 'checkStatus'])->name('shop.check');
});

// 5. Chatwazungu Admin Dashboard
Route::middleware(['auth', 'admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/dashboard', [AdminController::class, 'index'])->name('dashboard');
    
    // Withdrawals
    Route::post('/withdrawals/{id}/approve',[AdminController::class, 'approveWithdrawal'])->name('withdrawals.approve');
    Route::post('/withdrawals/{id}/reject',[AdminController::class, 'rejectWithdrawal'])->name('withdrawals.reject');
    
    // Settings
    Route::post('/settings/update', [AdminController::class, 'updateSettings'])->name('settings.update');
    
    // Users Management
    Route::post('/users/store', [AdminController::class, 'storeUser'])->name('users.store');
    Route::post('/users/{id}/update',[AdminController::class, 'updateUser'])->name('users.update');
    Route::delete('/users/{id}/delete',[AdminController::class, 'deleteUser'])->name('users.delete');

    // Books Management
    Route::post('/books/store', [AdminController::class, 'storeBook'])->name('books.store');
    Route::post('/books/{id}/update', [AdminController::class, 'updateBook'])->name('books.update');
    Route::delete('/books/{id}/delete', [AdminController::class, 'deleteBook'])->name('books.delete');
});

require __DIR__.'/auth.php';