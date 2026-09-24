import { BarChart3, Shield, Trophy, Users } from 'lucide-react';

const whyChooseUs = [
    {
        icon: Trophy,
        title: 'Metodologi IKM & SLOI Teruji',
        description:
            'Gunakan framework evaluasi yang diakui secara global untuk mengukur dampak sosial program Anda.',
    },
    {
        icon: Shield,
        title: 'Keamanan Data Tersentralisasi',
        description:
            'Kelola data hasil survei dari ratusan enumerator dalam satu platform yang dijamin aman.',
    },
    {
        icon: BarChart3,
        title: 'Dashboard Visualisasi Aktif',
        description:
            'Dapatkan pemahaman langsung dari data evaluasi lapangan dengan grafik dan laporan yang terotomatisasi.',
    },
    {
        icon: Users,
        title: 'Praktis dan Kolaboratif',
        description:
            'Sistem dirancang untuk digunakan mulai dari manager yang butuh laporan hingga para petugas survei lapangan.',
    },
];

export default function WhyChooseUsSection() {
    return (
        <div className="relative overflow-hidden bg-white py-24 dark:bg-gray-900 sm:py-32">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
                    {/* Left Side - Image & Title */}
                    <div className="flex flex-col justify-start gap-10 lg:gap-12">
                        <div>
                            <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-lime-500/20 bg-lime-50 px-4 py-1.5 dark:bg-lime-950/30">
                                <svg
                                    className="h-4 w-4 text-lime-600 dark:text-lime-400"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M5 13l4 4L19 7"
                                    />
                                </svg>
                                <span className="text-sm font-semibold text-lime-700 dark:text-lime-300">
                                    Mengapa Memilih Kami?
                                </span>
                            </div>

                            <h2 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
                                Solusi Cerdas untuk{' '}
                                <span className="text-gray-600 dark:text-gray-400">
                                    Evaluasi Dampak Sosial Perusahaan
                                </span>
                            </h2>
                        </div>

                        <div className="relative flex items-center justify-center">
                            {/* Decorative elements */}
                            <div className="absolute -bottom-4 -left-4 h-24 w-24 rounded-full bg-gradient-to-br from-lime-400 to-green-500 opacity-40 blur-2xl" />
                            <div className="absolute -right-4 -top-4 h-32 w-32 rounded-full bg-gradient-to-br from-lime-300 to-green-400 opacity-30 blur-3xl" />

                            <div className="relative z-10 aspect-video w-full max-w-lg overflow-hidden rounded-3xl shadow-2xl">
                                <iframe
                                    className="pointer-events-none absolute inset-0 h-full w-full"
                                    src="https://www.youtube.com/embed/Ha4ik5XtQvA?autoplay=1&mute=1&loop=1&playlist=Ha4ik5XtQvA&controls=0&showinfo=0&rel=0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    title="YouTube video player"
                                ></iframe>
                            </div>
                        </div>
                    </div>

                    {/* Right Side - Content */}
                    <div className="flex flex-col justify-center">
                        <div className="space-y-4">
                            {whyChooseUs.map((item, index) => {
                                const Icon = item.icon;
                                return (
                                    <div
                                        key={index}
                                        className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 p-6 transition-all duration-300 hover:border-lime-500/30 hover:bg-white hover:shadow-lg dark:border-gray-800 dark:bg-gray-900/50 dark:hover:bg-gray-900"
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-lime-400 to-green-500 shadow-lg transition-transform duration-300 group-hover:scale-110">
                                                <Icon className="h-6 w-6 text-white" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="mb-1 text-lg font-semibold text-gray-900 dark:text-white">
                                                    {item.title}
                                                </h3>
                                                <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                                                    {item.description}
                                                </p>
                                            </div>
                                        </div>
                                        {/* Subtle gradient overlay on hover */}
                                        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-lime-50/0 via-lime-50/0 to-green-50/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:from-lime-950/0 dark:via-lime-950/0 dark:to-green-950/0" />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
