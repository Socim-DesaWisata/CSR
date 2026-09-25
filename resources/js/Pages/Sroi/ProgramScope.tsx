import StageFrame from '@/Components/Sroi/StageFrame';
import type { Row, Section, StageProps, Value } from '@/Components/Sroi/types';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { router } from '@inertiajs/react';
import { ArrowRight, Plus, Save, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';

type Values = Record<string, Value>;
type Changes = {
    create: Record<string, { values: Values }>;
    update: Record<string, { id: number; original: Values; values: Values }>;
    delete: Record<string, { id: number; original: Values }>;
};
type Investment = {
    key: string;
    id: number | null;
    values: Values;
    original?: Values;
    amounts: Record<number, string>;
    deleted: boolean;
};
const scopeFields = [
    'assessment_type',
    'evaluative_start_year',
    'evaluative_end_year',
    'forecast_start_year',
    'forecast_end_year',
    'scope_text',
];
const investmentFields = [
    'investor_name',
    'contribution_type',
    'form',
    'currency_code',
];
const yearFields = ['investment_id', 'year', 'amount'];
const emptyChanges = (): Changes => ({ create: {}, update: {}, delete: {} });
const valuesOf = (row: Row, fields: string[]): Values =>
    Object.fromEntries(fields.map((field) => [field, row[field] ?? null]));
const rowsFor = (sections: Section[], key: string): Row[] =>
    sections.find((section) => section.key === key)?.rows ?? [];
const format = (amount: number, currency: string) =>
    `${currency} ${new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 }).format(amount)}`;

function initialScope(sections: Section[], start: number, end: number): Values {
    const row = rowsFor(sections, 'scopes')[0];
    return row
        ? valuesOf(row, scopeFields)
        : {
              assessment_type: 'evaluative',
              evaluative_start_year: start,
              evaluative_end_year: end,
              forecast_start_year: null,
              forecast_end_year: null,
              scope_text: '',
          };
}

function initialInvestments(sections: Section[]): Investment[] {
    const annual = rowsFor(sections, 'investment-years');
    return rowsFor(sections, 'investments').map((row) => ({
        key: String(row.id),
        id: row.id,
        deleted: false,
        values: valuesOf(row, investmentFields),
        original: valuesOf(row, investmentFields),
        amounts: Object.fromEntries(
            annual
                .filter((entry) => Number(entry.investment_id) === row.id)
                .map((entry) => [
                    Number(entry.year),
                    String(entry.amount ?? ''),
                ]),
        ),
    }));
}

export default function ProgramScope(props: StageProps) {
    return <ScopeEditor key={props.program.id} {...props} />;
}

function ScopeEditor({
    program,
    sections,
    documents,
    exports,
    canEdit,
}: StageProps) {
    const [tab, setTab] = useState<'scope' | 'investment'>('scope');
    const [scope, setScope] = useState<Values>(() =>
        initialScope(sections, program.start_year, program.end_year),
    );
    const [investments, setInvestments] = useState<Investment[]>(() =>
        initialInvestments(sections),
    );
    const [periodOpen, setPeriodOpen] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);
    const nextKey = useRef(0);
    const savedScope = rowsFor(sections, 'scopes')[0];
    const annualRows = rowsFor(sections, 'investment-years');
    const activePeriods =
        scope.assessment_type === 'both'
            ? ['evaluative', 'forecast']
            : [String(scope.assessment_type)];
    const periodYears = activePeriods.map((period) => {
        const start = Number(scope[`${period}_start_year`]);
        const end = Number(scope[`${period}_end_year`]);
        return {
            period,
            years:
                start > 0 && end >= start && end - start < 100
                    ? Array.from(
                          { length: end - start + 1 },
                          (_, index) => start + index,
                      )
                    : [],
        };
    });
    const years = [
        ...new Set(
            periodYears.flatMap(({ years: periodRange }) => periodRange),
        ),
    ].sort((left, right) => left - right);
    const currency = (row: Investment) =>
        String(row.values.currency_code || 'IDR');
    const amount = (row: Investment, year: number) =>
        Number(row.amounts[year] || 0);
    const currencies = [
        ...new Set(investments.filter((row) => !row.deleted).map(currency)),
    ];
    const inputClass =
        'w-full min-w-0 rounded-md border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-900 focus:border-emerald-600 focus:ring-emerald-600 disabled:bg-slate-50';

    function changeInvestment(
        key: string,
        change: (row: Investment) => Investment,
    ) {
        setInvestments((current) =>
            current.map((row) => (row.key === key ? change(row) : row)),
        );
    }

    function save(next: 'investment' | 'general' | null = null) {
        const scopes = emptyChanges();
        const investmentChanges = emptyChanges();
        const annualChanges = emptyChanges();
        const scopeValues = { ...scope };
        for (const period of ['evaluative', 'forecast']) {
            if (!activePeriods.includes(period)) {
                scopeValues[`${period}_start_year`] = null;
                scopeValues[`${period}_end_year`] = null;
            }
        }
        if (savedScope) {
            const original = valuesOf(savedScope, scopeFields);
            if (JSON.stringify(scopeValues) !== JSON.stringify(original)) {
                scopes.update[String(savedScope.id)] = {
                    id: savedScope.id,
                    original,
                    values: scopeValues,
                };
            }
        } else {
            scopes.create.scope = { values: scopeValues };
        }

        for (const row of investments) {
            const reference = row.id ?? `@draft:${row.key}`;
            if (row.deleted) {
                if (row.id !== null) {
                    investmentChanges.delete[row.key] = {
                        id: row.id,
                        original: row.original!,
                    };
                    for (const old of annualRows.filter(
                        (entry) => Number(entry.investment_id) === row.id,
                    )) {
                        annualChanges.delete[String(old.id)] = {
                            id: old.id,
                            original: valuesOf(old, yearFields),
                        };
                    }
                }
                continue;
            }
            if (row.id === null)
                investmentChanges.create[row.key] = { values: row.values };
            else if (
                JSON.stringify(row.values) !== JSON.stringify(row.original)
            ) {
                investmentChanges.update[row.key] = {
                    id: row.id,
                    original: row.original!,
                    values: row.values,
                };
            }
            for (const year of years) {
                const old = annualRows.find(
                    (entry) =>
                        Number(entry.investment_id) === row.id &&
                        Number(entry.year) === year,
                );
                const value =
                    row.amounts[year] === '' || row.amounts[year] === undefined
                        ? null
                        : row.amounts[year];
                const values: Values = {
                    investment_id: reference,
                    year,
                    amount: value,
                };
                if (old && String(old.amount ?? '') !== String(value ?? '')) {
                    annualChanges.update[String(old.id)] = {
                        id: old.id,
                        original: valuesOf(old, yearFields),
                        values,
                    };
                } else if (!old && (row.id === null || value !== null)) {
                    annualChanges.create[`year-${row.key}-${year}`] = {
                        values,
                    };
                }
            }
        }

        setErrors({});
        setProcessing(true);
        router.put(
            route('sroi.stages.batch-save', [program.id, 'scope']),
            {
                sections: {
                    scopes,
                    investments: investmentChanges,
                    'investment-years': annualChanges,
                },
            },
            {
                preserveScroll: true,
                onSuccess: (page) => {
                    const updated = (
                        page.props as unknown as { sections: Section[] }
                    ).sections;
                    setScope(
                        initialScope(
                            updated,
                            program.start_year,
                            program.end_year,
                        ),
                    );
                    setInvestments(initialInvestments(updated));
                    if (next === 'investment') setTab('investment');
                    if (next === 'general')
                        router.visit(
                            route('sroi.programs.stage', [
                                program.id,
                                'stakeholder',
                            ]),
                        );
                },
                onError: setErrors,
                onFinish: () => setProcessing(false),
            },
        );
    }

    return (
        <StageFrame
            program={program}
            stage="scope"
            title="Program Scope"
            documents={documents}
            exports={exports}
            canEdit={canEdit}
        >
            <div className="space-y-4 text-sm text-slate-900">
                <div
                    role="tablist"
                    aria-label="Program Scope"
                    className="flex gap-2 overflow-x-auto border-b border-slate-200"
                >
                    {(
                        [
                            ['scope', 'Program Scope'],
                            ['investment', 'Investment Details'],
                        ] as const
                    ).map(([key, label]) => (
                        <button
                            key={key}
                            type="button"
                            role="tab"
                            aria-selected={tab === key}
                            onClick={() => setTab(key)}
                            className={`whitespace-nowrap border-b-2 px-4 py-3 font-medium ${tab === key ? 'border-emerald-700 text-emerald-800' : 'border-transparent text-slate-600 hover:text-emerald-700'}`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
                {Object.keys(errors).length > 0 && (
                    <div
                        role="alert"
                        className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-700"
                    >
                        {Object.values(errors).map((message, index) => (
                            <p key={index}>{message}</p>
                        ))}
                    </div>
                )}
                {tab === 'scope' ? (
                    <section
                        role="tabpanel"
                        aria-label="Program Scope"
                        className="overflow-hidden rounded-xl border border-slate-200 bg-white"
                    >
                        <h2 className="border-b border-slate-200 px-6 py-4 font-semibold">
                            Scope Program
                        </h2>
                        <div className="space-y-5 p-6">
                            <label className="block space-y-2 font-medium">
                                Calculation Type
                                <select
                                    disabled={!canEdit}
                                    className={inputClass}
                                    value={String(scope.assessment_type)}
                                    onChange={(event) =>
                                        setScope((current) => ({
                                            ...current,
                                            assessment_type: event.target.value,
                                        }))
                                    }
                                >
                                    <option value="evaluative">
                                        Evaluatif
                                    </option>
                                    <option value="forecast">Forecast</option>
                                    <option value="both">
                                        Evaluatif dan Forecast
                                    </option>
                                </select>
                            </label>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <span className="font-medium">
                                        Tahun mulai program
                                    </span>
                                    <p className="mt-1 text-slate-600">
                                        {program.start_year}
                                    </p>
                                </div>
                                <div>
                                    <span className="font-medium">
                                        Tahun akhir program
                                    </span>
                                    <p className="mt-1 text-slate-600">
                                        {program.end_year}
                                    </p>
                                </div>
                                {activePeriods.map((period) => (
                                    <div key={period} className="sm:col-span-2">
                                        <span className="font-medium">
                                            Periode{' '}
                                            {period === 'evaluative'
                                                ? 'Evaluatif'
                                                : 'Forecast'}
                                        </span>
                                        <p className="mt-1 text-slate-600">
                                            {scope[`${period}_start_year`] ??
                                                '—'}{' '}
                                            –{' '}
                                            {scope[`${period}_end_year`] ?? '—'}
                                        </p>
                                    </div>
                                ))}
                            </div>
                            {canEdit && (
                                <button
                                    type="button"
                                    onClick={() => setPeriodOpen(true)}
                                    className="rounded-md border border-emerald-700 px-3 py-2 font-medium text-emerald-800 hover:bg-emerald-50"
                                >
                                    Atur Periode
                                </button>
                            )}
                            <label className="block space-y-2 font-medium">
                                Scope of this SROI Assessment
                                <textarea
                                    disabled={!canEdit}
                                    className={inputClass}
                                    rows={4}
                                    value={String(scope.scope_text ?? '')}
                                    onChange={(event) =>
                                        setScope((current) => ({
                                            ...current,
                                            scope_text: event.target.value,
                                        }))
                                    }
                                />
                            </label>
                            {canEdit && (
                                <button
                                    type="button"
                                    disabled={processing}
                                    onClick={() => save('investment')}
                                    className="inline-flex items-center gap-2 rounded-md bg-emerald-800 px-5 py-2.5 font-semibold text-white hover:bg-emerald-900 disabled:opacity-50"
                                >
                                    Next <ArrowRight size={16} />
                                </button>
                            )}
                        </div>
                    </section>
                ) : (
                    <section
                        role="tabpanel"
                        aria-label="Investment Details"
                        className="space-y-3"
                    >
                        {canEdit && (
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setInvestments((current) => [
                                            ...current,
                                            {
                                                key: `new-${++nextKey.current}`,
                                                id: null,
                                                deleted: false,
                                                values: {
                                                    investor_name: '',
                                                    contribution_type: 'cash',
                                                    form: '',
                                                    currency_code: 'IDR',
                                                },
                                                amounts: {},
                                            },
                                        ])
                                    }
                                    className="inline-flex items-center gap-2 rounded-md border border-emerald-700 px-4 py-2 font-medium text-emerald-800 hover:bg-emerald-50"
                                >
                                    <Plus size={16} /> Tambah
                                </button>
                                <button
                                    type="button"
                                    disabled={processing}
                                    onClick={() => save()}
                                    className="inline-flex items-center gap-2 rounded-md bg-emerald-800 px-4 py-2 font-semibold text-white hover:bg-emerald-900 disabled:opacity-50"
                                >
                                    <Save size={16} /> Simpan
                                </button>
                            </div>
                        )}
                        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                            <table className="min-w-full table-fixed text-left text-xs">
                                <thead className="bg-slate-50 text-slate-900">
                                    <tr>
                                        {canEdit && (
                                            <th
                                                scope="col"
                                                rowSpan={3}
                                                className="w-12 px-2 py-3"
                                            >
                                                <span className="sr-only">
                                                    Aksi
                                                </span>
                                            </th>
                                        )}
                                        <th
                                            scope="col"
                                            rowSpan={3}
                                            className="min-w-36 px-2 py-3"
                                        >
                                            Investor
                                        </th>
                                        <th
                                            scope="col"
                                            rowSpan={3}
                                            className="min-w-36 px-2 py-3"
                                        >
                                            Bentuk
                                        </th>
                                        <th
                                            scope="col"
                                            rowSpan={3}
                                            className="min-w-40 px-2 py-3"
                                        >
                                            Deskripsi
                                        </th>
                                        <th
                                            scope="col"
                                            rowSpan={3}
                                            className="w-24 px-2 py-3"
                                        >
                                            Mata Uang
                                        </th>
                                        {periodYears
                                            .filter(
                                                ({ years: periodRange }) =>
                                                    periodRange.length > 0,
                                            )
                                            .map(
                                                ({
                                                    period,
                                                    years: periodRange,
                                                }) => (
                                                    <th
                                                        key={period}
                                                        scope="colgroup"
                                                        colSpan={
                                                            periodRange.length
                                                        }
                                                        className="border-l border-slate-200 px-2 py-2"
                                                    >
                                                        {period === 'evaluative'
                                                            ? 'Evaluatif'
                                                            : 'Forecast'}
                                                    </th>
                                                ),
                                            )}
                                        <th
                                            scope="col"
                                            rowSpan={3}
                                            className="min-w-40 px-2 py-3"
                                        >
                                            Jumlah Investasi Seluruhnya
                                        </th>
                                    </tr>
                                    <tr>
                                        {years.map((year) => (
                                            <th
                                                key={year}
                                                scope="col"
                                                className="min-w-36 border-l border-slate-200 px-2 py-2"
                                            >
                                                {year}
                                            </th>
                                        ))}
                                    </tr>
                                    <tr>
                                        {years.map((year) => (
                                            <th
                                                key={year}
                                                scope="col"
                                                className="border-l border-slate-200 px-2 py-2 font-normal text-slate-600"
                                            >
                                                Nominal
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {investments
                                        .filter((row) => !row.deleted)
                                        .map((row) => (
                                            <tr
                                                key={row.key}
                                                className="align-top"
                                            >
                                                {canEdit && (
                                                    <td className="px-2 py-2">
                                                        <button
                                                            type="button"
                                                            aria-label={`Hapus investasi ${row.values.investor_name || ''}`}
                                                            onClick={() =>
                                                                changeInvestment(
                                                                    row.key,
                                                                    (
                                                                        current,
                                                                    ) => ({
                                                                        ...current,
                                                                        deleted: true,
                                                                    }),
                                                                )
                                                            }
                                                            className="rounded border border-slate-200 p-1.5 text-slate-600 hover:text-red-700"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </td>
                                                )}
                                                <td className="p-2">
                                                    <input
                                                        aria-label="Investor"
                                                        disabled={!canEdit}
                                                        className={inputClass}
                                                        value={String(
                                                            row.values
                                                                .investor_name ??
                                                                '',
                                                        )}
                                                        onChange={(event) =>
                                                            changeInvestment(
                                                                row.key,
                                                                (current) => ({
                                                                    ...current,
                                                                    values: {
                                                                        ...current.values,
                                                                        investor_name:
                                                                            event
                                                                                .target
                                                                                .value,
                                                                    },
                                                                }),
                                                            )
                                                        }
                                                    />
                                                </td>
                                                <td className="p-2">
                                                    <select
                                                        aria-label="Bentuk"
                                                        disabled={!canEdit}
                                                        className={inputClass}
                                                        value={String(
                                                            row.values
                                                                .contribution_type,
                                                        )}
                                                        onChange={(event) =>
                                                            changeInvestment(
                                                                row.key,
                                                                (current) => ({
                                                                    ...current,
                                                                    values: {
                                                                        ...current.values,
                                                                        contribution_type:
                                                                            event
                                                                                .target
                                                                                .value,
                                                                    },
                                                                }),
                                                            )
                                                        }
                                                    >
                                                        <option value="cash">
                                                            Dana
                                                        </option>
                                                        <option value="in_kind">
                                                            Barang/Jasa
                                                        </option>
                                                        <option value="time">
                                                            Tenaga/Waktu
                                                        </option>
                                                    </select>
                                                </td>
                                                <td className="p-2">
                                                    <input
                                                        aria-label="Deskripsi"
                                                        disabled={!canEdit}
                                                        className={inputClass}
                                                        value={String(
                                                            row.values.form ??
                                                                '',
                                                        )}
                                                        onChange={(event) =>
                                                            changeInvestment(
                                                                row.key,
                                                                (current) => ({
                                                                    ...current,
                                                                    values: {
                                                                        ...current.values,
                                                                        form: event
                                                                            .target
                                                                            .value,
                                                                    },
                                                                }),
                                                            )
                                                        }
                                                    />
                                                </td>
                                                <td className="p-2">
                                                    <input
                                                        aria-label="Mata Uang"
                                                        disabled={!canEdit}
                                                        maxLength={3}
                                                        className={inputClass}
                                                        value={currency(row)}
                                                        onChange={(event) =>
                                                            changeInvestment(
                                                                row.key,
                                                                (current) => ({
                                                                    ...current,
                                                                    values: {
                                                                        ...current.values,
                                                                        currency_code:
                                                                            event.target.value.toUpperCase(),
                                                                    },
                                                                }),
                                                            )
                                                        }
                                                    />
                                                </td>
                                                {years.map((year) => (
                                                    <td
                                                        key={year}
                                                        className="p-2"
                                                    >
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            aria-label={`Nominal ${year} ${row.values.investor_name || ''}`}
                                                            disabled={!canEdit}
                                                            className={
                                                                inputClass
                                                            }
                                                            value={
                                                                row.amounts[
                                                                    year
                                                                ] ?? ''
                                                            }
                                                            onChange={(event) =>
                                                                changeInvestment(
                                                                    row.key,
                                                                    (
                                                                        current,
                                                                    ) => ({
                                                                        ...current,
                                                                        amounts:
                                                                            {
                                                                                ...current.amounts,
                                                                                [year]: event
                                                                                    .target
                                                                                    .value,
                                                                            },
                                                                    }),
                                                                )
                                                            }
                                                        />
                                                    </td>
                                                ))}
                                                <td className="p-2 font-semibold tabular-nums">
                                                    {format(
                                                        years.reduce(
                                                            (sum, year) =>
                                                                sum +
                                                                amount(
                                                                    row,
                                                                    year,
                                                                ),
                                                            0,
                                                        ),
                                                        currency(row),
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    {investments.every(
                                        (row) => row.deleted,
                                    ) && (
                                        <tr>
                                            <td
                                                colSpan={
                                                    years.length +
                                                    (canEdit ? 6 : 5)
                                                }
                                                className="px-4 py-8 text-center text-slate-500"
                                            >
                                                Belum ada investasi. Pilih
                                                Tambah untuk membuat baris.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                                <tfoot className="border-t border-slate-200 font-semibold">
                                    {currencies.map((code) => (
                                        <tr key={code}>
                                            <th
                                                scope="row"
                                                colSpan={canEdit ? 5 : 4}
                                                className="px-3 py-3 text-left"
                                            >
                                                Jumlah Investasi · {code}
                                            </th>
                                            {years.map((year) => (
                                                <td
                                                    key={year}
                                                    className="px-2 py-3 tabular-nums"
                                                >
                                                    {format(
                                                        investments
                                                            .filter(
                                                                (row) =>
                                                                    !row.deleted &&
                                                                    currency(
                                                                        row,
                                                                    ) === code,
                                                            )
                                                            .reduce(
                                                                (sum, row) =>
                                                                    sum +
                                                                    amount(
                                                                        row,
                                                                        year,
                                                                    ),
                                                                0,
                                                            ),
                                                        code,
                                                    )}
                                                </td>
                                            ))}
                                            <td className="px-2 py-3 tabular-nums">
                                                {format(
                                                    investments
                                                        .filter(
                                                            (row) =>
                                                                !row.deleted &&
                                                                currency(
                                                                    row,
                                                                ) === code,
                                                        )
                                                        .reduce(
                                                            (sum, row) =>
                                                                sum +
                                                                years.reduce(
                                                                    (
                                                                        annual,
                                                                        year,
                                                                    ) =>
                                                                        annual +
                                                                        amount(
                                                                            row,
                                                                            year,
                                                                        ),
                                                                    0,
                                                                ),
                                                            0,
                                                        ),
                                                    code,
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tfoot>
                            </table>
                        </div>
                        {canEdit && (
                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => save('general')}
                                    disabled={processing}
                                    className="inline-flex items-center gap-2 font-medium text-emerald-800 disabled:opacity-50"
                                >
                                    Next setup <ArrowRight size={16} />
                                </button>
                            </div>
                        )}
                    </section>
                )}
            </div>
            <Dialog
                open={periodOpen}
                onClose={setPeriodOpen}
                className="relative z-50"
            >
                <div
                    className="fixed inset-0 bg-slate-950/40"
                    aria-hidden="true"
                />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <DialogPanel className="w-full max-w-lg space-y-4 rounded-xl bg-white p-6 shadow-xl">
                        <DialogTitle className="text-lg font-semibold">
                            Atur Periode Penilaian
                        </DialogTitle>
                        {activePeriods.map((period) => (
                            <div key={period} className="space-y-2">
                                <h3 className="font-medium capitalize">
                                    {period}
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {(['start', 'end'] as const).map((edge) => (
                                        <label key={edge} className="text-sm">
                                            Tahun{' '}
                                            {edge === 'start'
                                                ? 'awal'
                                                : 'akhir'}
                                            <input
                                                type="number"
                                                min={program.start_year}
                                                max={program.end_year}
                                                className={inputClass}
                                                value={String(
                                                    scope[
                                                        `${period}_${edge}_year`
                                                    ] ?? '',
                                                )}
                                                onChange={(event) =>
                                                    setScope((current) => ({
                                                        ...current,
                                                        [`${period}_${edge}_year`]:
                                                            event.target
                                                                .value === ''
                                                                ? null
                                                                : Number(
                                                                      event
                                                                          .target
                                                                          .value,
                                                                  ),
                                                    }))
                                                }
                                            />
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}
                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={() => setPeriodOpen(false)}
                                className="rounded-md bg-emerald-800 px-4 py-2 font-semibold text-white"
                            >
                                Selesai
                            </button>
                        </div>
                    </DialogPanel>
                </div>
            </Dialog>
        </StageFrame>
    );
}
