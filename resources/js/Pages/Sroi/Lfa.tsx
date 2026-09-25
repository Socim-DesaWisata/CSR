import StageFrame from '@/Components/Sroi/StageFrame';
import type { Section, StageProps } from '@/Components/Sroi/types';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { router, usePage } from '@inertiajs/react';
import { Plus, Save, Trash2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type Level = 'goal' | 'purpose' | 'output' | 'activity';
type NodeValues = {
    parent_id: number | string | null;
    level: Level;
    code: string | null;
    element: string;
    indicator: string | null;
    verification_source: string | null;
    assumptions: string | null;
};
type Draft = {
    key: string;
    id: number | null;
    values: NodeValues;
    original?: NodeValues;
    deleted: boolean;
};
type Changes = {
    create: Record<string, { values: NodeValues }>;
    update: Record<
        string,
        { id: number; original: NodeValues; values: NodeValues }
    >;
    delete: { id: number; original: NodeValues }[];
};

const levels: Level[] = ['goal', 'purpose', 'output', 'activity'];
const labels: Record<
    Level,
    { title: string; name: string; description: string; add: string }
> = {
    goal: {
        title: 'Tujuan Umum (Goal)',
        name: 'Goal',
        description: 'Mulai dengan gambaran besar sebelum masuk ke rincian.',
        add: 'Tambah baris',
    },
    purpose: {
        title: 'Tujuan Khusus (Purpose)',
        name: 'Purpose',
        description: 'Setiap purpose menjadi dasar untuk keluaran terkait.',
        add: 'Tambah baris',
    },
    output: {
        title: 'Keluaran (Outputs)',
        name: 'Output',
        description:
            'Tambah output melalui modal untuk memastikan keterkaitan Purpose - Output.',
        add: 'Add Output',
    },
    activity: {
        title: 'Aktifitas (Activities)',
        name: 'Activity',
        description: 'Pastikan setiap aktivitas mendukung output yang dipilih.',
        add: 'Add Activity',
    },
};
const nodeFields: (keyof NodeValues)[] = [
    'parent_id',
    'level',
    'code',
    'element',
    'indicator',
    'verification_source',
    'assumptions',
];
const inputClass =
    'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 disabled:bg-slate-50';

function loadRows(sections: Section[]): Record<Level, Draft[]> {
    const nodes =
        sections.find((section) => section.key === 'nodes')?.rows ?? [];
    return Object.fromEntries(
        levels.map((level) => [
            level,
            nodes
                .filter((node) => node.level === level)
                .map((node) => {
                    const values: NodeValues = {
                        parent_id: node.parent_id
                            ? Number(node.parent_id)
                            : null,
                        level,
                        code:
                            node.code === null ? null : String(node.code ?? ''),
                        element: String(node.element ?? ''),
                        indicator:
                            node.indicator === null
                                ? null
                                : String(node.indicator ?? ''),
                        verification_source:
                            node.verification_source === null
                                ? null
                                : String(node.verification_source ?? ''),
                        assumptions:
                            node.assumptions === null
                                ? null
                                : String(node.assumptions ?? ''),
                    };
                    return {
                        key: String(node.id),
                        id: node.id,
                        values,
                        original: { ...values },
                        deleted: false,
                    };
                }),
        ]),
    ) as Record<Level, Draft[]>;
}

function blankRow(
    level: Level,
    key: string,
    parent: number | string | null,
): Draft {
    return {
        key,
        id: null,
        deleted: false,
        values: {
            parent_id: parent,
            level,
            code: null,
            element: '',
            indicator: null,
            verification_source: null,
            assumptions: null,
        },
    };
}

function changed(row: Draft): boolean {
    return (
        row.deleted ||
        row.id === null ||
        nodeFields.some(
            (field) =>
                String(row.values[field] ?? '') !==
                String(row.original?.[field] ?? ''),
        )
    );
}

export default function Lfa(props: StageProps) {
    return <LfaCanvas key={props.program.id} {...props} />;
}

function LfaCanvas({
    program,
    sections,
    documents,
    exports,
    canEdit,
}: StageProps) {
    const [rows, setRows] = useState(() => loadRows(sections));
    const [modal, setModal] = useState<'output' | 'activity' | null>(null);
    const [selectedPurpose, setSelectedPurpose] = useState<number | null>(null);
    const [selectedOutput, setSelectedOutput] = useState<number | null>(null);
    const [modalText, setModalText] = useState('');
    const [modalItems, setModalItems] = useState<string[]>([]);
    const [summaryOpen, setSummaryOpen] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [localError, setLocalError] = useState('');
    const nextKey = useRef(0);
    const allowVisit = useRef(false);
    const { errors } = usePage().props as unknown as {
        errors: Record<string, string>;
    };
    const visible = (level: Level) => rows[level].filter((row) => !row.deleted);
    const savedPurposes = visible('purpose').filter((row) => row.id !== null);
    const savedOutputs = visible('output').filter((row) => row.id !== null);
    const dirty = levels.some((level) => rows[level].some(changed));
    const hasDraftDependents = (level: Level): boolean => {
        const childLevel = levels[levels.indexOf(level) + 1];
        if (!childLevel) return false;
        return rows[level].some(
            (parent) =>
                parent.id === null &&
                !parent.deleted &&
                rows[childLevel].some(
                    (child) =>
                        !child.deleted &&
                        child.values.parent_id === '@draft:' + parent.key,
                ),
        );
    };

    useEffect(() => {
        if (!dirty) return;
        const beforeUnload = (event: BeforeUnloadEvent) => {
            event.preventDefault();
            event.returnValue = '';
        };
        const removeListener = router.on('before', (event) => {
            if (
                !allowVisit.current &&
                !window.confirm(
                    'Perubahan LFA belum disimpan. Tinggalkan halaman?',
                )
            ) {
                event.preventDefault();
            }
        });
        window.addEventListener('beforeunload', beforeUnload);
        return () => {
            removeListener();
            window.removeEventListener('beforeunload', beforeUnload);
        };
    }, [dirty]);

    const addRow = (level: Level, parent: number | string | null) => {
        const key = 'new-' + ++nextKey.current;
        setRows((current) => ({
            ...current,
            [level]: [...current[level], blankRow(level, key, parent)],
        }));
        setLocalError('');
    };

    const editRow = (
        level: Level,
        key: string,
        field: keyof NodeValues,
        value: string | number | null,
    ) => {
        setRows((current) => ({
            ...current,
            [level]: current[level].map((row) =>
                row.key === key
                    ? { ...row, values: { ...row.values, [field]: value } }
                    : row,
            ),
        }));
        setLocalError('');
    };

    const removeRow = (level: Level, row: Draft) => {
        if (
            levels.some((childLevel) =>
                rows[childLevel].some(
                    (child) =>
                        !child.deleted &&
                        child.values.parent_id ===
                            (row.id ?? '@draft:' + row.key),
                ),
            )
        ) {
            setLocalError(
                'Hapus baris yang terkait di langkah berikutnya terlebih dahulu.',
            );
            return;
        }
        setRows((current) => ({
            ...current,
            [level]: current[level]
                .filter((item) => item.key !== row.key || item.id !== null)
                .map((item) =>
                    item.key === row.key ? { ...item, deleted: true } : item,
                ),
        }));
        setLocalError('');
    };

    const addPurpose = () => {
        const goal = visible('goal')[0];
        if (!goal) {
            setLocalError('Tambahkan Goal sebelum Purpose.');
            return;
        }
        addRow('purpose', goal.id ?? '@draft:' + goal.key);
    };

    const openModal = (level: 'output' | 'activity') => {
        setModal(level);
        setSelectedPurpose(
            level === 'output' ? (savedPurposes[0]?.id ?? null) : null,
        );
        setSelectedOutput(null);
        setModalText('');
        setModalItems([]);
        setLocalError('');
    };

    const appendModalItem = () => {
        const text = modalText.trim();
        if (!text) return;
        setModalItems((current) => [...current, text]);
        setModalText('');
    };

    const commitModal = () => {
        const items = [
            ...modalItems,
            ...(modalText.trim() ? [modalText.trim()] : []),
        ];
        const parent = modal === 'output' ? selectedPurpose : selectedOutput;
        if (!modal || !parent || items.length === 0) return;
        items.forEach((item, index) => {
            const key = 'new-' + ++nextKey.current;
            const row = blankRow(modal, key, parent);
            row.values.element = item;
            if (modal === 'activity')
                row.values.code = String(rows.activity.length + index + 1);
            setRows((current) => ({
                ...current,
                [modal]: [...current[modal], row],
            }));
        });
        setModal(null);
    };

    const save = (only?: Level) => {
        const changes: Changes = { create: {}, update: {}, delete: [] };
        for (const level of only ? [only] : levels) {
            for (const row of rows[level]) {
                if (row.id === null) {
                    changes.create[row.key] = { values: row.values };
                } else if (row.deleted) {
                    changes.delete.push({
                        id: row.id,
                        original: row.original!,
                    });
                } else if (changed(row)) {
                    changes.update[String(row.id)] = {
                        id: row.id,
                        original: row.original!,
                        values: row.values,
                    };
                }
            }
        }

        if (
            !Object.keys(changes.create).length &&
            !Object.keys(changes.update).length &&
            !changes.delete.length
        )
            return;
        setProcessing(true);
        setLocalError('');
        allowVisit.current = true;
        router.put(
            route('sroi.stages.batch-save', [program.id, 'lfa']),
            { sections: { nodes: changes } },
            {
                preserveScroll: true,
                onSuccess: (page) => {
                    const savedRows = loadRows(
                        (page.props as unknown as { sections: Section[] })
                            .sections,
                    );
                    setRows((current) =>
                        only
                            ? { ...current, [only]: savedRows[only] }
                            : savedRows,
                    );
                },
                onFinish: () => {
                    allowVisit.current = false;
                    setProcessing(false);
                },
            },
        );
    };

    const exportExcel = () => {
        setExporting(true);
        router.post(
            route('sroi.exports.store', [program.id, 'lfa']),
            {},
            {
                preserveScroll: true,
                onFinish: () => setExporting(false),
            },
        );
    };

    const parentName = (row: Draft): string => {
        const parent = [...rows.goal, ...rows.purpose, ...rows.output].find(
            (item) =>
                item.id === row.values.parent_id ||
                '@draft:' + item.key === row.values.parent_id,
        );
        return parent?.values.element || 'Belum dipilih';
    };

    return (
        <StageFrame
            program={program}
            stage="lfa"
            title="LFA"
            documents={documents}
            exports={exports}
            canEdit={canEdit}
            showHeader={false}
        >
            <div className="space-y-5 text-slate-800">
                <header className="rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-white to-sky-50 px-4 py-4 shadow-sm sm:px-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-800 shadow-sm">
                                Logical Framework{' '}
                                <span aria-hidden="true">›</span> Canvas
                            </span>
                            <h1 className="mt-3 text-sm font-bold text-slate-900">
                                Susun logframe yang terhubung dari Goal sampai
                                Activity
                            </h1>
                            <p className="mt-1 max-w-xl text-xs leading-relaxed">
                                Mulai dengan tujuan umum, lalu turunkan ke
                                tujuan khusus, keluaran, dan aktivitas. Gunakan
                                modal agar relasi Purpose - Output - Activity
                                tersimpan otomatis.
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center justify-end gap-2 text-xs">
                            <span
                                role="status"
                                className={`w-full rounded-full border border-slate-200 bg-white px-3 py-1 text-right text-[11px] font-medium ${dirty ? 'text-amber-700' : 'text-emerald-800'}`}
                            >
                                {dirty
                                    ? '● Perubahan belum disimpan'
                                    : '● Semua tersimpan'}
                            </span>
                            {canEdit && (
                                <button
                                    type="button"
                                    onClick={() => save()}
                                    disabled={!dirty || processing}
                                    className="rounded-md bg-emerald-800 px-3 py-2 font-semibold text-white hover:bg-emerald-900 focus-visible:ring-2 focus-visible:ring-emerald-600 disabled:opacity-50"
                                >
                                    Save semua sekarang
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={exportExcel}
                                disabled={dirty || exporting}
                                className="rounded-md border border-emerald-700 bg-white px-3 py-2 font-medium text-emerald-900 hover:bg-emerald-50 focus-visible:ring-2 focus-visible:ring-emerald-600 disabled:opacity-50"
                            >
                                Export Excel
                            </button>
                        </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                        {levels.map((level, index) => (
                            <a
                                key={level}
                                href={'#lfa-' + level}
                                className="rounded-full bg-emerald-600 px-3 py-1 text-[10px] font-bold text-white hover:bg-emerald-700"
                            >
                                ● &nbsp;{index + 1}. {labels[level].name}
                            </a>
                        ))}
                    </div>
                    {exports.length > 0 && (
                        <div className="mt-3 text-xs text-slate-600">
                            Ekspor terbaru:{' '}
                            {exports[0].status === 'ready' ? (
                                <a
                                    href={route('sroi.exports.download', [
                                        program.id,
                                        exports[0].id,
                                    ])}
                                    className="font-semibold text-emerald-800 underline"
                                >
                                    Unduh XLSX
                                </a>
                            ) : (
                                exports[0].status
                            )}
                        </div>
                    )}
                </header>

                <section className="rounded-xl border border-emerald-200 bg-white px-4 py-3 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                                Ringkasan
                            </p>
                            <h2 className="text-xs font-bold">
                                Statistik & keterkaitan
                            </h2>
                        </div>
                        <button
                            type="button"
                            aria-expanded={summaryOpen}
                            onClick={() => setSummaryOpen(!summaryOpen)}
                            className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-semibold text-emerald-800 focus-visible:ring-2 focus-visible:ring-emerald-600"
                        >
                            {summaryOpen ? 'Tutup detail' : 'Lihat detail'}
                        </button>
                    </div>
                    {summaryOpen && (
                        <div className="mt-3 grid gap-2 border-t border-slate-100 pt-3 text-xs sm:grid-cols-4">
                            {levels.map((level) => (
                                <p
                                    key={level}
                                    className="rounded-lg bg-slate-50 p-2"
                                >
                                    <strong className="block text-lg text-emerald-800">
                                        {visible(level).length}
                                    </strong>
                                    {labels[level].name}
                                </p>
                            ))}
                        </div>
                    )}
                </section>

                {(localError ||
                    errors.export ||
                    Object.entries(errors).some(([key]) =>
                        key.startsWith('sections.'),
                    )) && (
                    <div
                        role="alert"
                        className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700"
                    >
                        {localError ||
                            errors.export ||
                            Object.values(errors).join(' ')}
                    </div>
                )}

                {levels.map((level, index) => (
                    <section
                        key={level}
                        id={'lfa-' + level}
                        className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
                    >
                        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                    Langkah {index + 1}
                                </p>
                                <h2 className="mt-1 text-xs font-bold text-slate-900">
                                    {labels[level].title}
                                </h2>
                                <p className="mt-1 text-xs text-slate-600">
                                    {labels[level].description}
                                </p>
                            </div>
                            {canEdit && (
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            level === 'goal'
                                                ? addRow('goal', null)
                                                : level === 'purpose'
                                                  ? addPurpose()
                                                  : openModal(level)
                                        }
                                        disabled={processing}
                                        className={`rounded-md border px-3 py-2 text-[11px] font-medium focus-visible:ring-2 focus-visible:ring-emerald-600 disabled:opacity-50 ${level === 'output' || level === 'activity' ? 'border-emerald-800 bg-emerald-800 text-white hover:bg-emerald-900' : 'border-slate-300 bg-white hover:bg-slate-50'}`}
                                    >
                                        {level === 'output' ||
                                        level === 'activity' ? (
                                            <Plus
                                                className="mr-1 inline size-3"
                                                aria-hidden="true"
                                            />
                                        ) : null}
                                        {labels[level].add}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => save(level)}
                                        disabled={
                                            processing ||
                                            !rows[level].some(changed) ||
                                            hasDraftDependents(level) ||
                                            rows[level].some(
                                                (row) =>
                                                    !row.deleted &&
                                                    typeof row.values
                                                        .parent_id ===
                                                        'string' &&
                                                    row.values.parent_id.startsWith(
                                                        '@draft:',
                                                    ),
                                            )
                                        }
                                        className="rounded-md border border-emerald-700 px-3 py-2 text-[11px] font-medium text-emerald-900 hover:bg-emerald-50 focus-visible:ring-2 focus-visible:ring-emerald-600 disabled:opacity-50"
                                    >
                                        <Save
                                            className="mr-1 inline size-3"
                                            aria-hidden="true"
                                        />
                                        Save
                                    </button>
                                    {hasDraftDependents(level) && (
                                        <span className="self-center text-[10px] text-slate-500">
                                            Gunakan Save semua untuk menjaga
                                            relasi draft.
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                        {level === 'goal' && (
                            <p className="mx-4 mt-3 rounded-md border border-dashed border-emerald-200 bg-emerald-50/60 p-3 text-[11px] text-emerald-900">
                                Buat 1-2 kalimat ringkas agar mudah dipahami
                                oleh tim lain.
                            </p>
                        )}
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[780px] table-fixed border-collapse text-left text-xs">
                                {level === 'goal' ? (
                                    <colgroup>
                                        <col className="w-14" />
                                        <col />
                                    </colgroup>
                                ) : level === 'activity' ? (
                                    <colgroup>
                                        <col className="w-14" />
                                        <col className="w-16" />
                                        <col />
                                    </colgroup>
                                ) : (
                                    <colgroup>
                                        <col className="w-14" />
                                        <col className="w-[24%]" />
                                        <col className="w-[24%]" />
                                        <col className="w-[24%]" />
                                        <col />
                                    </colgroup>
                                )}
                                {level !== 'goal' && (
                                    <thead className="bg-slate-50 text-[11px] text-slate-600">
                                        <tr>
                                            {(level === 'activity'
                                                ? ['Aksi', 'Code', 'Aktifitas']
                                                : [
                                                      'Action',
                                                      'Element',
                                                      'Indicator',
                                                      'Sumber Verifikasi',
                                                      'Asumsi',
                                                  ]
                                            ).map((heading) => (
                                                <th
                                                    key={heading}
                                                    scope="col"
                                                    className="border-b border-slate-200 px-3 py-3 font-medium"
                                                >
                                                    {heading}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                )}
                                <tbody>
                                    {visible(level).map((row, rowIndex) => (
                                        <tr
                                            key={row.key}
                                            className="align-top [&+tr]:border-t [&+tr]:border-slate-100"
                                        >
                                            <td className="px-3 py-3">
                                                {canEdit && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            removeRow(
                                                                level,
                                                                row,
                                                            )
                                                        }
                                                        aria-label={`Hapus ${labels[level].name} ${rowIndex + 1}`}
                                                        className="rounded-md bg-rose-500 p-2 text-white hover:bg-rose-600 focus-visible:ring-2 focus-visible:ring-rose-500"
                                                    >
                                                        <Trash2
                                                            size={14}
                                                            aria-hidden="true"
                                                        />
                                                    </button>
                                                )}
                                            </td>
                                            {level === 'activity' && (
                                                <td className="px-2 py-3">
                                                    <input
                                                        aria-label={`Code Activity ${rowIndex + 1}`}
                                                        value={
                                                            row.values.code ??
                                                            ''
                                                        }
                                                        onChange={(event) =>
                                                            editRow(
                                                                level,
                                                                row.key,
                                                                'code',
                                                                event.target
                                                                    .value,
                                                            )
                                                        }
                                                        disabled={!canEdit}
                                                        className={inputClass}
                                                    />
                                                </td>
                                            )}
                                            <td className="px-3 py-3">
                                                {level === 'purpose' &&
                                                    visible('goal').length >
                                                        1 && (
                                                        <select
                                                            aria-label={`Goal untuk Purpose ${rowIndex + 1}`}
                                                            value={String(
                                                                row.values
                                                                    .parent_id ??
                                                                    '',
                                                            )}
                                                            onChange={(event) =>
                                                                editRow(
                                                                    level,
                                                                    row.key,
                                                                    'parent_id',
                                                                    event.target.value.startsWith(
                                                                        '@draft:',
                                                                    )
                                                                        ? event
                                                                              .target
                                                                              .value
                                                                        : Number(
                                                                              event
                                                                                  .target
                                                                                  .value,
                                                                          ),
                                                                )
                                                            }
                                                            disabled={!canEdit}
                                                            className={`${inputClass} mb-2`}
                                                        >
                                                            {visible(
                                                                'goal',
                                                            ).map((goal) => (
                                                                <option
                                                                    key={
                                                                        goal.key
                                                                    }
                                                                    value={
                                                                        goal.id ??
                                                                        '@draft:' +
                                                                            goal.key
                                                                    }
                                                                >
                                                                    {goal.values
                                                                        .element ||
                                                                        'Goal belum diisi'}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    )}
                                                <input
                                                    aria-label={`${labels[level].name} ${rowIndex + 1}`}
                                                    value={row.values.element}
                                                    onChange={(event) =>
                                                        editRow(
                                                            level,
                                                            row.key,
                                                            'element',
                                                            event.target.value,
                                                        )
                                                    }
                                                    disabled={!canEdit}
                                                    className={inputClass}
                                                />
                                                {(level === 'output' ||
                                                    level === 'activity') && (
                                                    <p className="mt-1 break-words text-[10px] text-slate-500">
                                                        {level === 'output'
                                                            ? 'Purpose'
                                                            : 'Output'}
                                                        : {parentName(row)}
                                                    </p>
                                                )}
                                            </td>
                                            {(level === 'purpose' ||
                                                level === 'output') &&
                                                (
                                                    [
                                                        'indicator',
                                                        'verification_source',
                                                        'assumptions',
                                                    ] as const
                                                ).map((field) => (
                                                    <td
                                                        key={field}
                                                        className="px-3 py-3"
                                                    >
                                                        <textarea
                                                            aria-label={`${field.replace('_', ' ')} ${labels[level].name} ${rowIndex + 1}`}
                                                            rows={3}
                                                            value={
                                                                row.values[
                                                                    field
                                                                ] ?? ''
                                                            }
                                                            onChange={(event) =>
                                                                editRow(
                                                                    level,
                                                                    row.key,
                                                                    field,
                                                                    event.target
                                                                        .value,
                                                                )
                                                            }
                                                            disabled={!canEdit}
                                                            className={`${inputClass} min-h-20 resize-y whitespace-pre-wrap break-words`}
                                                        />
                                                    </td>
                                                ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {visible(level).length === 0 && (
                                <p className="p-4 text-xs text-slate-500">
                                    Belum ada {labels[level].name.toLowerCase()}
                                    .{' '}
                                    {canEdit
                                        ? `Gunakan tombol ${labels[level].add} untuk memulai.`
                                        : ''}
                                </p>
                            )}
                        </div>
                    </section>
                ))}
            </div>

            {modal && (
                <Dialog
                    open
                    onClose={() => setModal(null)}
                    className="relative z-[80]"
                >
                    <div
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
                        aria-hidden="true"
                    />
                    <div className="fixed inset-0 flex items-center justify-center p-3">
                        <DialogPanel className="w-full max-w-3xl rounded-lg bg-white p-5 shadow-xl sm:p-6">
                            <div className="flex items-start justify-between gap-4">
                                <DialogTitle
                                    id="lfa-modal-title"
                                    className="text-sm font-bold"
                                >
                                    Set{' '}
                                    {modal === 'output' ? 'Output' : 'Activity'}{' '}
                                    - Logical Framework Approach
                                </DialogTitle>
                                <button
                                    type="button"
                                    onClick={() => setModal(null)}
                                    aria-label="Tutup modal"
                                    className="rounded p-1 text-slate-500 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-emerald-600"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                            <div className="mt-5 grid max-h-[65vh] gap-5 overflow-y-auto sm:grid-cols-2">
                                <div>
                                    <p className="mb-2 text-xs font-semibold">
                                        Tujuan Khusus (Purpose)
                                    </p>
                                    {savedPurposes.length === 0 ? (
                                        <p className="text-xs text-slate-500">
                                            Simpan Purpose terlebih dahulu untuk
                                            menambahkan {modal}.
                                        </p>
                                    ) : (
                                        savedPurposes.map((purpose) => (
                                            <div
                                                key={purpose.key}
                                                className="mb-1"
                                            >
                                                <button
                                                    type="button"
                                                    aria-expanded={
                                                        modal === 'activity'
                                                            ? selectedPurpose ===
                                                              purpose.id
                                                            : undefined
                                                    }
                                                    aria-controls={
                                                        modal === 'activity'
                                                            ? `lfa-outputs-${purpose.id}`
                                                            : undefined
                                                    }
                                                    onClick={() => {
                                                        setSelectedPurpose(
                                                            modal ===
                                                                'activity' &&
                                                                selectedPurpose ===
                                                                    purpose.id
                                                                ? null
                                                                : purpose.id,
                                                        );
                                                        setSelectedOutput(null);
                                                    }}
                                                    className={`block w-full rounded-md border px-3 py-2 text-left text-xs font-medium ${selectedPurpose === purpose.id ? 'border-emerald-500 bg-emerald-50' : 'border-transparent hover:bg-slate-50'}`}
                                                >
                                                    {purpose.values.element}
                                                </button>
                                                {modal === 'activity' &&
                                                    selectedPurpose ===
                                                        purpose.id && (
                                                        <div
                                                            id={`lfa-outputs-${purpose.id}`}
                                                            className="ml-3 space-y-1 border-l border-emerald-200 py-2 pl-3"
                                                        >
                                                            {savedOutputs.filter(
                                                                (output) =>
                                                                    output
                                                                        .values
                                                                        .parent_id ===
                                                                    purpose.id,
                                                            ).length === 0 ? (
                                                                <p className="text-xs text-slate-500">
                                                                    Simpan
                                                                    Output untuk
                                                                    Purpose ini
                                                                    terlebih
                                                                    dahulu.
                                                                </p>
                                                            ) : (
                                                                savedOutputs
                                                                    .filter(
                                                                        (
                                                                            output,
                                                                        ) =>
                                                                            output
                                                                                .values
                                                                                .parent_id ===
                                                                            purpose.id,
                                                                    )
                                                                    .map(
                                                                        (
                                                                            output,
                                                                        ) => (
                                                                            <button
                                                                                type="button"
                                                                                key={
                                                                                    output.key
                                                                                }
                                                                                onClick={() =>
                                                                                    setSelectedOutput(
                                                                                        output.id,
                                                                                    )
                                                                                }
                                                                                aria-pressed={
                                                                                    selectedOutput ===
                                                                                    output.id
                                                                                }
                                                                                className={`block w-full rounded-md border px-3 py-2 text-left text-xs font-medium ${selectedOutput === output.id ? 'border-emerald-500 bg-emerald-50' : 'border-transparent hover:bg-slate-50'}`}
                                                                            >
                                                                                {
                                                                                    output
                                                                                        .values
                                                                                        .element
                                                                                }
                                                                            </button>
                                                                        ),
                                                                    )
                                                            )}
                                                        </div>
                                                    )}
                                            </div>
                                        ))
                                    )}
                                </div>
                                <div>
                                    <label
                                        className="mt-2 block text-xs font-semibold"
                                        htmlFor="lfa-modal-input"
                                    >
                                        Add{' '}
                                        {modal === 'output'
                                            ? 'Output'
                                            : 'Activity'}
                                    </label>
                                    <p className="mt-1 text-[11px] text-blue-600">
                                        Tekan Enter untuk menambah ke daftar.
                                    </p>
                                    <input
                                        id="lfa-modal-input"
                                        value={modalText}
                                        onChange={(event) =>
                                            setModalText(event.target.value)
                                        }
                                        onKeyDown={(event) => {
                                            if (event.key === 'Enter') {
                                                event.preventDefault();
                                                appendModalItem();
                                            }
                                        }}
                                        disabled={
                                            modal === 'output'
                                                ? !selectedPurpose
                                                : !selectedOutput
                                        }
                                        placeholder={
                                            modal === 'output'
                                                ? 'Output'
                                                : 'Aktifitas'
                                        }
                                        className={`${inputClass} mt-1`}
                                    />
                                    <p className="mt-4 text-xs font-medium">
                                        {modal === 'output'
                                            ? 'Output'
                                            : 'Activity'}{' '}
                                        List
                                    </p>
                                    <ul className="mt-2 space-y-1 text-xs">
                                        {modalItems.map((item, index) => (
                                            <li
                                                key={index}
                                                className="flex items-center justify-between gap-2 rounded border border-slate-100 p-2"
                                            >
                                                {item}
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setModalItems(
                                                            (current) =>
                                                                current.filter(
                                                                    (
                                                                        _,
                                                                        itemIndex,
                                                                    ) =>
                                                                        itemIndex !==
                                                                        index,
                                                                ),
                                                        )
                                                    }
                                                    aria-label={`Hapus ${item} dari daftar`}
                                                    className="text-rose-600"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setModal(null)}
                                    className="rounded-md border border-slate-300 px-4 py-2 text-xs hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={commitModal}
                                    disabled={
                                        !(modal === 'output'
                                            ? selectedPurpose
                                            : selectedOutput) ||
                                        (!modalItems.length &&
                                            !modalText.trim())
                                    }
                                    className="rounded-md bg-emerald-800 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-900 disabled:opacity-50"
                                >
                                    Save
                                </button>
                            </div>
                            <p className="mt-2 text-right text-[10px] text-slate-500">
                                Baris ditambahkan sebagai draft. Simpan langkah
                                untuk menyimpan ke program.
                            </p>
                        </DialogPanel>
                    </div>
                </Dialog>
            )}
        </StageFrame>
    );
}
