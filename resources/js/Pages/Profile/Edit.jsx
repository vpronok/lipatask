import LipataskLayout from '@/Layouts/LipataskLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';

export default function Edit({ mustVerifyEmail, status, stats, upline, recent_activity, referral_link }) {
    const user = usePage().props.auth.user;
    const [copied, setCopied] = useState(false);

    // Form for Password Update
    const passwordForm = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const updatePassword = (e) => {
        e.preventDefault();
        passwordForm.put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => passwordForm.reset(),
            onError: () => {
                if (passwordForm.errors.password) {
                    passwordForm.reset('password', 'password_confirmation');
                }
                if (passwordForm.errors.current_password) {
                    passwordForm.reset('current_password');
                }
            },
        });
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(referral_link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Helper for relative time (e.g., "13 hours ago")
    const getTimeAgo = (dateString) => {
        const seconds = Math.floor((new Date() - new Date(dateString)) / 1000);
        let interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " days ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " hours ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " minutes ago";
        return "Just now";
    };

    // Format Join Date
    const joinDate = new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    return (
        <LipataskLayout>
            <Head title="Profile | Lipatask" />

            {/* --- Top User Banner --- */}
            <div className="bg-gradient-to-r from-[#150a21] to-purple-900/20 border border-purple-900/30 rounded-2xl p-6 mb-6 shadow-lg flex items-center gap-6 relative overflow-hidden">
                <div className="absolute right-0 top-0 w-64 h-64 bg-pink-500/10 blur-[100px] rounded-full pointer-events-none"></div>
                
                <div className="w-20 h-20 rounded-full border-4 border-fuchsia-500 bg-[#2a1329] flex items-center justify-center text-fuchsia-500 font-black text-3xl shadow-[0_0_20px_rgba(217,4,249,0.3)] z-10">
                    {user.username.substring(0, 2).toUpperCase()}
                </div>
                <div className="z-10">
                    <h2 className="text-2xl font-black text-white mb-1">{user.username}</h2>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1">✉️ {user.email}</span>
                        <span className="flex items-center gap-1">📅 Joined {joinDate}</span>
                        <span className="flex items-center gap-1">🌍 Kenya</span>
                    </div>
                    <div className="mt-3">
                        <span className="bg-emerald-900/50 border border-emerald-500/50 text-emerald-400 text-[10px] px-3 py-1 rounded-full font-bold tracking-wider flex items-center gap-1.5 w-max">
                            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
                            ACTIVE
                        </span>
                    </div>
                </div>
            </div>

            {/* --- Stats Row --- */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-r from-purple-800 to-fuchsia-800 rounded-xl p-4 shadow-lg flex items-center gap-4">
                    <div className="bg-black/20 p-2.5 rounded-lg text-white">👥</div>
                    <div>
                        <h3 className="text-xl font-black text-white">{stats.active_refs}</h3>
                        <p className="text-[8px] text-purple-200 uppercase font-bold tracking-widest">Active Refs</p>
                    </div>
                </div>
                <div className="bg-gradient-to-r from-emerald-700 to-teal-700 rounded-xl p-4 shadow-lg flex items-center gap-4">
                    <div className="bg-black/20 p-2.5 rounded-lg text-white">💵</div>
                    <div>
                        <h3 className="text-xl font-black text-white">KSh {stats.withdrawn}</h3>
                        <p className="text-[8px] text-emerald-200 uppercase font-bold tracking-widest">Withdrawn</p>
                    </div>
                </div>
                <div className="bg-gradient-to-r from-amber-600 to-yellow-600 rounded-xl p-4 shadow-lg flex items-center gap-4">
                    <div className="bg-black/20 p-2.5 rounded-lg text-white">🔄</div>
                    <div>
                        <h3 className="text-xl font-black text-white">{stats.transactions_count}</h3>
                        <p className="text-[8px] text-amber-200 uppercase font-bold tracking-widest">Transactions</p>
                    </div>
                </div>
                <div className="bg-gradient-to-r from-indigo-800 to-purple-800 rounded-xl p-4 shadow-lg flex items-center gap-4">
                    <div className="bg-black/20 p-2.5 rounded-lg text-white">🏷️</div>
                    <div>
                        <h3 className="text-xl font-black text-white">{user.referral_code}</h3>
                        <p className="text-[8px] text-indigo-200 uppercase font-bold tracking-widest">Ref Code</p>
                    </div>
                </div>
            </div>

            {/* --- Main Content Grid --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                
                {/* Left Column */}
                <div className="space-y-6">
                    {/* Profile Information List (Read Only) */}
                    <div className="bg-[#150a21] border border-purple-900/30 rounded-2xl p-6 shadow-xl">
                        <h3 className="font-bold text-white flex items-center gap-2 mb-6 text-sm">
                            <span className="bg-blue-600 p-1.5 rounded text-white">👤</span> Profile Information
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase mb-1">Username</p>
                                <p className="text-white font-bold text-sm">{user.username}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase mb-1">Email</p>
                                <p className="text-white font-bold text-sm">{user.email}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase mb-1">Phone</p>
                                <p className="text-white font-bold text-sm">{user.phone}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase mb-1">Country</p>
                                <p className="text-white font-bold text-sm">Kenya</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase mb-1">Status</p>
                                <span className="bg-emerald-900/50 text-emerald-400 text-[10px] px-2 py-0.5 rounded font-bold tracking-wider">ACTIVE</span>
                            </div>
                            <div className="pt-2">
                                <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase mb-2">Referral Link</p>
                                <div className="flex gap-2">
                                    <input type="text" readOnly value={referral_link} className="flex-1 bg-[#090210] border border-gray-800 rounded-lg px-3 py-2 text-xs text-gray-400 focus:ring-0" />
                                    <button onClick={copyToClipboard} className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1">
                                        {copied ? '✓ Copied' : '📄 Copy'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Upline Box */}
                    <div className="bg-[#150a21] border border-purple-900/30 rounded-2xl p-6 shadow-xl">
                        <h3 className="font-bold text-white flex items-center gap-2 mb-6 text-sm">
                            <span className="bg-rose-600 p-1.5 rounded text-white">📈</span> My Upline
                        </h3>
                        <div className="flex items-center gap-4 bg-[#1a0c29] p-4 rounded-xl border border-gray-800">
                            <div className="w-10 h-10 rounded-full bg-blue-900 flex items-center justify-center text-blue-200 font-black uppercase shadow-inner">
                                {upline.name.substring(0, 2)}
                            </div>
                            <div>
                                <h4 className="text-white font-bold text-sm">{upline.name}</h4>
                                <p className="text-[10px] text-gray-500">🌍 Kenya • {upline.role === 'admin' ? 'Platform Admin' : 'Affiliate'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    {/* Update Profile (Locked Phone visual) */}
                    <div className="bg-[#150a21] border border-purple-900/30 rounded-2xl p-6 shadow-xl">
                        <h3 className="font-bold text-white flex items-center gap-2 mb-6 text-sm">
                            <span className="bg-emerald-600 p-1.5 rounded text-white">📝</span> Update Profile
                        </h3>
                        
                        {/* Fake form for visuals (Since details are locked as requested) */}
                        <div className="space-y-5">
                            <div>
                                <label className="block text-[10px] text-gray-500 font-bold tracking-widest uppercase mb-1.5 flex items-center gap-1">
                                    📞 Phone Number
                                </label>
                                <input
                                    type="text"
                                    disabled
                                    value={user.phone}
                                    className="w-full bg-[#090210]/50 border border-gray-800 text-gray-500 rounded-lg px-4 py-2.5 text-sm cursor-not-allowed opacity-70"
                                />
                                <p className="text-[9px] text-gray-500 mt-1 flex items-center gap-1">🔒 Contact support to update phone / M-Pesa number.</p>
                            </div>
                            
                            <div>
                                <label className="block text-[10px] text-gray-500 font-bold tracking-widest uppercase mb-1.5 flex items-center gap-1">
                                    🌍 Country
                                </label>
                                <input
                                    type="text"
                                    readOnly
                                    value="Kenya"
                                    className="w-full bg-[#1a0c29] border border-gray-800 text-white rounded-lg px-4 py-2.5 text-sm focus:ring-0"
                                />
                            </div>

                            <button type="button" className="w-full bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold py-3 rounded-xl transition flex justify-center items-center gap-2 text-sm shadow-[0_0_15px_rgba(217,4,249,0.3)] mt-2">
                                💾 Save Changes
                            </button>
                        </div>
                    </div>

                    {/* Change Password Form */}
                    <div className="bg-[#150a21] border border-purple-900/30 rounded-2xl p-6 shadow-xl">
                        <h3 className="font-bold text-white flex items-center gap-2 mb-6 text-sm">
                            <span className="bg-amber-600 p-1.5 rounded text-white">🔒</span> Change Password
                        </h3>

                        {status === 'password-updated' && (
                            <div className="mb-4 bg-emerald-500/10 border border-emerald-500 text-emerald-500 text-xs px-3 py-2 rounded font-bold">
                                Password successfully updated!
                            </div>
                        )}

                        <form onSubmit={updatePassword} className="space-y-4">
                            <div>
                                <label className="block text-[10px] text-gray-500 font-bold tracking-widest uppercase mb-1.5">🔑 Current Password</label>
                                <input
                                    type="password"
                                    value={passwordForm.data.current_password}
                                    onChange={(e) => passwordForm.setData('current_password', e.target.value)}
                                    className="w-full bg-[#090210] border border-gray-800 text-white placeholder-gray-600 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-lg px-4 py-2.5 text-sm transition"
                                    placeholder="••••••••"
                                />
                                <p className="text-red-500 text-[10px] mt-1 empty:hidden">{passwordForm.errors.current_password}</p>
                            </div>
                            
                            <div>
                                <label className="block text-[10px] text-gray-500 font-bold tracking-widest uppercase mb-1.5">🆕 New Password</label>
                                <input
                                    type="password"
                                    value={passwordForm.data.password}
                                    onChange={(e) => passwordForm.setData('password', e.target.value)}
                                    className="w-full bg-[#090210] border border-gray-800 text-white placeholder-gray-600 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-lg px-4 py-2.5 text-sm transition"
                                    placeholder="••••••••"
                                />
                                <p className="text-gray-500 text-[9px] mt-1">Minimum 8 characters</p>
                                <p className="text-red-500 text-[10px] mt-1 empty:hidden">{passwordForm.errors.password}</p>
                            </div>

                            <div>
                                <label className="block text-[10px] text-gray-500 font-bold tracking-widest uppercase mb-1.5">✅ Confirm Password</label>
                                <input
                                    type="password"
                                    value={passwordForm.data.password_confirmation}
                                    onChange={(e) => passwordForm.setData('password_confirmation', e.target.value)}
                                    className="w-full bg-[#090210] border border-gray-800 text-white placeholder-gray-600 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-lg px-4 py-2.5 text-sm transition"
                                    placeholder="••••••••"
                                />
                                <p className="text-red-500 text-[10px] mt-1 empty:hidden">{passwordForm.errors.password_confirmation}</p>
                            </div>

                            <button 
                                type="submit" 
                                disabled={passwordForm.processing}
                                className={`w-full bg-amber-500 hover:bg-amber-400 text-amber-950 font-black py-3 rounded-xl transition flex justify-center items-center gap-2 text-sm shadow-[0_0_15px_rgba(245,158,11,0.3)] mt-2 ${passwordForm.processing && 'opacity-50'}`}
                            >
                                🔑 Update Password
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {/* --- Recent Activity Table --- */}
            <div className="bg-[#150a21] border border-purple-900/30 rounded-2xl overflow-hidden shadow-xl mb-8">
                <div className="px-6 py-4 border-b border-gray-800 bg-[#1a0c29] flex items-center gap-2">
                    <span className="bg-blue-600 p-1.5 rounded text-white text-xs">🕒</span>
                    <h3 className="font-bold text-white text-sm">Recent Activity</h3>
                </div>
                <div className="divide-y divide-gray-800/50">
                    {recent_activity.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 text-sm">No recent activity found.</div>
                    ) : (
                        recent_activity.map((tx) => (
                            <div key={tx.id} className="p-4 px-6 flex items-center justify-between hover:bg-white/5 transition">
                                <div className="flex items-center gap-4">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${tx.type === 'withdrawal' ? 'bg-rose-600' : 'bg-fuchsia-600'}`}>
                                        {tx.type === 'withdrawal' ? '↗️' : '↘️'}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-200 text-sm">{tx.description || `${tx.type} transaction`}</p>
                                        <p className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5">
                                            🕒 {getTimeAgo(tx.created_at)}
                                        </p>
                                    </div>
                                </div>
                                <div className={`font-black text-sm ${tx.type === 'withdrawal' ? 'text-rose-500' : 'text-emerald-500'}`}>
                                    {tx.type === 'withdrawal' ? '-' : '+'}KSh {tx.amount}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

        </LipataskLayout>
    );
}