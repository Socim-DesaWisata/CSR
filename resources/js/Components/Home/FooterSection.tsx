import { Button } from '@/Components/ui/button';
import { Link } from '@inertiajs/react';
import {
    ArrowUpRight,
    Database,
    Instagram,
    Leaf,
    Linkedin,
    Mail,
    MapPin,
    Phone,
    TrendingUp,
    Users,
    Youtube,
} from 'lucide-react';

export default function FooterSection() {
    return (
        <footer className="relative overflow-hidden border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
            {/* Subtle background gradient */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-green-50/60 via-transparent to-emerald-50/40 dark:from-green-950/20 dark:to-emerald-950/10" />

            <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
                {/* Main Footer Content */}
                <div className="py-16 lg:py-20">
                    <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">
                        {/* Brand Column */}
                        <div className="lg:col-span-1">
                            <div className="flex items-center gap-2.5">
                                <img
                                    src="/img/LogoHeader.svg"
                                    alt="Impact Report Manajemen Apps"
                                    className="h-12 w-auto"
                                />
                            </div>
                            <p className="mt-4 text-sm leading-6 text-gray-500 dark:text-gray-400">
                                Platform evaluasi program CSR terdepan di
                                Indonesia. Ukur, kelola, dan tingkatkan dampak
                                sosial perusahaan Anda.
                            </p>
                            {/* Social Links */}
                            <div className="mt-6 flex items-center gap-3">
                                {[
                                    {
                                        icon: Linkedin,
                                        label: 'LinkedIn',
                                        href: 'https://www.linkedin.com/company/78847969/admin/dashboard/',
                                    },
                                    {
                                        icon: Instagram,
                                        label: 'Instagram',
                                        href: 'https://www.instagram.com/socialimpact_id/',
                                    },
                                    {
                                        icon: Youtube,
                                        label: 'YouTube',
                                        href: 'https://www.youtube.com/@CreativeImpactSocial/videos',
                                    },
                                ].map(({ icon: Icon, label, href }) => (
                                    <a
                                        key={label}
                                        href={href}
                                        aria-label={label}
                                        className="flex size-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 shadow-sm transition-all duration-200 hover:border-green-300 hover:bg-green-50 hover:text-green-600 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:border-green-600 dark:hover:bg-green-950 dark:hover:text-green-400"
                                    >
                                        <Icon className="size-4" />
                                    </a>
                                ))}
                            </div>
                        </div>

                        {/* Fitur Column */}
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                                Fitur
                            </h3>
                            <ul className="mt-4 space-y-3">
                                {[
                                    { label: 'Survey IKM', icon: Users },
                                    { label: 'SLOI', icon: TrendingUp },
                                    { label: 'Manajemen Data', icon: Database },
                                ].map(({ label, icon: Icon }) => (
                                    <li key={label}>
                                        <a
                                            href="#"
                                            className="group flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400"
                                        >
                                            <Icon className="size-3.5 text-gray-400 transition-colors group-hover:text-green-500" />
                                            {label}
                                            <ArrowUpRight className="size-3 opacity-0 transition-all group-hover:opacity-100" />
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Perusahaan Column */}
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                                Perusahaan
                            </h3>
                            <ul className="mt-4 space-y-3">
                                {[
                                    'Tentang Kami',
                                    'Blog',
                                    'Karir',
                                    'Mitra',
                                    'Syarat & Ketentuan',
                                    'Kebijakan Privasi',
                                ].map((item) => (
                                    <li key={item}>
                                        <a
                                            href="#"
                                            className="group flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400"
                                        >
                                            {item}
                                            <ArrowUpRight className="size-3 opacity-0 transition-all group-hover:opacity-100" />
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Kontak Column */}
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                                Hubungi Kami
                            </h3>
                            <ul className="mt-4 space-y-3">
                                <li>
                                    <a
                                        href="mailto:info@socialimpact.id"
                                        className="flex items-start gap-2.5 text-sm text-gray-500 transition-colors hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400"
                                    >
                                        <Mail className="mt-0.5 size-4 shrink-0 text-green-500" />
                                        info@socialimpact.id
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="tel:+62811106066"
                                        className="flex items-start gap-2.5 text-sm text-gray-500 transition-colors hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400"
                                    >
                                        <Phone className="mt-0.5 size-4 shrink-0 text-green-500" />
                                        +62 811 106 066
                                    </a>
                                </li>
                                <li className="flex items-start gap-2.5 text-sm text-gray-500 dark:text-gray-400">
                                    <MapPin className="mt-0.5 size-4 shrink-0 text-green-500" />
                                    <span>
                                        Jl. Raya Panggung No.66a, Jatibening,
                                        <br /> Kec. Pd. Gede, Kota Bks, Jawa
                                        Barat 17412
                                    </span>
                                </li>
                            </ul>

                            {/* CTA mini */}
                            <div className="mt-6">
                                <Link href={route('register')}>
                                    <Button
                                        size="sm"
                                        className="gap-1.5 rounded-full bg-green-600 text-white shadow-md shadow-green-500/20 hover:bg-green-700"
                                    >
                                        Mulai Gratis
                                        <ArrowUpRight className="size-3.5" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-200 to-transparent dark:via-gray-700" />

                {/* Bottom Bar */}
                <div className="flex flex-col items-center justify-between gap-4 py-6 sm:flex-row">
                    <div className="flex items-center gap-2">
                        <div className="flex size-5 items-center justify-center rounded bg-green-600">
                            <Leaf className="size-3 text-white" />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            &copy; {new Date().getFullYear()}{' '}
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                                SocialImpact.id
                            </span>
                            . Hak cipta dilindungi undang-undang.
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
