import { Info } from 'lucide-react';
import { Fragment, ReactNode } from 'react';

interface AspectCell {
    count: number;
    percentage: number;
}

interface AspectRow {
    value: number;
    label: string;
    aspects: Record<string, AspectCell>;
    total: AspectCell;
}

interface SloiAspectAnalysis {
    aspects: string[];
    rows: AspectRow[];
    totals: {
        aspects: Record<string, AspectCell>;
        total: AspectCell;
    };
    summary: {
        positivePercentage: number;
        doubtPercentage: number;
        doubtfulAspect: string | null;
    };
}

interface SLOIAspectTableProps {
    data: SloiAspectAnalysis | null;
}

const ASPECT_COLORS = [
    'bg-slate-100 text-slate-900',
    'bg-emerald-800 text-white',
    'bg-amber-200 text-slate-900',
    'bg-lime-300 text-slate-900',
];

function formatPercentage(value: number): string {
    if (value === 0 || value === 100) {
        return `${value.toFixed(0)}%`;
    }

    return `${value.toFixed(2)}%`;
}

function getRowClass(value: number): string {
    if (value >= 4) {
        return 'bg-lime-50';
    }

    if (value === 3) {
        return 'bg-slate-50';
    }

    return 'bg-amber-50/60';
}

export default function SLOIAspectTable({
    data,
}: SLOIAspectTableProps): ReactNode {
    if (!data || data.aspects.length === 0 || data.rows.length === 0) {
        return (
            <div className="h-full rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
                <div className="flex h-full min-h-[20rem] flex-col items-center justify-center text-center">
                    <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-slate-50">
                        <Info className="size-6 text-slate-300" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">
                        Pengolahan dan Analisis Data
                    </h3>
                    <p className="mt-2 max-w-sm text-xs text-slate-400">
                        Belum tersedia. Data aspect akan muncul setelah survei
                        SLOI memiliki jawaban.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full rounded-xl border border-slate-100 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
                <h3 className="text-base font-bold text-slate-900">
                    Pengolahan dan Analisis Data
                </h3>
                <p className="mt-0.5 text-xs text-slate-400">
                    Distribusi persepsi stakeholder berdasarkan aspect SLOI.
                </p>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] border-collapse text-xs">
                    <thead>
                        <tr>
                            <th
                                rowSpan={2}
                                className="border border-slate-200 bg-teal-900 px-3 py-2 text-left font-bold text-white"
                            >
                                Persepsi Stakeholder
                            </th>
                            {data.aspects.map((aspect, index) => (
                                <th
                                    key={aspect}
                                    colSpan={2}
                                    className={`border border-slate-200 px-3 py-2 text-center font-bold ${ASPECT_COLORS[index % ASPECT_COLORS.length]}`}
                                >
                                    {aspect}
                                </th>
                            ))}
                            <th
                                colSpan={2}
                                className="border border-slate-200 bg-slate-100 px-3 py-2 text-center font-bold text-slate-900"
                            >
                                Total
                            </th>
                        </tr>
                        <tr className="bg-slate-100 text-slate-700">
                            {data.aspects.map((aspect) => (
                                <Fragment key={aspect}>
                                    <th className="border border-slate-200 px-2 py-1.5 text-center font-bold">
                                        Jumlah
                                    </th>
                                    <th className="border border-slate-200 px-2 py-1.5 text-center font-bold">
                                        %
                                    </th>
                                </Fragment>
                            ))}
                            <th className="border border-slate-200 px-2 py-1.5 text-center font-bold">
                                Jumlah
                            </th>
                            <th className="border border-slate-200 px-2 py-1.5 text-center font-bold">
                                %
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.rows.map((row) => (
                            <tr
                                key={row.value}
                                className={getRowClass(row.value)}
                            >
                                <td className="border border-slate-200 px-3 py-1.5 font-medium text-slate-700">
                                    {row.label}
                                </td>
                                {data.aspects.map((aspect) => {
                                    const cell = row.aspects[aspect] ?? {
                                        count: 0,
                                        percentage: 0,
                                    };

                                    return (
                                        <Fragment
                                            key={`${row.value}-${aspect}`}
                                        >
                                            <td className="border border-slate-200 px-2 py-1.5 text-center text-slate-700">
                                                {cell.count}
                                            </td>
                                            <td className="border border-slate-200 px-2 py-1.5 text-center text-slate-700">
                                                {formatPercentage(
                                                    cell.percentage,
                                                )}
                                            </td>
                                        </Fragment>
                                    );
                                })}
                                <td className="border border-slate-200 px-2 py-1.5 text-center font-bold text-slate-900">
                                    {row.total.count}
                                </td>
                                <td className="border border-slate-200 px-2 py-1.5 text-center font-bold text-slate-900">
                                    {formatPercentage(row.total.percentage)}
                                </td>
                            </tr>
                        ))}
                        <tr className="bg-slate-100 font-bold text-slate-900">
                            <td className="border border-slate-200 px-3 py-1.5">
                                Jumlah
                            </td>
                            {data.aspects.map((aspect) => {
                                const total = data.totals.aspects[aspect] ?? {
                                    count: 0,
                                    percentage: 0,
                                };

                                return (
                                    <Fragment key={`${aspect}-total`}>
                                        <td className="border border-slate-200 px-2 py-1.5 text-center">
                                            {total.count}
                                        </td>
                                        <td className="border border-slate-200 px-2 py-1.5 text-center">
                                            {formatPercentage(total.percentage)}
                                        </td>
                                    </Fragment>
                                );
                            })}
                            <td className="border border-slate-200 px-2 py-1.5 text-center">
                                {data.totals.total.count}
                            </td>
                            <td className="border border-slate-200 px-2 py-1.5 text-center">
                                {formatPercentage(data.totals.total.percentage)}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-4">
                <p className="text-sm leading-relaxed text-slate-600">
                    Analisis persepsi menunjukkan kesimpulan bahwa{' '}
                    <span className="font-bold text-slate-900">
                        {formatPercentage(data.summary.positivePercentage)}
                    </span>{' '}
                    masyarakat menunjukkan dukungan positif terhadap perusahaan,
                    sedangkan masih ada{' '}
                    <span className="font-bold text-slate-900">
                        {formatPercentage(data.summary.doubtPercentage)}
                    </span>{' '}
                    masyarakat masih menyatakan keraguan. Terutama pada aspek{' '}
                    <span className="font-bold text-slate-900">
                        {data.summary.doubtfulAspect ?? '-'}
                    </span>
                    .
                </p>
            </div>
        </div>
    );
}
