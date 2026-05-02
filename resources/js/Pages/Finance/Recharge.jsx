import LipataskLayout from '@/Layouts/LipataskLayout';
import { Head, useForm, Link, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Recharge({ main_balance, phone, flash, errors }) {
    const { data, setData, post, processing } = useForm({ amount: '' });
    
    // Auto-Polling States
    const [isPolling, setIsPolling] = useState(false);
    const[pollMessage, setPollMessage] = useState('Waiting for M-Pesa PIN...');

    // Preset amounts array
    const presets =[50, 100, 200, 500, 1000, 2000];

    const initiatePayment = (e) => {
        e.preventDefault();
        post(route('recharge.pay'));
    };

    // Polling Logic
    useEffect(() => {
        let interval;
        if (flash?.success === 'Prompt Sent') {
            setIsPolling(true);
            interval = setInterval(() => {
                axios.post(route('recharge.check'))
                    .then(response => {
                        if (response.data.status === 'success') {
                            clearInterval(interval);
                            setPollMessage('Deposit Successful! Updating Wallet...');
                            setTimeout(() => router.reload(), 1500); // Refresh to show new balance
                        } else if (response.data.status === 'failed') {
                            clearInterval(interval);
                            setIsPolling(false);
                            alert('M-Pesa payment failed or was cancelled.');
                            router.reload();
                        }
                    }).catch(error => console.error(error));
            }, 4000);
        }
        return () => clearInterval(interval);
    }, [flash]);

    return (
        <LipataskLayout>
            <Head title="Recharge Account | Chatwazungu" />

            <div className="max-w-2xl mx-auto py-8">
                
                {/* Main Card */}
                <div className="bg-[#11071c] rounded-2xl border border-gray-800 shadow-2xl overflow-hidden">
                    
                    {/* Header (Wallet Info) */}
                    <div className="bg-[#1a0e29] border-b border-gray-800 p-6 flex justify-between items-center relative overflow-hidden">
                        <div className="absolute right-0 top-0 w-32 h-32 bg-yellow-500/10 blur-2xl rounded-full"></div>
                        <div className="z-10">
                            <h3 className="text-[10px] text-yellow-500 font-bold uppercase tracking-widest flex items-center gap-2 mb-2">
                                <span>💼</span> MAIN WALLET
                            </h3>
                            <h1 className="text-4xl font-black text-white">{main_balance}</h1>
                            <p className="text-[10px] text-gray-500 mt-1">Current balance</p>
                        </div>
                        <div className="bg-yellow-500 text-yellow-950 w-10 h-10 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(234,179,8,0.3)] z-10">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"/><path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd"/></svg>
                        </div>
                    </div>

                    <div className="p-6 md:p-8">
                        {errors?.pay && (
                            <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg text-xs font-bold mb-6 text-center">
                                ⚠️ {errors.pay}
                            </div>
                        )}

                        <form onSubmit={initiatePayment}>
                            {/* Preset Buttons */}
                            <h4 className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-2 mb-3"><span>💰</span> DEPOSIT AMOUNT</h4>
                            <div className="grid grid-cols-3 gap-3 mb-4">
                                {presets.map((amt) => (
                                    <button 
                                        key={amt} type="button" 
                                        onClick={() => setData('amount', amt)}
                                        className={`py-3 rounded-xl border text-sm font-bold transition-all ${data.amount == amt ? 'bg-fuchsia-600/20 border-fuchsia-500 text-white' : 'bg-[#150a21] border-gray-800 text-gray-400 hover:border-gray-600'}`}
                                    >
                                        Ksh {amt}
                                    </button>
                                ))}
                            </div>

                            {/* Custom Amount Input */}
                            <div className="relative mb-1">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <span className="text-gray-500 font-bold text-sm">Ksh</span>
                                </div>
                                <input
                                    type="number"
                                    min="50" max="50000"
                                    value={data.amount}
                                    onChange={(e) => setData('amount', e.target.value)}
                                    className="w-full bg-[#150a21] border border-gray-800 rounded-xl pl-12 pr-4 py-4 text-white placeholder-gray-600 focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 transition-colors font-bold"
                                    placeholder="Enter amount"
                                    required
                                    disabled={isPolling}
                                />
                            </div>
                            <div className="flex justify-between items-center mb-8">
                                <p className="text-[10px] text-gray-500">Min Ksh 50 • Max Ksh 50,000</p>
                                <p className="text-red-500 text-[10px] empty:hidden">{errors.amount}</p>
                            </div>

                            {/* M-Pesa Info */}
                            <h4 className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-2 mb-3"><span>📱</span> M-PESA NUMBER</h4>
                            <div className="flex bg-[#150a21] border border-gray-800 rounded-xl overflow-hidden opacity-80 mb-3">
                                <div className="bg-[#1a0c29] px-4 py-3 border-r border-gray-800 flex items-center justify-center">
                                    <span className="text-xs font-black text-gray-500">KE +254</span>
                                </div>
                                <input type="text" disabled value={phone.replace(/^0/, '')} className="w-full bg-transparent border-none px-4 py-3 text-white cursor-not-allowed focus:ring-0 tracking-widest font-medium" />
                            </div>

                            {/* STK Push Info Banner */}
                            <div className="bg-[#1a0e29] border border-gray-800 rounded-xl p-3 flex items-start gap-3 mb-6">
                                <div className="bg-emerald-500 text-white text-[10px] font-black px-2 py-1 rounded">M</div>
                                <p className="text-[10px] text-gray-400 leading-relaxed">
                                    <strong className="text-gray-200">M-Pesa STK Push</strong> — you'll get a payment prompt on this number. Enter your <strong className="text-gray-200">M-Pesa PIN</strong> to confirm. Money goes directly to your <strong className="text-white">Main Wallet</strong>.
                                </p>
                            </div>

                            {/* Submit / Polling Button */}
                            {isPolling ? (
                                <div className="w-full bg-[#1a0e29] border border-fuchsia-500/50 py-4 rounded-xl flex justify-center items-center gap-3">
                                    <svg className="animate-spin h-5 w-5 text-fuchsia-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    <span className="text-fuchsia-400 font-bold text-sm animate-pulse">{pollMessage}</span>
                                </div>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={processing || !data.amount}
                                    className={`w-full bg-[#d904f9] hover:bg-[#c204df] text-white font-black py-4 rounded-xl shadow-[0_0_15px_rgba(217,4,249,0.4)] transition-all flex justify-center items-center gap-2 ${(!data.amount || processing) && 'opacity-50 cursor-not-allowed'}`}
                                >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd"/></svg>
                                    Deposit Ksh {data.amount || '0'} to Main Wallet
                                </button>
                            )}

                        </form>

                        <div className="text-center mt-6">
                            <Link href={route('dashboard')} className="text-xs font-bold text-gray-500 hover:text-white transition">
                                ← Back to Dashboard
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </LipataskLayout>
    );
}