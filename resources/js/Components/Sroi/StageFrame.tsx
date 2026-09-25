import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { FormEvent, ReactNode } from 'react';
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
    documents,
    exports,
    canEdit,
    children,
    showExport = true,
}: {
    program: Program;
    stage: string;
    title: string;
    documents: Document[];
    exports: Export[];
    canEdit: boolean;
    children?: ReactNode;
    showExport?: boolean;
}) {
    const { errors } = usePage().props as unknown as {
        errors: Record<string, string>;
    };
    const pending = ['calculation', 'report'].includes(stage);
    const fileForm = useForm<{ document: File | null }>({ document: null });
    const upload = (event: FormEvent) => {
        event.preventDefault();
        fileForm.post(route('sroi.documents.store', [program.id, stage]), {
            forceFormData: true,
            onSuccess: () => fileForm.reset(),
        });
    };
    return (
        <AppLayout breadcrumb={{ parent: program.name, current: title }}>
            <Head title={`${title} · ${program.name}`} />
            <div className="mx-auto max-w-6xl space-y-6 p-5 md:p-8">
                <div>
                    <Link
                        href={route('sroi.programs.index')}
                        className="text-sm font-semibold text-primary hover:underline"
                    >
                        Kembali ke Program List
                    </Link>
                    <h1 className="mt-3 text-2xl font-bold">{title}</h1>
                    <p className="text-sm text-slate-600">
                        {program.name} · {program.start_year}–{program.end_year}
                    </p>
                </div>
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
                {showExport && stage !== 'calculation' && (
                    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
                        <h2 className="text-lg font-bold">
                            {stage === 'report'
                                ? 'Laporan Naratif'
                                : 'Ekspor Data Tahap'}
                        </h2>
                        <p className="text-sm text-slate-600">
                            {stage === 'report'
                                ? 'DOCX naratif tanpa rasio SROI.'
                                : 'XLSX berisi input tahap ini tanpa hasil perhitungan.'}
                        </p>
                        <button
                            type="button"
                            onClick={() =>
                                router.post(
                                    route('sroi.exports.store', [
                                        program.id,
                                        stage === 'report'
                                            ? 'narrative'
                                            : stage,
                                    ]),
                                )
                            }
                            className="rounded-lg bg-primary px-4 py-2 font-semibold text-white focus-visible:ring-2"
                        >
                            {stage === 'report'
                                ? 'Buat Laporan DOCX'
                                : 'Ekspor XLSX'}
                        </button>
                        {errors.export && (
                            <p role="alert" className="text-sm text-red-600">
                                {errors.export}
                            </p>
                        )}
                        {exports.length > 0 && (
                            <ul className="space-y-2 text-sm">
                                {exports.map((item) => (
                                    <li
                                        key={item.id}
                                        className="flex flex-wrap items-center gap-3 border-t pt-2"
                                    >
                                        <span>
                                            {item.format.toUpperCase()} ·{' '}
                                            {item.status}
                                        </span>
                                        {item.status === 'ready' && (
                                            <a
                                                href={route(
                                                    'sroi.exports.download',
                                                    [program.id, item.id],
                                                )}
                                                className="font-semibold text-primary underline"
                                            >
                                                Unduh
                                            </a>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                )}
                {!pending && (
                    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
                        <h2 className="text-lg font-bold">Dokumen Pendukung</h2>
                        {canEdit && (
                            <form
                                onSubmit={upload}
                                className="flex flex-wrap items-center gap-3"
                            >
                                <input
                                    type="file"
                                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                                    onChange={(event) =>
                                        fileForm.setData(
                                            'document',
                                            event.target.files?.[0] ?? null,
                                        )
                                    }
                                    aria-label="Pilih dokumen pendukung"
                                    required
                                    className="text-sm"
                                />
                                <button
                                    disabled={fileForm.processing}
                                    className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                                >
                                    Unggah
                                </button>
                            </form>
                        )}
                        {fileForm.errors.document && (
                            <p role="alert" className="text-sm text-red-600">
                                {fileForm.errors.document}
                            </p>
                        )}
                        {documents.length > 0 && (
                            <ul className="space-y-2 text-sm">
                                {documents.map((document) => (
                                    <li key={document.id}>
                                        <a
                                            href={route(
                                                'sroi.documents.download',
                                                [program.id, document.id],
                                            )}
                                            className="text-primary underline"
                                        >
                                            {document.file_name}
                                        </a>{' '}
                                        <span className="text-slate-500">
                                            (
                                            {Math.ceil(
                                                document.size_bytes / 1024,
                                            )}{' '}
                                            KB)
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                )}
            </div>
        </AppLayout>
    );
}
