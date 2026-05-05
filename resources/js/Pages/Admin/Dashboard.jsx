import { Head, router, useForm, Link } from '@inertiajs/react';
import { useState } from 'react';

export default function AdminDashboard({ analytics, withdrawals, withdrawal_history, users, settings }) {
    
    // --- UI NAVIGATION STATE ---
    const[activeTab, setActiveTab] = useState('analytics'); // analytics, users, pending, processed, config

    // --- SETTINGS FORM ---
    const { data: configData, setData: setConfigData, post: postConfig, processing: configProcessing, recentlySuccessful } = useForm({
        whatsapp_link: settings?.whatsapp_link || '', activation_fee: settings?.activation_fee || '',
        signup_bonus: settings?.signup_bonus || '', referral_bonus: settings?.referral_bonus || '',
        pay_per_message: settings?.pay_per_message || '', task_withdraw_active: settings?.task_withdraw_active || '0', 
        withdrawal_fee: settings?.withdrawal_fee || '20',
    });

    const submitSettings = (e) => { e.preventDefault(); postConfig(route('admin.settings.update'), { preserveScroll: true }); };

    // --- WITHDRAWALS ---
    const handleWithdrawal = (id, action) => {
        if (confirm(`Are you sure you want to ${action} this withdrawal?`)) router.post(route(`admin.withdrawals.${action}`, id), {}, { preserveScroll: true });
    };

    // --- USER SEARCH & FILTER LOGIC ---
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // all, active, inactive
    const [selectedUser, setSelectedUser] = useState(null); // For the View Modal
    
    // Derived state: Automatically filters users blazingly fast in the browser
    const filteredUsers = users.filter(u => {
        const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              u.username.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              u.phone.includes(searchQuery);
        
        const matchesStatus = statusFilter === 'all' ? true : (statusFilter === 'active' ? u.is_active : !u.is_active);
        
        return matchesSearch && matchesStatus;
    });

    // --- USER EDIT LOGIC ---
    const [editingUser, setEditingUser] = useState(null);
    const [editData, setEditData] = useState({});

    const openEditMode = (u) => {
        setEditingUser(u.id);
        setEditData({ name: u.name, phone: u.phone || '', email: u.email, role: u.role, is_active: u.is_active });
    };

    const submitUserEdit = (e, userId) => {
        e.preventDefault();
        router.post(route('admin.users.update', userId), editData, { preserveScroll: true, onSuccess: () => setEditingUser(null) });
    };

    const handleDeleteUser = (id) => {
        if (confirm("Absolutely sure you want to delete this user? Action cannot be undone.")) {
            router.delete(route('admin.users.delete', id), { preserveScroll: true });
        }
    };

    return (
        <div className="flex h-screen bg-[#05010a] text-white font-sans overflow-hidden selection:bg-red-500">
            <Head title="Admin OS | Chatwazungu" />

            {/* ================= EXCLUSIVE ADMIN SIDEBAR ================= */}
            <aside className="w-[280px] bg-[#0a0214] border-r border-red-900/30 hidden md:flex flex-col z-20 shadow-[4px_0_24px_rgba(0,0,0,0.5)]">
                <div className="h-20 flex items-center px-6 gap-3 border-b border-red-900/30">
                    <div className="w-10 h-10 rounded bg-red-600 flex items-center justify-center font-black text-white shadow-[0_0_15px_rgba(220,38,38,0.5)]">OS</div>
                    <span className="font-black tracking-widest text-red-500 uppercase text-lg">ADMIN OS</span>
                </div>

                <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-2 mb-4">Command Center</p>
                    
                    <button onClick={() => setActiveTab('analytics')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'analytics' ? 'bg-red-900/30 text-red-400 border border-red-500/30' : 'text-gray-400 hover:bg-white/5'}`}>
                        <span>📊</span> Platform Analytics
                    </button>
                    
                    <button onClick={() => setActiveTab('users')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'users' ? 'bg-red-900/30 text-red-400 border border-red-500/30' : 'text-gray-400 hover:bg-white/5'}`}>
                        <span>👥</span> Platform Users
                    </button>

                    <button onClick={() => setActiveTab('pending')} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'pending' ? 'bg-red-900/30 text-red-400 border border-red-500/30' : 'text-gray-400 hover:bg-white/5'}`}>
                        <div className="flex items-center gap-3"><span>💸</span> Pending Payouts</div>
                        {withdrawals.length > 0 && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{withdrawals.length}</span>}
                    </button>

                    <button onClick={() => setActiveTab('processed')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'processed' ? 'bg-red-900/30 text-red-400 border border-red-500/30' : 'text-gray-400 hover:bg-white/5'}`}>
                        <span>📜</span> Processed History
                    </button>

                    <button onClick={() => setActiveTab('config')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'config' ? 'bg-red-900/30 text-red-400 border border-red-500/30' : 'text-gray-400 hover:bg-white/5'}`}>
                        <span>⚙️</span> Master Configuration
                    </button>
                </nav>

                <div className="p-4 border-t border-red-900/30">
                    <Link href={route('dashboard')} className="w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-3 rounded-xl text-sm font-bold transition">
                        Exit to App 🚪
                    </Link>
                </div>
            </aside>

            {/* ================= MAIN CONTENT ================= */}
            <main className="flex-1 overflow-y-auto p-6 md:p-10 relative bg-[#090210]">
                {/* Subtle Background Red Glow */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-600/5 blur-[120px] rounded-full pointer-events-none"></div>

                {/* --- TAB 1: ANALYTICS (Home) --- */}
                {activeTab === 'analytics' && (
                    <div className="animate-[fadeIn_0.3s_ease-out]">
                        <h2 className="text-3xl font-black text-white mb-2">Platform <span className="text-red-500">Analytics</span></h2>
                        <p className="text-gray-400 text-sm mb-8">Daily overview and historical revenue metrics.</p>

                        {/* Daily Stats */}
                        <h3 className="text-xs font-bold text-red-500 tracking-widest uppercase mb-4">Daily Performance (Today)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                            <div className="bg-[#11071c] p-6 rounded-2xl border border-red-900/30 shadow-lg">
                                <p className="text-gray-400 text-xs uppercase tracking-wider mb-2 font-bold">Active Sign Ups (Today)</p>
                                <h3 className="text-4xl font-black text-white">{analytics.daily_signups}</h3>
                                <p className="text-[10px] text-emerald-400 mt-2">Accounts verified via M-Pesa today</p>
                            </div>
                            <div className="bg-[#11071c] p-6 rounded-2xl border border-red-900/30 shadow-lg">
                                <p className="text-gray-400 text-xs uppercase tracking-wider mb-2 font-bold">Daily Revenue (Activations)</p>
                                <h3 className="text-4xl font-black text-emerald-400">Ksh {analytics.daily_revenue}</h3>
                                <p className="text-[10px] text-gray-500 mt-2">Cash deposited to platform today</p>
                            </div>
                        </div>

                        {/* Historical Stats */}
                        <h3 className="text-xs font-bold text-gray-500 tracking-widest uppercase mb-4">Historical Metrics</h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                            <div className="bg-[#150a21] p-5 rounded-2xl border border-gray-800">
                                <p className="text-gray-500 text-[10px] uppercase font-bold mb-1">Total Users</p>
                                <h3 className="text-2xl font-black text-white">{analytics.total_users}</h3>
                                <p className="text-[10px] text-gray-500 mt-1">{analytics.active_users} are active</p>
                            </div>
                            <div className="bg-[#150a21] p-5 rounded-2xl border border-gray-800">
                                <p className="text-gray-500 text-[10px] uppercase font-bold mb-1">Historical Revenue</p>
                                <h3 className="text-2xl font-black text-emerald-400">Ksh {analytics.historical_revenue}</h3>
                                <p className="text-[10px] text-gray-500 mt-1">All-time activation income</p>
                            </div>
                            <div className="bg-[#150a21] p-5 rounded-2xl border border-gray-800">
                                <p className="text-gray-500 text-[10px] uppercase font-bold mb-1">Pending Payouts</p>
                                <h3 className="text-2xl font-black text-amber-500">Ksh {analytics.pending_payouts}</h3>
                                <p className="text-[10px] text-gray-500 mt-1">Awaiting admin approval</p>
                            </div>
                            <div className="bg-[#150a21] p-5 rounded-2xl border border-gray-800">
                                <p className="text-gray-500 text-[10px] uppercase font-bold mb-1">Total Paid Out</p>
                                <h3 className="text-2xl font-black text-purple-400">Ksh {analytics.total_paid}</h3>
                                <p className="text-[10px] text-gray-500 mt-1">Cleared withdrawals</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- TAB 2: PLATFORM USERS (Search & Filter) --- */}
                {activeTab === 'users' && (
                    <div className="animate-[fadeIn_0.3s_ease-out]">
                        <h2 className="text-3xl font-black text-white mb-6">Platform <span className="text-blue-500">Users</span></h2>
                        
                        {/* Search & Filter Toolbar */}
                        <div className="flex flex-col md:flex-row gap-4 mb-6">
                            <input 
                                type="text" 
                                placeholder="Search by name, username, or phone..." 
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="flex-1 bg-[#11071c] border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-blue-500"
                            />
                            <select 
                                value={statusFilter} 
                                onChange={e => setStatusFilter(e.target.value)}
                                className="bg-[#11071c] border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-blue-500 w-full md:w-48"
                            >
                                <option value="all">All Users</option>
                                <option value="active">Active (Verified)</option>
                                <option value="inactive">Inactive (Unpaid)</option>
                            </select>
                        </div>

                        {/* Users Table */}
                        <div className="bg-[#11071c] rounded-2xl border border-gray-800 overflow-hidden shadow-xl">
                            <div className="px-6 py-4 border-b border-gray-800 bg-[#150a21] flex justify-between items-center">
                                <h3 className="font-bold text-sm text-gray-300">👥 Users Directory</h3>
                                <span className="text-xs text-gray-500">{filteredUsers.length} records found</span>
                            </div>
                            <div className="overflow-x-auto pb-10">
                                <table className="w-full text-sm text-left text-gray-300">
                                    <thead className="text-[10px] text-gray-500 uppercase bg-[#0d0415]">
                                        <tr>
                                            <th className="px-6 py-3">User</th>
                                            <th className="px-6 py-3">Status</th>
                                            <th className="px-6 py-3">Main Balance</th>
                                            <th className="px-6 py-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800">
                                        {filteredUsers.map((u) => (
                                            <tr key={u.id} className="hover:bg-white/5 transition-colors">
                                                {editingUser !== u.id ? (
                                                    <>
                                                        <td className="px-6 py-4">
                                                            <p className="font-bold text-white">{u.name}</p>
                                                            <p className="text-xs text-gray-500">@{u.username} • {u.phone}</p>
                                                        </td>
                                                        <td className="px-6 py-4 space-y-1">
                                                            <div className={`px-2 py-0.5 rounded text-[9px] uppercase font-black tracking-wider w-max ${u.is_active ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'}`}>
                                                                {u.is_active ? 'Verified' : 'Unpaid'}
                                                            </div>
                                                            {u.role === 'admin' && <div className="text-[9px] text-red-500 font-bold uppercase">ADMIN</div>}
                                                        </td>
                                                        <td className="px-6 py-4 font-black text-white">Ksh {u.balance}</td>
                                                        <td className="px-6 py-4 text-right space-x-2">
                                                            <button onClick={() => setSelectedUser(u)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded text-xs font-bold transition">View</button>
                                                            <button onClick={() => openEditMode(u)} className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded text-xs font-bold transition">Edit</button>
                                                            <button onClick={() => handleDeleteUser(u.id)} className="bg-red-900/50 hover:bg-red-600 text-red-400 hover:text-white px-3 py-1.5 rounded text-xs font-bold transition">Del</button>
                                                        </td>
                                                    </>
                                                ) : (
                                                    <td colSpan="4" className="px-6 py-4 bg-[#1a0e29]">
                                                        {/* EDIT FORM */}
                                                        <form onSubmit={(e) => submitUserEdit(e, u.id)} className="flex flex-wrap items-center gap-3 w-full">
                                                            <input type="text" value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} className="bg-[#090210] border border-gray-700 rounded px-3 py-1 text-sm text-white" placeholder="Name" required />
                                                            <input type="text" value={editData.phone} onChange={e => setEditData({...editData, phone: e.target.value})} className="bg-[#090210] border border-gray-700 rounded px-3 py-1 text-sm text-white" placeholder="Phone" required />
                                                            <input type="email" value={editData.email} onChange={e => setEditData({...editData, email: e.target.value})} className="bg-[#090210] border border-gray-700 rounded px-3 py-1 text-sm text-white" placeholder="Email" required />
                                                            <select value={editData.role} onChange={e => setEditData({...editData, role: e.target.value})} className="bg-[#090210] border border-gray-700 rounded px-3 py-1 text-xs text-white">
                                                                <option value="user">User</option><option value="admin">Admin</option>
                                                            </select>
                                                            <select value={editData.is_active ? '1' : '0'} onChange={e => setEditData({...editData, is_active: e.target.value === '1'})} className="bg-[#090210] border border-gray-700 rounded px-3 py-1 text-xs text-white">
                                                                <option value="1">Verified</option><option value="0">Unpaid</option>
                                                            </select>
                                                            <div className="flex-1 text-right space-x-2 min-w-max">
                                                                <button type="button" onClick={() => setEditingUser(null)} className="text-gray-400 hover:text-white text-xs font-bold px-2">Cancel</button>
                                                                <button type="submit" className="bg-emerald-600 text-white px-3 py-1.5 rounded text-xs font-bold">Save</button>
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
                )}

                {/* --- TAB 3: PENDING WITHDRAWALS --- */}
                {activeTab === 'pending' && (
                    <div className="animate-[fadeIn_0.3s_ease-out]">
                        <h2 className="text-3xl font-black text-white mb-6">Pending <span className="text-amber-500">Payouts</span></h2>
                        <div className="bg-[#11071c] rounded-2xl border border-gray-800 overflow-hidden shadow-xl">
                            <div className="px-6 py-4 border-b border-gray-800 bg-[#150a21]">
                                <h3 className="font-bold text-sm text-gray-300">Action Required</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left text-gray-300">
                                    <thead className="text-[10px] text-gray-500 uppercase bg-[#0d0415]">
                                        <tr>
                                            <th className="px-6 py-3">User & Phone</th>
                                            <th className="px-6 py-3">Amount</th>
                                            <th className="px-6 py-3">Wallet</th>
                                            <th className="px-6 py-3">Date</th>
                                            <th className="px-6 py-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800">
                                        {withdrawals.length === 0 ? (
                                            <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">No pending requests.</td></tr>
                                        ) : (
                                            withdrawals.map((req) => (
                                                <tr key={req.id} className="hover:bg-white/5 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <p className="font-bold text-white">{req.user.name}</p>
                                                        <p className="text-xs text-amber-500 font-mono tracking-widest">{req.user.phone}</p>
                                                    </td>
                                                    <td className="px-6 py-4 font-black text-yellow-400">Ksh {req.amount}</td>
                                                    <td className="px-6 py-4 uppercase text-xs font-bold text-purple-400">{req.wallet}</td>
                                                    <td className="px-6 py-4 text-xs text-gray-500">{new Date(req.created_at).toLocaleDateString()}</td>
                                                    <td className="px-6 py-4 text-right space-x-2">
                                                        <button onClick={() => handleWithdrawal(req.id, 'approve')} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition">Approve</button>
                                                        <button onClick={() => handleWithdrawal(req.id, 'reject')} className="bg-red-600 hover:bg-red-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition">Reject</button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- TAB 4: PROCESSED WITHDRAWALS --- */}
                {activeTab === 'processed' && (
                    <div className="animate-[fadeIn_0.3s_ease-out]">
                        <h2 className="text-3xl font-black text-white mb-6">Processed <span className="text-emerald-500">History</span></h2>
                        <div className="bg-[#11071c] rounded-2xl border border-gray-800 overflow-hidden shadow-xl">
                            <div className="px-6 py-4 border-b border-gray-800 bg-[#150a21]">
                                <h3 className="font-bold text-sm text-gray-300">Past 100 Transactions</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left text-gray-300">
                                    <thead className="text-[10px] text-gray-500 uppercase bg-[#0d0415] sticky top-0">
                                        <tr>
                                            <th className="px-6 py-3">User</th>
                                            <th className="px-6 py-3">Amount & Wallet</th>
                                            <th className="px-6 py-3">Date</th>
                                            <th className="px-6 py-3 text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800">
                                        {withdrawal_history.length === 0 ? (
                                            <tr><td colSpan="4" className="px-6 py-8 text-center text-gray-500">No history found.</td></tr>
                                        ) : (
                                            withdrawal_history.map((req) => (
                                                <tr key={req.id} className="hover:bg-white/5 transition-colors">
                                                    <td className="px-6 py-3">
                                                        <p className="font-bold text-white text-xs">{req.user.name}</p>
                                                        <p className="text-[10px] text-gray-500">{req.user.phone}</p>
                                                    </td>
                                                    <td className="px-6 py-3">
                                                        <span className="font-black text-white text-xs">Ksh {req.amount}</span>
                                                        <span className="text-[10px] text-gray-500 ml-2 uppercase">{req.wallet}</span>
                                                    </td>
                                                    <td className="px-6 py-3 text-[10px] text-gray-500">{new Date(req.created_at).toLocaleDateString()}</td>
                                                    <td className="px-6 py-3 text-right">
                                                        <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-black tracking-wider ${req.status === 'completed' ? 'bg-emerald-900/30 text-emerald-500' : 'bg-red-900/30 text-red-500'}`}>
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
                    </div>
                )}

                {/* --- TAB 5: SETTINGS --- */}
                {activeTab === 'config' && (
                    <div className="animate-[fadeIn_0.3s_ease-out]">
                        <h2 className="text-3xl font-black text-white mb-6">Master <span className="text-purple-500">Config</span></h2>
                        <form onSubmit={submitSettings} className="bg-[#11071c] rounded-2xl border border-gray-800 overflow-hidden shadow-xl">
                            <div className="px-6 py-4 border-b border-gray-800 bg-[#150a21] flex justify-between items-center">
                                <h3 className="font-bold text-sm text-gray-300">Global Variables</h3>
                                {recentlySuccessful && <span className="bg-emerald-900/50 text-emerald-400 text-[10px] px-3 py-1 rounded-full font-bold">SAVED</span>}
                            </div>
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-5">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-gray-800 pb-2">Financial Rules</h4>
                                    <div><label className="block text-[10px] text-gray-400 uppercase mb-1">Activation Fee</label><input type="number" value={configData.activation_fee} onChange={e => setConfigData('activation_fee', e.target.value)} className="w-full bg-[#090210] border border-gray-700 rounded-lg px-4 py-2 text-sm text-white focus:ring-1 focus:ring-red-500" /></div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><label className="block text-[10px] text-gray-400 uppercase mb-1">Signup Bonus</label><input type="number" value={configData.signup_bonus} onChange={e => setConfigData('signup_bonus', e.target.value)} className="w-full bg-[#090210] border border-gray-700 rounded-lg px-4 py-2 text-sm text-white focus:ring-1 focus:ring-red-500" /></div>
                                        <div><label className="block text-[10px] text-gray-400 uppercase mb-1">Ref Bonus</label><input type="number" value={configData.referral_bonus} onChange={e => setConfigData('referral_bonus', e.target.value)} className="w-full bg-[#090210] border border-gray-700 rounded-lg px-4 py-2 text-sm text-white focus:ring-1 focus:ring-red-500" /></div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><label className="block text-[10px] text-gray-400 uppercase mb-1">Task Rate / Msg</label><input type="number" step="0.5" value={configData.pay_per_message} onChange={e => setConfigData('pay_per_message', e.target.value)} className="w-full bg-[#090210] border border-gray-700 rounded-lg px-4 py-2 text-sm text-white focus:ring-1 focus:ring-red-500" /></div>
                                        <div><label className="block text-[10px] text-gray-400 uppercase mb-1">Withdrawal Fee</label><input type="number" value={configData.withdrawal_fee} onChange={e => setConfigData('withdrawal_fee', e.target.value)} className="w-full bg-[#090210] border border-gray-700 rounded-lg px-4 py-2 text-sm text-white focus:ring-1 focus:ring-red-500" /></div>
                                    </div>
                                    <div><label className="block text-[10px] text-gray-400 uppercase mb-1">Task Withdrawals</label><select value={configData.task_withdraw_active} onChange={e => setConfigData('task_withdraw_active', e.target.value)} className="w-full bg-[#090210] border border-gray-700 rounded-lg px-4 py-2 text-sm text-white focus:ring-1 focus:ring-red-500"><option value="1">Enabled</option><option value="0">Disabled (Locked)</option></select></div>
                                </div>
                                <div className="space-y-5 flex flex-col justify-between">
                                    <div>
                                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-gray-800 pb-2 mb-4">Social</h4>
                                        <div><label className="block text-[10px] text-gray-400 uppercase mb-1">WhatsApp Link</label><input type="url" value={configData.whatsapp_link} onChange={e => setConfigData('whatsapp_link', e.target.value)} className="w-full bg-[#090210] border border-gray-700 rounded-lg px-4 py-2 text-sm text-white focus:ring-1 focus:ring-red-500" /></div>
                                    </div>
                                    <button type="submit" disabled={configProcessing} className={`w-full bg-red-600 hover:bg-red-500 text-white font-bold py-4 rounded-xl shadow-[0_0_15px_rgba(220,38,38,0.3)] transition-all uppercase tracking-wider text-sm mt-4 ${configProcessing && 'opacity-50'}`}>Save Configuration</button>
                                </div>
                            </div>
                        </form>
                    </div>
                )}
            </main>

            {/* ================= USER DATA MODAL ================= */}
            {selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-[#11071c] w-full max-w-2xl max-h-[90vh] rounded-2xl border border-gray-800 shadow-2xl flex flex-col overflow-hidden animate-[fadeIn_0.2s_ease-out]">
                        
                        {/* Modal Header */}
                        <div className="p-6 border-b border-gray-800 bg-[#150a21] flex justify-between items-start relative">
                            <div>
                                <h2 className="text-2xl font-black text-white">{selectedUser.name}</h2>
                                <p className="text-sm text-gray-400">@{selectedUser.username} • {selectedUser.phone}</p>
                            </div>
                            <button onClick={() => setSelectedUser(null)} className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center text-gray-400 hover:text-white transition">✖</button>
                        </div>

                        {/* Modal Body (Scrollable) */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-[#090210] p-4 rounded-xl border border-gray-800 text-center"><p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mb-1">Status</p><span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${selectedUser.is_active ? 'bg-emerald-900/30 text-emerald-400' : 'bg-red-900/30 text-red-400'}`}>{selectedUser.is_active ? 'Active' : 'Unpaid'}</span></div>
                                <div className="bg-[#090210] p-4 rounded-xl border border-gray-800 text-center"><p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mb-1">Income</p><h4 className="text-lg font-black text-emerald-400">Ksh {selectedUser.total_income}</h4></div>
                                <div className="bg-[#090210] p-4 rounded-xl border border-gray-800 text-center"><p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mb-1">Referrals</p><h4 className="text-lg font-black text-white">{selectedUser.referrals_count}</h4></div>
                                <div className="bg-[#090210] p-4 rounded-xl border border-gray-800 text-center"><p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mb-1">Upline</p><h4 className="text-sm font-bold text-purple-400 truncate">{selectedUser.upline}</h4></div>
                            </div>

                            <div>
                                <h3 className="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2"><span>👥</span> User's Downline (Team)</h3>
                                <div className="bg-[#090210] border border-gray-800 rounded-xl overflow-hidden">
                                    <table className="w-full text-xs text-left text-gray-400">
                                        <thead className="bg-[#150a21] text-[9px] uppercase">
                                            <tr><th className="px-4 py-2">Name / Username</th><th className="px-4 py-2">Phone</th><th className="px-4 py-2 text-right">Status</th></tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-800">
                                            {selectedUser.team.length === 0 ? (
                                                <tr><td colSpan="3" className="px-4 py-6 text-center text-gray-600">No referrals found.</td></tr>
                                            ) : (
                                                selectedUser.team.map(ref => (
                                                    <tr key={ref.id} className="hover:bg-white/5">
                                                        <td className="px-4 py-3"><p className="font-bold text-white">{ref.name}</p><p className="text-[10px]">@{ref.username}</p></td>
                                                        <td className="px-4 py-3">{ref.phone}</td>
                                                        <td className="px-4 py-3 text-right"><span className={`${ref.is_active ? 'text-emerald-500' : 'text-red-500'} font-bold`}>{ref.is_active ? 'Active' : 'Unpaid'}</span></td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Tailwind utility classes for basic animations */}
            <style jsx global>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
}