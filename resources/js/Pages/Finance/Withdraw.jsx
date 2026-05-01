import LipataskLayout from '@/Layouts/LipataskLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';

export default function Withdraw({ balances, min_withdrawal }) {
    const { auth, flash } = usePage().props;
    const user = auth.user;

    // Local state for UI selection
    const [selectedWallet, setSelectedWallet] = useState('team'); 

    // Inertia Form Setup
    const { data, setData, post, processing, errors, reset } = useForm({
        wallet: 'team',
        amount: '',
    });

    // Sync local selection with Inertia form data
    useEffect(() => {
        setData('wallet', selectedWallet);
        setData('amount', ''); // Reset amount when switching wallets
    }, [selectedWallet]);

    const handleMaxClick = () => {
        setData('amount', balances[selectedWallet].toString());
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('withdraw.store'), {
            preserveScroll: true,
            onSuccess: () => reset('amount'),
        });
    };

    return (
        <LipataskLayout>
            <Head title="Withdraw Funds | Lipatask" />

            <div className="max-w-2xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white">Request <span className="text-fuchsia-500">Withdrawal</span></h1>
                    <p className="text-sm text-gray-500">Cash out your earnings directly to M-Pesa.</p>
                </div>

                {/* Success Notification */}
                {flash?.success && (
                    <div className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-500 px-4 py-3 rounded-xl font-bold text-sm mb-6 flex items-center gap-2">
                        <span>✅</span> {flash.success}
                    </div>
                )}

                <div className="bg-white dark:bg-[#11071c] rounded-2xl border border-gray-100 dark:border-purple-900/30 overflow-hidden shadow-sm dark:shadow-xl p-4 md:p-6">
                    
                    {/* Wallet Selectors */}
                    <div className="flex gap-4 mb-6">
                        {/* Affiliate (Team) Wallet Button */}
                        <button 
                            onClick={() => setSelectedWallet('team')}
                            className={`flex-1 rounded-xl p-4 flex flex-col items-center justify-center transition-all duration-300 relative border ${
                                selectedWallet === 'team' 
                                ? 'bg-[#2a1342] border-fuchsia-500 shadow-[0_0_15px_rgba(217,4,249,0.2)]' 
                                : 'bg-[#150a21] border-transparent opacity-60 hover:opacity-100'
                            }`}
                        >
                            {selectedWallet === 'team' && (
                                <div className="absolute top-2 right-2 bg-fuchsia-500 rounded-full p-0.5">
                                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                </div>
                            )}
                            <div className={`p-2 rounded-lg mb-2 ${selectedWallet === 'team' ? 'bg-fuchsia-500/20 text-fuchsia-400' : 'bg-gray-800 text-gray-500'}`}>👥</div>
                            <span className={`font-bold text-xs ${selectedWallet === 'team' ? 'text-white' : 'text-gray-400'}`}>Affiliate</span>
                            <span className={`font-black text-lg ${selectedWallet === 'team' ? 'text-white' : 'text-gray-500'}`}>{balances.team}</span>
                        </button>

                        {/* Main Wallet Button */}
                        <button 
                            onClick={() => setSelectedWallet('main')}
                            className={`flex-1 rounded-xl p-4 flex flex-col items-center justify-center transition-all duration-300 relative border ${
                                selectedWallet === 'main' 
                                ? 'bg-[#2a1342] border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]' 
                                : 'bg-[#150a21] border-transparent opacity-60 hover:opacity-100'
                            }`}
                        >
                            {selectedWallet === 'main' && (
                                <div className="absolute top-2 right-2 bg-blue-500 rounded-full p-0.5">
                                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                </div>
                            )}
                            <div className={`p-2 rounded-lg mb-2 ${selectedWallet === 'main' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-800 text-gray-500'}`}>💼</div>
                            <span className={`font-bold text-xs ${selectedWallet === 'main' ? 'text-white' : 'text-gray-400'}`}>Main</span>
                            <span className={`font-black text-lg ${selectedWallet === 'main' ? 'text-white' : 'text-gray-500'}`}>{balances.main}</span>
                            <span className="text-[9px] text-gray-500 mt-1">Min Ksh {min_withdrawal}</span>
                        </button>
                    </div>

                    {/* Available Balance Row */}
                    <div className="bg-[#210c3b] rounded-xl p-4 flex justify-between items-center mb-6">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-fuchsia-500 shadow-[0_0_5px_#d904f9]"></div>
                            <span className="text-sm font-bold text-gray-300">Available</span>
                        </div>
                        <span className="text-lg font-black text-white">KSh {balances[selectedWallet].toFixed(2)}</span>
                    </div>

                    <form onSubmit={submit} className="space-y-6">
                        {/* Amount Input */}
                        <div className="bg-[#150a21] border border-gray-800 rounded-xl p-4">
                            <label className="flex items-center gap-2 text-xs font-bold text-white mb-3">
                                <span className="bg-emerald-500/20 text-emerald-500 p-1 rounded">💵</span>
                                Amount - Min KSh {min_withdrawal}
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    min={min_withdrawal}
                                    step="0.01"
                                    value={data.amount}
                                    onChange={(e) => setData('amount', e.target.value)}
                                    className="w-full bg-[#1a0c29] border border-gray-700/50 rounded-lg pl-4 pr-20 py-3 text-white placeholder-gray-600 focus:ring-1 focus:ring-fuchsia-500 focus:border-fuchsia-500 transition-colors"
                                    placeholder="0.00"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={handleMaxClick}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-[10px] font-bold px-3 py-1.5 rounded uppercase tracking-wider flex items-center gap-1 transition"
                                >
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                    MAX
                                </button>
                            </div>
                            <p className="text-red-500 text-[10px] mt-1 empty:hidden">{errors.amount}</p>
                        </div>

                        {/* M-Pesa Locked Input */}
                        <div className="bg-[#150a21] border border-gray-800 rounded-xl p-4">
                            <label className="flex items-center gap-2 text-xs font-bold text-white mb-3">
                                <span className="bg-rose-500/20 text-rose-500 p-1 rounded">📱</span>
                                M-Pesa Number
                            </label>
                            <div className="flex bg-[#1a0c29] border border-gray-700/50 rounded-lg overflow-hidden opacity-70">
                                <div className="bg-[#24133b] px-4 py-3 border-r border-gray-700/50 flex items-center justify-center">
                                    <span className="text-xs font-black text-gray-400">KE +254</span>
                                </div>
                                <input
                                    type="text"
                                    disabled
                                    value={user.phone.replace(/^(07|01)/, '')} // Strip leading 0 to match format
                                    className="w-full bg-transparent border-none px-4 py-3 text-white cursor-not-allowed focus:ring-0 tracking-widest font-medium"
                                />
                            </div>
                            <p className="text-[10px] text-gray-500 mt-2 flex items-center gap-1">
                                🔒 Locked · <a href={route('profile.edit')} className="text-fuchsia-400 hover:underline">Update in Profile →</a>
                            </p>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={processing}
                            className={`w-full bg-[#d904f9] hover:bg-[#c204df] text-white font-black py-4 rounded-xl flex justify-center items-center gap-2 transition-colors shadow-[0_0_20px_rgba(217,4,249,0.3)] uppercase tracking-wide text-sm ${processing && 'opacity-50'}`}
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/></svg>
                            {processing ? 'Processing...' : 'Submit Withdrawal'}
                        </button>
                    </form>
                </div>
            </div>
        </LipataskLayout>
    );
}