import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Head, useForm } from '@inertiajs/react';
import { Eye, EyeOff } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

export default function LoginEnum({ status }: { status?: string }) {
    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: true as boolean,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login.enum'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <div
            className="relative flex min-h-screen w-full items-center justify-center bg-cover bg-center bg-no-repeat p-4"
            style={{ backgroundImage: 'url("/img/bg-team.jpeg")' }}
        >
            {/* Dark overlay to make text readable */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"></div>

            <Head title="Enumerator Login" />

            <div className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-white/20 bg-white/10 p-8 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] backdrop-blur-xl transition-all duration-300">
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-lg">
                        <img
                            src="/img/LogoTab.png"
                            alt="SocialImpact Logo"
                            className="h-10 w-10 object-contain"
                        />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-md">
                        Impact Report Management
                    </h1>
                    <p className="mt-2 text-sm font-medium text-green-100">
                        Enumerator Mobile Access
                    </p>
                </div>

                {status && (
                    <div className="mb-6 rounded-xl border border-green-400/50 bg-green-500/30 px-4 py-3 text-sm font-medium text-white backdrop-blur-md">
                        {status}
                    </div>
                )}

                <form onSubmit={submit} className="space-y-5">
                    <div className="group relative space-y-2">
                        <Label
                            htmlFor="email"
                            className="ml-1 text-sm font-medium text-green-50 drop-shadow-sm transition-colors group-focus-within:text-white"
                        >
                            Email
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            name="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder="nama@email.com"
                            autoComplete="email"
                            autoFocus
                            className="h-12 rounded-xl border-white/20 bg-white/10 text-white transition-all duration-300 placeholder:text-white/50 focus:border-white/50 focus:bg-white/20 focus:outline-none focus:ring-0"
                        />
                        {errors.email && (
                            <p className="ml-1 mt-1 inline-block rounded-md bg-red-900/40 px-2 py-1 text-sm font-medium text-red-300 backdrop-blur-md">
                                {errors.email}
                            </p>
                        )}
                    </div>

                    <div className="group relative space-y-2">
                        <Label
                            htmlFor="password"
                            className="ml-1 text-sm font-medium text-green-50 drop-shadow-sm transition-colors group-focus-within:text-white"
                        >
                            Password
                        </Label>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                value={data.password}
                                onChange={(e) =>
                                    setData('password', e.target.value)
                                }
                                autoComplete="current-password"
                                placeholder="••••••••"
                                className="h-12 rounded-xl border-white/20 bg-white/10 pr-12 text-white transition-all duration-300 placeholder:text-white/50 focus:border-white/50 focus:bg-white/20 focus:outline-none focus:ring-0"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((v) => !v)}
                                className="absolute inset-y-0 right-0 flex h-full w-12 items-center justify-center text-white/70 outline-none transition-colors hover:text-white"
                                tabIndex={-1}
                            >
                                {showPassword ? (
                                    <EyeOff className="h-5 w-5" />
                                ) : (
                                    <Eye className="h-5 w-5" />
                                )}
                            </button>
                        </div>
                        {errors.password && (
                            <p className="ml-1 mt-1 inline-block rounded-md bg-red-900/40 px-2 py-1 text-sm font-medium text-red-300 backdrop-blur-md">
                                {errors.password}
                            </p>
                        )}
                    </div>

                    <Button
                        type="submit"
                        disabled={processing}
                        className="mt-8 h-12 w-full rounded-xl border border-green-500/50 bg-green-600 text-lg font-bold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:bg-green-500 hover:shadow-xl active:scale-95"
                    >
                        {processing ? 'Memproses...' : 'Masuk'}
                    </Button>
                </form>
            </div>

            <div className="pointer-events-none fixed bottom-6 z-10 w-full text-center">
                <p className="text-xs font-medium uppercase tracking-wider text-white/80 drop-shadow-md">
                    CSR Management System
                </p>
            </div>
        </div>
    );
}
