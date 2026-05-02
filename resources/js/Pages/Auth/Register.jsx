import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';

export default function Register({ referrerName, refCode }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        username: '',
        email: '',
        phone: '',
        password: '',
        terms: false,
        referring_code: refCode, // Sent from Controller
    });

    const [showPassword, setShowPassword] = useState(false);

    const submit = (e) => {
        e.preventDefault();
        post(route('register'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center p-4 font-sans selection:bg-fuchsia-500 selection:text-white">
            <Head title="Create Account | ChatWazungu" />

            {/* --- Starry Gradient Background --- */}
            <div className="fixed inset-0 z-0 bg-[#0a0214] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#240b42] via-[#0a0214] to-[#05010a]">
                <div className="absolute top-[20%] left-[15%] w-1 h-1 bg-white rounded-full shadow-[0_0_10px_2px_#fff] opacity-60"></div>
                <div className="absolute top-[40%] right-[20%] w-1.5 h-1.5 bg-purple-400 rounded-full shadow-[0_0_12px_3px_#a855f7] opacity-40"></div>
                <div className="absolute bottom-[25%] left-[30%] w-1 h-1 bg-yellow-300 rounded-full shadow-[0_0_10px_2px_#fde047] opacity-50"></div>
            </div>

            {/* --- Registration Card --- */}
            <div className="relative z-10 w-full max-w-[420px] bg-[#1a1125] border border-white/5 rounded-2xl p-6 sm:p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 via-purple-500 to-pink-500 p-[2px] shadow-[0_0_15px_rgba(168,85,247,0.4)]">
                        <div className="w-full h-full bg-[#1a1125] rounded-full flex items-center justify-center">
                            <span className="font-black text-xl text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 to-pink-500">L</span>
                        </div>
                    </div>
                    <div>
                        <h1 className="text-white font-black text-lg tracking-wide uppercase">CHATWAZUNGU</h1>
                        <p className="text-gray-400 text-xs">Create account — start earning today</p>
                    </div>
                </div>

                <form onSubmit={submit} className="space-y-4">
                    
                    {/* Invited By Banner */}
                    <div className="bg-[#2c1338] border border-purple-800/50 rounded-md p-2.5 flex items-center gap-2">
                        <div className="bg-purple-500 text-white p-1 rounded">
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/></svg>
                        </div>
                        <p className="text-xs text-purple-200">Invited by <span className="font-bold text-white">{referrerName}</span></p>
                    </div>

                    {/* Username Input */}
                    <div>
                        <label className="block text-xs font-bold text-gray-300 mb-1.5">Username <span className="text-gray-500 font-normal">(display name)</span></label>
                        <input
                            type="text"
                            value={data.username}
                            onChange={(e) => setData('username', e.target.value)}
                            className="w-full bg-[#231732] border border-gray-700/50 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 transition-colors text-sm"
                            placeholder="Your display name"
                            required
                        />
                        <p className="text-red-500 text-[10px] mt-1 empty:hidden">{errors.username}</p>
                    </div>

                    {/* Email Input */}
                    <div>
                        <label className="block text-xs font-bold text-gray-300 mb-1.5">Email</label>
                        <input
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            className="w-full bg-[#231732] border border-gray-700/50 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 transition-colors text-sm"
                            placeholder="you@email.com"
                            required
                        />
                        <p className="text-red-500 text-[10px] mt-1 empty:hidden">{errors.email}</p>
                    </div>

                    {/* Phone Input (Kenyan specific) */}
                    <div>
                        <label className="block text-xs font-bold text-gray-300 mb-1.5">Phone</label>
                        <input
                            type="tel"
                            value={data.phone}
                            onChange={(e) => setData('phone', e.target.value)}
                            className="w-full bg-[#231732] border border-gray-700/50 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 transition-colors text-sm tracking-wide"
                            placeholder="07XXXXXXXX"
                            required
                        />
                        <p className="text-red-500 text-[10px] mt-1 empty:hidden">{errors.phone}</p>
                    </div>

                    {/* Password Input */}
                    <div>
                        <label className="block text-xs font-bold text-gray-300 mb-1.5">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                className="w-full bg-[#231732] border border-gray-700/50 rounded-xl pl-4 pr-12 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 transition-colors text-sm"
                                placeholder="Min. 6 characters"
                                required
                            />
                            {/* Show/Hide Toggle */}
                            <button 
                                type="button" 
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                            >
                                {showPassword ? (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                ) : (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                                )}
                            </button>
                        </div>
                        <p className="text-red-500 text-[10px] mt-1 empty:hidden">{errors.password}</p>
                    </div>

                    {/* Terms Checkbox */}
                    <div className="flex items-center pt-2">
                        <label className="flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={data.terms}
                                onChange={(e) => setData('terms', e.target.checked)}
                                className="w-4 h-4 rounded bg-[#231732] border-gray-600 text-fuchsia-500 focus:ring-fuchsia-500 focus:ring-offset-[#1a1125]"
                                required
                            />
                            <span className="ms-3 text-[11px] text-gray-400">
                                I agree to the <span className="text-yellow-500 font-bold hover:underline">Terms of Service</span> and <span className="text-yellow-500 font-bold hover:underline">No-Refund Policy</span>
                            </span>
                        </label>
                    </div>
                    <p className="text-red-500 text-[10px] empty:hidden">{errors.terms}</p>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={processing}
                        className={`w-full mt-2 bg-[#d904f9] hover:bg-[#c204df] text-white font-bold py-3.5 rounded-xl flex justify-center items-center gap-2 transition-colors shadow-[0_0_15px_rgba(217,4,249,0.4)] ${processing && 'opacity-50 cursor-wait'}`}
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z"/></svg>
                        Create Account
                    </button>

                    {/* Divider & Login Link */}
                    <div className="text-center pt-4 border-t border-gray-800/50 mt-4">
                        <span className="text-xs text-gray-500">Already have an account? </span>
                        <Link href={route('login')} className="text-xs font-bold text-yellow-500 hover:text-yellow-400 transition">
                            Sign in
                        </Link>
                    </div>

                </form>
            </div>

            {/* Footer */}
            <div className="absolute bottom-6 w-full text-center z-10">
                <p className="text-[10px] text-gray-600">© 2026 CHATWAZUNGU. All rights reserved.</p>
            </div>
        </div>
    );
}