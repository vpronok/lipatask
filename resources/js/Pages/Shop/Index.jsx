import { Head, usePage, Link, router } from '@inertiajs/react';
import LipataskLayout from '@/Layouts/LipataskLayout';
import { useState, useEffect } from 'react';

export default function ShopIndex({ books, purchasedBookIds, phone }) {
    const { errors, flash } = usePage().props;
    
    const [payingBookId, setPayingBookId] = useState(null);
    const [statusChecker, setStatusChecker] = useState(null);
    const [paymentStatus, setPaymentStatus] = useState(null); // null, 'pending', 'success', 'failed'

    const [isProcessing, setIsProcessing] = useState(false);

    const handleBuy = (bookId) => {
        if (isProcessing) return;
        setIsProcessing(true);
        setPayingBookId(bookId);
        setPaymentStatus('pending');

        router.post(route('shop.buy'), 
            { book_id: bookId },
            {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    setIsProcessing(false);
                    startCheckingStatus();
                },
                onError: () => {
                    setIsProcessing(false);
                    setPayingBookId(null);
                    setPaymentStatus('failed');
                }
            }
        );
    };

    const startCheckingStatus = () => {
        if (statusChecker) clearInterval(statusChecker);
        
        const interval = setInterval(async () => {
            try {
                const response = await fetch(route('shop.check'));
                const data = await response.json();

                if (data.status === 'success') {
                    clearInterval(interval);
                    setPaymentStatus('success');
                    setTimeout(() => window.location.reload(), 2000);
                } else if (data.status === 'failed') {
                    clearInterval(interval);
                    setPaymentStatus('failed');
                    setPayingBookId(null);
                }
            } catch (e) {
                console.error(e);
            }
        }, 5000);

        setStatusChecker(interval);
    };

    useEffect(() => {
        return () => {
            if (statusChecker) clearInterval(statusChecker);
        };
    }, [statusChecker]);

    return (
        <LipataskLayout>
            <Head title="Chat na Wazungu" />

            <div className="max-w-7xl mx-auto py-8 animate-[fadeIn_0.5s_ease-out]">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white">
                            Chat na <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500">Wazungu</span>
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-2">Invest in your mind. Purchase premium self-improvement books.</p>
                    </div>
                    <Link href={route('shop.my-books')} className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-purple-500/30 transition transform hover:-translate-y-0.5">
                        💬 Countries
                    </Link>
                </div>

                {errors.pay && (
                    <div className="bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl mb-6">
                        {errors.pay}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {books.length === 0 ? (
                        <div className="col-span-full py-12 text-center text-gray-500">
                            No books available in the shop at the moment.
                        </div>
                    ) : (
                        books.map(book => {
                            const isOwned = purchasedBookIds.includes(book.id);
                            const isPaying = payingBookId === book.id && paymentStatus === 'pending';

                            return (
                                <div key={book.id} className="bg-white dark:bg-[#11071c] rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-xl hover:shadow-2xl transition-all flex flex-col">
                                    <div className="h-48 bg-gray-100 dark:bg-[#1a0e29] flex items-center justify-center relative overflow-hidden">
                                        {book.image_url ? (
                                            <img src={book.image_url} alt={book.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-6xl">💬</span>
                                        )}
                                        {isOwned && (
                                            <div className="absolute top-3 right-3 bg-emerald-500 text-white text-xs font-black px-2 py-1 rounded-md shadow-lg">
                                                OWNED
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-5 flex-1 flex flex-col">
                                        <h3 className="font-black text-gray-900 dark:text-white text-lg mb-2">{book.title}</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 flex-1 line-clamp-3">{book.description}</p>
                                        
                                        <div className="flex items-center justify-between mt-auto">
                                            <span className="text-xl font-black text-emerald-500">Ksh {book.price}</span>
                                            
                                            {isOwned ? (
                                                <Link href={route('shop.my-books')} className="bg-gray-100 dark:bg-white/10 text-gray-800 dark:text-white px-4 py-2 rounded-lg text-sm font-bold">
                                                    Read
                                                </Link>
                                            ) : isPaying ? (
                                                <button disabled className="bg-orange-500/50 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 animate-pulse">
                                                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                                    Awaiting M-Pesa
                                                </button>
                                            ) : (
                                                <button 
                                                    onClick={() => handleBuy(book.id)}
                                                    disabled={isProcessing || paymentStatus === 'pending'}
                                                    className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg shadow-orange-500/30 transition transform hover:scale-105 disabled:opacity-50"
                                                >
                                                    Chat Now
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* PAYMENT PROCESSING OVERLAY */}
            {paymentStatus === 'pending' && (
                <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm z-[100] flex flex-col items-center justify-center p-4">
                    <div className="bg-white dark:bg-[#11071c] p-8 rounded-3xl max-w-sm w-full text-center border border-purple-200 dark:border-purple-900/30 shadow-2xl">
                        <div className="w-20 h-20 mx-auto mb-6 relative">
                            <div className="absolute inset-0 border-4 border-gray-100 dark:border-gray-800 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center text-2xl">📱</div>
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Check Your Phone</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                            An M-Pesa prompt has been sent to <span className="font-bold text-orange-500">{phone}</span>. Please enter your PIN to complete the purchase.
                        </p>
                        <p className="text-xs text-gray-400 animate-pulse">
                            Waiting for confirmation...
                        </p>
                    </div>
                </div>
            )}
            
            {/* SUCCESS OVERLAY */}
            {paymentStatus === 'success' && (
                <div className="fixed inset-0 bg-emerald-900/90 backdrop-blur-md z-[100] flex flex-col items-center justify-center p-4 animate-[fadeIn_0.3s_ease-out]">
                    <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mb-6 animate-[bounce_1s_ease-in-out]">
                        <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <h2 className="text-4xl font-black text-white mb-2 text-center">Purchase Successful!</h2>
                    <p className="text-emerald-100 text-lg text-center">Your book has been added to your library.</p>
                </div>
            )}
        </LipataskLayout>
    );
}
