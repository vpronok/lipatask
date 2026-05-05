import LipataskLayout from '@/Layouts/LipataskLayout';
import { Head, usePage, router, useForm } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const MOCK_PARTNERS =[
    { name: 'James Miller', country: 'United States', flag: '🇺🇸', color: 'from-blue-400 to-blue-600', initialMsg: 'My phone keeps acting up today 🙄 but yes please tell me more!' },
    { name: 'Sophie Laurent', country: 'France', flag: '🇫🇷', color: 'from-fuchsia-400 to-pink-600', initialMsg: 'Bonjour! How is your day going so far?' },
];
const BOT_REPLIES =["Oh really? That is so interesting!", "Wow, I never thought about it that way.", "Haha yeah exactly! 😂", "Tell me more about that...", "I completely agree with you."];

export default function ChatToEarn({ stats, pay_per_message, cost_per_message, credits }) {
    const { flash, errors } = usePage().props;
    
    const[modalState, setModalState] = useState('hidden'); 
    const [partner, setPartner] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [userMessageCount, setUserMessageCount] = useState(0);
    const[localCredits, setLocalCredits] = useState(credits); 
    const[isBotTyping, setIsBotTyping] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Custom Exit Confirmation State
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    
    // Recharge Form Logic (No input needed anymore, amount is fixed on backend)
    const { post, processing } = useForm({});
    const [isPolling, setIsPolling] = useState(false);
    const [pollMessage, setPollMessage] = useState('Waiting for PIN...');

    const CHAT_DURATION = 120; 
    const [timeLeft, setTimeLeft] = useState(CHAT_DURATION);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    useEffect(() => { scrollToBottom(); }, [messages, isBotTyping]);

    useEffect(() => {
        let timer;
        if (modalState === 'chatting' && timeLeft > 0 && !showExitConfirm) {
            timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
        }
        return () => clearInterval(timer);
    }, [modalState, timeLeft, showExitConfirm]);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    // --- FIX: Credit Purchase Polling Logic ---
    useEffect(() => {
        let interval;
        if (flash?.success === 'Prompt Sent' && modalState === 'recharge') {
            setIsPolling(true);
            setPollMessage('Waiting for PIN...');
            
            interval = setInterval(() => {
                axios.post(route('chat.credits.check')).then(res => {
                    if (res.data.status === 'success') {
                        clearInterval(interval);
                        setPollMessage('Credits Added Successfully!');
                        setTimeout(() => { 
                            router.reload(); 
                            setModalState('hidden'); 
                            setIsPolling(false);
                        }, 1500);
                    } else if (res.data.status === 'failed') {
                        clearInterval(interval); 
                        setIsPolling(false);
                        alert('M-Pesa payment failed or was cancelled.'); 
                        router.reload();
                    }
                }).catch(err => console.error(err));
            }, 4000);
        }
        return () => clearInterval(interval);
    }, [flash, modalState]);

    const handleStartChat = () => {
        if (localCredits < cost_per_message) {
            setModalState('recharge');
            return;
        }

        setModalState('matching');
        setTimeout(() => {
            const randomPartner = MOCK_PARTNERS[Math.floor(Math.random() * MOCK_PARTNERS.length)];
            setPartner(randomPartner);
            setMessages([{ id: 1, text: randomPartner.initialMsg, sender: 'bot' }]);
            setUserMessageCount(0);
            setTimeLeft(CHAT_DURATION);
            setModalState('chatting');
        }, 3000);
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!inputText.trim() || localCredits < cost_per_message) return;

        const newMsg = { id: Date.now(), text: inputText, sender: 'user' };
        setMessages((prev) => [...prev, newMsg]);
        setInputText('');
        
        setUserMessageCount((prev) => prev + 1);
        setLocalCredits((prev) => prev - cost_per_message);

        setIsBotTyping(true);
        setTimeout(() => {
            const randomReply = BOT_REPLIES[Math.floor(Math.random() * BOT_REPLIES.length)];
            setMessages((prev) =>[...prev, { id: Date.now(), text: randomReply, sender: 'bot' }]);
            setIsBotTyping(false);
        }, 1500 + Math.random() * 1500); 
    };

    const handleCompleteTask = () => {
        if (userMessageCount === 0) return;
        setIsSubmitting(true);
        
        router.post(route('chat-to-earn.complete'), { message_count: userMessageCount }, {
            preserveScroll: true,
            onSuccess: () => {
                setModalState('hidden');
                setIsSubmitting(false);
            },
            onError: () => {
                alert("Something went wrong saving your task. Try again.");
                setIsSubmitting(false);
            }
        });
    };

    const triggerClose = () => setShowExitConfirm(true);
    const confirmExit = () => { setShowExitConfirm(false); setModalState('hidden'); };

    const handleBuyCredits = (e) => {
        e.preventDefault();
        post(route('chat.credits.pay'), {
            preserveState: true,
            preserveScroll: true,
        });
    };

    return (
        <LipataskLayout>
            <Head title="Chat to Earn | Chatwazungu" />

            <div className="max-w-5xl mx-auto py-4 relative z-0">
                {flash?.success && modalState !== 'recharge' && (
                    <div className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 p-4 rounded-xl text-sm font-bold mb-6 flex items-center justify-center gap-2 animate-[pulse_1s_ease-in-out_2]">
                        <span className="text-xl">💰</span> {flash.success}
                    </div>
                )}

                {/* --- Top Banner Section --- */}
                <div className="bg-white dark:bg-[#11071c] rounded-2xl border border-gray-100 dark:border-purple-900/50 shadow-sm dark:shadow-xl overflow-hidden mb-10">
                    <div className="p-6 md:p-8 relative">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-fuchsia-500/10 blur-[80px] rounded-full pointer-events-none"></div>

                        <div className="flex justify-between items-start mb-6">
                            <div className="w-14 h-14 rounded-full border border-orange-500/50 flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(249,115,22,0.3)] bg-[#1a0e29]">🌍</div>
                            
                            <div className="bg-[#1a0c29] border border-gray-800 rounded-xl px-4 py-2 text-center flex items-center gap-3">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">My Credits:</span>
                                <span className="text-xl font-black text-white">{credits}</span>
                                <button onClick={() => setModalState('recharge')} className="ml-2 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded transition uppercase">Buy</button>
                            </div>
                        </div>

                        <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Chat to Earn</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 max-w-2xl">
                            Have friendly conversations and earn <strong className="text-fuchsia-500">Ksh {pay_per_message}</strong> for every message sent. Requires <strong className="text-amber-500">Ksh {cost_per_message} credits</strong> to send a message.
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div className="bg-gray-50 dark:bg-[#1a0c29] border border-gray-100 dark:border-gray-800 rounded-xl p-4 text-center">
                                <h3 className="text-2xl font-black text-gray-900 dark:text-white">{stats.tasks_available}</h3>
                                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mt-1">TASKS</p>
                            </div>
                            <div className="bg-gray-50 dark:bg-[#1a0c29] border border-gray-100 dark:border-gray-800 rounded-xl p-4 text-center">
                                <h3 className="text-2xl font-black text-gray-900 dark:text-white">{stats.done}</h3>
                                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mt-1">DONE</p>
                            </div>
                            <div className="bg-gray-50 dark:bg-[#1a0c29] border border-gray-100 dark:border-gray-800 rounded-xl p-4 text-center">
                                <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">Ksh {stats.earned}</h3>
                                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mt-1">TASK WALLET</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- Available Sessions Section --- */}
                <div className="bg-white dark:bg-[#11071c] border border-gray-100 dark:border-purple-900/40 rounded-2xl p-5 md:p-6 shadow-sm dark:shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-fuchsia-500/50 transition-colors relative overflow-hidden">
                    <div className="flex items-center gap-4 md:gap-6 z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-[0_0_8px_#10b981] animate-pulse"></div>
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-black text-white text-lg shadow-[0_0_15px_rgba(99,102,241,0.4)]">01</div>
                        </div>
                        <div>
                            <h3 className="text-base md:text-lg font-black text-gray-900 dark:text-white mb-1">Chat with lonely people</h3>
                            <div className="flex items-center gap-3">
                                <span className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-[9px] px-2 py-0.5 rounded uppercase font-black tracking-widest">💬 CHAT</span>
                                <span className="text-xs text-gray-500 font-medium">👥 180,825 sessions</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-2 border-t md:border-t-0 border-gray-100 dark:border-gray-800 pt-4 md:pt-0 z-10 w-full md:w-auto">
                        <div className="text-left md:text-right">
                            <p className="text-[9px] text-yellow-600 dark:text-yellow-500 font-bold uppercase tracking-widest">CLIENT PAYS</p>
                            <h4 className="text-lg md:text-xl font-black text-gray-900 dark:text-yellow-400 leading-tight">Ksh {pay_per_message.toFixed(2)}</h4>
                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">PER MESSAGE</p>
                        </div>
                        <button onClick={handleStartChat} className="bg-[#d904f9] hover:bg-[#c204df] text-white px-8 py-3 rounded-xl font-black text-sm transition-all shadow-[0_0_15px_rgba(217,4,249,0.3)]">
                            ▶ Start
                        </button>
                    </div>
                </div>
            </div>

            {/* ======================= RECHARGE CREDITS MODAL =========================== */}
            {modalState === 'recharge' && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/90 dark:bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-[#11071c] w-full max-w-sm rounded-2xl border border-gray-200 dark:border-purple-500/30 p-6 shadow-2xl relative">
                        {!isPolling && (
                            <button onClick={() => setModalState('hidden')} className="absolute top-4 right-4 text-gray-500 hover:text-white bg-gray-100 dark:bg-[#1a0e29] w-8 h-8 rounded-full flex items-center justify-center transition z-20">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        )}
                        
                        <div className="text-center mb-6 mt-2">
                            <div className="w-14 h-14 bg-amber-500/20 text-amber-500 rounded-full flex items-center justify-center mx-auto text-2xl mb-3 shadow-[0_0_15px_rgba(245,158,11,0.2)]">💳</div>
                            <h2 className="font-black text-xl text-gray-900 dark:text-white">Buy Chat Credits</h2>
                            <p className="text-xs text-gray-500 mt-1">Fixed recharge bundle</p>
                        </div>

                        {errors?.pay && <div className="bg-red-500/10 text-red-500 text-xs p-3 rounded mb-4 text-center font-bold">{errors.pay}</div>}

                        <form onSubmit={handleBuyCredits}>
                            <div className="bg-gray-50 dark:bg-[#1a0c29] border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex justify-between items-center mb-6">
                                <span className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest text-xs">Amount to Pay</span>
                                <span className="text-fuchsia-600 dark:text-fuchsia-400 font-black text-xl">Ksh 49</span>
                            </div>

                            {isPolling ? (
                                <div className="w-full bg-gray-100 dark:bg-[#1a0e29] border border-amber-500/50 py-3 rounded-xl flex justify-center items-center gap-3">
                                    <svg className="animate-spin h-5 w-5 text-amber-600 dark:text-amber-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    <span className="text-amber-600 dark:text-amber-500 font-bold text-sm">{pollMessage}</span>
                                </div>
                            ) : (
                                <button type="submit" disabled={processing} className={`w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl transition shadow-[0_0_15px_rgba(16,185,129,0.3)] ${processing && 'opacity-50 cursor-wait'}`}>
                                    Pay Ksh 49 with M-Pesa
                                </button>
                            )}
                        </form>
                    </div>
                </div>
            )}

            {/* ======================= CHAT MODAL =========================== */}
            {modalState === 'matching' && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/90 dark:bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-[#11071c] w-full max-w-sm rounded-2xl border-t-4 border-fuchsia-500 p-8 shadow-2xl flex flex-col items-center justify-center relative">
                        <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
                            <div className="absolute inset-0 border-4 border-fuchsia-500/30 rounded-full animate-ping"></div>
                            <div className="absolute inset-2 border-4 border-cyan-400/50 rounded-full animate-pulse"></div>
                            <div className="w-12 h-12 bg-gradient-to-br from-fuchsia-500 to-cyan-500 rounded-full shadow-[0_0_20px_#d904f9]"></div>
                        </div>
                        <h3 className="text-gray-900 dark:text-white font-bold mb-2">Finding someone to chat with...</h3>
                    </div>
                </div>
            )}

            {modalState === 'chatting' && partner && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/90 dark:bg-black/80 backdrop-blur-sm p-4 sm:p-6">
                    <div className="bg-white dark:bg-[#11071c] w-full max-w-md h-full max-h-[600px] rounded-2xl border border-gray-200 dark:border-purple-500/30 shadow-2xl flex flex-col relative overflow-hidden">
                        
                        {/* --- CUSTOM EXIT CONFIRMATION MODAL (OVERLAYS CHAT) --- */}
                        {showExitConfirm && (
                            <div className="absolute inset-0 z-[60] bg-gray-900/90 dark:bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm transition-opacity">
                                <div className="bg-white dark:bg-[#1a0e29] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 w-full text-center shadow-2xl">
                                    <div className="w-12 h-12 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-xl border border-red-200 dark:border-red-500/30">⚠️</div>
                                    <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2">Exit Chat?</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">Are you sure you want to leave? If you exit now, your messages will <strong className="text-red-500 dark:text-red-400">not be credited</strong> to your task wallet.</p>
                                    <div className="flex gap-3">
                                        <button onClick={() => setShowExitConfirm(false)} className="flex-1 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-white py-3 rounded-xl font-bold transition text-sm">Cancel</button>
                                        <button onClick={confirmExit} className="flex-1 bg-red-600 hover:bg-red-500 text-white py-3 rounded-xl font-bold transition shadow-[0_0_15px_rgba(220,38,38,0.4)] text-sm">Exit & Lose Reward</button>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {/* Close 'X' Button */}
                        <button onClick={triggerClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:hover:text-white bg-gray-100 dark:bg-[#1a0e29] w-8 h-8 rounded-full flex items-center justify-center transition z-20">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>

                        <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#150a21] flex items-center gap-4 relative z-10">
                            <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${partner.color} flex items-center justify-center font-black text-white text-xl shadow-lg flex-shrink-0`}>{partner.name.charAt(0)}</div>
                            <div className="flex-1 pr-8">
                                <div className="flex justify-between items-center mb-1">
                                    <h3 className="font-bold text-gray-900 dark:text-white leading-none text-sm">{partner.name}</h3>
                                    <div className="flex items-center gap-1 text-[10px] text-gray-500 font-medium">{partner.flag} {partner.country}</div>
                                </div>
                                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"></div><span className="text-[10px] text-emerald-600 dark:text-emerald-500 font-bold">Online now</span></div>
                            </div>
                        </div>

                        <div className="bg-gray-200 dark:bg-[#1a0e29] h-1.5 w-full relative">
                            <div className="h-full bg-gradient-to-r from-cyan-400 to-fuchsia-500 transition-all duration-1000 linear" style={{ width: `${(timeLeft / CHAT_DURATION) * 100}%` }}></div>
                        </div>
                        <div className="flex justify-between items-center py-1.5 px-4 bg-gray-50 dark:bg-[#150a21]">
                            <span className="text-[10px] text-amber-600 dark:text-amber-500 font-bold">Credits: {localCredits}</span>
                            <span className="text-[10px] text-gray-500">Time remaining: <span className="font-mono text-gray-800 dark:text-gray-300 font-bold">{formatTime(timeLeft)}</span></span>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-gray-100 dark:bg-[#0d0415]">
                            {messages.map((msg) => (
                                <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                                    <div className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm ${msg.sender === 'user' ? 'bg-[#d904f9] text-white rounded-br-none' : 'bg-white dark:bg-[#1a0e29] border border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-none'}`}>{msg.text}</div>
                                </div>
                            ))}
                            {isBotTyping && (
                                <div className="flex items-end gap-2 max-w-[80%]">
                                    <div className="bg-white dark:bg-[#1a0e29] border border-gray-200 dark:border-gray-800 px-4 py-3 rounded-2xl rounded-bl-none shadow-sm">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"></div>
                                            <div className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                            <div className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="p-4 bg-white dark:bg-[#11071c] border-t border-gray-200 dark:border-gray-800 relative z-10">
                            {localCredits < cost_per_message ? (
                                <div className="text-center text-rose-500 text-xs font-bold mb-3 bg-rose-50 dark:bg-rose-500/10 py-2 rounded">Out of credits! Claim your earnings and recharge.</div>
                            ) : (
                                <form onSubmit={handleSendMessage} className="flex items-center gap-2 mb-3">
                                    <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="Type your message..." disabled={timeLeft <= 0 || isSubmitting || showExitConfirm} className="flex-1 bg-gray-50 dark:bg-[#1a0e29] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:ring-1 focus:ring-fuchsia-500 focus:border-fuchsia-500 placeholder-gray-400 disabled:opacity-50" />
                                    <button type="submit" disabled={!inputText.trim() || timeLeft <= 0 || isSubmitting || showExitConfirm} className="bg-indigo-600 hover:bg-indigo-500 text-white w-12 h-12 rounded-xl flex items-center justify-center transition disabled:opacity-50 shadow-md flex-shrink-0">
                                        <svg className="w-5 h-5 ml-1" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/></svg>
                                    </button>
                                </form>
                            )}

                            <button onClick={handleCompleteTask} disabled={userMessageCount === 0 || isSubmitting || showExitConfirm} className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all flex justify-center items-center gap-2 ${isSubmitting ? 'bg-emerald-600 opacity-70 text-white cursor-wait' : userMessageCount > 0 ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-gray-100 dark:bg-[#1a0e29] text-gray-400 dark:text-gray-500 cursor-not-allowed'}`}>
                                {isSubmitting ? 'Saving Task...' : userMessageCount > 0 ? `✔️ Claim Ksh ${(userMessageCount * pay_per_message).toFixed(2)} to Task Wallet` : '🔒 Complete chat to earn reward'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </LipataskLayout>
    );
}