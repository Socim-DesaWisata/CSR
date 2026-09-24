import { Button } from '@/Components/ui/button';
import { ShimmerButton } from '@/Components/ui/shimmer-button';
import { Link } from '@inertiajs/react';

export default function HeroSection() {
    return (
        <div className="relative flex min-h-[100vh] flex-col items-center justify-center overflow-hidden pt-20">
            {/* Video Background */}
            <video
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 z-0 h-full w-full object-cover"
            >
                <source src="/img/animation.webm" type="video/webm" />
            </video>
            <div className="absolute inset-0 z-0 bg-black/40 backdrop-blur-sm dark:bg-black/60"></div>

            <div className="relative z-10 mt-[-5vh] w-full max-w-7xl px-6 text-center">
                {/* <div className="mb-8 flex justify-center">
                                <div className="z-10 flex items-center justify-center">
                                    <div className="group rounded-full border border-white/20 bg-white/10 text-base text-white shadow-[0_0_15px_rgba(255,255,255,0.1)] backdrop-blur-md transition-all ease-in hover:cursor-pointer hover:bg-white/20">
                                        <AnimatedShinyText className="inline-flex items-center justify-center px-4 py-1.5 text-sm text-white/90 transition ease-out hover:text-white">
                                            ✨ Platform Evaluasi Program CSR #1
                                            di Indonesia
                                        </AnimatedShinyText>
                                    </div>
                                </div>
                            </div> */}

                <h1 className="text-3xl font-extrabold tracking-tight text-white drop-shadow-xl sm:text-6xl">
                    Evaluasi Dampak Program Keberlanjutan{' '}
                    <br className="hidden sm:block" />
                    <span className="bg-gradient-to-r from-green-300 to-emerald-400 bg-clip-text text-transparent drop-shadow-lg">
                        Secara Terukur & Profesional
                    </span>
                </h1>

                {/* <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-200 drop-shadow-md">
                                Tingkatkan efektivitas program CSR Anda dengan
                                platform manajemen evaluasi komprehensif. Hitung
                                IKM dan SLOI dalam satu dashboard
                                canggih.
                            </p> */}

                <div className="mt-10 flex items-center justify-center gap-4">
                    <Link href={route('register')}>
                        <ShimmerButton className="shadow-2xl">
                            <span className="whitespace-pre-wrap text-center text-sm font-medium leading-none tracking-tight text-white dark:from-white dark:to-slate-900/10 lg:text-lg">
                                Coba Gratis Sekarang
                            </span>
                        </ShimmerButton>
                    </Link>
                    <Button
                        onClick={() => {
                            document
                                .getElementById('features-section')
                                ?.scrollIntoView({
                                    behavior: 'smooth',
                                });
                        }}
                        variant="outline"
                        size="lg"
                        className="hidden h-12 rounded-full border-white/30 bg-white px-8 text-black hover:bg-white/10 sm:flex"
                    >
                        Pelajari Fitur
                    </Button>
                </div>
            </div>
        </div>
    );
}
