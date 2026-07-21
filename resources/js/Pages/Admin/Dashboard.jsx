import { Head, router, useForm, Link } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';

export default function AdminDashboard({ analytics, shop_analytics, withdrawals, withdrawal_history, users, settings, books, filters }) {
    
    // --- UI NAVIGATION & MOBILE STATE ---
    const[activeTab, setActiveTab] = useState(filters?.tab || 'analytics'); 
    const[isSidebarOpen, setIsSidebarOpen] = useState(false);

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setIsSidebarOpen(false); // Auto-close sidebar on mobile
        window.history.replaceState({}, '', `?tab=${tab}`);
    };

    // --- PROGRESSIVE FEES STATE ---
    // Parse the JSON string from settings if it exists, otherwise empty array
    const [feeTiers, setFeeTiers] = useState(
        settings?.withdrawal_fee_tiers ? JSON.parse(settings.withdrawal_fee_tiers) :[]
    );

    const addTier = () => setFeeTiers([...feeTiers, { min: '', max: '', fee: '' }]);
    const updateTier = (index, field, value) => {
        const newTiers = [...feeTiers];
        newTiers[index][field] = value;
        setFeeTiers(newTiers);
    };
    const removeTier = (index) => setFeeTiers(feeTiers.filter((_, i) => i !== index));

    // --- MASTER SETTINGS FORM ---
    const { data: configData, setData: setConfigData, post: postConfig, processing: configProcessing, recentlySuccessful } = useForm({
        whatsapp_link: settings?.whatsapp_link || '', 
        activation_fee: settings?.activation_fee || '',
        signup_bonus: settings?.signup_bonus || '', 
        referral_bonus: settings?.referral_bonus || '',
        pay_per_message: settings?.pay_per_message || '', 
        task_withdraw_active: settings?.task_withdraw_active || '0', 
        withdrawal_fee: settings?.withdrawal_fee || '20', // Fallback flat fee
        withdrawal_fee_tiers: settings?.withdrawal_fee_tiers || '[]',
    });

    // Sync the dynamic JSON fee tiers into the form before saving
    useEffect(() => {
        setConfigData('withdrawal_fee_tiers', JSON.stringify(feeTiers));
    }, [feeTiers]);

    const submitSettings = (e) => { 
        e.preventDefault(); 
        postConfig(route('admin.settings.update'), { preserveScroll: true }); 
    };

    // --- WITHDRAWALS LOGIC ---
    const handleWithdrawal = (id, action) => {
        if (confirm(`Are you sure you want to ${action} this withdrawal?`)) {
            router.post(route(`admin.withdrawals.${action}`, id), {}, { preserveScroll: true });
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        alert("Copied to clipboard: " + text);
    };

    // Extract Net Payout from transaction description
    const getNetPayout = (description, amount) => {
        const match = description?.match(/Payout:\s*Ksh\s*([0-9.]+)/i);
        return match ? match[1] : amount;
    };

    // --- USER SEARCH & FILTER LOGIC (Server Side) ---
    const [searchQuery, setSearchQuery] = useState(filters?.search || '');
    const [statusFilter, setStatusFilter] = useState(filters?.status || 'all');
    const[selectedUser, setSelectedUser] = useState(null); 
    const isFirstRender = useRef(true);

    // Debounce search
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        const delayDebounceFn = setTimeout(() => {
            router.get(route('admin.dashboard'), {
                tab: activeTab,
                search: searchQuery,
                status: statusFilter
            }, { preserveState: true, preserveScroll: true, replace: true });
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, statusFilter]);

    // --- USER EDIT / ADD LOGIC ---
    const [editingUser, setEditingUser] = useState(null);
    const[showAddModal, setShowAddUserModal] = useState(false);
    const [editData, setEditData] = useState({});
    
    const addUserForm = useForm({ 
        name: '', username: '', phone: '', email: '', password: '', role: 'user', is_active: true 
    });

    // --- SHOP / BOOK LOGIC ---
    const [editingBook, setEditingBook] = useState(null);
    const [showAddBookModal, setShowAddBookModal] = useState(false);
    const [editBookData, setEditBookData] = useState({});
    const addBookForm = useForm({
        title: '', description: '', price: '', image: null, file_url: '', is_active: true
    });

    const openEditBookMode = (b) => {
        setEditingBook(b.id);
        setEditBookData({ title: b.title, description: b.description || '', price: b.price, image: null, file_url: b.file_url || '', is_active: b.is_active });
    };
    const submitBookEdit = (e, bookId) => {
        e.preventDefault();
        router.post(route('admin.books.update', bookId), editBookData, { preserveScroll: true, onSuccess: () => setEditingBook(null) });
    };
    const submitAddBook = (e) => {
        e.preventDefault();
        addBookForm.post(route('admin.books.store'), { preserveScroll: true, onSuccess: () => { setShowAddBookModal(false); addBookForm.reset(); } });
    };
    const handleDeleteBook = (id) => {
        if (confirm("Delete this book?")) router.delete(route('admin.books.delete', id), { preserveScroll: true });
    };

    const openEditMode = (u) => {
        setEditingUser(u.id);
        setEditData({ name: u.name, phone: u.phone || '', email: u.email, role: u.role, is_active: u.is_active });
    };

    const submitUserEdit = (e, userId) => {
        e.preventDefault();
        router.post(route('admin.users.update', userId), editData, { 
            preserveScroll: true, onSuccess: () => setEditingUser(null) 
        });
    };

    const submitAddUser = (e) => {
        e.preventDefault();
        addUserForm.post(route('admin.users.store'), { 
            preserveScroll: true, 
            onSuccess: () => { setShowAddUserModal(false); addUserForm.reset(); } 
        });
    };

    const handleDeleteUser = (id) => {
        if (confirm("Absolutely sure you want to delete this user? Action cannot be undone.")) {
            router.delete(route('admin.users.delete', id), { preserveScroll: true });
        }
    };

    return (
        <div className="flex h-screen bg-[#05010a] text-white font-sans overflow-hidden selection:bg-red-500 relative">
            <Head title="Admin OS | Chatwazungu" />

            {/* ================= MOBILE OVERLAY & HEADER ================= */}
            {isSidebarOpen && <div className="fixed inset-0 bg-black/80 z-40 md:hidden" onClick={() => setIsSidebarOpen(false)}></div>}
            
            <header className="md:hidden absolute top-0 w-full h-16 bg-[#0a0214] border-b border-red-900/30 flex items-center px-4 z-30">
                <button onClick={() => setIsSidebarOpen(true)} className="text-gray-300 hover:text-white p-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" /></svg>
                </button>
                <span className="font-black tracking-widest text-red-500 uppercase ml-4">ADMIN OS</span>
            </header>

            {/* ================= EXCLUSIVE ADMIN SIDEBAR ================= */}
            <aside className={`absolute md:relative z-50 w-[280px] h-full bg-[#0a0214] border-r border-red-900/30 flex flex-col shadow-2xl transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
                <div className="h-16 md:h-20 flex items-center px-6 gap-3 border-b border-red-900/30 justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded bg-red-600 flex items-center justify-center font-black text-white shadow-[0_0_15px_rgba(220,38,38,0.5)]">OS</div>
                        <span className="font-black tracking-widest text-red-500 uppercase text-base md:text-lg">ADMIN OS</span>
                    </div>
                    <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-gray-500 text-xl font-bold">×</button>
                </div>

                <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2 custom-scrollbar">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-2 mb-4">Command Center</p>
                    
                    <button onClick={() => handleTabChange('analytics')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'analytics' ? 'bg-red-900/30 text-red-400 border border-red-500/30' : 'text-gray-400 hover:bg-white/5'}`}>
                        <span>📊</span> Platform Analytics
                    </button>
                    
                    <button onClick={() => handleTabChange('users')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'users' ? 'bg-red-900/30 text-red-400 border border-red-500/30' : 'text-gray-400 hover:bg-white/5'}`}>
                        <span>👥</span> Platform Users
                    </button>

                    <button onClick={() => handleTabChange('pending')} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'pending' ? 'bg-red-900/30 text-red-400 border border-red-500/30' : 'text-gray-400 hover:bg-white/5'}`}>
                        <div className="flex items-center gap-3"><span>💸</span> Pending Payouts</div>
                        {withdrawals.length > 0 && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{withdrawals.length}</span>}
                    </button>

                    <button onClick={() => handleTabChange('processed')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'processed' ? 'bg-red-900/30 text-red-400 border border-red-500/30' : 'text-gray-400 hover:bg-white/5'}`}>
                        <span>📜</span> Processed History
                    </button>

                    {/* NEW PROGRESSIVE FEES TAB */}
                    <button onClick={() => handleTabChange('fees')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'fees' ? 'bg-red-900/30 text-red-400 border border-red-500/30' : 'text-gray-400 hover:bg-white/5'}`}>
                        <span>💰</span> Withdrawal Charges
                    </button>

                    <button onClick={() => handleTabChange('config')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'config' ? 'bg-red-900/30 text-red-400 border border-red-500/30' : 'text-gray-400 hover:bg-white/5'}`}>
                        <span>⚙️</span> Master Configuration
                    </button>

                    <button onClick={() => handleTabChange('shop')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'shop' ? 'bg-red-900/30 text-red-400 border border-red-500/30' : 'text-gray-400 hover:bg-white/5'}`}>
                        <span>💬</span> Chat na Wazungu
                    </button>
                </nav>

                <div className="p-4 border-t border-red-900/30">
                    <Link href={route('dashboard')} className="w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-3 rounded-xl text-sm font-bold transition">
                        Exit to App 🚪
                    </Link>
                </div>
            </aside>

            {/* ================= MAIN CONTENT ================= */}
            <main className="flex-1 overflow-y-auto p-4 pt-20 md:pt-10 md:p-10 relative bg-[#090210]">
                {/* Subtle Background Red Glow */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-600/5 blur-[120px] rounded-full pointer-events-none"></div>

                {/* --- TAB 1: ANALYTICS --- */}
                {activeTab === 'analytics' && (
                    <div className="animate-[fadeIn_0.3s_ease-out]">
                        <h2 className="text-2xl md:text-3xl font-black text-white mb-2">Platform <span className="text-red-500">Analytics</span></h2>
                        <p className="text-gray-400 text-xs md:text-sm mb-8">Daily overview and historical revenue metrics.</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                            <div className="bg-[#11071c] p-6 rounded-2xl border border-red-900/30 shadow-lg">
                                <p className="text-gray-400 text-xs uppercase tracking-wider mb-2 font-bold">Active Sign Ups (Today)</p>
                                <h3 className="text-3xl md:text-4xl font-black text-white">{analytics.daily_signups}</h3>
                                <p className="text-[10px] text-emerald-400 mt-2">Accounts verified via M-Pesa today</p>
                            </div>
                            <div className="bg-[#11071c] p-6 rounded-2xl border border-red-900/30 shadow-lg">
                                <p className="text-gray-400 text-xs uppercase tracking-wider mb-2 font-bold">Daily Revenue (Activations)</p>
                                <h3 className="text-3xl md:text-4xl font-black text-emerald-400">Ksh {analytics.daily_revenue}</h3>
                                <p className="text-[10px] text-gray-500 mt-2">Cash deposited to platform today</p>
                            </div>
                        </div>

                        <h3 className="text-xs font-bold text-gray-500 tracking-widest uppercase mb-4">Historical Metrics</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                            <div className="bg-[#150a21] p-4 md:p-5 rounded-2xl border border-gray-800">
                                <p className="text-gray-500 text-[9px] md:text-[10px] uppercase font-bold mb-1">Total Users</p>
                                <h3 className="text-xl md:text-2xl font-black text-white">{analytics.total_users}</h3>
                            </div>
                            <div className="bg-[#150a21] p-4 md:p-5 rounded-2xl border border-gray-800">
                                <p className="text-gray-500 text-[9px] md:text-[10px] uppercase font-bold mb-1">Hist. Revenue</p>
                                <h3 className="text-xl md:text-2xl font-black text-emerald-400">Ksh {analytics.historical_revenue}</h3>
                            </div>
                            <div className="bg-[#150a21] p-4 md:p-5 rounded-2xl border border-gray-800">
                                <p className="text-gray-500 text-[9px] md:text-[10px] uppercase font-bold mb-1">Pending Out</p>
                                <h3 className="text-xl md:text-2xl font-black text-amber-500">Ksh {analytics.pending_payouts}</h3>
                            </div>
                            <div className="bg-[#150a21] p-4 md:p-5 rounded-2xl border border-gray-800">
                                <p className="text-gray-500 text-[9px] md:text-[10px] uppercase font-bold mb-1">Total Paid</p>
                                <h3 className="text-xl md:text-2xl font-black text-purple-400">Ksh {analytics.total_paid}</h3>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- TAB 2: PLATFORM USERS --- */}
                {activeTab === 'users' && (
                    <div className="animate-[fadeIn_0.3s_ease-out]">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                            <h2 className="text-2xl md:text-3xl font-black text-white">Platform <span className="text-blue-500">Users</span></h2>
                            <button onClick={() => setShowAddUserModal(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-lg w-full md:w-auto">
                                + Manually Add User
                            </button>
                        </div>
                        
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

                        <div className="bg-[#11071c] rounded-2xl border border-gray-800 overflow-hidden shadow-xl">
                            <div className="px-6 py-4 border-b border-gray-800 bg-[#150a21] flex justify-between items-center">
                                <h3 className="font-bold text-sm text-gray-300">👥 Users Directory</h3>
                                <span className="text-xs text-gray-500">Page {users?.current_page} of {users?.last_page}</span>
                            </div>
                            <div className="overflow-x-auto pb-6">
                                <table className="w-full text-sm text-left text-gray-300 min-w-[700px]">
                                    <thead className="text-[10px] text-gray-500 uppercase bg-[#0d0415]">
                                        <tr>
                                            <th className="px-6 py-3">User</th>
                                            <th className="px-6 py-3">Status</th>
                                            <th className="px-6 py-3">Balance</th>
                                            <th className="px-6 py-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800">
                                        {users?.data?.map((u) => (
                                            <tr key={u.id} className="hover:bg-white/5 transition-colors">
                                                {editingUser !== u.id ? (
                                                    <>
                                                        <td className="px-6 py-4">
                                                            <p className="font-bold text-white">{u.name}</p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="text-xs text-gray-500">@{u.username} • {u.phone}</span>
                                                                <button onClick={() => copyToClipboard(u.phone)} className="text-[9px] bg-gray-800 px-1.5 py-0.5 rounded hover:bg-gray-700 transition">Copy</button>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 space-y-1">
                                                            <div className={`px-2 py-0.5 rounded text-[9px] uppercase font-black tracking-wider w-max ${u.is_active ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'}`}>
                                                                {u.is_active ? 'Verified' : 'Unpaid'}
                                                            </div>
                                                            {u.role === 'admin' && <div className="text-[9px] text-red-500 font-bold uppercase mt-1">ADMIN</div>}
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
                                                            <input type="text" value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} className="bg-[#090210] border border-gray-700 rounded px-3 py-1 text-sm text-white flex-1 min-w-[120px]" placeholder="Name" required />
                                                            <input type="text" value={editData.phone} onChange={e => setEditData({...editData, phone: e.target.value})} className="bg-[#090210] border border-gray-700 rounded px-3 py-1 text-sm text-white flex-1 min-w-[120px]" placeholder="Phone" required />
                                                            <input type="email" value={editData.email} onChange={e => setEditData({...editData, email: e.target.value})} className="bg-[#090210] border border-gray-700 rounded px-3 py-1 text-sm text-white flex-1 min-w-[150px]" placeholder="Email" required />
                                                            
                                                            <select value={editData.role} onChange={e => setEditData({...editData, role: e.target.value})} className="bg-[#090210] border border-gray-700 rounded px-3 py-1 text-xs text-white">
                                                                <option value="user">User</option>
                                                                <option value="admin">Admin</option>
                                                            </select>
                                                            
                                                            <select value={editData.is_active ? '1' : '0'} onChange={e => setEditData({...editData, is_active: e.target.value === '1'})} className="bg-[#090210] border border-gray-700 rounded px-3 py-1 text-xs text-white">
                                                                <option value="1">Verified</option>
                                                                <option value="0">Unpaid</option>
                                                            </select>
                                                            
                                                            <div className="text-right space-x-2 w-full mt-2 md:mt-0 md:w-auto">
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

                            {/* Pagination Links */}
                            <div className="p-4 border-t border-gray-800 flex justify-center gap-1 flex-wrap">
                                {users?.links?.map((link, k) => (
                                    <Link 
                                        key={k} 
                                        href={link.url ? `${link.url}&tab=users` : '#'} 
                                        preserveState 
                                        preserveScroll 
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${link.active ? 'bg-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.4)]' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'} ${!link.url && 'opacity-30 cursor-not-allowed'}`} 
                                        dangerouslySetInnerHTML={{ __html: link.label }} 
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* --- TAB 3: PENDING WITHDRAWALS (With Net Payout & Copy Button) --- */}
                {activeTab === 'pending' && (
                    <div className="animate-[fadeIn_0.3s_ease-out]">
                        <h2 className="text-3xl font-black text-white mb-6">Pending <span className="text-amber-500">Payouts</span></h2>
                        <div className="bg-[#11071c] rounded-2xl border border-gray-800 overflow-hidden shadow-xl">
                            <div className="overflow-x-auto min-w-[700px]">
                                <table className="w-full text-sm text-left text-gray-300">
                                    <thead className="text-[10px] text-gray-500 uppercase bg-[#0d0415]">
                                        <tr>
                                            <th className="px-6 py-3">User & Contact</th>
                                            <th className="px-6 py-3">Requested</th>
                                            <th className="px-6 py-3 bg-emerald-900/20 text-emerald-400">Net To Send (Ksh)</th>
                                            <th className="px-6 py-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800">
                                        {withdrawals.length === 0 ? (
                                            <tr><td colSpan="4" className="px-6 py-8 text-center text-gray-500">No pending requests.</td></tr>
                                        ) : (
                                            withdrawals.map((req) => (
                                                <tr key={req.id} className="hover:bg-white/5 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <p className="font-bold text-white">{req.user.name}</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-xs text-amber-500 font-mono tracking-widest">{req.user.phone}</span>
                                                            <button onClick={() => copyToClipboard(req.user.phone)} className="bg-emerald-600/20 text-emerald-500 hover:bg-emerald-500 hover:text-white text-[9px] px-2 py-0.5 rounded font-bold uppercase transition">Copy Number</button>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 font-bold text-gray-400">Ksh {req.amount}</td>
                                                    <td className="px-6 py-4 font-black text-emerald-400 text-xl bg-emerald-900/5">
                                                        {getNetPayout(req.description, req.amount)}
                                                    </td>
                                                    <td className="px-6 py-4 text-right space-x-2">
                                                        <button onClick={() => handleWithdrawal(req.id, 'approve')} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition mb-1 md:mb-0">Approve</button>
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
                            <div className="overflow-x-auto max-h-[600px] custom-scrollbar">
                                <table className="w-full text-sm text-left text-gray-300">
                                    <thead className="text-[10px] text-gray-500 uppercase bg-[#0d0415] sticky top-0 z-10 shadow-md">
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
                                                        <span className="text-[10px] text-purple-500 ml-2 uppercase font-bold">{req.wallet}</span>
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

                {/* --- TAB 5: WITHDRAWAL CHARGES (Progressive Fees UI) --- */}
                {activeTab === 'fees' && (
                    <div className="animate-[fadeIn_0.3s_ease-out]">
                        <h2 className="text-3xl font-black text-white mb-2">Withdrawal <span className="text-emerald-500">Charges</span></h2>
                        <p className="text-gray-400 text-sm mb-6">Set progressive fee ranges (e.g. 170-1000 = Ksh 20)</p>

                        <div className="bg-[#11071c] rounded-2xl border border-gray-800 p-6 shadow-xl max-w-3xl">
                            <div className="space-y-4 mb-6">
                                {feeTiers.map((tier, index) => (
                                    <div key={index} className="flex flex-col sm:flex-row gap-4 items-center bg-[#150a21] p-4 rounded-xl border border-gray-700/50 shadow-inner">
                                        <div className="flex-1 w-full"><label className="text-[10px] text-gray-500 uppercase font-bold">Min Amount</label><input type="number" value={tier.min} onChange={e => updateTier(index, 'min', e.target.value)} className="w-full bg-[#090210] border border-gray-800 rounded text-sm text-white px-3 py-2 focus:ring-1 focus:ring-emerald-500" placeholder="e.g. 170"/></div>
                                        <div className="flex-1 w-full"><label className="text-[10px] text-gray-500 uppercase font-bold">Max Amount</label><input type="number" value={tier.max} onChange={e => updateTier(index, 'max', e.target.value)} className="w-full bg-[#090210] border border-gray-800 rounded text-sm text-white px-3 py-2 focus:ring-1 focus:ring-emerald-500" placeholder="e.g. 1000"/></div>
                                        <div className="flex-1 w-full"><label className="text-[10px] text-emerald-500 uppercase font-bold">Fee (Ksh)</label><input type="number" value={tier.fee} onChange={e => updateTier(index, 'fee', e.target.value)} className="w-full bg-emerald-900/20 border border-emerald-500/30 rounded text-sm text-emerald-400 px-3 py-2 font-bold focus:ring-1 focus:ring-emerald-500" placeholder="e.g. 20"/></div>
                                        <button onClick={() => removeTier(index)} className="mt-4 sm:mt-5 text-red-500 hover:text-red-400 bg-red-500/10 hover:bg-red-500/20 p-2.5 rounded-lg font-bold transition">🗑️</button>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="flex gap-4">
                                <button onClick={addTier} className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-xl transition text-sm shadow-md">+ Add Range</button>
                                <button onClick={submitSettings} disabled={configProcessing} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-6 rounded-xl transition text-sm flex-1 shadow-[0_0_15px_rgba(16,185,129,0.3)]">Save Ranges</button>
                            </div>
                            {recentlySuccessful && <p className="text-emerald-500 text-xs mt-3 font-bold animate-pulse">Ranges saved successfully!</p>}
                        </div>
                    </div>
                )}

                {/* --- TAB 6: MASTER CONFIGURATION --- */}
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
                                        <div><label className="block text-[10px] text-gray-400 uppercase mb-1">Default Withdraw Fee</label><input type="number" value={configData.withdrawal_fee} onChange={e => setConfigData('withdrawal_fee', e.target.value)} className="w-full bg-[#090210] border border-gray-700 rounded-lg px-4 py-2 text-sm text-white focus:ring-1 focus:ring-red-500" /></div>
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

                {/* --- TAB 7: CHAT NA WAZUNGU --- */}
                {activeTab === 'shop' && (
                    <div className="animate-[fadeIn_0.3s_ease-out]">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-3xl font-black text-white">Chat na <span className="text-blue-500">Wazungu</span></h2>
                            <button onClick={() => setShowAddBookModal(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-lg">
                                + Add New Book
                            </button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                            <div className="bg-[#150a21] p-4 md:p-5 rounded-2xl border border-gray-800">
                                <p className="text-gray-500 text-[9px] md:text-[10px] uppercase font-bold mb-1">Daily Sales</p>
                                <h3 className="text-xl md:text-2xl font-black text-white">{shop_analytics?.daily_sales || 0}</h3>
                            </div>
                            <div className="bg-[#150a21] p-4 md:p-5 rounded-2xl border border-gray-800">
                                <p className="text-gray-500 text-[9px] md:text-[10px] uppercase font-bold mb-1">Daily Revenue</p>
                                <h3 className="text-xl md:text-2xl font-black text-emerald-400">Ksh {shop_analytics?.daily_revenue || 0}</h3>
                            </div>
                            <div className="bg-[#150a21] p-4 md:p-5 rounded-2xl border border-gray-800">
                                <p className="text-gray-500 text-[9px] md:text-[10px] uppercase font-bold mb-1">Total Sales</p>
                                <h3 className="text-xl md:text-2xl font-black text-amber-500">{shop_analytics?.total_sales || 0}</h3>
                            </div>
                            <div className="bg-[#150a21] p-4 md:p-5 rounded-2xl border border-gray-800">
                                <p className="text-gray-500 text-[9px] md:text-[10px] uppercase font-bold mb-1">Total Revenue</p>
                                <h3 className="text-xl md:text-2xl font-black text-purple-400">Ksh {shop_analytics?.total_revenue || 0}</h3>
                            </div>
                        </div>

                        <div className="bg-[#11071c] rounded-2xl border border-gray-800 overflow-hidden shadow-xl">
                            <div className="px-6 py-4 border-b border-gray-800 bg-[#150a21]">
                                <h3 className="font-bold text-sm text-gray-300">💬 Products Directory</h3>
                            </div>
                            <div className="overflow-x-auto pb-6">
                                <table className="w-full text-sm text-left text-gray-300 min-w-[700px]">
                                    <thead className="text-[10px] text-gray-500 uppercase bg-[#0d0415]">
                                        <tr>
                                            <th className="px-6 py-3">Title & Details</th>
                                            <th className="px-6 py-3">Price</th>
                                            <th className="px-6 py-3">Status</th>
                                            <th className="px-6 py-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800">
                                        {books?.length === 0 ? (
                                            <tr><td colSpan="4" className="px-6 py-8 text-center text-gray-500">No books added yet.</td></tr>
                                        ) : books?.map((b) => (
                                            <tr key={b.id} className="hover:bg-white/5 transition-colors">
                                                {editingBook !== b.id ? (
                                                    <>
                                                        <td className="px-6 py-4">
                                                            <p className="font-bold text-white">{b.title}</p>
                                                            <p className="text-xs text-gray-500 truncate max-w-[300px]">{b.description}</p>
                                                        </td>
                                                        <td className="px-6 py-4 font-black text-emerald-400">Ksh {b.price}</td>
                                                        <td className="px-6 py-4">
                                                            <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-black tracking-wider ${b.is_active ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'}`}>
                                                                {b.is_active ? 'Active' : 'Inactive'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right space-x-2">
                                                            <button onClick={() => openEditBookMode(b)} className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded text-xs font-bold transition">Edit</button>
                                                            <button onClick={() => handleDeleteBook(b.id)} className="bg-red-900/50 hover:bg-red-600 text-red-400 hover:text-white px-3 py-1.5 rounded text-xs font-bold transition">Del</button>
                                                        </td>
                                                    </>
                                                ) : (
                                                    <td colSpan="4" className="px-6 py-4 bg-[#1a0e29]">
                                                        <form onSubmit={(e) => submitBookEdit(e, b.id)} className="flex flex-wrap items-center gap-3 w-full">
                                                            <input type="text" value={editBookData.title} onChange={e => setEditBookData({...editBookData, title: e.target.value})} className="bg-[#090210] border border-gray-700 rounded px-3 py-1 text-sm text-white flex-1 min-w-[120px]" placeholder="Title" required />
                                                            <input type="text" value={editBookData.description} onChange={e => setEditBookData({...editBookData, description: e.target.value})} className="bg-[#090210] border border-gray-700 rounded px-3 py-1 text-sm text-white flex-1 min-w-[150px]" placeholder="Description" />
                                                            <input type="number" value={editBookData.price} onChange={e => setEditBookData({...editBookData, price: e.target.value})} className="bg-[#090210] border border-gray-700 rounded px-3 py-1 text-sm text-white w-[100px]" placeholder="Price" required />
                                                            <input type="file" accept="image/*" onChange={e => setEditBookData({...editBookData, image: e.target.files[0]})} className="bg-[#090210] border border-gray-700 rounded px-3 py-1 text-sm text-white flex-1 min-w-[150px]" />
                                                            <input type="url" value={editBookData.file_url} onChange={e => setEditBookData({...editBookData, file_url: e.target.value})} className="bg-[#090210] border border-gray-700 rounded px-3 py-1 text-sm text-white flex-1 min-w-[150px]" placeholder="File/Download URL" />
                                                            <select value={editBookData.is_active ? '1' : '0'} onChange={e => setEditBookData({...editBookData, is_active: e.target.value === '1'})} className="bg-[#090210] border border-gray-700 rounded px-3 py-1 text-xs text-white">
                                                                <option value="1">Active</option>
                                                                <option value="0">Inactive</option>
                                                            </select>
                                                            <div className="text-right space-x-2 w-full mt-2 md:mt-0 md:w-auto">
                                                                <button type="button" onClick={() => setEditingBook(null)} className="text-gray-400 hover:text-white text-xs font-bold px-2">Cancel</button>
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

            </main>

            {/* ================= ADD NEW USER MODAL ================= */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-[#11071c] w-full max-w-md rounded-2xl border border-blue-500/30 shadow-2xl overflow-hidden animate-[fadeIn_0.2s_ease-out]">
                        <div className="p-4 border-b border-gray-800 bg-[#150a21] flex justify-between items-center">
                            <h3 className="font-bold text-white text-lg">➕ Add New User</h3>
                            <button onClick={() => setShowAddUserModal(false)} className="text-gray-500 hover:text-white bg-gray-800 w-8 h-8 rounded-full">✖</button>
                        </div>
                        <form onSubmit={submitAddUser} className="p-6 space-y-4">
                            <div><label className="text-xs text-gray-400 mb-1 block">Full Name</label><input type="text" value={addUserForm.data.name} onChange={e=>addUserForm.setData('name', e.target.value)} className="w-full bg-[#090210] border border-gray-700 rounded-lg p-2.5 text-white text-sm focus:border-blue-500" required/></div>
                            <div><label className="text-xs text-gray-400 mb-1 block">Username</label><input type="text" value={addUserForm.data.username} onChange={e=>addUserForm.setData('username', e.target.value)} className="w-full bg-[#090210] border border-gray-700 rounded-lg p-2.5 text-white text-sm focus:border-blue-500" required/></div>
                            <div><label className="text-xs text-gray-400 mb-1 block">Phone</label><input type="text" value={addUserForm.data.phone} onChange={e=>addUserForm.setData('phone', e.target.value)} className="w-full bg-[#090210] border border-gray-700 rounded-lg p-2.5 text-white text-sm focus:border-blue-500" required placeholder="07XXXXXXXX"/></div>
                            <div><label className="text-xs text-gray-400 mb-1 block">Email</label><input type="email" value={addUserForm.data.email} onChange={e=>addUserForm.setData('email', e.target.value)} className="w-full bg-[#090210] border border-gray-700 rounded-lg p-2.5 text-white text-sm focus:border-blue-500" required/></div>
                            <div><label className="text-xs text-gray-400 mb-1 block">Password</label><input type="password" value={addUserForm.data.password} onChange={e=>addUserForm.setData('password', e.target.value)} className="w-full bg-[#090210] border border-gray-700 rounded-lg p-2.5 text-white text-sm focus:border-blue-500" required placeholder="Min 6 chars"/></div>
                            
                            <div className="flex gap-4">
                                <div className="flex-1"><label className="text-xs text-gray-400 mb-1 block">Role</label><select value={addUserForm.data.role} onChange={e=>addUserForm.setData('role', e.target.value)} className="w-full bg-[#090210] border border-gray-700 rounded-lg p-2.5 text-white text-sm focus:border-blue-500"><option value="user">User</option><option value="admin">Admin</option></select></div>
                                <div className="flex-1"><label className="text-xs text-gray-400 mb-1 block">Status</label><select value={addUserForm.data.is_active} onChange={e=>addUserForm.setData('is_active', e.target.value === 'true')} className="w-full bg-[#090210] border border-gray-700 rounded-lg p-2.5 text-white text-sm focus:border-blue-500"><option value="true">Active (Verified)</option><option value="false">Unpaid</option></select></div>
                            </div>
                            
                            <button type="submit" disabled={addUserForm.processing} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl mt-4 shadow-[0_0_15px_rgba(37,99,235,0.4)]">Create Account</button>
                            {addUserForm.errors.email && <p className="text-red-500 text-xs text-center">{addUserForm.errors.email}</p>}
                            {addUserForm.errors.phone && <p className="text-red-500 text-xs text-center">{addUserForm.errors.phone}</p>}
                            {addUserForm.errors.username && <p className="text-red-500 text-xs text-center">{addUserForm.errors.username}</p>}
                        </form>
                    </div>
                </div>
            )}

            {/* ================= ADD NEW BOOK MODAL ================= */}
            {showAddBookModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-[#11071c] w-full max-w-md rounded-2xl border border-blue-500/30 shadow-2xl overflow-hidden animate-[fadeIn_0.2s_ease-out]">
                        <div className="p-4 border-b border-gray-800 bg-[#150a21] flex justify-between items-center">
                            <h3 className="font-bold text-white text-lg">➕ Add New Book</h3>
                            <button onClick={() => setShowAddBookModal(false)} className="text-gray-500 hover:text-white bg-gray-800 w-8 h-8 rounded-full">✖</button>
                        </div>
                        <form onSubmit={submitAddBook} className="p-6 space-y-4">
                            <div><label className="text-xs text-gray-400 mb-1 block">Title</label><input type="text" value={addBookForm.data.title} onChange={e=>addBookForm.setData('title', e.target.value)} className="w-full bg-[#090210] border border-gray-700 rounded-lg p-2.5 text-white text-sm focus:border-blue-500" required/></div>
                            <div><label className="text-xs text-gray-400 mb-1 block">Description</label><textarea value={addBookForm.data.description} onChange={e=>addBookForm.setData('description', e.target.value)} className="w-full bg-[#090210] border border-gray-700 rounded-lg p-2.5 text-white text-sm focus:border-blue-500" rows="3"></textarea></div>
                            <div><label className="text-xs text-gray-400 mb-1 block">Price (Ksh)</label><input type="number" value={addBookForm.data.price} onChange={e=>addBookForm.setData('price', e.target.value)} className="w-full bg-[#090210] border border-gray-700 rounded-lg p-2.5 text-white text-sm focus:border-blue-500" required/></div>
                            <div><label className="text-xs text-gray-400 mb-1 block">Cover Image</label><input type="file" accept="image/*" onChange={e=>addBookForm.setData('image', e.target.files[0])} className="w-full bg-[#090210] border border-gray-700 rounded-lg p-2.5 text-white text-sm focus:border-blue-500" /></div>
                            <div><label className="text-xs text-gray-400 mb-1 block">File/Download URL</label><input type="url" value={addBookForm.data.file_url} onChange={e=>addBookForm.setData('file_url', e.target.value)} className="w-full bg-[#090210] border border-gray-700 rounded-lg p-2.5 text-white text-sm focus:border-blue-500" /></div>
                            
                            <button type="submit" disabled={addBookForm.processing} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl mt-4 shadow-[0_0_15px_rgba(37,99,235,0.4)]">Save Book</button>
                        </form>
                    </div>
                </div>
            )}

            {/* ================= VIEW USER DATA MODAL ================= */}
            {selectedUser && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-[#11071c] w-full max-w-2xl max-h-[90vh] rounded-2xl border border-gray-800 shadow-2xl flex flex-col overflow-hidden animate-[fadeIn_0.2s_ease-out]">
                        <div className="p-6 border-b border-gray-800 bg-[#150a21] flex justify-between items-start relative">
                            <div>
                                <h2 className="text-2xl font-black text-white">{selectedUser.name}</h2>
                                <p className="text-sm text-gray-400">@{selectedUser.username} • {selectedUser.phone}</p>
                            </div>
                            <button onClick={() => setSelectedUser(null)} className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center text-gray-400 hover:text-white transition">✖</button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
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
            
            <style jsx global>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(220, 38, 38, 0.4); border-radius: 20px; }
            `}</style>
        </div>
    );
}