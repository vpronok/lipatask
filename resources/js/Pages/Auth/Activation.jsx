import { Head, useForm, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Activation({ fee, phone, flash, errors }) {
    const { post, processing } = useForm({});
    
    // UI States for Polling
    const[isPolling, setIsPolling] = useState(false);
    const [pollMessage, setPollMessage] = useState('Waiting for M-Pesa PIN...');

    const initiatePayment = (e) => {
        e.preventDefault();
        post(route('activation.pay'));
    };

    // The Polling Logic
    useEffect(() => {
        let interval;
        
        // If the backend confirmed the STK push was sent to the phone successfully
        if (flash?.success === 'Prompt Sent') {
            setIsPolling(true);
            
            // Check the status silently in the background every 4 seconds
            interval = setInterval(() => {
                axios.post(route('activation.check'))
                    .then(response => {
                        if (response.data.status === 'success') {
                            clearInterval(interval);
                            setPollMessage('Payment Successful! Redirecting...');
                            // Give them 1 second to read the success message, then open dashboard
                            setTimeout(() => router.visit(route('dashboard')), 1000);
                        } 
                        else if (response.data.status === 'failed') {
                            clearInterval(interval);
                            setIsPolling(false);
                            alert('M-Pesa payment failed or was cancelled. Please try again.');
                            router.reload(); // Reload to reset the state
                        }
                    })
                    .catch(error => console.error("Polling error:", error));
            }, 4000);
        }

        return () => clearInterval(interval); // Cleanup timer if user leaves page
    }, [flash]);

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[#0d0415] text-white font-sans selection:bg-fuchsia-500">
            <Head title="Account Activation | Lipatask" />

            <div className="w-full max-w-[420px] bg-[#1a1125] border border-fuchsia-500/30 rounded-3xl p-8 shadow-[0_0_40px_rgba(217,4,249,0.15)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/20 blur-3xl rounded-full pointer-events-none"></div>

                <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center text-2xl mb-4 border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]">📱</div>
                    <h1 className="text-2xl font-black uppercase tracking-wider text-white">Activate Account</h1>
                    <p className="text-gray-400 text-sm mt-2">Complete M-Pesa verification to access your Lipatask dashboard.</p>
                </div>
                
                {errors?.pay && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-xl text-xs font-bold mb-6 text-center">
                        ⚠️ {errors.pay}
                    </div>
                )}

                <div className="bg-[#090210] border border-gray-800 rounded-xl p-4 mb-6">
                    <div className="flex justify-between items-center mb-3 pb-3 border-b border-gray-800">
                        <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">Phone Number</span>
                        <span className="text-white font-bold">{phone}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">Activation Fee</span>
                        <span className="text-fuchsia-400 font-black text-xl">Ksh {fee}</span>
                    </div>
                </div>

                {/* Hide the Pay button and show the Loading State when polling starts */}
                {isPolling ? (
                    <div className="bg-purple-900/20 border border-purple-500/30 rounded-xl p-6 text-center">
                        <div className="inline-block relative w-12 h-12 mb-4">
                            <div className="absolute inset-0 border-4 border-fuchsia-500/20 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-fuchsia-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                        <h3 className="font-bold text-white mb-1">Check your phone!</h3>
                        <p className="text-sm text-fuchsia-400 animate-pulse">{pollMessage}</p>
                        <p className="text-[10px] text-gray-500 mt-4 uppercase tracking-widest">Do not close this page</p>
                    </div>
                ) : (
                    <form onSubmit={initiatePayment}>
                        <button
                            type="submit"
                            disabled={processing}
                            className={`w-full bg-[#d904f9] hover:bg-[#c204df] text-white font-black py-4 rounded-xl flex justify-center items-center gap-2 transition-colors shadow-[0_0_20px_rgba(217,4,249,0.4)] uppercase tracking-wider text-sm mb-4 ${processing ? 'opacity-70 cursor-wait' : ''}`}
                        >
                            {processing ? 'Connecting to Safaricom...' : 'Pay with M-Pesa'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}