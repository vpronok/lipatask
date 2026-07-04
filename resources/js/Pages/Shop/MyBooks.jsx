import { Head, Link } from '@inertiajs/react';
import LipataskLayout from '@/Layouts/LipataskLayout';

export default function MyBooks({ purchases }) {
    return (
        <LipataskLayout>
            <Head title="My Countries" />

            <div className="max-w-7xl mx-auto py-8 animate-[fadeIn_0.5s_ease-out]">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white">
                            My <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-fuchsia-500">Countries</span>
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-2">Access all your purchased self-improvement books.</p>
                    </div>
                    <Link href={route('shop')} className="bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-800 dark:text-white px-6 py-3 rounded-xl font-bold transition">
                        ← Back to Shop
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {purchases.length === 0 ? (
                        <div className="col-span-full py-12 text-center">
                            <div className="text-6xl mb-4">💬</div>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Your country list is empty</h3>
                            <p className="text-gray-500 mb-6">Discover premium products in our shop.</p>
                            <Link href={route('shop')} className="bg-orange-600 hover:bg-orange-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg">
                                Browse Shop
                            </Link>
                        </div>
                    ) : (
                        purchases.map(purchase => {
                            const book = purchase.book;
                            if (!book) return null;

                            return (
                                <div key={purchase.id} className="bg-white dark:bg-[#11071c] rounded-2xl border border-purple-100 dark:border-purple-900/30 overflow-hidden shadow-xl hover:shadow-2xl transition-all flex flex-col">
                                    <div className="h-48 bg-purple-50 dark:bg-[#1a0e29] flex items-center justify-center relative overflow-hidden group">
                                        {book.image_url ? (
                                            <img src={book.image_url} alt={book.title} className="w-full h-full object-cover transition transform group-hover:scale-105" />
                                        ) : (
                                            <span className="text-6xl">💬</span>
                                        )}
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                            <a href={book.file_url || '#'} target="_blank" rel="noreferrer" className="bg-white text-gray-900 px-6 py-2 rounded-full font-bold shadow-lg transform translate-y-4 group-hover:translate-y-0 transition">
                                                Read Now
                                            </a>
                                        </div>
                                    </div>
                                    <div className="p-5 flex-1 flex flex-col">
                                        <h3 className="font-black text-gray-900 dark:text-white text-lg mb-2">{book.title}</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 flex-1 line-clamp-2">{book.description}</p>
                                        
                                        <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-800">
                                            <a 
                                                href={book.file_url || '#'}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="block w-full text-center bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white px-4 py-2.5 rounded-lg text-sm font-bold shadow-lg shadow-purple-500/30 transition"
                                            >
                                                Open Book
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </LipataskLayout>
    );
}
