import { useState, useEffect } from 'react';
import { Link, usePage } from '@inertiajs/react';

export default function LipataskLayout({ children }) {
    const { auth, platform, url } = usePage().props;
    const user = auth.user;

    // 1. Theme Toggle Logic
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
    
    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

    // 2. Dropdown & Mobile Menu State
    const [showUserMenu, setShowUserMenu] = useState(false);
    const[isSidebarOpen, setIsSidebarOpen] = useState(false);

    // 3. Auto-close mobile sidebar when navigating to a new page
    useEffect(() => {
        setIsSidebarOpen(false);
    }, [url]);

    return (
        <div className="flex h-screen bg-[#f4effa] dark:bg-[#090210] text-gray-800 dark:text-white font-sans overflow-hidden transition-colors duration-300 selection:bg-fuchsia-500 relative">
            
            {/* ================= MOBILE OVERLAY ================= */}
            {/* This darkens the background on mobile when the sidebar slides out */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-gray-900/60 dark:bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
                    onClick={() => setIsSidebarOpen(false)}
                ></div>
            )}

            {/* ================= SIDEBAR ================= */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-[260px] flex flex-col bg-white dark:bg-[#0d0415] border-r border-purple-200 dark:border-purple-900/30 shadow-[4px_0_24px_rgba(0,0,0,0.05)] dark:shadow-[4px_0_24px_rgba(0,0,0,0.5)] transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                
                {/* Sidebar Header */}
                <div className="h-20 flex items-center justify-between px-6 border-b border-purple-100 dark:border-purple-900/30">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-pink-500 p-[1px]">
                            <div className="w-full h-full bg-white dark:bg-[#1a1125] rounded-full flex items-center justify-center font-black text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 to-pink-500">C</div>
                        </div>
                        <span className="font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-600 uppercase text-lg">CHATWAZUNGU</span>
                    </div>
                    {/* Mobile Close X */}
                    <button 
                        onClick={() => setIsSidebarOpen(false)} 
                        className="md:hidden p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Sidebar Scrollable Area */}
                <div className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar">
                    {/* User Mini Profile */}
                    <div className="bg-purple-50 dark:bg-[#150a21] border border-purple-100 dark:border-purple-900/50 rounded-xl p-3 flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-full border-2 border-red-500 flex items-center justify-center font-bold text-red-500 bg-red-100 dark:bg-[#2a1329] text-sm">
                            {user.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <p className="font-bold text-sm truncate max-w-[120px] text-gray-800 dark:text-white">{user.username}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                <span className="text-[10px] text-green-600 dark:text-green-500 font-bold uppercase tracking-wider">Active</span>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Links */}
                    <div className="space-y-6">
                        
                        {/* --- MAIN SECTION --- */}
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 dark:text-yellow-500/80 tracking-widest uppercase mb-3 px-2">Main</p>
                            <div className="space-y-1">
                                <Link href={route('dashboard')} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${route().current('dashboard') ? 'bg-purple-100 dark:bg-gradient-to-r dark:from-purple-900/50 dark:to-transparent border-l-2 border-fuchsia-500 text-purple-700 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'}`}>
                                    <span className="text-fuchsia-500">📊</span> Dashboard
                                </Link>
                                
                                <Link href={route('team')} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${route().current('team') ? 'bg-purple-100 dark:bg-gradient-to-r dark:from-purple-900/50 dark:to-transparent border-l-2 border-fuchsia-500 text-purple-700 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'}`}>
                                    <span className="text-cyan-500">👥</span> Team members
                                </Link>

                                <Link href={route('leaderboard')} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${route().current('leaderboard') ? 'bg-purple-100 dark:bg-gradient-to-r dark:from-purple-900/50 dark:to-transparent border-l-2 border-fuchsia-500 text-purple-700 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'}`}>
                                    <span className="text-yellow-500">🏆</span> Leaderboard
                                </Link>
                            </div>
                        </div>

                        {/* --- FINANCE SECTION --- */}
                        <div className="pt-4 border-t border-purple-200 dark:border-purple-900/30">
                            <p className="text-[10px] font-bold text-gray-400 dark:text-yellow-500/80 tracking-widest uppercase mb-3 px-2">Finance</p>
                            <div className="space-y-1">
                                <Link href={route('withdraw')} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${route().current('withdraw') ? 'bg-purple-100 dark:bg-gradient-to-r dark:from-purple-900/50 dark:to-transparent border-l-2 border-fuchsia-500 text-purple-700 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'}`}>
                                    <span className="text-rose-500">💸</span> Withdraw
                                </Link>

                                {/* --- RECHARGE LINK ACTIVATED HERE --- */}
                                <Link href={route('recharge')} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${route().current('recharge') ? 'bg-purple-100 dark:bg-gradient-to-r dark:from-purple-900/50 dark:to-transparent border-l-2 border-fuchsia-500 text-purple-700 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'}`}>
                                    <span className="text-green-500">💰</span> Recharge
                                </Link>
                                
                                <button className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition text-sm font-medium">
                                    <span className="text-blue-400">📜</span> History
                                </button>
                                <button className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition text-sm font-medium">
                                    <span className="text-yellow-400">💎</span> Bonuses
                                </button>
                            </div>
                        </div>

                        {/* --- ADMINISTRATION SECTION (Admin Only) --- */}
                        {user.role === 'admin' && (
                            <div className="pt-4 border-t border-purple-200 dark:border-purple-900/30">
                                <p className="text-[10px] font-bold text-red-500 dark:text-red-400 tracking-widest uppercase mb-3 px-2">Administration</p>
                                <div className="space-y-1">
                                    <Link href={route('admin.dashboard')} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${route().current('admin.dashboard') ? 'bg-red-100 dark:bg-gradient-to-r dark:from-red-900/50 dark:to-transparent border-l-2 border-red-500 text-red-700 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'}`}>
                                        <span className="text-red-500">🛡️</span> Admin Panel
                                    </Link>
                                </div>
                            </div>
                        )}

                        {/* --- ACCOUNT SECTION --- */}
                        <div className="pt-4 border-t border-purple-200 dark:border-purple-900/30">
                            <p className="text-[10px] font-bold text-gray-400 dark:text-yellow-500/80 tracking-widest uppercase mb-3 px-2">Account</p>
                            <div className="space-y-1">
                                <a 
                                    href={platform?.whatsapp_link || '#'} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    onClick={(e) => !platform?.whatsapp_link && e.preventDefault()}
                                    className="flex items-center gap-3 px-3 py-2.5 text-gray-500 dark:text-gray-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg transition text-sm font-medium"
                                >
                                    <span className="text-emerald-500">💬</span> WhatsApp Group
                                </a>

                                <Link href={route('profile.edit')} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${route().current('profile.edit') ? 'bg-purple-100 dark:bg-gradient-to-r dark:from-purple-900/50 dark:to-transparent border-l-2 border-fuchsia-500 text-purple-700 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'}`}>
                                    <span className="text-blue-500">👤</span> Profile
                                </Link>
                                <Link href={route('logout')} method="post" as="button" className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-500 dark:text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition text-sm font-medium">
                                    <span className="text-rose-500">🚪</span> Sign Out
                                </Link>
                            </div>
                        </div>

                    </div>
                </div>
            </aside>

            {/* ================= MAIN CONTENT ================= */}
            <div className="flex-1 flex flex-col h-screen relative overflow-hidden">
                
                {/* Topbar */}
                <header className="h-20 flex-shrink-0 flex items-center justify-between md:justify-end px-4 sm:px-8 relative z-30 border-b border-purple-100 dark:border-white/5 bg-white/80 dark:bg-[#0a0214]/80 backdrop-blur-md">
                    
                    {/* Hamburger Button (Mobile Only) */}
                    <div className="md:hidden">
                        <button 
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 -ml-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-purple-900/50 transition focus:outline-none"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" /></svg>
                        </button>
                    </div>

                    <div className="flex items-center gap-3 md:gap-4">
                        {/* Theme Toggle Button */}
                        <button onClick={toggleTheme} className="w-9 h-9 rounded-full bg-purple-50 dark:bg-[#1a0e29] border border-purple-200 dark:border-purple-900/50 flex items-center justify-center text-indigo-500 dark:text-indigo-400 hover:scale-105 transition">
                            {theme === 'dark' ? '☀️' : '🌙'}
                        </button>
                        
                        {/* User Dropdown Button */}
                        <div className="relative">
                            <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center gap-2 bg-purple-50 dark:bg-[#1a0e29] border border-purple-200 dark:border-purple-900/50 pl-1 pr-3 py-1 rounded-full cursor-pointer hover:shadow-md transition">
                                <div className="w-8 h-8 rounded-full bg-fuchsia-600 flex items-center justify-center font-bold text-xs text-white">
                                    {user.username.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-sm font-bold text-gray-800 dark:text-white hidden sm:block">{user.username}</span>
                                <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </button>

                            {/* Dropdown Menu */}
                            {showUserMenu && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)}></div>
                                    
                                    <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-[#150a21] border border-gray-200 dark:border-purple-900/50 rounded-xl shadow-xl py-2 z-50">
                                        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                                            <p className="text-sm text-gray-800 dark:text-white font-bold">{user.name}</p>
                                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                        </div>
                                        <Link href={route('profile.edit')} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition">
                                            👤 Profile Settings
                                        </Link>
                                        <Link href={route('logout')} method="post" as="button" className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition">
                                            🚪 Sign Out
                                        </Link>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                {/* Page Content passed from children */}
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-10 relative z-10 custom-scrollbar">
                    <div className="max-w-[1400px] mx-auto">
                        {children}
                    </div>
                </main>
            </div>
            
            <style jsx global>{`
                @keyframes marquee { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(168, 85, 247, 0.4); border-radius: 20px; }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(168, 85, 247, 0.4); }
            `}</style>
        </div>
    );
}