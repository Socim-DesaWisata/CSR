import StageFrame from '@/Components/Sroi/StageFrame';
import type {
    Program,
    Row,
    Section,
    StageProps,
    Value,
} from '@/Components/Sroi/types';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { router } from '@inertiajs/react';
import { ArrowRight, Pencil, Plus, Save, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type Values = Record<string, Value>;
type Draft = {
    key: string;
    id: number | null;
    values: Values;
    original?: Values;
    deleted: boolean;
};
type Changes = {
    create: Record<string, { values: Values }>;
    update: Record<string, { id: number; original: Values; values: Values }>;
    delete: Record<string, { id: number; original: Values }>;
};
const columns = [
    { field: 'stakeholder_id', label: 'Stakeholder', width: 145 },
    { field: 'name', label: 'Outcome', width: 150 },
    { field: 'description', label: 'Deskripsi', width: 150 },
    { field: 'relevant', label: 'Relevan', width: 145 },
    { field: 'significant', label: 'Signifikan', width: 145 },
    { field: 'material', label: 'Material/Tidak', width: 145 },
    { field: 'materiality_reason', label: 'Alasan', width: 255 },
    { field: 'materiality_explanation', label: 'Penjelasan', width: 150 },
] as const;
const booleanLabels: Record<string, [string, string]> = {
    relevant: ['Relevan', 'Tidak Relevan'],
    significant: ['Signifikan', 'Tidak Signifikan'],
    material: ['Material', 'Tidak Material'],
};

function initialRows(section: Section): Draft[] {
    return section.rows.map((row: Row) => {
        const values = Object.fromEntries(
            Object.entries(section.fields).map(([field, descriptor]) => {
                const value = row[field] ?? null;
                return [
                    field,
                    descriptor.replace(/\?$/, '') === 'boolean'
                        ? value === true || value === 1 || value === '1'
                        : value === null
                          ? null
                          : ['stakeholder_id', 'outcome_category_id'].includes(
                                  field,
                              )
                            ? value
                            : String(value),
                ];
            }),
        ) as Values;
        return {
            key: String(row.id),
            id: row.id,
            values,
            original: { ...values },
            deleted: false,
        };
    });
}

export default function OutcomeIdentification({
    program,
    sections,
    documents,
    exports,
    canEdit,
}: StageProps) {
    const section = sections.find((item) => item.key === 'outcomes');
    return (
        <StageFrame
            program={program}
            stage="outcome"
            title="Outcome Identification"
            documents={documents}
            exports={exports}
            canEdit={canEdit}
        >
            {section && (
                <OutcomeTable
                    key={program.id}
                    program={program}
                    section={section}
                    canEdit={canEdit}
                />
            )}
        </StageFrame>
    );
}

export function OutcomeTable({
    program,
    section,
    canEdit,
}: {
    program: Program;
    section: Section;
    canEdit: boolean;
}) {
    const [rows, setRows] = useState<Draft[]>(() => initialRows(section));
    const [wrapText, setWrapText] = useState(true);
    const [categoryTarget, setCategoryTarget] = useState<string | null>(null);
    const [categoryId, setCategoryId] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);
    const nextKey = useRef(0);
    const allowVisit = useRef(false);
    const dirty = rows.some(
        (row) =>
            row.id === null ||
            row.deleted ||
            Object.keys(section.fields).some(
                (field) => row.values[field] !== row.original?.[field],
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
            )
                event.preventDefault();
        });
        window.addEventListener('beforeunload', beforeUnload);
        return () => {
            removeListener();
            window.removeEventListener('beforeunload', beforeUnload);
        };
    }, [dirty]);

    function update(key: string, field: string, value: Value) {
        setRows((current) =>
            current.map((row) =>
                row.key === key
                    ? { ...row, values: { ...row.values, [field]: value } }
                    : row,
            ),
        );
    }

    function startCategory(target: string) {
        setCategoryTarget(target);
        setCategoryId(
            target === 'new'
                ? ''
                : String(
                      rows.find((row) => row.key === target)?.values
                          .outcome_category_id ?? '',
                  ),
        );
    }

    function applyCategory() {
        if (!categoryId || !categoryTarget) return;
        if (categoryTarget === 'new') {
            setRows((current) => [
                ...current,
                {
                    key: `new-${++nextKey.current}`,
                    id: null,
                    deleted: false,
                    values: {
                        stakeholder_id: null,
                        outcome_category_id: Number(categoryId),
                        name: '',
                        description: '',
                        relevant: true,
                        significant: true,
                        material: true,
                        materiality_reason: '',
                        materiality_explanation: null,
                    },
                },
            ]);
        } else {
            update(categoryTarget, 'outcome_category_id', Number(categoryId));
        }
        setCategoryTarget(null);
    }

    function remove(key: string) {
        if (!window.confirm('Hapus outcome ini?')) return;
        setRows((current) =>
            current
                .filter((row) => row.key !== key || row.id !== null)
                .map((row) =>
                    row.key === key ? { ...row, deleted: true } : row,
                ),
        );
    }

    function save(next = false) {
        const changes: Changes = { create: {}, update: {}, delete: {} };
        for (const row of rows) {
            if (row.id === null)
                changes.create[row.key] = { values: row.values };
            else if (row.deleted)
                changes.delete[row.key] = {
                    id: row.id,
                    original: row.original!,
                };
            else if (
                Object.keys(section.fields).some(
                    (field) => row.values[field] !== row.original?.[field],
                )
            ) {
                changes.update[row.key] = {
                    id: row.id,
                    original: row.original!,
                    values: row.values,
                };
            }
        }
        setErrors({});
        setProcessing(true);
        allowVisit.current = true;
        router.put(
            route('sroi.stages.batch-save', [program.id, 'outcome']),
            { sections: { outcomes: changes } },
            {
                preserveScroll: true,
                onSuccess: (page) => {
                    const refreshed = (
                        page.props as unknown as { sections: Section[] }
                    ).sections.find((item) => item.key === 'outcomes');
                    if (refreshed) setRows(initialRows(refreshed));
                    if (next)
                        router.visit(
                            route('sroi.programs.stage', [program.id, 'table']),
                        );
                },
                onError: setErrors,
                onFinish: () => {
                    allowVisit.current = false;
                    setProcessing(false);
                },
            },
        );
    }

    function nextStage() {
        if (processing) return;
        if (dirty) save(true);
        else router.visit(route('sroi.programs.stage', [program.id, 'table']));
    }

    function fitText(textarea: HTMLTextAreaElement | null) {
        if (!textarea) return;
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
    }

    function errorFor(row: Draft, field: string) {
        return errors[
            `sections.outcomes.${row.id === null ? 'create' : 'update'}.${row.key}.values.${field}`
        ];
    }

    const fieldClass =
        'block w-full border-0 bg-transparent p-0 text-sm leading-5 text-slate-900 focus:ring-2 focus:ring-[#006b3d] disabled:text-slate-700';
    const visibleRows = rows.filter((row) => !row.deleted);

    return (
        <div className="space-y-3 text-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex gap-2">
                    {canEdit && (
                        <button
                            type="button"
                            onClick={() => startCategory('new')}
                            disabled={processing}
                            className="inline-flex min-h-9 items-center gap-1 rounded-lg bg-[#006b3d] px-3 text-sm font-semibold text-white hover:bg-[#005630] disabled:opacity-50"
                        >
                            <Plus size={15} aria-hidden="true" /> Add Outcome
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => setWrapText((current) => !current)}
                        aria-pressed={wrapText}
                        className="min-h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 hover:bg-slate-50"
                    >
                        Wrap Text: {wrapText ? 'On' : 'Off'}
                    </button>
                </div>
                <button
                    type="button"
                    onClick={nextStage}
                    disabled={processing}
                    className="inline-flex items-center gap-1 text-xs text-slate-800 hover:text-[#006b3d] disabled:opacity-50"
                >
                    Next table sroi <ArrowRight size={16} aria-hidden="true" />
                </button>
            </div>
            {Object.entries(errors).map(([path, message]) => (
                <p
                    key={path}
                    role="alert"
                    className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
                >
                    {message}
                </p>
            ))}
            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                <table className="min-w-[1325px] table-fixed text-left text-sm">
                    <colgroup>
                        <col style={{ width: 40 }} />
                        {columns.map(({ field, width }) => (
                            <col key={field} style={{ width }} />
                        ))}
                    </colgroup>
                    <thead className="bg-slate-50 text-xs font-semibold">
                        <tr className="border-b border-slate-200">
                            <th rowSpan={2} scope="col" className="px-2 py-3">
                                <span className="sr-only">Aksi</span>
                            </th>
                            {columns.slice(0, 3).map(({ field, label }) => (
                                <th
                                    key={field}
                                    rowSpan={2}
                                    scope="col"
                                    className="border-r border-slate-200 px-3 py-3"
                                >
                                    {label}
                                </th>
                            ))}
                            <th
                                colSpan={5}
                                scope="colgroup"
                                className="px-3 py-3"
                            >
                                Uji Materialitas
                            </th>
                        </tr>
                        <tr className="border-b border-slate-200">
                            {columns.slice(3).map(({ field, label }) => (
                                <th
                                    key={field}
                                    scope="col"
                                    className="px-3 py-3"
                                >
                                    {label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 align-top">
                        {visibleRows.map((row, index) => (
                            <tr key={row.key}>
                                <td className="px-1 py-3">
                                    {canEdit && (
                                        <div className="flex flex-col items-start gap-1">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    startCategory(row.key)
                                                }
                                                aria-label={`Ubah kategori outcome baris ${index + 1}`}
                                                className="rounded border border-slate-200 p-1 text-slate-700 hover:border-[#006b3d] focus-visible:ring-2 focus-visible:ring-[#006b3d]"
                                            >
                                                <Pencil
                                                    size={13}
                                                    aria-hidden="true"
                                                />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => remove(row.key)}
                                                aria-label={`Hapus outcome baris ${index + 1}`}
                                                className="rounded border border-slate-200 p-1 text-slate-700 hover:border-red-500 focus-visible:ring-2 focus-visible:ring-red-600"
                                            >
                                                <Trash2
                                                    size={13}
                                                    aria-hidden="true"
                                                />
                                            </button>
                                        </div>
                                    )}
                                </td>
                                {columns.map(({ field, label }) => {
                                    const error = errorFor(row, field);
                                    const value = row.values[field];
                                    return (
                                        <td
                                            key={field}
                                            className="px-2 py-2 align-top"
                                        >
                                            {field === 'stakeholder_id' ? (
                                                <select
                                                    value={String(value ?? '')}
                                                    aria-label={`${label} baris ${index + 1}`}
                                                    aria-invalid={Boolean(
                                                        error,
                                                    )}
                                                    required
                                                    disabled={
                                                        !canEdit || processing
                                                    }
                                                    onChange={(event) =>
                                                        update(
                                                            row.key,
                                                            field,
                                                            event.target.value
                                                                ? Number(
                                                                      event
                                                                          .target
                                                                          .value,
                                                                  )
                                                                : null,
                                                        )
                                                    }
                                                    className={fieldClass}
                                                >
                                                    <option value="">
                                                        Pilih stakeholder
                                                    </option>
                                                    {(
                                                        section.choices
                                                            .stakeholder_id ??
                                                        []
                                                    ).map((choice) => (
                                                        <option
                                                            key={choice.id}
                                                            value={choice.id}
                                                        >
                                                            {choice.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : field in booleanLabels ? (
                                                <select
                                                    value={String(
                                                        Boolean(value),
                                                    )}
                                                    aria-label={`${label} baris ${index + 1}`}
                                                    aria-invalid={Boolean(
                                                        error,
                                                    )}
                                                    disabled={
                                                        !canEdit || processing
                                                    }
                                                    onChange={(event) =>
                                                        update(
                                                            row.key,
                                                            field,
                                                            event.target
                                                                .value ===
                                                                'true',
                                                        )
                                                    }
                                                    className={fieldClass}
                                                >
                                                    <option value="true">
                                                        {
                                                            booleanLabels[
                                                                field
                                                            ][0]
                                                        }
                                                    </option>
                                                    <option value="false">
                                                        {
                                                            booleanLabels[
                                                                field
                                                            ][1]
                                                        }
                                                    </option>
                                                </select>
                                            ) : (
                                                <textarea
                                                    ref={fitText}
                                                    rows={1}
                                                    maxLength={
                                                        field === 'name'
                                                            ? 255
                                                            : 10000
                                                    }
                                                    required={
                                                        field !==
                                                        'materiality_explanation'
                                                    }
                                                    value={String(value ?? '')}
                                                    aria-label={`${label} baris ${index + 1}`}
                                                    aria-invalid={Boolean(
                                                        error,
                                                    )}
                                                    disabled={
                                                        !canEdit || processing
                                                    }
                                                    onChange={(event) =>
                                                        update(
                                                            row.key,
                                                            field,
                                                            event.target.value,
                                                        )
                                                    }
                                                    className={`${fieldClass} resize-none ${wrapText ? 'whitespace-pre-wrap [overflow-wrap:anywhere]' : 'overflow-x-auto whitespace-nowrap [overflow-wrap:normal]'}`}
                                                />
                                            )}
                                            {error && (
                                                <p
                                                    role="alert"
                                                    className="mt-1 text-xs text-red-700"
                                                >
                                                    {error}
                                                </p>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                        {visibleRows.length === 0 && (
                            <tr>
                                <td
                                    colSpan={9}
                                    className="px-4 py-8 text-center text-slate-500"
                                >
                                    Belum ada outcome. Pilih Add Outcome untuk
                                    menambahkan data.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            {canEdit && (
                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={() => save()}
                        disabled={!dirty || processing}
                        className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-[#006b3d] px-4 text-sm font-semibold text-white hover:bg-[#005630] disabled:opacity-50"
                    >
                        <Save size={16} aria-hidden="true" /> Save
                    </button>
                </div>
            )}
            <Dialog
                open={categoryTarget !== null}
                onClose={() => setCategoryTarget(null)}
                className="relative z-50"
            >
                <div
                    className="fixed inset-0 bg-slate-950/40"
                    aria-hidden="true"
                />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <DialogPanel className="w-full max-w-md space-y-4 rounded-xl bg-white p-6 shadow-xl">
                        <DialogTitle className="text-lg font-semibold">
                            {categoryTarget === 'new'
                                ? 'Add Outcome'
                                : 'Ubah Kategori Outcome'}
                        </DialogTitle>
                        <label className="block space-y-2 text-sm font-medium">
                            Kategori Outcome
                            <select
                                value={categoryId}
                                onChange={(event) =>
                                    setCategoryId(event.target.value)
                                }
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-[#006b3d] focus:ring-[#006b3d]"
                            >
                                <option value="">Pilih kategori outcome</option>
                                {(
                                    section.choices.outcome_category_id ?? []
                                ).map((choice) => (
                                    <option key={choice.id} value={choice.id}>
                                        {choice.name}
                                    </option>
                                ))}
                            </select>
                        </label>
                        {(section.choices.outcome_category_id ?? []).length ===
                            0 && (
                            <p className="text-sm text-amber-800">
                                Belum ada kategori outcome aktif untuk program
                                ini.
                            </p>
                        )}
                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setCategoryTarget(null)}
                                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={applyCategory}
                                disabled={!categoryId}
                                className="rounded-lg bg-[#006b3d] px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                            >
                                Lanjutkan
                            </button>
                        </div>
                    </DialogPanel>
                </div>
            </Dialog>
        </div>
    );
}
