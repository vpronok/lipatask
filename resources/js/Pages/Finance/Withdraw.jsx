import LipataskLayout from '@/Layouts/LipataskLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';

export default function Withdraw({ balances, min_withdrawal, task_enabled, withdrawal_fee }) {
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

    // Calculate Net Payout Live
    const netPayout = data.amount && data.amount > withdrawal_fee 
        ? (data.amount - withdrawal_fee).toFixed(2) 
        : '0.00';

    return (
        <LipataskLayout>
            <Head title="Withdraw Funds | Chatwazungu" />

            <div className="max-w-3xl mx-auto py-4">
                <div className="mb-6">
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white">Request <span className="text-fuchsia-500">Withdrawal</span></h1>
                    <p className="text-sm text-gray-500">Cash out your earnings directly to M-Pesa.</p>
                </div>

                {/* Success Notification */}
                {flash?.success && (
                    <div className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-500 px-4 py-3 rounded-xl font-bold text-sm mb-6 flex items-center gap-2 animate-[pulse_1s_ease-in-out_2]">
                        <span>✅</span> {flash.success}
                    </div>
                )}

                <div className="bg-white dark:bg-[#11071c] rounded-2xl border border-gray-100 dark:border-purple-900/30 overflow-hidden shadow-sm dark:shadow-xl p-4 md:p-6">
                    
                    {/* --- Wallet Selectors --- */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-6">
                        
                        {/* Affiliate (Team) Wallet Button */}
                        <button 
                            onClick={() => setSelectedWallet('team')}
                            className={`rounded-xl p-4 flex flex-col items-center justify-center transition-all duration-300 relative border ${
                                selectedWallet === 'team' 
                                ? 'bg-[#2a1342] border-fuchsia-500 shadow-[0_0_15px_rgba(217,4,249,0.2)]' 
                                : 'bg-gray-50 dark:bg-[#150a21] border-gray-200 dark:border-gray-800 opacity-60 hover:opacity-100'
                            }`}
                        >
                            {selectedWallet === 'team' && (
                                <div className="absolute top-2 right-2 bg-fuchsia-500 rounded-full p-0.5">
                                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                </div>
                            )}
                            <div className={`p-2 rounded-lg mb-2 ${selectedWallet === 'team' ? 'bg-fuchsia-500/20 text-fuchsia-600 dark:text-fuchsia-400' : 'bg-gray-200 dark:bg-gray-800 text-gray-500'}`}>👥</div>
                            <span className={`font-bold text-xs uppercase tracking-widest ${selectedWallet === 'team' ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>Affiliate</span>
                            <span className={`font-black text-lg ${selectedWallet === 'team' ? 'text-fuchsia-600 dark:text-white' : 'text-gray-500'}`}>{balances.team}</span>
                        </button>

                        {/* Main Wallet Button */}
                        <button 
                            onClick={() => setSelectedWallet('main')}
                            className={`rounded-xl p-4 flex flex-col items-center justify-center transition-all duration-300 relative border ${
                                selectedWallet === 'main' 
                                ? 'bg-blue-50 dark:bg-[#1a2042] border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]' 
                                : 'bg-gray-50 dark:bg-[#150a21] border-gray-200 dark:border-gray-800 opacity-60 hover:opacity-100'
                            }`}
                        >
                            {selectedWallet === 'main' && (
                                <div className="absolute top-2 right-2 bg-blue-500 rounded-full p-0.5">
                                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                </div>
                            )}
                            <div className={`p-2 rounded-lg mb-2 ${selectedWallet === 'main' ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400' : 'bg-gray-200 dark:bg-gray-800 text-gray-500'}`}>💼</div>
                            <span className={`font-bold text-xs uppercase tracking-widest ${selectedWallet === 'main' ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>Main</span>
                            <span className={`font-black text-lg ${selectedWallet === 'main' ? 'text-blue-600 dark:text-white' : 'text-gray-500'}`}>{balances.main}</span>
                        </button>

                        {/* Task Wallet Button */}
                        <button 
                            onClick={() => { if(task_enabled) setSelectedWallet('task'); }}
                            disabled={!task_enabled}
                            className={`rounded-xl p-4 flex flex-col items-center justify-center transition-all duration-300 relative border ${
                                !task_enabled ? 'bg-gray-100 dark:bg-[#150a21]/50 border-gray-200 dark:border-gray-800 opacity-40 cursor-not-allowed' :
                                selectedWallet === 'task' 
                                ? 'bg-emerald-50 dark:bg-[#132a24] border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]' 
                                : 'bg-gray-50 dark:bg-[#150a21] border-gray-200 dark:border-gray-800 opacity-60 hover:opacity-100'
                            }`}
                        >
                            {selectedWallet === 'task' && (
                                <div className="absolute top-2 right-2 bg-emerald-500 rounded-full p-0.5">
                                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                </div>
                            )}
                            {!task_enabled && (
                                <div className="absolute top-2 right-2 bg-gray-500 rounded p-0.5 text-[8px] text-white font-bold tracking-wider">LOCKED</div>
                            )}
                            <div className={`p-2 rounded-lg mb-2 ${selectedWallet === 'task' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-gray-200 dark:bg-gray-800 text-gray-500'}`}>🌍</div>
                            <span className={`font-bold text-xs uppercase tracking-widest ${selectedWallet === 'task' ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>Task</span>
                            <span className={`font-black text-lg ${selectedWallet === 'task' ? 'text-emerald-600 dark:text-white' : 'text-gray-500'}`}>{balances.task}</span>
                        </button>

                    </div>

                    {/* --- Available Balance Row --- */}
                    <div className="bg-gray-50 dark:bg-[#210c3b] rounded-xl p-4 flex justify-between items-center mb-6 border border-gray-100 dark:border-transparent">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-fuchsia-500 shadow-[0_0_5px_#d904f9]"></div>
                            <span className="text-sm font-bold text-gray-600 dark:text-gray-300 uppercase tracking-widest">Available</span>
                        </div>
                        <span className="text-lg font-black text-gray-900 dark:text-white">KSh {balances[selectedWallet].toFixed(2)}</span>
                    </div>

                    <form onSubmit={submit} className="space-y-6">
                        
                        {/* --- Amount Input & Fee Calculator --- */}
                        <div className="bg-white dark:bg-[#150a21] border border-gray-200 dark:border-gray-800 rounded-xl p-4">
                            <div className="flex justify-between items-center mb-3">
                                <label className="flex items-center gap-2 text-xs font-bold text-gray-900 dark:text-white">
                                    <span className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-500 p-1 rounded">💵</span>
                                    Amount to Withdraw
                                </label>
                                <span className="text-[10px] text-gray-500 font-bold bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">Min KSh {min_withdrawal}</span>
                            </div>
                            
                            <div className="relative mb-4">
                                <input
                                    type="number"
                                    min={min_withdrawal}
                                    step="0.01"
                                    value={data.amount}
                                    onChange={(e) => setData('amount', e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-[#1a0c29] border border-gray-200 dark:border-gray-700/50 rounded-lg pl-4 pr-20 py-4 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:ring-1 focus:ring-fuchsia-500 focus:border-fuchsia-500 transition-colors font-bold text-lg"
                                    placeholder="0.00"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={handleMaxClick}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-[10px] font-bold px-3 py-1.5 rounded uppercase tracking-wider flex items-center gap-1 transition"
                                >
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                    MAX
                                </button>
                            </div>
                            
                            {/* Live Fee Calculator */}
                            {data.amount && (
                                <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-lg p-3 md:p-4 flex flex-col md:flex-row md:justify-between md:items-center text-sm mb-2 gap-2">
                                    <div>
                                        <p className="text-gray-600 dark:text-gray-400 text-xs">Platform Fee: <span className="text-rose-500 font-bold">-Ksh {withdrawal_fee}</span></p>
                                        <p className="text-emerald-700 dark:text-emerald-400 font-bold mt-1">You will receive via M-Pesa:</p>
                                    </div>
                                    <span className="text-2xl font-black text-emerald-600 dark:text-emerald-500">Ksh {netPayout}</span>
                                </div>
                            )}

                            <p className="text-red-500 text-[10px] mt-1 empty:hidden font-bold">{errors.amount}</p>
                        </div>

                        {/* --- M-Pesa Locked Input --- */}
                        <div className="bg-white dark:bg-[#150a21] border border-gray-200 dark:border-gray-800 rounded-xl p-4">
                            <label className="flex items-center gap-2 text-xs font-bold text-gray-900 dark:text-white mb-3">
                                <span className="bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-500 p-1 rounded">📱</span>
                                Destination M-Pesa Number
                            </label>
                            <div className="flex bg-gray-50 dark:bg-[#1a0c29] border border-gray-200 dark:border-gray-700/50 rounded-lg overflow-hidden opacity-70">
                                <div className="bg-gray-100 dark:bg-[#24133b] px-4 py-3 border-r border-gray-200 dark:border-gray-700/50 flex items-center justify-center">
                                    <span className="text-xs font-black text-gray-500 dark:text-gray-400">KE +254</span>
                                </div>
                                <input
                                    type="text"
                                    disabled
                                    value={user.phone.replace(/^0/, '')}
                                    className="w-full bg-transparent border-none px-4 py-3 text-gray-900 dark:text-white cursor-not-allowed focus:ring-0 tracking-widest font-medium"
                                />
                            </div>
                            <p className="text-[10px] text-gray-500 mt-2 flex items-center gap-1">
                                🔒 Locked · <a href={route('profile.edit')} className="text-fuchsia-600 dark:text-fuchsia-400 hover:underline">Update in Profile →</a>
                            </p>
                        </div>

                        {/* --- Submit Button --- */}
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