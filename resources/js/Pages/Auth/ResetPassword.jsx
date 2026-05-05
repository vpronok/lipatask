import { Head, useForm } from '@inertiajs/react';

export default function ResetPassword({ token, email }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        token: token, email: email, password: '', password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('password.store'), { onFinish: () => reset('password', 'password_confirmation') });
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center p-4 font-sans selection:bg-fuchsia-500 bg-[#0a0214]">
            <Head title="Reset Password | Chatwazungu" />
            <div className="relative z-10 w-full max-w-[420px] bg-[#1a1125] border border-white/5 rounded-2xl p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                
                <h1 className="text-white font-black text-2xl tracking-wide uppercase text-center mb-6">Create New Password</h1>

                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-300 mb-1.5">Email</label>
                        <input type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} className="w-full bg-[#231732] border border-gray-700/50 rounded-xl px-4 py-3 text-white focus:border-fuchsia-500" required readOnly />
                        <p className="text-red-500 text-xs mt-1 empty:hidden">{errors.email}</p>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-300 mb-1.5">New Password</label>
                        <input type="password" value={data.password} onChange={(e) => setData('password', e.target.value)} className="w-full bg-[#231732] border border-gray-700/50 rounded-xl px-4 py-3 text-white focus:border-fuchsia-500" required autoFocus />
                        <p className="text-red-500 text-xs mt-1 empty:hidden">{errors.password}</p>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-300 mb-1.5">Confirm Password</label>
                        <input type="password" value={data.password_confirmation} onChange={(e) => setData('password_confirmation', e.target.value)} className="w-full bg-[#231732] border border-gray-700/50 rounded-xl px-4 py-3 text-white focus:border-fuchsia-500" required />
                        <p className="text-red-500 text-xs mt-1 empty:hidden">{errors.password_confirmation}</p>
                    </div>

                    <button type="submit" disabled={processing} className={`w-full mt-4 bg-[#d904f9] hover:bg-[#c204df] text-white font-bold py-3.5 rounded-xl shadow-[0_0_15px_rgba(217,4,249,0.4)] ${processing && 'opacity-50'}`}>
                        Reset Password
                    </button>
                </form>
            </div>
        </div>
    );
}