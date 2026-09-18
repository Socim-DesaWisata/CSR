import { ArrowUpRight, X } from 'lucide-react';
import { useRef, useState } from 'react';

interface Feature {
    title: string;
    description: string;
    detailedDescription?: string;
    tags?: string[];
    image: string;
    href: string;
    featured?: boolean;
    comingSoon?: boolean;
}

const features: Feature[] = [
    {
        title: 'IKM Survey',
        description:
            'Ukur kepuasan masyarakat terhadap program Keberlanjutan secara real-time dan komprehensif.',
        detailedDescription:
            'Platform IKM (Indeks Kepuasan Masyarakat) kami memungkinkan Anda untuk mengukur dan menganalisis tingkat kepuasan masyarakat terhadap program keberlanjutan perusahaan secara menyeluruh. Dengan metodologi yang terstandarisasi dan antarmuka yang user-friendly, Anda dapat mengumpulkan feedback real-time dari stakeholder, mengidentifikasi area perbaikan, dan membuat keputusan berbasis data untuk meningkatkan dampak sosial program Anda.',
        tags: ['Kepuasan Masyarakat', 'Keberlanjutan Survey'],
        image: '/img/hom3.webp',
        href: '#features-section',
        featured: true,
    },
    {
        title: 'Indeks SLOI',
        description:
            'Pantau tingkat penerimaan masyarakat terhadap operasional perusahaan Anda.',
        detailedDescription:
            'SLOI (Social License to Operate Index) adalah alat penting untuk memantau dan mengukur tingkat penerimaan masyarakat terhadap kehadiran dan operasional perusahaan Anda. Sistem ini membantu mengidentifikasi potensi konflik, mengukur persepsi publik, dan memastikan operasional perusahaan berjalan harmonis dengan masyarakat sekitar. Dashboard interaktif memberikan insight mendalam tentang dinamika hubungan perusahaan dengan komunitas lokal.',
        image: '/img/hom2.webp',
        href: '#features-section',
    },
    {
        title: 'Analisis SROI',
        description:
            'Evaluasi dampak sosial dan lingkungan dengan metodologi Social Return on Investment (Coming Soon).',
        detailedDescription:
            'SROI (Social Return on Investment) adalah metodologi canggih untuk mengukur nilai sosial, lingkungan, dan ekonomi yang dihasilkan dari investasi program keberlanjutan Anda. Fitur ini akan segera hadir untuk membantu Anda menghitung ROI sosial, mengidentifikasi dampak yang paling signifikan, dan mengkomunikasikan nilai program CSR Anda dalam bahasa yang dipahami oleh stakeholder bisnis.',
        image: '/img/hom-new.webp',
        href: '#features-section',
        comingSoon: true,
    },
];

function FeatureCard({
    feature,
    onExpand,
}: {
    feature: Feature;
    onExpand: () => void;
}) {
    return (
        <div
            className={`feature-card group relative h-[480px] w-72 flex-shrink-0 overflow-hidden rounded-[2rem] transition-all duration-300 sm:h-[520px] sm:w-80 lg:h-[560px] lg:w-[320px] xl:h-[600px] xl:w-[400px] ${
                feature.comingSoon ? 'opacity-60' : ''
            }`}
        >
            {/* Background Image */}
            <img
                src={feature.image}
                alt={feature.title}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out will-change-transform group-hover:scale-105"
            />

            {/* Gradient overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/10" />
            <div
                className="absolute inset-0"
                style={{
                    background:
                        'linear-gradient(180deg, rgba(0,0,0,0.15) 0%, transparent 35%, rgba(0,0,0,0.7) 70%, rgba(0,0,0,0.9) 100%)',
                }}
            />

            {/* Coming Soon Badge - Center */}
            {feature.comingSoon && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="rounded-3xl border-2 border-white bg-white/95 px-4 py-1 shadow-xl backdrop-blur-sm">
                        <span className="text-sm font-bold uppercase tracking-widest text-gray-900">
                            Coming Soon
                        </span>
                    </div>
                </div>
            )}

            {/* Top bar */}
            <div className="absolute left-4 right-4 top-4 flex items-start justify-between">
                {/* Tags — only shown on featured card */}
                {feature.tags && (
                    <div className="flex flex-col gap-2">
                        {feature.tags.map((tag) => (
                            <span
                                key={tag}
                                className="inline-flex items-center gap-1.5 rounded-full border border-white/60 bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm"
                            >
                                <span className="size-1.5 rounded-full bg-yellow-400" />
                                {tag}
                            </span>
                        ))}
                    </div>
                )}

                {/* Arrow button */}
                <button
                    onClick={onExpand}
                    className="ml-auto flex size-10 flex-shrink-0 items-center justify-center rounded-full border border-white/70 bg-white/90 text-gray-900 shadow-md transition-all duration-300 hover:bg-white hover:shadow-lg group-hover:rotate-12"
                >
                    <ArrowUpRight className="size-4" strokeWidth={2.5} />
                </button>
            </div>

            {/* Bottom content */}
            <div className="absolute bottom-0 left-0 right-0 p-5">
                <h3
                    className="mb-2 font-serif text-3xl font-bold leading-tight text-white"
                    style={{ textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}
                >
                    {feature.title.split(' ').map((word, i) => (
                        <span key={i} className="block">
                            {word}
                        </span>
                    ))}
                </h3>
                <p className="text-md mb-4 leading-relaxed text-white/80">
                    {feature.description}
                </p>

                {/* CTA Button */}
                <button
                    onClick={onExpand}
                    disabled={feature.comingSoon}
                    className="group/btn flex w-max items-center gap-3 rounded-2xl bg-white/95 px-5 py-3 backdrop-blur-sm transition-all duration-300 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-900">
                        Jelajahi Fitur
                    </span>
                    <svg
                        className="size-4 text-gray-900 transition-transform duration-300 group-hover/btn:translate-x-0.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 5l7 7-7 7"
                        />
                    </svg>
                </button>
            </div>
        </div>
    );
}

export default function FeaturesSection() {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [expandedFeature, setExpandedFeature] = useState<Feature | null>(
        null,
    );

    return (
        <section
            id="features-section"
            className="relative overflow-hidden bg-[#f7f7f5] py-20 sm:py-28"
        >
            {/* Section header */}
            <div className="mx-auto mb-12 max-w-7xl px-6 lg:px-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <span className="mb-3 inline-block rounded-full bg-green-100 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-green-700">
                            Fitur Utama
                        </span>
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                            Solusi Lengkap
                            <br />
                            <span className="text-green-600">
                                Evaluasi Keberlanjutan
                            </span>
                        </h2>
                    </div>
                    <p className="max-w-xs text-lg leading-relaxed text-gray-500 sm:text-right">
                        Semua alat yang Anda butuhkan untuk mengukur dan
                        melaporkan dampak sosial perusahaan.
                    </p>
                </div>
            </div>

            {/* Cards horizontal scroll */}
            <div
                ref={scrollRef}
                className="flex gap-4 overflow-x-auto px-6 pb-4 lg:justify-center lg:px-8"
                style={{
                    scrollSnapType: 'x mandatory',
                    msOverflowStyle: 'none',
                    scrollbarWidth: 'none',
                }}
            >
                {features.map((feature) => (
                    <div
                        key={feature.title}
                        style={{ scrollSnapAlign: 'start' }}
                    >
                        <FeatureCard
                            feature={feature}
                            onExpand={() =>
                                !feature.comingSoon &&
                                setExpandedFeature(feature)
                            }
                        />
                    </div>
                ))}
            </div>

            {/* Expanded Feature Modal */}
            {expandedFeature && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
                    onClick={() => setExpandedFeature(null)}
                >
                    <div
                        className="relative flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl md:flex-row"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close button */}
                        <button
                            onClick={() => setExpandedFeature(null)}
                            className="absolute right-4 top-4 z-10 flex size-10 items-center justify-center rounded-full bg-gray-100 text-gray-900 transition-all hover:bg-gray-200 md:bg-black/10 md:text-white md:backdrop-blur-sm md:hover:bg-black/20"
                        >
                            <X className="size-5" />
                        </button>

                        {/* Image Section */}
                        <div className="relative hidden w-2/5 flex-shrink-0 md:block">
                            <img
                                src={expandedFeature.image}
                                alt={expandedFeature.title}
                                className="h-full w-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20" />
                        </div>

                        {/* Content Section */}
                        <div className="flex-1 overflow-y-auto p-8 md:p-12">
                            {expandedFeature.tags && (
                                <div className="mb-4 flex flex-wrap gap-2">
                                    {expandedFeature.tags.map((tag) => (
                                        <span
                                            key={tag}
                                            className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold text-green-700"
                                        >
                                            <span className="size-1.5 rounded-full bg-green-500" />
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}

                            <h2 className="mb-4 font-serif text-4xl font-bold text-gray-900">
                                {expandedFeature.title}
                            </h2>

                            <p className="mb-6 text-lg font-medium text-gray-700">
                                {expandedFeature.description}
                            </p>

                            <div className="prose prose-slate max-w-none">
                                <p className="leading-relaxed text-gray-600">
                                    {expandedFeature.detailedDescription}
                                </p>
                            </div>

                            {/* Mobile Image */}
                            <div className="mt-6 md:hidden">
                                <img
                                    src={expandedFeature.image}
                                    alt={expandedFeature.title}
                                    className="w-full rounded-2xl object-cover"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Scrollbar hide for webkit */}
            <style>{`
                #features-section [style*="scroll-snap-type"]::-webkit-scrollbar {
                    display: none;
                }
                .feature-card {
                    will-change: transform;
                }
            `}</style>
        </section>
    );
}
