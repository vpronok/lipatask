import { Head, useForm, Link } from '@inertiajs/react';

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({ email: '' });

    const submit = (e) => { e.preventDefault(); post(route('password.email')); };

    return (
        <div className="min-h-screen relative flex items-center justify-center p-4 font-sans selection:bg-fuchsia-500 bg-[#0a0214]">
            <Head title="Forgot Password | Chatwazungu" />
            <div className="relative z-10 w-full max-w-[420px] bg-[#1a1125] border border-white/5 rounded-2xl p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                
                <div className="text-center mb-6">
                    <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-500 mx-auto flex items-center justify-center text-3xl mb-4">🔐</div>
                    <h1 className="text-white font-black text-2xl tracking-wide uppercase">Reset Password</h1>
                    <p className="text-gray-400 text-sm mt-2">Forgot your password? No problem. Just let us know your email address and we will email you a password reset link.</p>
                </div>

                {status && <div className="mb-6 font-medium text-sm text-emerald-400 bg-emerald-500/10 p-3 rounded text-center">{status}</div>}

                <form onSubmit={submit} className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-gray-300 mb-1.5">Email Address</label>
                        <input type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} className="w-full bg-[#231732] border border-gray-700/50 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 transition-colors text-sm" placeholder="you@email.com" required autoFocus />
                        <p className="text-red-500 text-xs mt-1 empty:hidden">{errors.email}</p>
                    </div>

                    <button type="submit" disabled={processing} className={`w-full bg-[#d904f9] hover:bg-[#c204df] text-white font-bold py-3.5 rounded-xl transition-colors shadow-[0_0_15px_rgba(217,4,249,0.4)] ${processing && 'opacity-50 cursor-wait'}`}>
                        {processing ? 'Sending...' : 'Email Password Reset Link'}
                    </button>
                    
                    <div className="text-center mt-4 border-t border-gray-800 pt-4">
                        <Link href={route('login')} className="text-xs font-bold text-gray-500 hover:text-white transition">← Back to Login</Link>
                    </div>
                </form>
            </div>
        </div>
    );
}