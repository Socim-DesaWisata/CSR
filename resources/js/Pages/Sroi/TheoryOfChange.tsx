import StageFrame from '@/Components/Sroi/StageFrame';
import type { Section, StageProps } from '@/Components/Sroi/types';
import { router } from '@inertiajs/react';
import { ArrowRightToLine, Network, Plus, Save, Trash2 } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

type Tab = 'conditions' | 'flows';
type Values = Record<string, string>;
type Draft = {
    key: string;
    id: number | null;
    values: Values;
    original?: Values;
    deleted: boolean;
};
type Changes = {
    create: Values[];
    update: { id: number; original: Values; values: Values }[];
    delete: { id: number; original: Values }[];
};

const columns: Record<Tab, { field: string; label: string }[]> = {
    conditions: [
        { field: 'initial_condition', label: 'Kondisi Awal' },
        { field: 'intervention', label: 'Intervensi' },
        { field: 'expected_condition', label: 'Outcome yang Diharapkan' },
    ],
    flows: [
        { field: 'input_text', label: 'Input' },
        { field: 'activity_text', label: 'Aktivitas' },
        { field: 'output_text', label: 'Output' },
        { field: 'outcome_text', label: 'Outcome' },
        { field: 'impact_text', label: 'Impact' },
    ],
};
const tabs: Tab[] = ['conditions', 'flows'];
const initialWidths: Record<Tab, Record<string, number>> = {
    conditions: {
        action: 64,
        initial_condition: 340,
        intervention: 340,
        expected_condition: 340,
    },
    flows: {
        action: 64,
        input_text: 205,
        activity_text: 205,
        output_text: 205,
        outcome_text: 205,
        impact_text: 205,
    },
};

function initialRows(sections: Section[]): Record<Tab, Draft[]> {
    return Object.fromEntries(
        tabs.map((tab) => [
            tab,
            (sections.find((section) => section.key === tab)?.rows ?? []).map(
                (row) => {
                    const values = Object.fromEntries(
                        columns[tab].map(({ field }) => [
                            field,
                            String(row[field] ?? ''),
                        ]),
                    );
                    return {
                        key: String(row.id),
                        id: row.id,
                        values,
                        original: { ...values },
                        deleted: false,
                    };
                },
            ),
        ]),
    ) as Record<Tab, Draft[]>;
}

export default function TheoryOfChange(props: StageProps) {
    return <TheoryTable key={props.program.id} {...props} />;
}

function TheoryTable({
    program,
    sections,
    documents,
    exports,
    canEdit,
}: StageProps) {
    const [active, setActive] = useState<Tab>('conditions');
    const [rows, setRows] = useState(() => initialRows(sections));
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [widths, setWidths] = useState(initialWidths);
    const resizing = useRef<{
        pointerId: number;
        tab: Tab;
        field: string;
        startX: number;
        startWidth: number;
    } | null>(null);
    const tablePanel = useRef<HTMLDivElement>(null);
    const nextKey = useRef(0);
    const allowVisit = useRef(false);
    const dirty = tabs.some((tab) =>
        rows[tab].some(
            (row) =>
                row.deleted ||
                row.id === null ||
                columns[tab].some(
                    ({ field }) => row.values[field] !== row.original?.[field],
                ),
        ),
    );

    useEffect(() => {
        if (!dirty) return;
        const beforeUnload = (event: BeforeUnloadEvent) => {
            event.preventDefault();
            event.returnValue = '';
        };
        const removeListener = router.on('before', (event) => {
            if (
                !allowVisit.current &&
                !window.confirm('Perubahan belum disimpan. Tinggalkan halaman?')
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

    const addRow = () => {
        const key = 'new-' + ++nextKey.current;
        const values = Object.fromEntries(
            columns[active].map(({ field }) => [field, '']),
        );
        setRows((current) => ({
            ...current,
            [active]: [
                ...current[active],
                { key, id: null, values, deleted: false },
            ],
        }));
        requestAnimationFrame(() =>
            document
                .querySelector<HTMLTextAreaElement>(
                    '[data-row-key="' + key + '"] textarea',
                )
                ?.focus(),
        );
    };

    const changeCell = (key: string, field: string, value: string) => {
        setRows((current) => ({
            ...current,
            [active]: current[active].map((row) =>
                row.key === key
                    ? { ...row, values: { ...row.values, [field]: value } }
                    : row,
            ),
        }));
        setErrors((current) => {
            const next = { ...current };
            delete next[active + '.' + key + '.' + field];
            return next;
        });
    };

    const removeRow = (key: string) => {
        setRows((current) => ({
            ...current,
            [active]: current[active]
                .filter((row) => row.key !== key || row.id !== null)
                .map((row) =>
                    row.key === key ? { ...row, deleted: true } : row,
                ),
        }));
    };

    const save = () => {
        const fieldPaths: Record<string, string> = {};
        const changes = Object.fromEntries(
            tabs.map((tab) => {
                const entries: Changes = { create: [], update: [], delete: [] };
                for (const row of rows[tab]) {
                    if (row.id === null) {
                        const index = entries.create.push(row.values) - 1;
                        for (const { field } of columns[tab]) {
                            fieldPaths[tab + '.create.' + index + '.' + field] =
                                tab + '.' + row.key + '.' + field;
                        }
                    } else if (row.deleted) {
                        entries.delete.push({
                            id: row.id,
                            original: row.original!,
                        });
                    } else if (
                        columns[tab].some(
                            ({ field }) =>
                                row.values[field] !== row.original?.[field],
                        )
                    ) {
                        const index =
                            entries.update.push({
                                id: row.id,
                                original: row.original!,
                                values: row.values,
                            }) - 1;
                        for (const { field } of columns[tab]) {
                            fieldPaths[
                                tab + '.update.' + index + '.values.' + field
                            ] = tab + '.' + row.key + '.' + field;
                        }
                    }
                }
                return [tab, entries];
            }),
        ) as Record<Tab, Changes>;

        setErrors({});
        setProcessing(true);
        allowVisit.current = true;
        router.put(route('sroi.theory-of-change.save', program.id), changes, {
            preserveScroll: true,
            onSuccess: (page) => {
                const refreshed = page.props as unknown as {
                    sections: Section[];
                };
                setRows(initialRows(refreshed.sections));
            },
            onError: (serverErrors) => {
                setErrors(
                    Object.fromEntries(
                        Object.entries(serverErrors).map(([path, message]) => [
                            fieldPaths[path] ?? path,
                            message,
                        ]),
                    ),
                );
            },
            onFinish: () => {
                allowVisit.current = false;
                setProcessing(false);
            },
        });
    };

    const exportTab = () => {
        setErrors({});
        setExporting(true);
        router.post(
            route('sroi.exports.store', [program.id, 'theory-of-change']),
            { section: active },
            {
                preserveScroll: true,
                onError: (serverErrors) => setErrors(serverErrors),
                onFinish: () => setExporting(false),
            },
        );
    };

    const visible = rows[active].filter((row) => !row.deleted);
    const setColumnWidth = (tab: Tab, field: string, width: number) => {
        setWidths((current) => ({
            ...current,
            [tab]: {
                ...current[tab],
                [field]: Math.max(field === 'action' ? 52 : 120, width),
            },
        }));
    };
    const tableWidth = Object.values(widths[active]).reduce(
        (total, width) => total + width,
        0,
    );

    useLayoutEffect(() => {
        const panel = tablePanel.current;
        if (!panel) return;

        const fitTextareas = () => {
            panel
                .querySelectorAll<HTMLTextAreaElement>('textarea')
                .forEach((textarea) => {
                    textarea.style.height = 'auto';
                    textarea.style.height = `${textarea.scrollHeight}px`;
                });
        };

        fitTextareas();
        window.addEventListener('resize', fitTextareas);

        return () => window.removeEventListener('resize', fitTextareas);
    }, [active, rows, widths]);
    const history = exports.filter(
        (item) =>
            item.stage === 'theory-of-change' ||
            item.stage === 'theory-of-change:' + active,
    );

    return (
        <StageFrame
            program={program}
            stage="theory-of-change"
            title="Theory of Change"
            documents={documents}
            exports={exports}
            canEdit={canEdit}
        >
            <div className="space-y-0 bg-white text-slate-900">
                <div
                    role="tablist"
                    aria-label="Tabel Theory of Change"
                    className="flex gap-2 overflow-x-auto border-b border-slate-200"
                >
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            type="button"
                            role="tab"
                            id={'tab-' + tab}
                            aria-controls="theory-panel"
                            aria-selected={active === tab}
                            tabIndex={active === tab ? 0 : -1}
                            onClick={() => setActive(tab)}
                            onKeyDown={(event) => {
                                if (
                                    event.key !== 'ArrowLeft' &&
                                    event.key !== 'ArrowRight'
                                )
                                    return;
                                event.preventDefault();
                                const next =
                                    tabs[
                                        (tabs.indexOf(tab) +
                                            (event.key === 'ArrowRight'
                                                ? 1
                                                : -1) +
                                            tabs.length) %
                                            tabs.length
                                    ];
                                setActive(next);
                                document.getElementById('tab-' + next)?.focus();
                            }}
                            className={
                                'flex shrink-0 items-center gap-2 border-b-2 px-2 py-3 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#006b3d] ' +
                                (active === tab
                                    ? 'border-[#006b3d] text-[#006b3d]'
                                    : 'border-transparent text-slate-500 hover:text-[#006b3d]')
                            }
                        >
                            {tab === 'conditions' ? (
                                <Network size={16} aria-hidden="true" />
                            ) : (
                                <ArrowRightToLine
                                    size={16}
                                    aria-hidden="true"
                                />
                            )}
                            {tab === 'conditions'
                                ? 'Kondisi Awal - Intervensi - Kondisi yang diharapkan'
                                : 'Input - Impact'}
                        </button>
                    ))}
                </div>

                <div className="flex flex-wrap justify-end gap-2 py-3">
                    {canEdit && (
                        <button
                            type="button"
                            onClick={addRow}
                            disabled={processing}
                            className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-[#006b3d] px-3 text-sm font-medium text-[#006b3d] hover:bg-green-50 focus-visible:outline focus-visible:outline-2 disabled:opacity-50"
                        >
                            <Plus size={16} aria-hidden="true" /> Tambah
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={exportTab}
                        disabled={dirty || exporting || processing}
                        title={
                            dirty
                                ? 'Simpan perubahan sebelum mengekspor'
                                : undefined
                        }
                        className="min-h-9 rounded-lg border border-[#006b3d] px-3 text-sm font-medium text-[#006b3d] hover:bg-green-50 focus-visible:outline focus-visible:outline-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Export Excel
                    </button>
                    {canEdit && (
                        <button
                            type="button"
                            onClick={save}
                            disabled={!dirty || processing}
                            className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-[#006b3d] px-3 text-sm font-semibold text-white hover:bg-[#005630] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <Save size={16} aria-hidden="true" /> Simpan
                        </button>
                    )}
                </div>

                <div
                    id="theory-panel"
                    role="tabpanel"
                    aria-labelledby={'tab-' + active}
                    className="min-h-[160px] overflow-x-auto rounded-xl border border-slate-200 bg-white"
                    ref={tablePanel}
                >
                    <table
                        className="min-w-full table-fixed text-left"
                        style={{ width: tableWidth }}
                    >
                        <colgroup>
                            <col style={{ width: widths[active].action }} />
                            {columns[active].map(({ field }) => (
                                <col
                                    key={field}
                                    style={{ width: widths[active][field] }}
                                />
                            ))}
                        </colgroup>
                        <thead className="border-b border-slate-200 bg-[#fcfcfe]">
                            <tr>
                                {[
                                    { field: 'action', label: 'Aksi' },
                                    ...columns[active],
                                ].map(({ field, label }) => (
                                    <th
                                        key={field}
                                        scope="col"
                                        className="relative px-3 py-3 pr-5 text-xs font-semibold text-slate-950"
                                    >
                                        <span
                                            className={
                                                field === 'action'
                                                    ? 'sr-only'
                                                    : 'block break-words'
                                            }
                                        >
                                            {label}
                                        </span>
                                        <button
                                            type="button"
                                            aria-label={`Ubah lebar kolom ${label}, ${widths[active][field]} piksel. Gunakan panah kiri atau kanan.`}
                                            title={`Seret untuk mengubah lebar kolom ${label}`}
                                            onPointerDown={(event) => {
                                                if (event.button !== 0) return;
                                                event.preventDefault();
                                                resizing.current = {
                                                    pointerId: event.pointerId,
                                                    tab: active,
                                                    field,
                                                    startX: event.clientX,
                                                    startWidth:
                                                        widths[active][field],
                                                };
                                                event.currentTarget.setPointerCapture(
                                                    event.pointerId,
                                                );
                                            }}
                                            onPointerMove={(event) => {
                                                const drag = resizing.current;
                                                if (
                                                    drag?.pointerId ===
                                                    event.pointerId
                                                ) {
                                                    setColumnWidth(
                                                        drag.tab,
                                                        drag.field,
                                                        drag.startWidth +
                                                            event.clientX -
                                                            drag.startX,
                                                    );
                                                }
                                            }}
                                            onPointerUp={(event) => {
                                                if (
                                                    resizing.current
                                                        ?.pointerId ===
                                                    event.pointerId
                                                ) {
                                                    resizing.current = null;
                                                    event.currentTarget.releasePointerCapture(
                                                        event.pointerId,
                                                    );
                                                }
                                            }}
                                            onPointerCancel={() => {
                                                resizing.current = null;
                                            }}
                                            onKeyDown={(event) => {
                                                if (
                                                    event.key !== 'ArrowLeft' &&
                                                    event.key !== 'ArrowRight'
                                                )
                                                    return;
                                                event.preventDefault();
                                                setColumnWidth(
                                                    active,
                                                    field,
                                                    widths[active][field] +
                                                        (event.key ===
                                                        'ArrowRight'
                                                            ? 16
                                                            : -16),
                                                );
                                            }}
                                            className="absolute inset-y-0 right-0 w-3 cursor-col-resize touch-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#006b3d]"
                                        >
                                            <span
                                                aria-hidden="true"
                                                className="mx-auto block h-full w-px bg-slate-300 hover:bg-[#006b3d]"
                                            />
                                        </button>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {visible.map((row, index) => (
                                <tr
                                    key={row.key}
                                    data-row-key={row.key}
                                    className="border-b border-slate-200 last:border-b-0"
                                >
                                    <td className="px-3 py-2 align-top">
                                        {canEdit && (
                                            <button
                                                type="button"
                                                aria-label={
                                                    'Hapus baris ' + (index + 1)
                                                }
                                                onClick={() =>
                                                    removeRow(row.key)
                                                }
                                                className="rounded border border-slate-300 p-1 text-slate-700 hover:border-red-500 hover:text-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-600"
                                            >
                                                <Trash2
                                                    size={14}
                                                    aria-hidden="true"
                                                />
                                            </button>
                                        )}
                                    </td>
                                    {columns[active].map(({ field, label }) => (
                                        <td
                                            key={field}
                                            className="px-3 py-2 align-top text-sm"
                                        >
                                            {canEdit ? (
                                                <>
                                                    <textarea
                                                        rows={1}
                                                        value={
                                                            row.values[field]
                                                        }
                                                        aria-label={
                                                            label +
                                                            ' baris ' +
                                                            (index + 1)
                                                        }
                                                        aria-invalid={Boolean(
                                                            errors[
                                                                active +
                                                                    '.' +
                                                                    row.key +
                                                                    '.' +
                                                                    field
                                                            ],
                                                        )}
                                                        onChange={(event) =>
                                                            changeCell(
                                                                row.key,
                                                                field,
                                                                event.target
                                                                    .value,
                                                            )
                                                        }
                                                        className="block min-h-6 w-full resize-none overflow-hidden border-0 bg-transparent p-0 text-sm leading-5 text-slate-900 [overflow-wrap:anywhere] focus:ring-2 focus:ring-[#006b3d]"
                                                    />
                                                    {errors[
                                                        active +
                                                            '.' +
                                                            row.key +
                                                            '.' +
                                                            field
                                                    ] && (
                                                        <span
                                                            role="alert"
                                                            className="block text-xs text-red-700"
                                                        >
                                                            {
                                                                errors[
                                                                    active +
                                                                        '.' +
                                                                        row.key +
                                                                        '.' +
                                                                        field
                                                                ]
                                                            }
                                                        </span>
                                                    )}
                                                </>
                                            ) : (
                                                <p className="whitespace-pre-wrap break-words leading-5">
                                                    {row.values[field]}
                                                </p>
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                            {visible.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={columns[active].length + 1}
                                        className="py-8 text-center text-sm text-slate-500"
                                    >
                                        Belum ada data.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {rows[active].some((row) => row.deleted) && (
                    <button
                        type="button"
                        onClick={() =>
                            setRows((current) => ({
                                ...current,
                                [active]: current[active].map((row) => ({
                                    ...row,
                                    deleted: false,
                                })),
                            }))
                        }
                        className="py-3 text-sm font-medium text-[#006b3d] underline"
                    >
                        Urungkan penghapusan
                    </button>
                )}
                {errors.export && (
                    <p role="alert" className="py-3 text-sm text-red-700">
                        {errors.export}
                    </p>
                )}
                {history.length > 0 && (
                    <ul
                        className="space-y-2 py-4 text-sm"
                        aria-label="Riwayat ekspor tab"
                    >
                        {history.map((item) => (
                            <li key={item.id} className="flex gap-3">
                                <span>
                                    {item.stage === 'theory-of-change'
                                        ? 'Kedua tab (lama)'
                                        : active === 'conditions'
                                          ? 'Kondisi Awal'
                                          : 'Input - Impact'}{' '}
                                    · {item.status}
                                </span>
                                {item.status === 'ready' && (
                                    <a
                                        href={route('sroi.exports.download', [
                                            program.id,
                                            item.id,
                                        ])}
                                        className="font-semibold text-[#006b3d] underline"
                                    >
                                        Unduh XLSX
                                    </a>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </StageFrame>
    );
}
