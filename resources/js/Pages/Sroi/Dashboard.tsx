import AppLayout from '@/Layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';

type Program = {
    id: number;
    name: string;
    status: string;
    start_year: number;
    end_year: number;
};

export default function Dashboard({
    total,
    active,
    draft,
    recent,
}: {
    total: number;
    active: number;
    draft: number;
    recent: Program[];
}) {
    return (
        <AppLayout breadcrumb={{ parent: 'SROI', current: 'Dashboard' }}>
            <Head title="Dashboard SROI" />
            <div className="mx-auto max-w-6xl space-y-7 p-5 md:p-8">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold">Dashboard SROI</h1>
                        <p className="mt-1 text-sm text-slate-600">
                            Program penilaian mandiri, terpisah dari IKM dan
                            SLOI.
                        </p>
                    </div>
                    <Link
                        href={route('sroi.programs.index')}
                        className="rounded-lg bg-primary px-4 py-2 font-semibold text-white"
                    >
                        Buka Program List
                    </Link>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                    {[
                        ['Total Program', total],
                        ['Aktif', active],
                        ['Draft', draft],
                    ].map(([label, value]) => (
                        <div
                            key={label}
                            className="rounded-xl border border-slate-200 bg-white p-5"
                        >
                            <p className="text-sm font-medium text-slate-600">
                                {label}
                            </p>
                            <p className="mt-3 text-3xl font-bold text-primary">
                                {value}
                            </p>
                        </div>
                    ))}
                </div>
                <section className="rounded-xl border border-slate-200 bg-white p-5">
                    <h2 className="text-lg font-bold">Program Terbaru</h2>
                    {recent.length ? (
                        <ul className="mt-3 divide-y divide-slate-100">
                            {recent.map((program) => (
                                <li
                                    key={program.id}
                                    className="flex flex-wrap items-center justify-between gap-2 py-3"
                                >
                                    <div>
                                        <p className="font-semibold">
                                            {program.name}
                                        </p>
                                        <p className="text-sm text-slate-600">
                                            {program.start_year}–
                                            {program.end_year} ·{' '}
                                            {program.status}
                                        </p>
                                    </div>
                                    <Link
                                        href={route('sroi.programs.stage', [
                                            program.id,
                                            'description',
                                        ])}
                                        className="text-sm font-semibold text-primary hover:underline"
                                    >
                                        Buka tahap
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="mt-3 text-sm text-slate-600">
                            Belum ada program. Mulai dari Program List.
                        </p>
                    )}
                </section>
                <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                    Perhitungan rasio SROI menunggu pengesahan metode. Dashboard
                    tidak menampilkan angka hasil sementara.
                </p>
            </div>
        </AppLayout>
    );
}
