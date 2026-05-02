import LipataskLayout from '@/Layouts/LipataskLayout';
import { Head } from '@inertiajs/react';

export default function Bonuses({ active_refs, bonus_earned, tiers, next_tier, progress_percent, bonus_history }) {
    
    return (
        <LipataskLayout>
            <Head title="Bonus Rewards | Chatwazungu" />

            <div className="max-w-5xl mx-auto py-4">
                
                {/* Header Banner */}
                <div className="bg-[#11071c] rounded-2xl border border-purple-900/50 shadow-xl overflow-hidden mb-8">
                    <div className="bg-gradient-to-r from-[#1e0b30] to-[#11071c] p-6 md:p-8 flex items-center gap-6 relative">
                        <div className="absolute right-0 top-0 w-64 h-64 bg-fuchsia-500/10 blur-[80px] rounded-full pointer-events-none"></div>
                        
                        <div className="w-20 h-20 rounded-full border-4 border-emerald-500 bg-[#0d0415] flex flex-col items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)] z-10 flex-shrink-0">
                            <span className="text-2xl font-black text-white leading-none">{active_refs}</span>
                            <span className="text-[9px] text-emerald-500 font-bold uppercase tracking-wider">SALES</span>
                        </div>
                        
                        <div className="z-10 flex-1">
                            <h2 className="text-2xl font-black text-white mb-1">Bonus Rewards</h2>
                            <p className="text-xs text-gray-400 mb-4">Reach sales milestones to unlock cash bonuses</p>
                            
                            <div className="flex gap-6 md:gap-10">
                                <div>
                                    <p className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">BALANCE</p>
                                    <h4 className="text-lg font-black text-white">KSh {bonus_earned}</h4>
                                </div>
                                <div>
                                    <p className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">TOTAL EARNED</p>
                                    <h4 className="text-lg font-black text-white">KSh {bonus_earned}</h4>
                                </div>
                                <div>
                                    <p className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">TIERS</p>
                                    <h4 className="text-lg font-black text-white">{tiers.length}</h4>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="bg-[#1a0e29] p-4 flex items-center gap-4">
                        <span className="text-[10px] text-gray-400 font-bold tracking-wider w-20">Next: {next_tier}</span>
                        <div className="flex-1 bg-[#090210] rounded-full h-1.5 overflow-hidden">
                            <div className="bg-yellow-500 h-full rounded-full shadow-[0_0_10px_#eab308]" style={{ width: `${progress_percent}%` }}></div>
                        </div>
                        <span className="text-xs font-black text-white">{progress_percent}%</span>
                    </div>
                </div>

                {/* Vertical Timeline of Tiers */}
                <div className="relative pl-6 md:pl-8 space-y-6 mb-12">
                    {/* The vertical timeline line */}
                    <div className="absolute left-10 md:left-12 top-4 bottom-0 w-0.5 bg-gray-800/80 -z-10"></div>

                    {tiers.map((tier) => {
                        const isUnlocked = active_refs >= tier.required;
                        const remaining = Math.max(0, tier.required - active_refs);
                        const percent = Math.min(100, (active_refs / tier.required) * 100);

                        return (
                            <div key={tier.id} className="relative flex items-center gap-4 md:gap-6 group">
                                {/* Number Circle */}
                                <div className={`w-8 h-8 rounded-full border-[3px] flex items-center justify-center text-sm font-black flex-shrink-0 z-10 transition-colors duration-300 ${
                                    isUnlocked 
                                    ? 'border-emerald-500 bg-[#0d0415] text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                                    : 'border-gray-700 bg-[#150a21] text-gray-600'
                                }`}>
                                    {tier.id}
                                </div>

                                {/* Tier Card */}
                                <div className={`flex-1 rounded-xl p-5 border transition-all duration-300 ${
                                    isUnlocked 
                                    ? 'bg-[#1a0e29] border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.1)]' 
                                    : 'bg-[#11071c] border-gray-800 opacity-80'
                                }`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-xl font-black text-white">{tier.name}</h3>
                                            <p className="text-[10px] text-gray-500 mt-1">
                                                👥 {tier.required} active referrals required {remaining > 0 && <span className="text-yellow-500 font-bold">• {remaining} to go</span>}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <h4 className={`text-xl font-black ${isUnlocked ? 'text-emerald-400' : 'text-gray-600'}`}>{tier.reward}</h4>
                                            <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">KSH BONUS</p>
                                        </div>
                                    </div>

                                    {/* Sub-progress bar inside card */}
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] text-gray-400">{Math.min(active_refs, tier.required)} / {tier.required} referrals</span>
                                        <div className="flex-1 bg-[#090210] rounded-full h-1">
                                            <div className={`${isUnlocked ? 'bg-emerald-500' : 'bg-purple-500'} h-full rounded-full`} style={{ width: `${percent}%` }}></div>
                                        </div>
                                        <span className="text-[10px] font-bold text-gray-300">{Math.round(percent)}%</span>
                                    </div>

                                    {/* Lock Footer */}
                                    {!isUnlocked && (
                                        <div className="mt-4 pt-3 border-t border-gray-800 text-center">
                                            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold flex justify-center items-center gap-1">
                                                🔒 Need {remaining} more referrals
                                            </span>
                                        </div>
                                    )}
                                    {isUnlocked && (
                                        <div className="mt-4 pt-3 border-t border-purple-900/30 text-center">
                                            <span className="text-[10px] text-emerald-400 uppercase tracking-widest font-bold flex justify-center items-center gap-1">
                                                ✅ Bonus Unlocked!
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* --- Bonus History Table --- */}
                <div className="bg-[#11071c] rounded-2xl border border-gray-800 overflow-hidden shadow-xl">
                    <div className="px-6 py-4 border-b border-gray-800 bg-[#1a0c29]">
                        <h3 className="font-bold text-sm text-gray-300 flex items-center gap-2 uppercase tracking-wider">
                            <span>🕒</span> Bonus History
                        </h3>
                    </div>
                    <div>
                        {bonus_history.length === 0 ? (
                            <div className="p-10 text-center flex flex-col items-center justify-center opacity-60">
                                <div className="text-4xl mb-3">🎁</div>
                                <p className="text-gray-400 text-sm">No bonuses claimed yet — start referring!</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-800">
                                {bonus_history.map((tx) => (
                                    <div key={tx.id} className="p-4 px-6 flex justify-between items-center hover:bg-white/5">
                                        <div>
                                            <p className="font-bold text-white text-sm">{tx.description}</p>
                                            <p className="text-xs text-gray-500 mt-1">{new Date(tx.created_at).toLocaleDateString()}</p>
                                        </div>
                                        <span className="font-black text-emerald-400">+{tx.amount} KSh</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </LipataskLayout>
    );
}