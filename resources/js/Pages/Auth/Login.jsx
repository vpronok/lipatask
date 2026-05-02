import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';

export default function Login({ status }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const [showPassword, setShowPassword] = useState(false);

    const submit = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center p-4 font-sans selection:bg-fuchsia-500 selection:text-white">
            <Head title="Log in | ChatWazungu" />

            {/* --- Custom Starry Gradient Background --- */}
            <div className="fixed inset-0 z-0 bg-[#0a0214] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#240b42] via-[#0a0214] to-[#05010a]">
                {/* CSS Stars/Dust (simulated with absolute glowing dots) */}
                <div className="absolute top-[20%] left-[15%] w-1 h-1 bg-white rounded-full shadow-[0_0_10px_2px_#fff] opacity-60"></div>
                <div className="absolute top-[40%] right-[20%] w-1.5 h-1.5 bg-purple-400 rounded-full shadow-[0_0_12px_3px_#a855f7] opacity-40"></div>
                <div className="absolute bottom-[25%] left-[30%] w-1 h-1 bg-yellow-300 rounded-full shadow-[0_0_10px_2px_#fde047] opacity-50"></div>
                <div className="absolute bottom-[15%] right-[35%] w-1.5 h-1.5 bg-pink-400 rounded-full shadow-[0_0_12px_2px_#ec4899] opacity-30"></div>
            </div>

            {/* --- Login Card --- */}
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
                        <p className="text-gray-400 text-xs">Sign in to your account</p>
                    </div>
                </div>

                {status && <div className="mb-4 font-medium text-sm text-green-400">{status}</div>}

                <form onSubmit={submit} className="space-y-5">
                    
                    {/* Info Banner */}
                    <div className="bg-[#241a24] border border-[#3e2e28] rounded-md p-3 flex items-center gap-2">
                        <svg className="w-4 h-4 text-yellow-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <p className="text-xs text-gray-300">Use your <span className="text-yellow-500 font-bold">username or email</span> to sign in</p>
                    </div>

                    {/* Email / Username Input */}
                    <div>
                        <label className="block text-xs font-bold text-gray-300 mb-1.5">Username or Email</label>
                        <input
                            id="email"
                            type="text"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            className="w-full bg-[#231732] border border-gray-700/50 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 transition-colors text-sm"
                            placeholder="username or you@email.com"
                            autoComplete="username"
                            autoFocus
                        />
                        <p className="text-red-500 text-xs mt-1 empty:hidden">{errors.email}</p>
                    </div>

                    {/* Password Input */}
                    <div>
                        <div className="flex justify-between items-center mb-1.5">
                            <label className="block text-xs font-bold text-gray-300">Password</label>
                            <Link href={route('password.request')} className="text-xs font-bold text-yellow-500 hover:text-yellow-400 transition">
                                Forgot password?
                            </Link>
                        </div>
                        <div className="relative">
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                className="w-full bg-[#231732] border border-gray-700/50 rounded-xl pl-4 pr-12 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 transition-colors text-sm tracking-widest"
                                placeholder="••••••••"
                                autoComplete="current-password"
                            />
                            {/* Show/Hide Password Toggle */}
                            <button 
                                type="button" 
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                            >
                                {showPassword ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                                )}
                            </button>
                        </div>
                        <p className="text-red-500 text-xs mt-1 empty:hidden">{errors.password}</p>
                    </div>

                    {/* Remember Me */}
                    <div className="flex items-center">
                        <label className="flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                name="remember"
                                checked={data.remember}
                                onChange={(e) => setData('remember', e.target.checked)}
                                className="w-4 h-4 rounded bg-[#231732] border-gray-600 text-fuchsia-500 focus:ring-fuchsia-500 focus:ring-offset-[#1a1125]"
                            />
                            <span className="ms-2 text-xs font-semibold text-gray-300">Remember me</span>
                        </label>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={processing}
                        className={`w-full bg-[#d904f9] hover:bg-[#c204df] text-white font-bold py-3.5 rounded-xl flex justify-center items-center gap-2 transition-colors shadow-[0_0_15px_rgba(217,4,249,0.4)] ${processing && 'opacity-50 cursor-wait'}`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
                        Sign In
                    </button>

                    {/* Divider */}
                    <div className="flex items-center gap-3 my-6">
                        <div className="h-[1px] flex-1 bg-gray-700/50"></div>
                        <span className="text-[10px] uppercase text-gray-500 font-bold">or continue with</span>
                        <div className="h-[1px] flex-1 bg-gray-700/50"></div>
                    </div>

                    {/* Social Buttons */}
                    <div className="flex gap-3">
                        <button type="button" className="flex-1 bg-[#231732] border border-gray-700/50 hover:bg-[#2a1d3c] py-2.5 rounded-xl flex justify-center items-center transition">
                            <svg className="w-4 h-4 text-gray-300" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                        </button>
                        <button type="button" className="flex-1 bg-[#231732] border border-gray-700/50 hover:bg-[#2a1d3c] py-2.5 rounded-xl flex justify-center items-center transition">
                             {/* Twitter/X icon */}
                             <svg className="w-4 h-4 text-gray-300" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                        </button>
                        <button type="button" className="flex-1 bg-[#231732] border border-gray-700/50 hover:bg-[#2a1d3c] py-2.5 rounded-xl flex justify-center items-center transition">
                            <svg className="w-4 h-4 text-gray-300" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                        </button>
                    </div>

                    <div className="text-center pt-2">
                        <span className="text-xs text-gray-400">Don't have an account? </span>
                        <Link href={route('register')} className="text-xs font-bold text-yellow-500 hover:text-yellow-400 transition">
                            Sign Up
                        </Link>
                    </div>

                </form>
            </div>

            {/* Copyright Footer */}
            <div className="absolute bottom-6 w-full text-center z-10">
                <p className="text-[10px] text-gray-600">© 2026 CHATWAZUNGU. All rights reserved.</p>
            </div>
        </div>
    );
}