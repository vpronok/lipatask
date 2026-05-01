import LipataskLayout from '@/Layouts/LipataskLayout';
import { Head } from '@inertiajs/react';
import { useState, useEffect } from 'react';

export default function Leaderboard({ rankings, currentUserStat, timeframe }) {
    
    // --- Countdown Timer Logic ---
    const [timeLeft, setTimeLeft] = useState({ days: '00', hours: '00', minutes: '00', seconds: '00' });

    useEffect(() => {
        const calculateTimeLeft = () => {
            const difference = +new Date(timeframe.end_date) - +new Date();
            if (difference > 0) {
                setTimeLeft({
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)).toString().padStart(2, '0'),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24).toString().padStart(2, '0'),
                    minutes: Math.floor((difference / 1000 / 60) % 60).toString().padStart(2, '0'),
                    seconds: Math.floor((difference / 1000) % 60).toString().padStart(2, '0')
                });
            }
        };
        const timer = setInterval(calculateTimeLeft, 1000);
        calculateTimeLeft(); // Initial call
        return () => clearInterval(timer);
    }, [timeframe.end_date]);

    // Top User Logic
    const topScore = rankings.length > 0 ? rankings[0].active_referrals : 1; // Prevent division by zero
    const firstPlace = rankings[0];
    const secondPlace = rankings[1];
    const thirdPlace = rankings[2];
    const restOfRankings = rankings.slice(3);

    return (
        <LipataskLayout>
            <Head title="Leaderboard | Lipatask" />

            {/* --- Header Section --- */}
            <div className="flex flex-col items-center justify-center mb-8">
                <div className="text-4xl mb-2 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]">👑</div>
                <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-1">Referral Leaderboard</h1>
                <p className="text-xs text-gray-500 mb-4">Who referred the most new members this week?</p>
                
                {/* Date Badge */}
                <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 text-[10px] px-4 py-1.5 rounded-full font-bold uppercase tracking-wider mb-6 flex items-center gap-2">
                    <span>📅</span> {timeframe.display}
                </div>

                {/* Countdown Timer */}
                <div className="flex items-center gap-3 text-center">
                    {Object.entries(timeLeft).map(([label, value], i) => (
                        <div key={label} className="flex items-center gap-3">
                            <div className="bg-[#150a21] border border-purple-900/50 rounded-lg p-2.5 w-14 shadow-inner shadow-purple-900/20">
                                <h3 className="text-xl font-black text-yellow-500">{value}</h3>
                                <p className="text-[8px] text-gray-400 uppercase font-bold tracking-widest mt-1">{label}</p>
                            </div>
                            {i < 3 && <span className="text-gray-500 font-black animate-pulse">:</span>}
                        </div>
                    ))}
                </div>
            </div>

            {/* --- User's Position Banner --- */}
            <div className="bg-gradient-to-r from-emerald-900/40 to-[#150a21] border border-emerald-500/20 rounded-xl p-4 mb-10 flex items-center gap-4">
                <div className="bg-yellow-500 p-2 rounded-lg shadow-[0_0_15px_rgba(234,179,8,0.4)]">
                    <svg className="w-5 h-5 text-yellow-950" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"/></svg>
                </div>
                <div>
                    <h4 className="text-white font-bold text-sm">Your Position This Week</h4>
                    <p className="text-[10px] text-gray-400">Rank: <span className="font-bold text-emerald-400">#{currentUserStat.rank}</span> • {currentUserStat.referrals} active referrals</p>
                </div>
            </div>

            {/* --- The Podium (Top 3) --- */}
            <div className="flex justify-center items-end gap-2 md:gap-4 mb-12">
                
                {/* 2nd Place */}
                {secondPlace && (
                    <div className="bg-[#150a21] border border-gray-400/30 rounded-t-xl rounded-b-lg w-28 md:w-32 flex flex-col items-center pt-4 pb-3 relative shadow-[0_0_20px_rgba(156,163,175,0.1)]">
                        <span className="absolute -top-3 text-[10px] bg-[#1a0c29] border border-gray-400 px-2 py-0.5 rounded-full font-bold text-gray-400 tracking-wider">2ND PLACE</span>
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 p-0.5 mb-2 shadow-[0_0_15px_rgba(156,163,175,0.3)]">
                            <div className="w-full h-full bg-[#150a21] rounded-full flex items-center justify-center font-black text-gray-300 text-lg uppercase">{secondPlace.username.charAt(0)}</div>
                        </div>
                        <h4 className="text-white font-bold text-xs truncate w-full text-center px-2">{secondPlace.username}</h4>
                        <p className="text-[9px] text-gray-500 mb-2">🇰🇪 Kenya</p>
                        <h2 className="text-2xl font-black text-white">{secondPlace.active_referrals}</h2>
                        <p className="text-[8px] text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded font-bold uppercase mt-1 tracking-wider">{secondPlace.active_referrals} ACTIVE</p>
                    </div>
                )}

                {/* 1st Place */}
                {firstPlace && (
                    <div className="bg-gradient-to-b from-[#2a1b05] to-[#150a21] border border-yellow-500/50 rounded-t-xl rounded-b-lg w-32 md:w-36 flex flex-col items-center pt-6 pb-4 relative shadow-[0_0_30px_rgba(234,179,8,0.15)] z-10 scale-105">
                        <span className="absolute -top-3 text-[10px] bg-[#1a0c29] border border-yellow-500 px-3 py-0.5 rounded-full font-bold text-yellow-500 tracking-wider flex items-center gap-1">👑 1ST PLACE</span>
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-600 p-0.5 mb-2 shadow-[0_0_20px_rgba(234,179,8,0.5)]">
                            <div className="w-full h-full bg-[#150a21] rounded-full flex items-center justify-center font-black text-yellow-400 text-xl uppercase">{firstPlace.username.charAt(0)}</div>
                        </div>
                        <h4 className="text-white font-bold text-sm truncate w-full text-center px-2">{firstPlace.username}</h4>
                        <p className="text-[9px] text-gray-400 mb-2">🇰🇪 Kenya</p>
                        <h2 className="text-3xl font-black text-yellow-500">{firstPlace.active_referrals}</h2>
                        <p className="text-[9px] text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded font-bold uppercase mt-1 tracking-wider">{firstPlace.active_referrals} ACTIVE</p>
                    </div>
                )}

                {/* 3rd Place */}
                {thirdPlace && (
                    <div className="bg-[#150a21] border border-amber-700/30 rounded-t-xl rounded-b-lg w-28 md:w-32 flex flex-col items-center pt-4 pb-3 relative shadow-[0_0_20px_rgba(180,83,9,0.1)]">
                        <span className="absolute -top-3 text-[10px] bg-[#1a0c29] border border-amber-700 px-2 py-0.5 rounded-full font-bold text-amber-600 tracking-wider">3RD PLACE</span>
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 p-0.5 mb-2 shadow-[0_0_15px_rgba(180,83,9,0.3)]">
                            <div className="w-full h-full bg-[#150a21] rounded-full flex items-center justify-center font-black text-amber-600 text-lg uppercase">{thirdPlace.username.charAt(0)}</div>
                        </div>
                        <h4 className="text-white font-bold text-xs truncate w-full text-center px-2">{thirdPlace.username}</h4>
                        <p className="text-[9px] text-gray-500 mb-2">🇰🇪 Kenya</p>
                        <h2 className="text-2xl font-black text-white">{thirdPlace.active_referrals}</h2>
                        <p className="text-[8px] text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded font-bold uppercase mt-1 tracking-wider">{thirdPlace.active_referrals} ACTIVE</p>
                    </div>
                )}
            </div>

            {/* --- Full Rankings List --- */}
            <div className="bg-white dark:bg-[#11071c] rounded-xl border border-gray-100 dark:border-purple-900/30 overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-black/20">
                    <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">🏆 Full Rankings</h3>
                    <span className="bg-purple-100 dark:bg-yellow-500/10 text-purple-700 dark:text-yellow-500 border border-transparent dark:border-yellow-500/20 text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider">{rankings.length} referrers</span>
                </div>
                
                <div className="divide-y divide-gray-100 dark:divide-gray-800/50">
                    
                    {/* Inject top 3 into list view for completeness, but specially highlighted */}
                    {rankings.map((user) => {
                        // Calculate percentage width for the progress bar (max 100%)
                        const percentage = topScore > 0 ? (user.active_referrals / topScore) * 100 : 0;
                        
                        // Badge coloring based on rank
                        let badgeClass = "bg-gray-200 dark:bg-[#1a0c29] text-gray-600 dark:text-gray-400";
                        let progressColor = "bg-purple-500";
                        if (user.rank === 1) { badgeClass = "bg-yellow-500 text-white shadow-[0_0_10px_rgba(234,179,8,0.5)]"; progressColor = "bg-yellow-500"; }
                        if (user.rank === 2) { badgeClass = "bg-gray-400 text-white shadow-[0_0_10px_rgba(156,163,175,0.5)]"; progressColor = "bg-gray-300"; }
                        if (user.rank === 3) { badgeClass = "bg-amber-600 text-white shadow-[0_0_10px_rgba(217,119,6,0.5)]"; progressColor = "bg-amber-600"; }

                        return (
                            <div key={user.id} className={`p-4 flex items-center justify-between transition-colors ${user.rank <= 3 ? 'bg-purple-50/50 dark:bg-white/5' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}>
                                <div className="flex items-center gap-4 flex-1">
                                    <div className="w-8 text-center font-bold text-gray-400 text-sm">
                                        {user.rank}
                                    </div>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs uppercase flex-shrink-0 ${badgeClass}`}>
                                        {user.username.charAt(0)}
                                    </div>
                                    <div className="flex-1 max-w-[80%] pr-4">
                                        <div className="flex items-center gap-2">
                                            <p className={`font-bold text-sm ${user.rank === 1 ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-900 dark:text-white'}`}>{user.username}</p>
                                            <p className="text-[9px] text-gray-500">🇰🇪 Kenya</p>
                                        </div>
                                        {/* Progress Bar */}
                                        <div className="w-full bg-gray-200 dark:bg-[#150a21] rounded-full h-1 mt-2">
                                            <div className={`${progressColor} h-1 rounded-full transition-all duration-1000`} style={{ width: `${percentage}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <h4 className={`text-lg font-black ${user.rank === 1 ? 'text-yellow-600 dark:text-yellow-500' : 'text-gray-900 dark:text-white'}`}>{user.active_referrals}</h4>
                                    <p className="text-[8px] text-gray-400 uppercase font-bold tracking-wider">Active Invitees</p>
                                </div>
                            </div>
                        );
                    })}

                    {rankings.length === 0 && (
                        <div className="p-8 text-center text-gray-400 text-sm">No referrals this week yet! Start sharing your link.</div>
                    )}
                </div>
            </div>
        </LipataskLayout>
    );
}