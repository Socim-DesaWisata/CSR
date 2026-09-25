import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { ReactNode } from 'react';
import type { Document, Export, Program } from './types';

const stageLinks = [
    ['description', 'General Description'],
    ['theory-of-change', 'Theory of Change'],
    ['lfa', 'LFA'],
    ['roadmap', 'Roadmap'],
    ['scope', 'Program Scope'],
    ['stakeholder', 'Stakeholder Identification'],
    ['outcome', 'Outcome Identification'],
    ['table', 'SROI Table'],
    ['calculation', 'SROI Calculation'],
    ['report', 'SROI Report'],
];

export default function StageFrame({
    program,
    stage,
    title,
    children,
    showHeader = true,
}: {
    program: Program;
    stage: string;
    title: string;
    documents: Document[];
    exports: Export[];
    canEdit: boolean;
    children?: ReactNode;
    showHeader?: boolean;
}) {
    const { errors } = usePage().props as unknown as {
        errors: Record<string, string>;
    };
    const pending = ['calculation', 'report'].includes(stage);
    return (
        <AppLayout breadcrumb={{ parent: program.name, current: title }}>
            <Head title={`${title} · ${program.name}`} />
            <div
                className={`mx-auto ${stage === 'outcome' ? 'max-w-none' : 'max-w-6xl'} space-y-6 p-5 md:p-8`}
            >
                {showHeader && (
                    <div>
                        <Link
                            href={route('sroi.programs.index')}
                            className="text-sm font-semibold text-primary hover:underline"
                        >
                            Kembali ke Program List
                        </Link>
                        <h1 className="mt-3 text-2xl font-bold">{title}</h1>
                        <p className="text-sm text-slate-600">
                            {program.name} · {program.start_year}–
                            {program.end_year}
                        </p>
                    </div>
                )}
                <nav
                    aria-label="Tahap SROI"
                    className="flex gap-2 overflow-x-auto pb-2"
                >
                    {stageLinks.map(([key, label]) => (
                        <Link
                            key={key}
                            href={route('sroi.programs.stage', [
                                program.id,
                                key,
                            ])}
                            className={`whitespace-nowrap rounded-lg border px-3 py-2 text-sm ${key === stage ? 'border-primary bg-primary text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-primary'}`}
                        >
                            {label}
                        </Link>
                    ))}
                </nav>
                {children}
                {pending && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
                        <h2 className="font-bold text-amber-900">
                            Rumus SROI belum disahkan
                        </h2>
                        <p className="mt-2 text-sm text-amber-900">
                            Perhitungan rasio dan laporan berbasis hasil belum
                            tersedia. Data tahap tetap dapat disimpan tanpa
                            menghasilkan angka rekaan.
                        </p>
                    </div>
                )}
                {errors.record && (
                    <p
                        role="alert"
                        className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
                    >
                        {errors.record}
                    </p>
                )}
            </div>
        </AppLayout>
    );
}
