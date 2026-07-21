<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Book;
use App\Models\Purchase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ShopController extends Controller
{
    public function index(Request $request)
    {
        $books = Book::where('is_active', true)->get();
        // Get IDs of books the user already purchased
        $purchasedBookIds = $request->user()->purchases()->where('status', 'completed')->pluck('book_id')->toArray();

        return Inertia::render('Shop/Index', [
            'books' => $books,
            'purchasedBookIds' => $purchasedBookIds,
            'phone' => $request->user()->phone
        ]);
    }

    public function myBooks(Request $request)
    {
        // Load purchases with the associated books
        $purchases = $request->user()->purchases()->where('status', 'completed')->with('book')->get();

        return Inertia::render('Shop/MyBooks', [
            'purchases' => $purchases
        ]);
    }

    public function buyBook(Request $request)
    {
        $request->validate([
            'book_id' => 'required|exists:books,id',
        ]);

        $user = $request->user();
        $book = Book::findOrFail($request->book_id);

        // Check if already purchased
        $existing = Purchase::where('user_id', $user->id)->where('book_id', $book->id)->where('status', 'completed')->first();
        if ($existing) {
            return back()->withErrors(['pay' => 'You already own this book.']);
        }

        $apiKey = env('LIPALINK_API_KEY', config('services.lipalink.key'));
        $businessId = env('LIPALINK_BUSINESS_ID', config('services.lipalink.business_id'));

        if (!$apiKey || !$businessId) {
            return back()->withErrors(['pay' => 'Payment gateway not configured.']);
        }

        $reference = 'BOK_' . $user->id . '_' . $book->id . '_' . time();

        // Format phone number
        $msisdn = preg_replace('/[^0-9]/', '', $user->phone);
        if (str_starts_with($msisdn, '0')) $msisdn = '254' . substr($msisdn, 1);
        elseif (strlen($msisdn) === 9) $msisdn = '254' . $msisdn;

        try {
            $response = Http::withoutVerifying()->withHeaders([
                'X-Api-Key' => $apiKey,
                'Content-Type' => 'application/json'
            ])->post('http://lipalink.co.ke/api/stk_push.php', [
                'amount' => (float) $book->price,
                'msisdn' => $msisdn,
                'reference' => $reference,
                'business_id' => (int) $businessId,
            ]);

            $result = $response->json();

            if (!$response->successful() || (isset($result['success']) && $result['success'] === false)) {
                $errorMsg = $result['error'] ?? 'Invalid payment request.';
                Log::error('LipaLink Book Purchase Failed: ' . $response->body());
                return back()->withErrors(['pay' => 'Payment Error: ' . $errorMsg]);
            }

            // Create a pending purchase record
            $txnId = $result['transaction_id'];
            
            Purchase::updateOrCreate(
                ['user_id' => $user->id, 'book_id' => $book->id, 'status' => 'pending'],
                ['amount' => $book->price, 'reference' => $txnId]
            );

            $request->session()->put('lipalink_book_txn', $txnId);

            return back()->with('success', 'Payment Prompt Sent');

        } catch (\Exception $e) {
            Log::error('LipaLink Connection Error: ' . $e->getMessage());
            return back()->withErrors(['pay' => 'Failed to connect. Try again.']);
        }
    }

    public function checkStatus(Request $request)
    {
        $user = $request->user();
        $txnId = $request->session()->get('lipalink_book_txn');

        if (!$txnId) {
            return response()->json(['status' => 'pending']);
        }

        // Check if Webhook processed it
        $purchase = Purchase::where('user_id', $user->id)->where('reference', $txnId)->first();
        if ($purchase && $purchase->status === 'completed') {
            $request->session()->forget('lipalink_book_txn');
            return response()->json(['status' => 'success']);
        }

        // Polling logic to LipaLink
        try {
            $apiKey = env('LIPALINK_API_KEY', config('services.lipalink.key'));

            $response = Http::withoutVerifying()->withHeaders(['X-Api-Key' => $apiKey])
                ->get('http://lipalink.co.ke/api/transaction_status.php', [
                    'transaction_id' => $txnId
                ]);

            if ($response->successful()) {
                $result = $response->json();
                
                if (isset($result['success']) && $result['success']) {
                    $txStatus = strtoupper($result['status'] ?? '');
                    
                    if ($txStatus === 'SUCCESS') {
                        if ($purchase) {
                            $purchase->update(['status' => 'completed']);
                            
                            // Record as transaction expense
                            $exists = $user->transactions()->where('description', "Book Purchase ($purchase->book_id)")->exists();
                            if (!$exists) {
                                $user->transactions()->create([
                                    'amount' => $purchase->amount, 
                                    'type' => 'withdrawal', 
                                    'wallet' => 'main', 
                                    'status' => 'completed', 
                                    'description' => "Book Purchase ($purchase->book_id)"
                                ]);
                            }
                        }

                        $request->session()->forget('lipalink_book_txn');
                        return response()->json(['status' => 'success']);
                    }
                    if (in_array($txStatus, ['FAILED', 'CANCELLED'])) {
                        if ($purchase) $purchase->update(['status' => 'failed']);
                        $request->session()->forget('lipalink_book_txn');
                        return response()->json(['status' => 'failed']);
                    }
                }
            }
            return response()->json(['status' => 'pending']);
        } catch (\Exception $e) {
            return response()->json(['status' => 'pending']);
        }
    }
}
