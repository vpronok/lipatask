import LipataskLayout from '@/Layouts/LipataskLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';

export default function AdminDashboard({ stats, withdrawals, withdrawal_history, users, settings }) {

    const { data, setData, post, processing, recentlySuccessful } = useForm({
        whatsapp_link: settings?.whatsapp_link || '', activation_fee: settings?.activation_fee || '',
        signup_bonus: settings?.signup_bonus || '', referral_bonus: settings?.referral_bonus || '',
        pay_per_message: settings?.pay_per_message || '', task_withdraw_active: settings?.task_withdraw_active || '0', 
    });

    const submitSettings = (e) => { e.preventDefault(); post(route('admin.settings.update'), { preserveScroll: true }); };

    const handleWithdrawal = (id, action) => {
        if (confirm(`Are you sure you want to ${action} this withdrawal?`)) {
            router.post(route(`admin.withdrawals.${action}`, id), {}, { preserveScroll: true });
        }
    };

    const copyPhone = (phone) => {
        navigator.clipboard.writeText(phone);
        alert("M-Pesa Number Copied: " + phone);
    };

    // User Editing State - Using local state guarantees forms populate instantly
    const [editingUser, setEditingUser] = useState(null);
    const[editData, setEditData] = useState({});

    const openEditModal = (u) => {
        setEditingUser(u.id);
        setEditData({ name: u.name, phone: u.phone, email: u.username + '@chatwazungu.com', role: u.role, is_active: u.is_active });
    };

    const submitUserEdit = (e, userId) => {
        e.preventDefault();
        router.post(route('admin.users.update', userId), editData, {
            preserveScroll: true, onSuccess: () => setEditingUser(null),
        });
    };

    const handleDeleteUser = (id) => {
        if (confirm("Absolutely sure you want to delete this user? Action cannot be undone.")) {
            router.delete(route('admin.users.delete', id), { preserveScroll: true });
        }
    };

    return (
        <LipataskLayout>
            <Head title="Admin Control Center | Chatwazungu" />

            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                        <span className="text-red-500">🛡️</span> Admin <span className="text-fuchsia-500">Control Center</span>
                    </h1>
                </div>
            </div>

            <div className="space-y-8">
                
                {/* --- Master Configuration Form (Unchanged UI) --- */}
                <form onSubmit={submitSettings} className="bg-white dark:bg-[#11071c] rounded-2xl border border-gray-100 dark:border-purple-900/50 overflow-hidden shadow-sm dark:shadow-xl">
                    <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#1a0c29] flex justify-between items-center">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">⚙️ Master Configuration</h3>
                        {recentlySuccessful && <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs px-3 py-1 rounded font-bold">✅ Saved</span>}
                    </div>
                    
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-5">
                            <h4 className="text-sm font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-widest border-b border-gray-100 dark:border-gray-800 pb-2">Financial Rules</h4>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5">Activation Fee (KSh)</label>
                                <input type="number" value={data.activation_fee} onChange={e => setData('activation_fee', e.target.value)} className="w-full bg-gray-50 dark:bg-[#090210] border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-2 text-sm text-white focus:border-emerald-500" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5">Signup Bonus (KSh)</label>
                                    <input type="number" value={data.signup_bonus} onChange={e => setData('signup_bonus', e.target.value)} className="w-full bg-gray-50 dark:bg-[#090210] border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-2 text-sm text-white focus:border-emerald-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5">Ref Bonus (KSh)</label>
                                    <input type="number" value={data.referral_bonus} onChange={e => setData('referral_bonus', e.target.value)} className="w-full bg-gray-50 dark:bg-[#090210] border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-2 text-sm text-white focus:border-emerald-500" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5">Task Rate</label>
                                    <input type="number" step="0.5" value={data.pay_per_message} onChange={e => setData('pay_per_message', e.target.value)} className="w-full bg-gray-50 dark:bg-[#090210] border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-2 text-sm text-white focus:border-emerald-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5">Task Withdrawals</label>
                                    <select value={data.task_withdraw_active} onChange={e => setData('task_withdraw_active', e.target.value)} className="w-full bg-gray-50 dark:bg-[#090210] border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-2 text-sm text-white focus:border-emerald-500">
                                        <option value="1">Enabled</option><option value="0">Disabled</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-5 flex flex-col justify-between">
                            <div>
                                <h4 className="text-sm font-black text-blue-600 dark:text-blue-500 uppercase tracking-widest border-b border-gray-100 dark:border-gray-800 pb-2 mb-5">Social</h4>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5">WhatsApp Link</label>
                                    <input type="url" value={data.whatsapp_link} onChange={e => setData('whatsapp_link', e.target.value)} className="w-full bg-gray-50 dark:bg-[#090210] border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-2 text-sm text-white focus:border-blue-500" />
                                </div>
                            </div>
                            <button type="submit" disabled={processing} className={`w-full bg-[#d904f9] hover:bg-[#c204df] text-white font-black py-4 rounded-xl shadow-[0_0_15px_rgba(217,4,249,0.4)] transition-all uppercase tracking-wider text-sm mt-4 ${processing && 'opacity-50'}`}>Save Configuration</button>
                        </div>
                    </div>
                </form>

                {/* --- PENDING WITHDRAWALS (Action Needed) --- */}
                <div className="bg-white dark:bg-[#150a21] rounded-2xl border border-gray-100 dark:border-purple-900/50 overflow-hidden shadow-sm dark:shadow-lg">
                    <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#1a0c29]">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">💸 Pending Withdrawals</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-600 dark:text-gray-300">
                            <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-100 dark:bg-[#0d0415]">
                                <tr>
                                    <th className="px-6 py-3">User & Phone</th>
                                    <th className="px-6 py-3">Amount</th>
                                    <th className="px-6 py-3">Wallet</th>
                                    <th className="px-6 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {withdrawals.length === 0 ? (
                                    <tr><td colSpan="4" className="px-6 py-8 text-center text-gray-400">No pending requests.</td></tr>
                                ) : (
                                    withdrawals.map((req) => (
                                        <tr key={req.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="font-bold text-gray-900 dark:text-white">{req.user.name}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs text-fuchsia-600 dark:text-fuchsia-400 font-mono font-bold tracking-widest">{req.user.phone || 'N/A'}</span>
                                                    <button onClick={() => copyPhone(req.user.phone)} className="bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider transition">Copy</button>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-black text-yellow-600 dark:text-yellow-400">Ksh {req.amount}</td>
                                            <td className="px-6 py-4 uppercase text-xs font-bold text-purple-600 dark:text-purple-400">{req.wallet}</td>
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

                {/* --- WITHDRAWAL HISTORY (Processed) --- */}
                <div className="bg-white dark:bg-[#11071c] rounded-2xl border border-gray-100 dark:border-purple-900/50 overflow-hidden shadow-sm dark:shadow-lg">
                    <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#1a0c29]">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">📜 Processed Withdrawals</h3>
                    </div>
                    <div className="overflow-x-auto max-h-64 custom-scrollbar">
                        <table className="w-full text-sm text-left text-gray-600 dark:text-gray-300">
                            <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-100 dark:bg-[#0d0415] sticky top-0">
                                <tr>
                                    <th className="px-6 py-3">User</th>
                                    <th className="px-6 py-3">Amount & Wallet</th>
                                    <th className="px-6 py-3">Date</th>
                                    <th className="px-6 py-3 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {withdrawal_history.length === 0 ? (
                                    <tr><td colSpan="4" className="px-6 py-8 text-center text-gray-400">No history found.</td></tr>
                                ) : (
                                    withdrawal_history.map((req) => (
                                        <tr key={req.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-3">
                                                <p className="font-bold text-gray-900 dark:text-white text-xs">{req.user.name}</p>
                                                <p className="text-[10px] text-gray-500">{req.user.phone}</p>
                                            </td>
                                            <td className="px-6 py-3">
                                                <span className="font-black text-gray-900 dark:text-white text-xs">Ksh {req.amount}</span>
                                                <span className="text-[10px] text-purple-500 ml-2 uppercase font-bold">{req.wallet}</span>
                                            </td>
                                            <td className="px-6 py-3 text-[10px] text-gray-500">{new Date(req.created_at).toLocaleDateString()}</td>
                                            <td className="px-6 py-3 text-right">
                                                <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-black tracking-wider ${req.status === 'completed' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : 'bg-rose-100 dark:bg-rose-900/30 text-rose-600'}`}>
                                                    {req.status}
                                                </span>
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
                    <div className="overflow-x-auto pb-10">
                        <table className="w-full text-sm text-left text-gray-600 dark:text-gray-300">
                            <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-100 dark:bg-[#0d0415]">
                                <tr>
                                    <th className="px-6 py-3">User</th>
                                    <th className="px-6 py-3">Role & Status</th>
                                    <th className="px-6 py-3">Main Balance</th>
                                    <th className="px-6 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {users.map((u) => (
                                    <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                        
                                        {editingUser !== u.id ? (
                                            <>
                                                {/* Standard View */}
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
                                                <td className="px-6 py-4 text-right space-x-2">
                                                    <button onClick={() => openEditModal(u)} className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition mb-1 md:mb-0">Edit</button>
                                                    <button onClick={() => handleDeleteUser(u.id)} className="bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition">Del</button>
                                                </td>
                                            </>
                                        ) : (
                                            <td colSpan="4" className="px-6 py-4 bg-gray-50 dark:bg-[#1a0c29]">
                                                {/* Editing View */}
                                                <form onSubmit={(e) => submitUserEdit(e, u.id)} className="flex flex-col md:flex-row items-center gap-3 w-full">
                                                    <input type="text" value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} className="w-full md:w-1/4 bg-white dark:bg-[#090210] border border-gray-200 dark:border-gray-800 rounded px-3 py-2 text-sm text-gray-900 dark:text-white" required placeholder="Name" />
                                                    <input type="text" value={editData.phone} onChange={e => setEditData({...editData, phone: e.target.value})} className="w-full md:w-1/4 bg-white dark:bg-[#090210] border border-gray-200 dark:border-gray-800 rounded px-3 py-2 text-sm text-gray-900 dark:text-white" required placeholder="Phone" />
                                                    
                                                    <select value={editData.role} onChange={e => setEditData({...editData, role: e.target.value})} className="w-full md:w-auto bg-white dark:bg-[#090210] border border-gray-200 dark:border-gray-800 rounded px-3 py-2 text-xs text-gray-900 dark:text-white">
                                                        <option value="user">User</option><option value="admin">Admin</option>
                                                    </select>
                                                    
                                                    <select value={editData.is_active ? '1' : '0'} onChange={e => setEditData({...editData, is_active: e.target.value === '1'})} className="w-full md:w-auto bg-white dark:bg-[#090210] border border-gray-200 dark:border-gray-800 rounded px-3 py-2 text-xs text-gray-900 dark:text-white">
                                                        <option value="1">Verified</option><option value="0">Unpaid</option>
                                                    </select>

                                                    <div className="flex-1 text-right space-x-2 w-full md:w-auto flex justify-end">
                                                        <button type="button" onClick={() => setEditingUser(null)} className="text-gray-500 hover:text-gray-700 dark:hover:text-white text-xs font-bold px-3 py-2">Cancel</button>
                                                        <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition">Save</button>
                                                    </div>
                                                </form>
                                            </td>
                                        )}
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