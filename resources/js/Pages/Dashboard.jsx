import LipataskLayout from '@/Layouts/LipataskLayout';
import { Head } from '@inertiajs/react';
import { useState, useEffect } from 'react';

export default function Dashboard({ auth, wallets, referral_stats }) {
    // 1. Referral Link Copy State
    const[copied, setCopied] = useState(false);

    // 2. Welcome Toast State
    const[showWelcome, setShowWelcome] = useState(false);

    // 3. Trigger Welcome Toast only once per session
    useEffect(() => {
        const welcomeShown = sessionStorage.getItem('welcome_shown_lipatask');
        
        if (!welcomeShown) {
            // Show the toast
            setShowWelcome(true);
            // Mark it as shown for this browser session
            sessionStorage.setItem('welcome_shown_lipatask', 'true');
            
            // Auto-hide after 3 seconds
            const timer = setTimeout(() => setShowWelcome(false), 3000);
            return () => clearTimeout(timer);
        }
    },[]);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(referral_stats.link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <LipataskLayout>
            <Head title="Dashboard | Lipatask" />

            {/* --- WELCOME TOAST NOTIFICATION --- */}
            <div 
                className={`fixed top-24 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ease-in-out transform ${
                    showWelcome ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8 pointer-events-none'
                }`}
            >
                <div className="bg-[#1a0e29] border border-gray-800 border-l-4 border-l-emerald-500 rounded-lg shadow-[0_10px_40px_rgba(0,0,0,0.5)] px-4 py-3 flex items-center gap-3 min-w-[280px]">
                    <div className="bg-emerald-500 rounded-full p-0.5 flex-shrink-0">
                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <p className="text-white font-bold text-sm flex-1">Welcome back, {auth.user.username}!</p>
                    <button onClick={() => setShowWelcome(false)} className="text-gray-500 hover:text-gray-300 transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>
            {/* ---------------------------------- */}


            <div className="py-12 bg-white dark:bg-[#0d0415] min-h-screen text-gray-900 dark:text-white font-sans selection:bg-purple-500 relative">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 relative z-10">
                    
                    {/* Header Banner */}
                    <div className="flex justify-between items-start mb-8">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full border-[3px] border-red-500 bg-[#2a1329] flex items-center justify-center text-red-500 font-bold text-xl shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                                {auth.user.username.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <p className="text-[10px] text-yellow-500 font-bold tracking-widest uppercase flex items-center gap-1">
                                    <span>⛅</span> Good afternoon,
                                </p>
                                <h2 className="text-2xl font-black text-white">{auth.user.username}</h2>
                                <p className="text-[10px] text-gray-500">Kenya</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <span className="bg-emerald-900/50 border border-emerald-500/50 text-emerald-400 text-[10px] px-3 py-1 rounded font-bold tracking-wider self-start mt-1 hidden sm:inline-block">ACTIVE</span>
                            <div className="bg-[#150a21] border border-purple-900/50 rounded flex text-[10px] font-bold overflow-hidden self-start mt-1">
                                <span className="bg-fuchsia-600 px-3 py-1.5 text-white shadow-[0_0_10px_rgba(192,38,211,0.5)]">Ksh</span>
                                <span className="px-3 py-1.5 text-gray-400">$ USD</span>
                            </div>
                        </div>
                    </div>

                    {/* Central Total Income */}
                    <div className="text-center mb-10">
                        <p className="text-[10px] text-gray-500 dark:text-yellow-500 font-bold tracking-[0.2em] uppercase mb-1">TOTAL INCOME</p>
                        <h1 className="text-5xl md:text-6xl font-black tracking-tight text-gray-900 dark:text-white drop-shadow-md dark:drop-shadow-[0_0_30px_rgba(255,255,255,0.25)]">
                            Ksh {wallets.total}
                        </h1>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 uppercase tracking-wider">All wallets combined</p>
                    </div>

                    {/* Top 3 Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                        <div className="bg-white dark:bg-[#150a21]/80 border border-gray-100 dark:border-purple-900/40 rounded-xl p-5 text-center shadow-sm dark:shadow-lg transition-colors">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Ksh {wallets.team}</h3>
                            <p className="text-[9px] text-gray-400 dark:text-gray-500 uppercase tracking-widest font-bold">TEAM</p>
                        </div>
                        <div className="bg-white dark:bg-[#150a21]/80 border border-gray-100 dark:border-purple-900/40 rounded-xl p-5 text-center shadow-sm dark:shadow-lg transition-colors">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Ksh {wallets.withdrawn}</h3>
                            <p className="text-[9px] text-gray-400 dark:text-gray-500 uppercase tracking-widest font-bold">WITHDRAWN</p>
                        </div>
                        <div className="bg-white dark:bg-[#150a21]/80 border border-gray-100 dark:border-purple-900/40 rounded-xl p-5 text-center shadow-sm dark:shadow-lg transition-colors">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Ksh {wallets.today}</h3>
                            <p className="text-[9px] text-gray-400 dark:text-gray-500 uppercase tracking-widest font-bold">TODAY</p>
                        </div>
                    </div>

                    {/* Wallet Grid Header */}
                    <div className="flex items-center gap-4 mb-4">
                        <h3 className="text-[10px] font-black text-purple-600 dark:text-yellow-500 tracking-[0.2em] uppercase">YOUR WALLETS</h3>
                    </div>
                    
                    {/* 8-Grid Wallet Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        {/* Team */}
                        <div className="bg-purple-600 dark:bg-gradient-to-r dark:from-[#6b0f9c] dark:to-[#9d17d6] p-5 rounded-2xl relative overflow-hidden shadow-lg border border-purple-500/20 dark:border-white/5">
                            <div className="flex justify-between items-start mb-3">
                                <div className="bg-white/20 dark:bg-black/20 p-2 rounded-lg backdrop-blur-sm">👥</div>
                                <span className="text-[9px] bg-white/20 dark:bg-black/20 px-3 py-1 rounded-full uppercase tracking-wider font-bold text-white">TEAM</span>
                            </div>
                            <p className="text-[10px] text-purple-100 dark:text-purple-200 uppercase font-black tracking-wider mb-0.5">TEAM EARNINGS</p>
                            <h2 className="text-2xl font-black text-white">Ksh {wallets.team}</h2>
                        </div>
                        {/* Main */}
                        <div className="bg-blue-600 dark:bg-gradient-to-r dark:from-[#173887] dark:to-[#2552ba] p-5 rounded-2xl relative overflow-hidden shadow-lg border border-blue-500/20 dark:border-white/5">
                            <div className="flex justify-between items-start mb-3">
                                <div className="bg-white/20 dark:bg-black/20 p-2 rounded-lg backdrop-blur-sm">💼</div>
                                <span className="text-[9px] bg-white/20 dark:bg-black/20 px-3 py-1 rounded-full uppercase tracking-wider font-bold text-white">MAIN</span>
                            </div>
                            <p className="text-[10px] text-blue-100 dark:text-blue-200 uppercase font-black tracking-wider mb-0.5">MAIN WALLET</p>
                            <h2 className="text-2xl font-black text-white">Ksh {wallets.main}</h2>
                        </div>
                        {/* Withdrawn */}
                        <div className="bg-emerald-600 dark:bg-gradient-to-r dark:from-[#1a6642] dark:to-[#248f5a] p-5 rounded-2xl relative overflow-hidden shadow-lg border border-emerald-500/20 dark:border-white/5">
                            <div className="flex justify-between items-start mb-3">
                                <div className="bg-white/20 dark:bg-black/20 p-2 rounded-lg backdrop-blur-sm">↗️</div>
                                <span className="text-[9px] bg-white/20 dark:bg-black/20 px-3 py-1 rounded-full uppercase tracking-wider font-bold text-white">PAID</span>
                            </div>
                            <p className="text-[10px] text-emerald-100 dark:text-emerald-200 uppercase font-black tracking-wider mb-0.5">TOTAL WITHDRAWN</p>
                            <h2 className="text-2xl font-black text-white">Ksh {wallets.withdrawn}</h2>
                        </div>
                        {/* Total */}
                        <div className="bg-indigo-600 dark:bg-gradient-to-r dark:from-[#4d169c] dark:to-[#6a25c7] p-5 rounded-2xl relative overflow-hidden shadow-lg border border-indigo-500/20 dark:border-white/5">
                            <div className="flex justify-between items-start mb-3">
                                <div className="bg-white/20 dark:bg-black/20 p-2 rounded-lg backdrop-blur-sm">📈</div>
                                <span className="text-[9px] bg-white/20 dark:bg-black/20 px-3 py-1 rounded-full uppercase tracking-wider font-bold text-white">TOTAL</span>
                            </div>
                            <p className="text-[10px] text-indigo-100 dark:text-purple-200 uppercase font-black tracking-wider mb-0.5">TOTAL EARNED</p>
                            <h2 className="text-2xl font-black text-white">Ksh {wallets.total}</h2>
                        </div>
                    </div>

                    {/* Referral Link Box */}
                    <div className="bg-white dark:bg-[#11071c] border border-gray-100 dark:border-purple-900/30 rounded-2xl p-6 md:p-8 shadow-sm dark:shadow-xl transition-colors">
                        <div className="flex items-center justify-between mb-8">
                            <h4 className="font-bold text-gray-900 dark:text-white text-base flex items-center gap-3">
                                <div className="bg-fuchsia-100 dark:bg-[#9d00ff] p-1.5 rounded-full dark:shadow-[0_0_15px_#9d00ff]">
                                    <svg className="w-4 h-4 text-fuchsia-600 dark:text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M13 8V2H7v6H2l8 8 8-8h-5zM0 18h20v2H0v-2z"/></svg>
                                </div>
                                Your Invite Link
                            </h4>
                            <span className="text-[10px] text-purple-600 dark:text-yellow-500 border border-purple-200 dark:border-yellow-500/30 px-3 py-1 rounded-full font-bold hidden sm:inline-block">Earn per activation</span>
                        </div>

                        <div className="flex flex-col md:flex-row gap-0 overflow-hidden rounded-xl border border-gray-200 dark:border-purple-900/50 shadow-sm mt-8 relative">
                            <input 
                                type="text" 
                                readOnly 
                                value={referral_stats.link} 
                                className="flex-1 bg-gray-50 dark:bg-[#1a0e29] border-0 px-4 py-4 text-gray-600 dark:text-gray-400 text-sm focus:ring-0"
                            />
                            
                            {/* Copy Button */}
                            <button 
                                onClick={copyToClipboard}
                                className={`px-8 py-4 font-black transition-all duration-300 flex items-center justify-center gap-2 uppercase tracking-wide text-xs ${
                                    copied 
                                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white' 
                                    : 'bg-fuchsia-600 hover:bg-fuchsia-700 text-white'
                                }`}
                            >
                                {copied ? (
                                    <>
                                        <svg className="w-4 h-4 animate-[bounce_0.5s_ease-in-out]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                        Copied!
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                                        Copy Link
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </LipataskLayout>
    );
}