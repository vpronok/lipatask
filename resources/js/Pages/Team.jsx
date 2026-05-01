import LipataskLayout from '@/Layouts/LipataskLayout';
import { Head } from '@inertiajs/react';
import { useState } from 'react';

export default function Team({ stats, referrals, referralLink }) {
    
    // Add state tracking here too
    const [copied, setCopied] = useState(false);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(referralLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <LipataskLayout>
            <Head title="My Network | Lipatask" />

            <div className="mb-6">
                <h1 className="text-2xl font-black text-gray-900 dark:text-white">Your <span className="text-fuchsia-500">Network</span></h1>
                <p className="text-sm text-gray-500">Your affiliate tree</p>
            </div>

            {/* Top 3 Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-white dark:bg-[#150a21] border-b-4 border-fuchsia-500 dark:border-purple-600 rounded-lg p-5 shadow-sm">
                    <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-1">{stats.total}</h3>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">TOTAL REFS</p>
                </div>
                <div className="bg-white dark:bg-[#150a21] border-b-4 border-emerald-500 rounded-lg p-5 shadow-sm">
                    <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-1">{stats.active}</h3>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">ACTIVE</p>
                </div>
                <div className="bg-white dark:bg-[#150a21] border-b-4 border-red-500 rounded-lg p-5 shadow-sm">
                    <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-1">{stats.inactive}</h3>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">INACTIVE</p>
                </div>
            </div>

            {/* Quick Invite Link */}
            <div className="bg-white dark:bg-[#150a21] border border-gray-100 dark:border-purple-900/30 rounded-xl p-4 mb-8 shadow-sm">
                <p className="text-[10px] font-bold text-gray-400 mb-2 flex items-center gap-2">🔗 YOUR INVITE LINK</p>
                <div className="flex gap-2 relative">
                    <input type="text" readOnly value={referralLink} className="flex-1 bg-gray-50 dark:bg-[#090210] border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-600 dark:text-gray-400" />
                    
                    {/* Modern Dynamic Button */}
                    <button 
                        onClick={copyToClipboard} 
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all duration-300 flex items-center gap-2 ${
                            copied 
                            ? 'bg-emerald-500 dark:bg-emerald-900/40 text-white dark:text-emerald-400 border border-emerald-500/50' 
                            : 'bg-emerald-500 hover:bg-emerald-600 text-white border border-transparent'
                        }`}
                    >
                        {copied ? '✓ Copied' : 'Copy'}
                    </button>
                </div>
            </div>

            {/* Members List */}
            <div className="bg-white dark:bg-[#150a21] rounded-xl border border-gray-100 dark:border-purple-900/30 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">👥 All Members</h3>
                    <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs px-3 py-1 rounded-full font-bold">{stats.total} found</span>
                </div>
                
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {referrals.length === 0 ? (
                        <div className="p-8 text-center text-gray-400">You don't have any referrals yet. Share your link!</div>
                    ) : (
                        referrals.map((ref) => (
                            <div key={ref.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 transition">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center font-bold text-white text-lg">
                                        {ref.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-bold text-gray-900 dark:text-white">{ref.name}</p>
                                            <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[9px] px-1.5 py-0.5 rounded font-black tracking-wider uppercase">DIRECT</span>
                                        </div>
                                        <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-500">
                                            <span className="flex items-center gap-1">📞 {ref.phone}</span>
                                            <span className="flex items-center gap-1">📅 {new Date(ref.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="text-right">
                                    {ref.is_active ? (
                                        <span className="text-emerald-500 font-bold text-xs uppercase tracking-wider">ACTIVE</span>
                                    ) : (
                                        <span className="text-red-500 font-bold text-xs uppercase tracking-wider">INACTIVE</span>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </LipataskLayout>
    );
}