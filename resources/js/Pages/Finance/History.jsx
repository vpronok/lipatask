import LipataskLayout from '@/Layouts/LipataskLayout';
import { Head } from '@inertiajs/react';

export default function History({ transactions, stats }) {

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true };
        return new Date(dateString).toLocaleDateString('en-US', options);
    };

    const getShortDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <LipataskLayout>
            <Head title="Transaction History | Chatwazungu" />

            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white">Transaction <span className="text-fuchsia-500">History</span></h1>
                    <button className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 shadow-[0_0_15px_rgba(192,38,211,0.4)]">
                        + New Request
                    </button>
                </div>

                {/* Top Stat Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-gradient-to-r from-[#6b0f9c] to-[#9d17d6] rounded-2xl p-5 shadow-lg flex items-center gap-4">
                        <div className="bg-white/20 p-2.5 rounded-full text-white">✔️</div>
                        <div>
                            <h3 className="text-2xl font-black text-white">Ksh {stats.paid_out}</h3>
                            <p className="text-[10px] text-purple-200 uppercase font-black tracking-wider">{stats.paid_count} PAID OUT</p>
                        </div>
                    </div>
                    <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-5 shadow-lg flex items-center gap-4">
                        <div className="bg-white/20 p-2.5 rounded-full text-white">🕒</div>
                        <div>
                            <h3 className="text-2xl font-black text-white">{stats.pending_count}</h3>
                            <p className="text-[10px] text-emerald-100 uppercase font-black tracking-wider">PENDING • {stats.total_count} TOTAL</p>
                        </div>
                    </div>
                </div>

                {/* Transactions List */}
                <div className="bg-white dark:bg-[#11071c] rounded-2xl border border-gray-100 dark:border-purple-900/30 overflow-hidden shadow-xl">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#1a0c29] flex justify-between items-center">
                        <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2 text-sm">
                            <span className="text-fuchsia-500">🧾</span> Transactions
                        </h3>
                        <span className="bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider">{transactions.length} records</span>
                    </div>

                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                        {transactions.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 text-sm">No transactions found.</div>
                        ) : (
                            transactions.map((tx) => (
                                <div key={tx.id} className="p-4 md:p-5 flex items-start justify-between hover:bg-gray-50 dark:hover:bg-white/5 transition">
                                    <div className="flex gap-4">
                                        {/* Status Icon */}
                                        <div className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center text-white flex-shrink-0 shadow-md ${
                                            tx.status === 'completed' ? 'bg-emerald-500 shadow-emerald-500/30' : 
                                            tx.status === 'rejected' ? 'bg-rose-500 shadow-rose-500/30' : 'bg-amber-500 shadow-amber-500/30'
                                        }`}>
                                            {tx.status === 'completed' ? '✔️' : tx.status === 'rejected' ? '✖️' : '🕒'}
                                        </div>

                                        <div>
                                            <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                                <h4 className="font-black text-gray-900 dark:text-white text-base">#{tx.id + 1000}</h4>
                                                <span className="bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-400 text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">{tx.wallet}</span>
                                                <span className={`text-[9px] px-2 py-0.5 rounded font-black tracking-wider uppercase ${
                                                    tx.status === 'completed' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' :
                                                    tx.status === 'rejected' ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400' :
                                                    'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                                                }`}>
                                                    {tx.status} • {getShortDate(tx.created_at)}
                                                </span>
                                            </div>
                                            <div className="text-[11px] text-gray-500 flex flex-wrap items-center gap-1 mt-1">
                                                <span>📅 {formatDate(tx.created_at)}</span>
                                                <span className="text-emerald-600 dark:text-emerald-400 font-bold mx-1">→ Ksh {tx.amount}</span>
                                                <span>— Fee Ksh 0.00</span>
                                            </div>
                                            <p className="text-[10px] text-gray-400 mt-1 italic">{tx.description}</p>
                                        </div>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <h3 className="text-lg md:text-xl font-black text-gray-900 dark:text-white">Ksh {tx.amount}</h3>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </LipataskLayout>
    );
}