import LipataskLayout from '@/Layouts/LipataskLayout';
import { Head, router, useForm } from '@inertiajs/react';

export default function AdminDashboard({ stats, withdrawals, users, settings }) {

    // 1. Unified Form logic for Platform Settings (API Keys securely hidden in backend!)
    const { data, setData, post, processing, recentlySuccessful } = useForm({
        whatsapp_link: settings?.whatsapp_link || '',
        activation_fee: settings?.activation_fee || '',
        signup_bonus: settings?.signup_bonus || '',
        referral_bonus: settings?.referral_bonus || '',
    });

    const submitSettings = (e) => {
        e.preventDefault();
        post(route('admin.settings.update'), {
            preserveScroll: true,
        });
    };

    // 2. Withdrawal Approval/Rejection Logic
    const handleWithdrawal = (id, action) => {
        if (confirm(`Are you sure you want to ${action} this withdrawal?`)) {
            router.post(route(`admin.withdrawals.${action}`, id));
        }
    };

    return (
        <LipataskLayout>
            <Head title="Admin Control Center | Lipatask" />

            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                        <span className="text-red-500">🛡️</span> Admin <span className="text-fuchsia-500">Control Center</span>
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Manage global platform settings, financial rules, and user payouts.</p>
                </div>
            </div>

            <div className="space-y-8">
                
                {/* --- Platform Overview Stats --- */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-[#150a21] p-6 rounded-2xl border border-gray-100 dark:border-purple-900/50 shadow-sm dark:shadow-lg relative overflow-hidden">
                        <div className="absolute right-0 top-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl"></div>
                        <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider mb-2 font-bold">Total Platform Users</p>
                        <h3 className="text-3xl font-black text-gray-900 dark:text-white">{stats.total_users}</h3>
                    </div>
                    <div className="bg-white dark:bg-[#150a21] p-6 rounded-2xl border border-gray-100 dark:border-yellow-900/50 shadow-sm dark:shadow-lg relative overflow-hidden">
                        <div className="absolute right-0 top-0 w-24 h-24 bg-yellow-500/10 rounded-full blur-2xl"></div>
                        <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider mb-2 font-bold">Pending Payouts</p>
                        <h3 className="text-3xl font-black text-yellow-600 dark:text-yellow-500">Ksh {stats.pending_payouts}</h3>
                    </div>
                    <div className="bg-white dark:bg-[#150a21] p-6 rounded-2xl border border-gray-100 dark:border-emerald-900/50 shadow-sm dark:shadow-lg relative overflow-hidden">
                        <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl"></div>
                        <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider mb-2 font-bold">Total Paid Out</p>
                        <h3 className="text-3xl font-black text-emerald-600 dark:text-emerald-400">Ksh {stats.total_paid}</h3>
                    </div>
                </div>

                {/* --- MASTER PLATFORM SETTINGS FORM --- */}
                <form onSubmit={submitSettings} className="bg-white dark:bg-[#11071c] rounded-2xl border border-gray-100 dark:border-purple-900/50 overflow-hidden shadow-sm dark:shadow-xl">
                    <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#1a0c29] flex justify-between items-center">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">⚙️ Platform Configuration</h3>
                        {recentlySuccessful && (
                            <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs px-3 py-1 rounded font-bold">✅ Saved Successfully</span>
                        )}
                    </div>
                    
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                        
                        {/* Column 1: Financial Rules */}
                        <div className="space-y-5">
                            <h4 className="text-sm font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-widest border-b border-gray-100 dark:border-gray-800 pb-2">Financial Rules</h4>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5">M-Pesa Activation Fee (KSh)</label>
                                <input type="number" value={data.activation_fee} onChange={e => setData('activation_fee', e.target.value)} placeholder="e.g. 150" className="w-full bg-gray-50 dark:bg-[#090210] border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-2 text-sm text-gray-900 dark:text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5">Signup Bonus</label>
                                    <input type="number" value={data.signup_bonus} onChange={e => setData('signup_bonus', e.target.value)} placeholder="KSh" className="w-full bg-gray-50 dark:bg-[#090210] border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-2 text-sm text-gray-900 dark:text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5">Referral Bonus</label>
                                    <input type="number" value={data.referral_bonus} onChange={e => setData('referral_bonus', e.target.value)} placeholder="KSh" className="w-full bg-gray-50 dark:bg-[#090210] border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-2 text-sm text-gray-900 dark:text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                                </div>
                            </div>
                        </div>

                        {/* Column 2: Social Links & Submit */}
                        <div className="space-y-5 flex flex-col justify-between">
                            <div>
                                <h4 className="text-sm font-black text-blue-600 dark:text-blue-500 uppercase tracking-widest border-b border-gray-100 dark:border-gray-800 pb-2 mb-5">Social & App</h4>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5">WhatsApp Group Link</label>
                                    <input type="url" value={data.whatsapp_link} onChange={e => setData('whatsapp_link', e.target.value)} placeholder="https://chat.whatsapp.com/..." className="w-full bg-gray-50 dark:bg-[#090210] border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                                </div>
                            </div>

                            <button 
                                type="submit"
                                disabled={processing}
                                className={`w-full bg-[#d904f9] hover:bg-[#c204df] text-white font-black py-4 rounded-xl shadow-[0_0_15px_rgba(217,4,249,0.4)] transition-all uppercase tracking-wider text-sm mt-4 ${processing && 'opacity-50'}`}
                            >
                                {processing ? 'Saving Configurations...' : 'Save Configuration'}
                            </button>
                        </div>
                    </div>
                </form>

                {/* --- Pending Withdrawals Table --- */}
                <div className="bg-white dark:bg-[#150a21] rounded-2xl border border-gray-100 dark:border-purple-900/50 overflow-hidden shadow-sm dark:shadow-lg">
                    <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#1a0c29]">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">💸 Pending Withdrawal Requests</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-600 dark:text-gray-300">
                            <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-100 dark:bg-[#0d0415]">
                                <tr>
                                    <th className="px-6 py-3">User & Phone</th>
                                    <th className="px-6 py-3">Amount</th>
                                    <th className="px-6 py-3">Wallet</th>
                                    <th className="px-6 py-3">Date</th>
                                    <th className="px-6 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {withdrawals.length === 0 ? (
                                    <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-400 dark:text-gray-500">No pending requests.</td></tr>
                                ) : (
                                    withdrawals.map((req) => (
                                        <tr key={req.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="font-bold text-gray-900 dark:text-white">{req.user.name}</p>
                                                <p className="text-xs text-fuchsia-600 dark:text-fuchsia-400 font-mono tracking-widest">{req.user.phone || 'N/A'}</p>
                                            </td>
                                            <td className="px-6 py-4 font-black text-yellow-600 dark:text-yellow-400">Ksh {req.amount}</td>
                                            <td className="px-6 py-4 uppercase text-xs font-bold text-purple-600 dark:text-purple-400">{req.wallet}</td>
                                            <td className="px-6 py-4 text-xs">{new Date(req.created_at).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 text-right space-x-2">
                                                <button onClick={() => handleWithdrawal(req.id, 'approve')} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition">Approve</button>
                                                <button onClick={() => handleWithdrawal(req.id, 'reject')} className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition">Reject</button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* --- Users Management Table --- */}
                <div className="bg-white dark:bg-[#150a21] rounded-2xl border border-gray-100 dark:border-purple-900/50 overflow-hidden shadow-sm dark:shadow-lg">
                    <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#1a0c29] flex justify-between items-center">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">👥 Platform Users</h3>
                        <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs px-3 py-1 rounded-full font-bold">{users.length} Total</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-600 dark:text-gray-300">
                            <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-100 dark:bg-[#0d0415]">
                                <tr>
                                    <th className="px-6 py-3">User</th>
                                    <th className="px-6 py-3">Role & Status</th>
                                    <th className="px-6 py-3">Main Balance</th>
                                    <th className="px-6 py-3">Referrals</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {users.map((u) => (
                                    <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-gray-900 dark:text-white">{u.name}</p>
                                            <p className="text-xs text-gray-500">@{u.username} • {u.phone}</p>
                                        </td>
                                        <td className="px-6 py-4 space-y-1">
                                            <div className={`px-2.5 py-1 rounded text-[10px] uppercase font-black tracking-wider w-max ${u.role === 'admin' ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
                                                {u.role}
                                            </div>
                                            <div className={`px-2.5 py-0.5 rounded text-[9px] uppercase font-black tracking-wider w-max ${u.is_active ? 'text-emerald-500 border border-emerald-500/30' : 'text-rose-500 border border-rose-500/30'}`}>
                                                {u.is_active ? 'Verified' : 'Unpaid'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-black text-gray-900 dark:text-white">Ksh {u.balance}</td>
                                        <td className="px-6 py-4 font-medium">{u.referrals_count} users</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </LipataskLayout>
    );
}