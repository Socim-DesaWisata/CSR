import StageFrame from '@/Components/Sroi/StageFrame';
import type { Row, Section, StageProps, Value } from '@/Components/Sroi/types';
import { router } from '@inertiajs/react';
import { Save } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

type Activity = {
    activity_id: number;
    activity: string;
    output: string | null;
    roadmap_item_id: number | null;
};
type Values = {
    target_quantity: string;
    unit: string;
    output_quantity: string;
    output_unit: string;
};
type Cell = {
    id: number | null;
    itemId: number | null;
    values: Values;
    original: Values;
};
type Props = StageProps & { roadmapActivities: Activity[] };
const fields: (keyof Values)[] = [
    'target_quantity',
    'unit',
    'output_quantity',
    'output_unit',
];
const keyFor = (activityId: number, year: number) => `${activityId}-${year}`;

function rows(sections: Section[], key: string): Row[] {
    return sections.find((section) => section.key === key)?.rows ?? [];
}

function valuesFor(row?: Row): Values {
    return {
        target_quantity: String(row?.target_quantity ?? ''),
        unit: String(row?.unit ?? ''),
        output_quantity: String(row?.output_quantity ?? ''),
        output_unit: String(row?.output_unit ?? ''),
    };
}

function initialCells(
    activities: Activity[],
    sections: Section[],
    years: number[],
): Record<string, Cell> {
    const targets = new Map(
        rows(sections, 'targets').map((row) => [
            `${row.roadmap_item_id}-${row.year}`,
            row,
        ]),
    );
    return Object.fromEntries(
        activities.flatMap((activity) =>
            years.map((year) => {
                const itemId = activity.roadmap_item_id;
                const row = itemId
                    ? targets.get(`${itemId}-${year}`)
                    : undefined;
                const values = valuesFor(row);
                return [
                    keyFor(activity.activity_id, year),
                    {
                        id: row?.id ?? null,
                        itemId,
                        values,
                        original: { ...values },
                    },
                ];
            }),
        ),
    );
}

export default function Roadmap(props: Props) {
    return (
        <RoadmapTable
            key={`${props.program.id}-${props.program.start_year}-${props.program.end_year}`}
            {...props}
        />
    );
}

function RoadmapTable({
    program,
    sections,
    roadmapActivities,
    documents,
    exports,
    canEdit,
}: Props) {
    const years = useMemo(
        () =>
            Array.from(
                { length: program.end_year - program.start_year + 1 },
                (_, index) => program.start_year + index,
            ),
        [program.start_year, program.end_year],
    );
    const [cells, setCells] = useState(() =>
        initialCells(roadmapActivities, sections, years),
    );
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState('');
    const [widths, setWidths] = useState<Record<string, number>>({
        activity: 220,
        output: 240,
    });
    const resizing = useRef<{
        field: string;
        startX: number;
        width: number;
    } | null>(null);
    const preserveEdits = useRef(false);

    useEffect(() => {
        if (!preserveEdits.current) {
            setCells(initialCells(roadmapActivities, sections, years));
        }
    }, [sections, roadmapActivities, years]);

    const dirty = Object.values(cells).some((cell) =>
        fields.some((field) => cell.values[field] !== cell.original[field]),
    );

    function update(
        activityId: number,
        year: number,
        field: keyof Values,
        value: string,
    ) {
        const key = keyFor(activityId, year);
        setCells((current) => ({
            ...current,
            [key]: {
                ...current[key],
                values: { ...current[key].values, [field]: value },
            },
        }));
    }

    function save() {
        const itemCreates: Record<string, { values: Record<string, Value> }> =
            {};
        const targetCreates: Record<string, { values: Record<string, Value> }> =
            {};
        const targetUpdates: Record<
            string,
            {
                id: number;
                original: Record<string, Value>;
                values: Record<string, Value>;
            }
        > = {};

        for (const activity of roadmapActivities) {
            for (const year of years) {
                const cell = cells[keyFor(activity.activity_id, year)];
                if (
                    !fields.some(
                        (field) => cell.values[field] !== cell.original[field],
                    )
                )
                    continue;
                if (
                    !cell.id &&
                    fields.every((field) => cell.values[field] === '')
                )
                    continue;

                const draftKey = `activity-${activity.activity_id}`;
                if (!cell.itemId) {
                    itemCreates[draftKey] = {
                        values: { lfa_activity_id: activity.activity_id },
                    };
                }
                const values: Record<string, Value> = {
                    roadmap_item_id: cell.itemId ?? `@draft:${draftKey}`,
                    year,
                    ...Object.fromEntries(
                        fields.map((field) => [
                            field,
                            cell.values[field] || null,
                        ]),
                    ),
                };
                if (cell.id) {
                    targetUpdates[String(cell.id)] = {
                        id: cell.id,
                        original: {
                            roadmap_item_id: String(cell.itemId),
                            year: String(year),
                            ...cell.original,
                        },
                        values,
                    };
                } else {
                    targetCreates[`target-${activity.activity_id}-${year}`] = {
                        values,
                    };
                }
            }
        }

        setError('');
        setProcessing(true);
        router.put(
            route('sroi.stages.batch-save', [program.id, 'roadmap']),
            {
                sections: {
                    items: { create: itemCreates, update: {}, delete: {} },
                    targets: {
                        create: targetCreates,
                        update: targetUpdates,
                        delete: {},
                    },
                },
            },
            {
                preserveScroll: true,
                onStart: () => {
                    preserveEdits.current = false;
                },
                onError: (errors) => {
                    preserveEdits.current = true;
                    setError(Object.values(errors).join(' '));
                },
                onFinish: () => setProcessing(false),
            },
        );
    }

    function handle(field: string, label: string) {
        return (
            <button
                type="button"
                aria-label={`Ubah lebar kolom ${label}`}
                className="absolute inset-y-0 right-0 w-2 cursor-col-resize touch-none focus-visible:ring-2 focus-visible:ring-emerald-600"
                onPointerDown={(event) => {
                    if (event.button !== 0) return;
                    resizing.current = {
                        field,
                        startX: event.clientX,
                        width: widths[field] ?? 135,
                    };
                    event.currentTarget.setPointerCapture(event.pointerId);
                }}
                onPointerMove={(event) => {
                    const drag = resizing.current;
                    if (drag?.field === field) {
                        setWidths((current) => ({
                            ...current,
                            [field]: Math.max(
                                90,
                                drag.width + event.clientX - drag.startX,
                            ),
                        }));
                    }
                }}
                onPointerUp={() => {
                    resizing.current = null;
                }}
                onPointerCancel={() => {
                    resizing.current = null;
                }}
                onKeyDown={(event) => {
                    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')
                        return;
                    event.preventDefault();
                    setWidths((current) => ({
                        ...current,
                        [field]: Math.max(
                            90,
                            (current[field] ?? 135) +
                                (event.key === 'ArrowRight' ? 10 : -10),
                        ),
                    }));
                }}
            />
        );
    }

    const columnKeys = years.flatMap((year) => [
        `target_quantity-${year}`,
        `unit-${year}`,
        `output_quantity-${year}`,
        `output_unit-${year}`,
    ]);
    const annualHeader = (year: number, field: keyof Values, label: string) => (
        <th key={`${field}-${year}`} className="relative px-2 py-2 font-medium">
            {label}
            {handle(
                `${field}-${year}`,
                `${field.startsWith('output') ? 'Output' : 'Target Tahunan'} ${label} ${year}`,
            )}
        </th>
    );
    const annualInput = (
        activity: Activity,
        year: number,
        field: keyof Values,
    ) => (
        <td key={`${year}-${field}`} className="px-2 py-2">
            <input
                type={field.endsWith('quantity') ? 'number' : 'text'}
                min={field.endsWith('quantity') ? 0 : undefined}
                step={field.endsWith('quantity') ? 'any' : undefined}
                value={cells[keyFor(activity.activity_id, year)].values[field]}
                onChange={(event) =>
                    update(
                        activity.activity_id,
                        year,
                        field,
                        event.target.value,
                    )
                }
                disabled={!canEdit || processing}
                aria-label={`${field.startsWith('output') ? 'Output' : 'Target Tahunan'} ${field.endsWith('quantity') ? 'QTY' : 'Jenis Satuan'} ${year}: ${activity.activity}`}
                className="w-full rounded border border-slate-300 px-2 py-1.5 text-xs disabled:border-transparent disabled:bg-transparent"
            />
        </td>
    );

    return (
        <StageFrame
            program={program}
            stage="roadmap"
            title="Roadmap"
            documents={documents}
            exports={exports}
            canEdit={canEdit}
        >
            <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 className="text-sm font-bold text-slate-900">
                            Rencana Program: Indikator & Target
                        </h2>
                        <p className="mt-1 text-xs text-slate-500">
                            Periode {program.start_year}–{program.end_year} ·
                            Aktivitas dari LFA
                        </p>
                    </div>
                    {canEdit && (
                        <button
                            type="button"
                            onClick={save}
                            disabled={!dirty || processing}
                            className="inline-flex items-center gap-2 rounded-lg bg-emerald-800 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-900 disabled:opacity-50"
                        >
                            <Save size={14} aria-hidden="true" />{' '}
                            {processing ? 'Menyimpan…' : 'Simpan'}
                        </button>
                    )}
                </div>
                {error && (
                    <p
                        role="alert"
                        className="rounded-md bg-red-50 p-3 text-xs text-red-700"
                    >
                        {error}
                    </p>
                )}
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="w-max min-w-full table-fixed text-left text-xs">
                        <colgroup>
                            <col style={{ width: 54 }} />
                            <col style={{ width: widths.activity }} />
                            <col style={{ width: widths.output }} />
                            {years.flatMap((year) => [
                                <col
                                    key={`target_quantity-${year}`}
                                    style={{
                                        width:
                                            widths[`target_quantity-${year}`] ??
                                            135,
                                    }}
                                />,
                                <col
                                    key={`unit-${year}`}
                                    style={{
                                        width: widths[`unit-${year}`] ?? 135,
                                    }}
                                />,
                                <col
                                    key={`output_quantity-${year}`}
                                    style={{
                                        width:
                                            widths[`output_quantity-${year}`] ??
                                            135,
                                    }}
                                />,
                                <col
                                    key={`output_unit-${year}`}
                                    style={{
                                        width:
                                            widths[`output_unit-${year}`] ??
                                            135,
                                    }}
                                />,
                            ])}
                        </colgroup>
                        <thead className="bg-slate-50 text-slate-800">
                            <tr className="border-b border-slate-200">
                                <th rowSpan={3} className="px-3 py-2">
                                    No
                                </th>
                                <th rowSpan={3} className="relative px-3 py-2">
                                    Aktivitas{handle('activity', 'Aktivitas')}
                                </th>
                                <th rowSpan={3} className="relative px-3 py-2">
                                    Output{handle('output', 'Output')}
                                </th>
                                {years.map((year) => (
                                    <th
                                        key={year}
                                        colSpan={4}
                                        className="px-3 py-2 text-center"
                                    >
                                        {year}
                                    </th>
                                ))}
                            </tr>
                            <tr className="border-b border-slate-200">
                                {years.flatMap((year) => [
                                    <th
                                        key={`target-${year}`}
                                        colSpan={2}
                                        className="px-2 py-2 text-center"
                                    >
                                        Target Tahunan
                                    </th>,
                                    <th
                                        key={`output-${year}`}
                                        colSpan={2}
                                        className="px-2 py-2 text-center"
                                    >
                                        Output
                                    </th>,
                                ])}
                            </tr>
                            <tr className="border-b border-slate-200">
                                {years.flatMap((year) => [
                                    annualHeader(
                                        year,
                                        'target_quantity',
                                        'QTY',
                                    ),
                                    annualHeader(year, 'unit', 'Jenis Satuan'),
                                    annualHeader(
                                        year,
                                        'output_quantity',
                                        'QTY',
                                    ),
                                    annualHeader(
                                        year,
                                        'output_unit',
                                        'Jenis Satuan',
                                    ),
                                ])}
                            </tr>
                        </thead>
                        <tbody>
                            {roadmapActivities.map((activity, index) => (
                                <tr
                                    key={activity.activity_id}
                                    className="border-b border-slate-100 align-top last:border-0"
                                >
                                    <td className="px-3 py-2">{index + 1}</td>
                                    <td className="whitespace-normal break-words px-3 py-2">
                                        {activity.activity}
                                    </td>
                                    <td className="whitespace-normal break-words px-3 py-2">
                                        {activity.output || '—'}
                                    </td>
                                    {years.flatMap((year) => [
                                        annualInput(
                                            activity,
                                            year,
                                            'target_quantity',
                                        ),
                                        annualInput(activity, year, 'unit'),
                                        annualInput(
                                            activity,
                                            year,
                                            'output_quantity',
                                        ),
                                        annualInput(
                                            activity,
                                            year,
                                            'output_unit',
                                        ),
                                    ])}
                                </tr>
                            ))}
                            {roadmapActivities.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={columnKeys.length + 3}
                                        className="px-4 py-10 text-center text-slate-500"
                                    >
                                        Belum ada Activity pada LFA.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </StageFrame>
    );
}
