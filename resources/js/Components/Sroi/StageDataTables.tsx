import { router } from '@inertiajs/react';
import { Plus, Save, Trash2 } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { Section, StageProps, Value } from './types';

type DraftRow = {
    key: string;
    id: number | null;
    values: Record<string, Value>;
    original?: Record<string, Value>;
    deleted: boolean;
};

type OperationRows = {
    create: Record<string, { values: Record<string, Value> }>;
    update: Record<
        string,
        {
            id: number;
            original: Record<string, Value>;
            values: Record<string, Value>;
        }
    >;
    delete: Record<string, { id: number; original: Record<string, Value> }>;
};

const sectionTables: Record<string, string> = {
    items: 'sroi_roadmap_items',
    targets: 'sroi_roadmap_targets',
    stakeholders: 'sroi_program_stakeholders',
    outcomes: 'sroi_program_outcomes',
    indicators: 'sroi_outcome_indicators',
    proxies: 'sroi_financial_proxies',
    'impact-years': 'sroi_outcome_impact_years',
};

function createDraftRows(sections: Section[]): Record<string, DraftRow[]> {
    return Object.fromEntries(
        sections.map((section) => [
            section.key,
            section.rows.map((row) => {
                const values = Object.fromEntries(
                    Object.entries(section.fields).map(
                        ([field, descriptor]) => {
                            const value = row[field] ?? null;
                            return [
                                field,
                                descriptor.replace(/\?$/, '') === 'boolean'
                                    ? value === true ||
                                      value === 1 ||
                                      value === '1'
                                    : value === null
                                      ? ''
                                      : String(value),
                            ];
                        },
                    ),
                ) as Record<string, Value>;

                return {
                    key: String(row.id),
                    id: row.id,
                    values,
                    original: { ...values },
                    deleted: false,
                };
            }),
        ]),
    );
}

function emptyValues(section: Section): Record<string, Value> {
    return Object.fromEntries(
        Object.entries(section.fields).map(([field, descriptor]) => [
            field,
            descriptor.replace(/\?$/, '') === 'boolean' ? false : null,
        ]),
    );
}

function fieldLabel(field: string): string {
    return field
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function fieldKind(descriptor: string): {
    kind: string;
    optional: boolean;
    options: string[];
} {
    const optional = descriptor.endsWith('?');
    const [kind, values = ''] = descriptor.replace(/\?$/, '').split(':');
    return {
        kind,
        optional,
        options: kind === 'enum' ? values.split(',') : [],
    };
}

function rowLabel(section: Section, row: DraftRow, index: number): string {
    const label =
        row.values.name ?? row.values.approach ?? row.values.role_in_program;
    return label ? String(label) : `${section.title} baru #${index + 1}`;
}

export default function StageDataTables({
    stage,
    program,
    sections,
    canEdit,
}: Pick<StageProps, 'stage' | 'program' | 'sections' | 'canEdit'>) {
    const [active, setActive] = useState(sections[0]?.key ?? '');
    const [rows, setRows] = useState(() => createDraftRows(sections));
    const [widths, setWidths] = useState<
        Record<string, Record<string, number>>
    >(() =>
        Object.fromEntries(
            sections.map((section) => [
                section.key,
                Object.fromEntries([
                    ['action', 64],
                    ...Object.entries(section.fields).map(
                        ([field, descriptor]) => [
                            field,
                            fieldKind(descriptor).kind === 'text' ? 260 : 190,
                        ],
                    ),
                ]),
            ]),
        ),
    );
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);
    const panel = useRef<HTMLDivElement>(null);
    const resizing = useRef<{
        pointerId: number;
        section: string;
        field: string;
        startX: number;
        startWidth: number;
    } | null>(null);
    const allowVisit = useRef(false);
    const activeSection = sections.find((section) => section.key === active);
    const visibleRows = (rows[active] ?? []).filter((row) => !row.deleted);
    const dirty = sections.some((section) =>
        (rows[section.key] ?? []).some(
            (row) =>
                row.deleted ||
                row.id === null ||
                Object.keys(section.fields).some(
                    (field) => row.values[field] !== row.original?.[field],
                ),
        ),
    );
    const tableWidth = Object.values(widths[active] ?? {}).reduce(
        (total, width) => total + width,
        0,
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

    useLayoutEffect(() => {
        const tablePanel = panel.current;
        if (!tablePanel) return;
        const fitTextareas = () => {
            tablePanel
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

    const setColumnWidth = (section: string, field: string, width: number) => {
        setWidths((current) => ({
            ...current,
            [section]: {
                ...current[section],
                [field]: Math.max(field === 'action' ? 52 : 120, width),
            },
        }));
    };

    const changeCell = (key: string, field: string, value: Value) => {
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
            delete next[`sections.${active}.create.${key}.values.${field}`];
            delete next[`sections.${active}.update.${key}.values.${field}`];
            return next;
        });
    };

    const addRow = () => {
        const section = activeSection;
        if (!section) return;
        const key = `new-${crypto.randomUUID()}`;
        setRows((current) => ({
            ...current,
            [active]: [
                ...current[active],
                { key, id: null, values: emptyValues(section), deleted: false },
            ],
        }));
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

    const undoDelete = () => {
        setRows((current) =>
            Object.fromEntries(
                Object.entries(current).map(([section, sectionRows]) => [
                    section,
                    sectionRows.map((row) => ({ ...row, deleted: false })),
                ]),
            ),
        );
    };

    const getChoices = (section: Section, field: string, row: DraftRow) => {
        const descriptor = fieldKind(section.fields[field]);
        if (descriptor.kind === 'enum') {
            return descriptor.options.map((value) => ({
                id: value,
                name: fieldLabel(value),
            }));
        }
        if (descriptor.kind === 'boolean') {
            return [
                { id: 'true', name: 'Ya' },
                { id: 'false', name: 'Tidak' },
            ];
        }
        const table = section.fields[field]
            .replace(/^reference:/, '')
            .replace(/\?$/, '');
        const target = sections.find(
            (item) => sectionTables[item.key] === table,
        );
        const localChoices = (target ? (rows[target.key] ?? []) : [])
            .filter((item) => !item.deleted && item.id === null)
            .map((item, index) => ({
                id: `@draft:${item.key}`,
                name: rowLabel(target as Section, item, index),
                outcome_id: item.id,
            }));
        const savedChoices = (section.choices[field] ?? []).filter((choice) => {
            if (!['indicator_id', 'financial_proxy_id'].includes(field))
                return true;
            return String(choice.outcome_id) === String(row.values.outcome_id);
        });

        return [...savedChoices, ...localChoices];
    };

    const displayValue = (section: Section, row: DraftRow, field: string) => {
        const value = row.values[field];
        if (value === null || value === '') return '—';
        const { kind } = fieldKind(section.fields[field]);
        if (kind === 'boolean') return value ? 'Ya' : 'Tidak';
        if (kind === 'reference' || kind === 'enum') {
            const choice = getChoices(section, field, row).find(
                (item) => String(item.id) === String(value),
            );
            return choice?.name ?? String(value);
        }

        return String(value);
    };

    const save = () => {
        const payload = {
            sections: Object.fromEntries(
                sections.map((section) => {
                    const sectionRows = rows[section.key] ?? [];
                    const operations: OperationRows = {
                        create: {},
                        update: {},
                        delete: {},
                    };
                    sectionRows.forEach((row) => {
                        if (row.deleted && row.id !== null) {
                            operations.delete[row.key] = {
                                id: row.id,
                                original: row.original ?? {},
                            };
                        } else if (row.id === null) {
                            operations.create[row.key] = { values: row.values };
                        } else if (
                            Object.keys(section.fields).some(
                                (field) =>
                                    row.values[field] !== row.original?.[field],
                            )
                        ) {
                            operations.update[row.key] = {
                                id: row.id,
                                original: row.original ?? {},
                                values: row.values,
                            };
                        }
                    });

                    return [section.key, operations];
                }),
            ),
        };

        setProcessing(true);
        setErrors({});
        allowVisit.current = true;
        router.put(
            route('sroi.stages.batch-save', [program.id, stage]),
            payload,
            {
                preserveScroll: true,
                onError: (serverErrors) => setErrors(serverErrors),
                onSuccess: (page) => {
                    allowVisit.current = true;
                    setRows(createDraftRows(page.props.sections as Section[]));
                    setErrors({});
                },
                onFinish: () => {
                    allowVisit.current = false;
                    setProcessing(false);
                },
            },
        );
    };

    if (!activeSection) return null;

    return (
        <div className="space-y-3 bg-white text-slate-900">
            {sections.length > 1 ? (
                <div
                    role="tablist"
                    aria-label="Bagian data"
                    className="flex gap-2 overflow-x-auto border-b border-slate-200"
                >
                    {sections.map((section) => (
                        <button
                            key={section.key}
                            type="button"
                            role="tab"
                            id={`tab-${section.key}`}
                            aria-controls="stage-table-panel"
                            aria-selected={active === section.key}
                            tabIndex={active === section.key ? 0 : -1}
                            onClick={() => setActive(section.key)}
                            onKeyDown={(event) => {
                                if (
                                    event.key !== 'ArrowLeft' &&
                                    event.key !== 'ArrowRight'
                                ) {
                                    return;
                                }
                                event.preventDefault();
                                const currentIndex = sections.findIndex(
                                    (item) => item.key === section.key,
                                );
                                const nextIndex =
                                    (currentIndex +
                                        (event.key === 'ArrowRight' ? 1 : -1) +
                                        sections.length) %
                                    sections.length;
                                setActive(sections[nextIndex].key);
                                document
                                    .getElementById(
                                        `tab-${sections[nextIndex].key}`,
                                    )
                                    ?.focus();
                            }}
                            className={`shrink-0 border-b-2 px-2 py-3 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#006b3d] ${active === section.key ? 'border-[#006b3d] text-[#006b3d]' : 'border-transparent text-slate-500 hover:text-[#006b3d]'}`}
                        >
                            {section.title}
                        </button>
                    ))}
                </div>
            ) : (
                <h2 className="text-base font-semibold">
                    {activeSection.title}
                </h2>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs text-slate-500">
                    {visibleRows.length} data
                </span>
                <div className="flex flex-wrap justify-end gap-2">
                    {canEdit && (
                        <button
                            type="button"
                            onClick={addRow}
                            disabled={processing}
                            className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-[#006b3d] px-3 text-sm font-medium text-[#006b3d] hover:bg-green-50 disabled:opacity-50"
                        >
                            <Plus size={16} aria-hidden="true" /> Tambah Baris
                        </button>
                    )}
                    {canEdit && (
                        <button
                            type="button"
                            onClick={save}
                            disabled={!dirty || processing}
                            className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-[#006b3d] px-3 text-sm font-semibold text-white hover:bg-[#005630] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <Save size={16} aria-hidden="true" /> Simpan
                        </button>
                    )}
                </div>
            </div>

            <div
                id="stage-table-panel"
                role="tabpanel"
                aria-labelledby={
                    sections.length > 1 ? `tab-${active}` : undefined
                }
                ref={panel}
                className="min-h-36 overflow-x-auto rounded-xl border border-slate-200 bg-white"
            >
                <table
                    className="min-w-full table-fixed text-left"
                    style={{ width: tableWidth }}
                >
                    <colgroup>
                        <col style={{ width: widths[active]?.action }} />
                        {Object.keys(activeSection.fields).map((field) => (
                            <col
                                key={field}
                                style={{ width: widths[active]?.[field] }}
                            />
                        ))}
                    </colgroup>
                    <thead className="border-b border-slate-200 bg-[#fcfcfe]">
                        <tr>
                            {[
                                ['action', 'Aksi'],
                                ...Object.keys(activeSection.fields).map(
                                    (field) => [field, fieldLabel(field)],
                                ),
                            ].map(([field, label]) => (
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
                                        aria-label={`Ubah lebar kolom ${label}, ${widths[active]?.[field]} piksel. Gunakan panah kiri atau kanan.`}
                                        title={`Seret untuk mengubah lebar kolom ${label}`}
                                        onPointerDown={(event) => {
                                            if (event.button !== 0) return;
                                            event.preventDefault();
                                            resizing.current = {
                                                pointerId: event.pointerId,
                                                section: active,
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
                                            )
                                                setColumnWidth(
                                                    drag.section,
                                                    drag.field,
                                                    drag.startWidth +
                                                        event.clientX -
                                                        drag.startX,
                                                );
                                        }}
                                        onPointerUp={(event) => {
                                            if (
                                                resizing.current?.pointerId ===
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
                                                    (event.key === 'ArrowRight'
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
                        {visibleRows.map((row, index) => (
                            <tr
                                key={row.key}
                                className="border-b border-slate-200 last:border-b-0"
                            >
                                <td className="px-3 py-2 align-top">
                                    {canEdit && (
                                        <button
                                            type="button"
                                            aria-label={`Hapus baris ${index + 1}`}
                                            onClick={() => removeRow(row.key)}
                                            disabled={processing}
                                            className="rounded border border-slate-300 p-1 text-slate-700 hover:border-red-500 hover:text-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-600"
                                        >
                                            <Trash2
                                                size={14}
                                                aria-hidden="true"
                                            />
                                        </button>
                                    )}
                                </td>
                                {Object.entries(activeSection.fields).map(
                                    ([field, descriptor]) => {
                                        const { kind, optional } =
                                            fieldKind(descriptor);
                                        const operation =
                                            row.id === null
                                                ? 'create'
                                                : 'update';
                                        const error =
                                            errors[
                                                `sections.${active}.${operation}.${row.key}.values.${field}`
                                            ];
                                        const label = `${fieldLabel(field)} baris ${index + 1}`;
                                        const value = row.values[field];

                                        return (
                                            <td
                                                key={field}
                                                className="px-3 py-2 align-top text-sm"
                                            >
                                                {canEdit ? (
                                                    kind === 'text' ? (
                                                        <textarea
                                                            rows={1}
                                                            value={String(
                                                                value ?? '',
                                                            )}
                                                            aria-label={label}
                                                            aria-invalid={Boolean(
                                                                error,
                                                            )}
                                                            onChange={(event) =>
                                                                changeCell(
                                                                    row.key,
                                                                    field,
                                                                    event.target
                                                                        .value,
                                                                )
                                                            }
                                                            required={!optional}
                                                            disabled={
                                                                processing
                                                            }
                                                            className="block min-h-6 w-full resize-none overflow-hidden border-0 bg-transparent p-0 text-sm leading-5 text-slate-900 [overflow-wrap:anywhere] focus:ring-2 focus:ring-[#006b3d]"
                                                        />
                                                    ) : [
                                                          'reference',
                                                          'enum',
                                                          'boolean',
                                                      ].includes(kind) ? (
                                                        <select
                                                            value={
                                                                kind ===
                                                                'boolean'
                                                                    ? String(
                                                                          Boolean(
                                                                              value,
                                                                          ),
                                                                      )
                                                                    : String(
                                                                          value ??
                                                                              '',
                                                                      )
                                                            }
                                                            aria-label={label}
                                                            aria-invalid={Boolean(
                                                                error,
                                                            )}
                                                            onChange={(event) =>
                                                                changeCell(
                                                                    row.key,
                                                                    field,
                                                                    kind ===
                                                                        'boolean'
                                                                        ? event
                                                                              .target
                                                                              .value ===
                                                                              'true'
                                                                        : event
                                                                              .target
                                                                              .value ||
                                                                              null,
                                                                )
                                                            }
                                                            required={!optional}
                                                            disabled={
                                                                processing
                                                            }
                                                            className="block min-h-8 w-full rounded border-slate-300 px-2 py-1 text-xs text-slate-900 focus:border-[#006b3d] focus:ring-[#006b3d]"
                                                        >
                                                            <option value="">
                                                                Pilih{' '}
                                                                {fieldLabel(
                                                                    field,
                                                                )}
                                                            </option>
                                                            {getChoices(
                                                                activeSection,
                                                                field,
                                                                row,
                                                            ).map((choice) => (
                                                                <option
                                                                    key={
                                                                        choice.id
                                                                    }
                                                                    value={
                                                                        choice.id
                                                                    }
                                                                >
                                                                    {
                                                                        choice.name
                                                                    }
                                                                </option>
                                                            ))}
                                                        </select>
                                                    ) : [
                                                          'string',
                                                          'currency',
                                                      ].includes(kind) ? (
                                                        <input
                                                            type="text"
                                                            maxLength={
                                                                kind ===
                                                                'currency'
                                                                    ? 3
                                                                    : 255
                                                            }
                                                            value={String(
                                                                value ?? '',
                                                            )}
                                                            aria-label={label}
                                                            aria-invalid={Boolean(
                                                                error,
                                                            )}
                                                            onChange={(event) =>
                                                                changeCell(
                                                                    row.key,
                                                                    field,
                                                                    event.target
                                                                        .value,
                                                                )
                                                            }
                                                            required={!optional}
                                                            disabled={
                                                                processing
                                                            }
                                                            className="block min-h-8 w-full rounded border-slate-300 px-2 py-1 text-xs text-slate-900 focus:border-[#006b3d] focus:ring-[#006b3d]"
                                                        />
                                                    ) : (
                                                        <input
                                                            type="number"
                                                            step={
                                                                kind === 'year'
                                                                    ? 1
                                                                    : kind ===
                                                                        'money'
                                                                      ? '0.01'
                                                                      : 'any'
                                                            }
                                                            min={
                                                                kind === 'year'
                                                                    ? program.start_year
                                                                    : kind ===
                                                                        'decimal'
                                                                      ? -180
                                                                      : 0
                                                            }
                                                            max={
                                                                kind === 'year'
                                                                    ? program.end_year
                                                                    : kind ===
                                                                        'percent'
                                                                      ? 100
                                                                      : undefined
                                                            }
                                                            value={String(
                                                                value ?? '',
                                                            )}
                                                            aria-label={label}
                                                            aria-invalid={Boolean(
                                                                error,
                                                            )}
                                                            onChange={(event) =>
                                                                changeCell(
                                                                    row.key,
                                                                    field,
                                                                    event.target
                                                                        .value,
                                                                )
                                                            }
                                                            required={!optional}
                                                            disabled={
                                                                processing
                                                            }
                                                            className="block min-h-8 w-full rounded border-slate-300 px-2 py-1 text-xs text-slate-900 focus:border-[#006b3d] focus:ring-[#006b3d]"
                                                        />
                                                    )
                                                ) : (
                                                    <p className="whitespace-pre-wrap break-words leading-5">
                                                        {displayValue(
                                                            activeSection,
                                                            row,
                                                            field,
                                                        )}
                                                    </p>
                                                )}
                                                {error && (
                                                    <span
                                                        role="alert"
                                                        className="block text-xs text-red-700"
                                                    >
                                                        {error}
                                                    </span>
                                                )}
                                            </td>
                                        );
                                    },
                                )}
                            </tr>
                        ))}
                        {visibleRows.length === 0 && (
                            <tr>
                                <td
                                    colSpan={
                                        Object.keys(activeSection.fields)
                                            .length + 1
                                    }
                                    className="py-8 text-center text-sm text-slate-500"
                                >
                                    Belum ada data.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {Object.values(rows).some((sectionRows) =>
                sectionRows.some((row) => row.deleted),
            ) && (
                <button
                    type="button"
                    onClick={undoDelete}
                    className="py-2 text-sm font-medium text-[#006b3d] underline"
                >
                    Urungkan penghapusan
                </button>
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
    );
}
