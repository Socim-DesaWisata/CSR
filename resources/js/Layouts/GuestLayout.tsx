import { PropsWithChildren } from 'react';

export default function Guest({ children }: PropsWithChildren) {
    return (
        <div className="flex h-screen w-full overflow-hidden font-sans">
            <div className="relative hidden w-[58%] flex-shrink-0 bg-slate-900 lg:flex lg:flex-col">
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 h-full w-full object-cover"
                >
                    <source src="/img/animation.webm" type="video/webm" />
                </video>
                {/* Dark overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-slate-900/30 to-slate-900/80" />

                {/* Top bar: Logo + Back to Website */}
                <div className="relative z-10 flex items-center justify-between px-10 py-8">
                    {/* Logo */}
                    <img
                        src="/img/LogoHeader.svg"
                        alt="Logo"
                        className="h-10 w-auto rounded-lg bg-white object-contain p-2"
                    />

                    {/* Back to Website */}
                    <a
                        href="/"
                        className="flex items-center gap-1.5 text-sm font-medium text-white/80 transition-colors hover:text-white"
                    >
                        <svg
                            viewBox="0 0 24 24"
                            className="size-4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                        Back to Home
                    </a>
                </div>

                {/* Bottom content: Big tagline */}
                <div className="relative z-10 mt-auto px-10 pb-14">
                    <h1 className="text-4xl font-extrabold leading-[1.15] tracking-tight text-white lg:text-5xl">
                        Ukur Dampak Program.
                        <br />
                        Laporkan Lebih Cepat.
                        <br />
                        Kelola Di Mana Saja.
                    </h1>
                    <p className="mt-5 max-w-md text-base leading-relaxed text-white/60">
                        Platform evaluasi keberlanjutan terpadu untuk pelaporan
                        IKM dan SLOI perusahaan Anda secara profesional.
                    </p>
                    {/* Decorative dash */}
                    <div className="mt-8 h-0.5 w-8 rounded-full bg-white/60" />
                </div>
            </div>

            {/* Right side: White form panel */}
            <div className="flex flex-1 flex-col overflow-y-auto bg-white">
                <div className="flex flex-1 items-center justify-center px-10 py-12">
                    <div className="w-full max-w-[400px]">{children}</div>
                </div>
            </div>
        </div>
    );
}
