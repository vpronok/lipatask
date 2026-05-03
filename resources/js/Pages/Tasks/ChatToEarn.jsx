import LipataskLayout from '@/Layouts/LipataskLayout';
import { Head, usePage, router } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';

const MOCK_PARTNERS =[
    { name: 'James Miller', country: 'United States', flag: '🇺🇸', color: 'from-blue-400 to-blue-600', initialMsg: 'My phone keeps acting up today 🙄 but yes please tell me more!' },
    { name: 'Sophie Laurent', country: 'France', flag: '🇫🇷', color: 'from-fuchsia-400 to-pink-600', initialMsg: 'Bonjour! How is your day going so far?' },
    { name: 'David Smith', country: 'United Kingdom', flag: '🇬🇧', color: 'from-emerald-400 to-teal-600', initialMsg: 'Hey there! Just relaxing with some coffee. You?' },
];

const BOT_REPLIES =[
    "Oh really? That is so interesting!",
    "Wow, I never thought about it that way.",
    "Haha yeah exactly! 😂",
    "Tell me more about that...",
    "That makes total sense.",
    "I completely agree with you."
];

export default function ChatToEarn({ stats, pay_per_message }) {
    const { flash } = usePage().props;
    
    const [modalState, setModalState] = useState('hidden'); 
    const [partner, setPartner] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const[userMessageCount, setUserMessageCount] = useState(0);
    const [isBotTyping, setIsBotTyping] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Custom Exit Confirmation State
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    
    const CHAT_DURATION = 120; 
    const [timeLeft, setTimeLeft] = useState(CHAT_DURATION);

    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };
    useEffect(() => { scrollToBottom(); }, [messages, isBotTyping]);

    useEffect(() => {
        let timer;
        if (modalState === 'chatting' && timeLeft > 0 && !showExitConfirm) {
            timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
        }
        return () => clearInterval(timer);
    },[modalState, timeLeft, showExitConfirm]);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const handleStartChat = () => {
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
        if (!inputText.trim()) return;

        const newMsg = { id: Date.now(), text: inputText, sender: 'user' };
        setMessages((prev) => [...prev, newMsg]);
        setInputText('');
        setUserMessageCount((prev) => prev + 1);

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
            },
            onError: () => {
                alert("Something went wrong saving your task. Try again.");
            },
            onFinish: () => {
                // Guaranteed to turn off the loading animation even if it fails
                setIsSubmitting(false); 
            }
        });
    };

    const triggerClose = () => {
        // Show our beautiful custom modal instead of the browser alert
        setShowExitConfirm(true);
    };

    const confirmExit = () => {
        setShowExitConfirm(false);
        setModalState('hidden');
    };

    return (
        <LipataskLayout>
            <Head title="Chat to Earn | Chatwazungu" />

            <div className="max-w-5xl mx-auto py-4 relative z-0">
                {flash?.success && (
                    <div className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 p-4 rounded-xl text-sm font-bold mb-6 flex items-center justify-center gap-2 animate-[pulse_1s_ease-in-out_2]">
                        <span className="text-xl">💰</span> {flash.success}
                    </div>
                )}

                {/* Top Banner Section */}
                <div className="bg-white dark:bg-[#11071c] rounded-2xl border border-gray-100 dark:border-purple-900/50 shadow-sm dark:shadow-xl overflow-hidden mb-10">
                    <div className="p-6 md:p-8 relative">
                        <div className="absolute top-0 left-10 w-48 h-48 bg-yellow-500/10 blur-[80px] rounded-full pointer-events-none"></div>
                        <div className="w-14 h-14 rounded-full border border-orange-500/50 flex items-center justify-center text-3xl mb-5 shadow-[0_0_20px_rgba(249,115,22,0.3)] bg-[#1a0e29]">
                            🌍
                        </div>
                        <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Chat with Foreigners</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 max-w-2xl">
                            Connect with lonely individuals around the world. Have a friendly conversation and earn rewards for <strong className="text-fuchsia-500">every message you send</strong>.
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
                                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mt-1">EARNED</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Available Sessions Section */}
                <div className="bg-white dark:bg-[#11071c] border border-gray-100 dark:border-purple-900/40 rounded-2xl p-5 md:p-6 shadow-sm dark:shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-fuchsia-500/50 transition-colors group relative overflow-hidden">
                    <div className="absolute inset-0 bg-fuchsia-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

                    <div className="flex items-center gap-4 md:gap-6 z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-[0_0_8px_#10b981] animate-pulse"></div>
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-black text-white text-lg shadow-[0_0_15px_rgba(99,102,241,0.4)]">01</div>
                        </div>
                        <div>
                            <h3 className="text-base md:text-lg font-black text-gray-900 dark:text-white mb-1 group-hover:text-fuchsia-500 transition-colors">Chat with lonely people</h3>
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

            {/* ======================= CHAT MODAL =========================== */}
            {modalState !== 'hidden' && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/90 dark:bg-black/80 backdrop-blur-sm p-4 sm:p-6">
                    
                    {modalState === 'matching' && (
                        <div className="bg-white dark:bg-[#11071c] w-full max-w-sm rounded-2xl border-t-4 border-fuchsia-500 p-8 shadow-2xl flex flex-col items-center justify-center relative">
                            <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
                                <div className="absolute inset-0 border-4 border-fuchsia-500/30 rounded-full animate-ping"></div>
                                <div className="absolute inset-2 border-4 border-cyan-400/50 rounded-full animate-pulse"></div>
                                <div className="w-12 h-12 bg-gradient-to-br from-fuchsia-500 to-cyan-500 rounded-full shadow-[0_0_20px_#d904f9]"></div>
                            </div>
                            <h3 className="text-gray-900 dark:text-white font-bold mb-2">Finding someone to chat with...</h3>
                            <p className="text-xs text-gray-500 animate-pulse">Scanning 180,825 online users</p>
                        </div>
                    )}

                    {modalState === 'chatting' && partner && (
                        <div className="bg-white dark:bg-[#11071c] w-full max-w-md h-full max-h-[600px] rounded-2xl border border-gray-200 dark:border-purple-500/30 shadow-2xl flex flex-col relative overflow-hidden">
                            
                            {/* --- CUSTOM EXIT CONFIRMATION MODAL (OVERLAYS CHAT) --- */}
                            {showExitConfirm && (
                                <div className="absolute inset-0 z-[60] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm transition-opacity">
                                    <div className="bg-[#1a0e29] border border-gray-800 rounded-2xl p-6 w-full text-center shadow-2xl">
                                        <div className="w-12 h-12 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-xl border border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.2)]">⚠️</div>
                                        <h3 className="text-lg font-black text-white mb-2">Exit Chat?</h3>
                                        <p className="text-sm text-gray-400 mb-6 leading-relaxed">Are you sure you want to leave? If you exit now, your messages will <strong className="text-red-400">not be credited</strong> to your task wallet.</p>
                                        <div className="flex gap-3">
                                            <button onClick={() => setShowExitConfirm(false)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-xl font-bold transition text-sm">Cancel</button>
                                            <button onClick={confirmExit} className="flex-1 bg-red-600 hover:bg-red-500 text-white py-3 rounded-xl font-bold transition shadow-[0_0_15px_rgba(220,38,38,0.4)] text-sm">Exit & Lose Reward</button>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            {/* Close 'X' Button */}
                            <button onClick={triggerClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:hover:text-white bg-gray-100 dark:bg-[#1a0e29] w-8 h-8 rounded-full flex items-center justify-center transition z-20">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>

                            {/* Chat Header */}
                            <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#150a21] flex items-center gap-4 relative z-10">
                                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${partner.color} flex items-center justify-center font-black text-white text-xl shadow-lg flex-shrink-0`}>
                                    {partner.name.charAt(0)}
                                </div>
                                <div className="flex-1 pr-8">
                                    <div className="flex justify-between items-center mb-1">
                                        <h3 className="font-bold text-gray-900 dark:text-white leading-none text-sm">{partner.name}</h3>
                                        <div className="flex items-center gap-1 text-[10px] text-gray-500 font-medium">
                                            {partner.flag} {partner.country}
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                            <span className="text-[10px] text-emerald-600 dark:text-emerald-500 font-bold">Online now</span>
                                        </div>
                                        <span className="text-[9px] text-gray-400 tracking-wider">Verified ✓</span>
                                    </div>
                                </div>
                            </div>

                            {/* Progress Bar / Timer */}
                            <div className="bg-gray-200 dark:bg-[#1a0e29] h-1.5 w-full relative">
                                <div className="h-full bg-gradient-to-r from-cyan-400 to-fuchsia-500 transition-all duration-1000 linear" style={{ width: `${(timeLeft / CHAT_DURATION) * 100}%` }}></div>
                            </div>
                            <div className="text-[10px] text-right text-gray-500 py-1.5 px-4 bg-gray-50 dark:bg-[#150a21]">
                                Time remaining: <span className="font-mono text-gray-800 dark:text-gray-300 font-bold">{formatTime(timeLeft)}</span>
                            </div>

                            {/* Messages Area */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-gray-100 dark:bg-[#0d0415]">
                                {messages.map((msg) => (
                                    <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                                        <div className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm ${
                                            msg.sender === 'user' 
                                            ? 'bg-[#d904f9] text-white rounded-br-none' 
                                            : 'bg-white dark:bg-[#1a0e29] border border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-none'
                                        }`}>
                                            {msg.text}
                                        </div>
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

                            {/* Input Area & Submit */}
                            <div className="p-4 bg-white dark:bg-[#11071c] border-t border-gray-200 dark:border-gray-800 relative z-10">
                                <form onSubmit={handleSendMessage} className="flex items-center gap-2 mb-3">
                                    <input 
                                        type="text" 
                                        value={inputText}
                                        onChange={(e) => setInputText(e.target.value)}
                                        placeholder="Type your message..."
                                        disabled={timeLeft <= 0 || isSubmitting || showExitConfirm}
                                        className="flex-1 bg-gray-50 dark:bg-[#1a0e29] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:ring-1 focus:ring-fuchsia-500 focus:border-fuchsia-500 placeholder-gray-400 disabled:opacity-50"
                                    />
                                    <button 
                                        type="submit" 
                                        disabled={!inputText.trim() || timeLeft <= 0 || isSubmitting || showExitConfirm}
                                        className="bg-indigo-600 hover:bg-indigo-500 text-white w-12 h-12 rounded-xl flex items-center justify-center transition disabled:opacity-50 shadow-md flex-shrink-0"
                                    >
                                        <svg className="w-5 h-5 ml-1" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/></svg>
                                    </button>
                                </form>

                                <button 
                                    onClick={handleCompleteTask}
                                    disabled={userMessageCount === 0 || isSubmitting || showExitConfirm}
                                    className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all flex justify-center items-center gap-2 ${
                                        isSubmitting ? 'bg-emerald-600 opacity-70 text-white cursor-wait' :
                                        userMessageCount > 0 
                                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                                        : 'bg-gray-100 dark:bg-[#1a0e29] text-gray-400 dark:text-gray-500 cursor-not-allowed'
                                    }`}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                            Saving Task...
                                        </>
                                    ) : userMessageCount > 0 ? (
                                        `✔️ Claim Ksh ${(userMessageCount * pay_per_message).toFixed(2)}`
                                    ) : (
                                        '🔒 Complete chat to earn reward'
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </LipataskLayout>
    );
}