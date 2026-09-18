import { ReactNode, useMemo } from 'react';

interface QuestionScoreItem {
    id: string;
    question: string;
    score: number;
    importance: number;
    performance: number;
}

interface ServingQualityProps {
    questionScores: QuestionScoreItem[];
}

function formatMetric(value: number | null): string {
    if (value === null || !Number.isFinite(value)) {
        return '-';
    }

    return value.toFixed(2);
}

export default function ServingQuality({
    questionScores,
}: ServingQualityProps): ReactNode {
    const rows = useMemo(
        () =>
            questionScores.map((item) => {
                const servingQuality = item.performance - item.importance;
                const suitabilityIndex =
                    item.importance > 0
                        ? item.performance / item.importance
                        : null;

                return {
                    id: item.id,
                    servingQuality,
                    suitabilityIndex,
                    average: (item.importance + item.performance) / 2,
                };
            }),
        [questionScores],
    );

    if (rows.length === 0) {
        return (
            <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
                <p className="py-8 text-center text-sm text-slate-400">
                    Belum ada data Serving Quality.
                </p>
            </div>
        );
    }

    return (
        <section className="overflow-hidden bg-white shadow-sm">
            <div className="border-b border-emerald-200 bg-gradient-to-r from-emerald-50 to-white px-4 py-4">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
                        Analisis Indikator
                    </p>
                    <h3 className="mt-1 text-lg font-bold text-slate-900">
                        Serving Quality dan TKI
                    </h3>
                </div>
            </div>

            <div className="overflow-x-auto p-3 lg:overflow-visible lg:p-4">
                <table className="min-w-[560px] text-xs lg:w-full lg:min-w-0 lg:table-fixed">
                    <thead>
                        <tr>
                            <th className="sticky left-0 z-20 w-40 border border-emerald-200 bg-emerald-700 px-2 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white">
                                Metrik
                            </th>
                            <th
                                className="border border-emerald-200 bg-emerald-700 px-2 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-white"
                                colSpan={rows.length}
                            >
                                Indikator IKM
                            </th>
                        </tr>
                        <tr>
                            <th className="sticky left-0 z-20 border border-slate-200 bg-slate-50 px-2 py-2 text-left text-[10px] font-semibold text-slate-500">
                                Nilai per indikator
                            </th>
                            {rows.map((row) => (
                                <th
                                    key={row.id}
                                    className="border border-slate-200 bg-slate-50 px-2 py-2 text-center text-[11px] font-bold text-slate-700"
                                >
                                    {row.id}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <th className="sticky left-0 z-10 border border-slate-200 bg-white px-2 py-2 text-left">
                                <p className="text-[11px] font-bold text-slate-900">
                                    Serving Quality
                                </p>
                            </th>
                            {rows.map((row) => (
                                <td
                                    key={`${row.id}-serving-quality`}
                                    className={`border border-slate-200 px-2 py-2 text-center ${
                                        row.servingQuality > 0
                                            ? 'bg-sky-50 text-sky-900'
                                            : 'bg-white text-slate-700'
                                    }`}
                                >
                                    <p className="text-[11px] font-bold">
                                        {formatMetric(row.servingQuality)}
                                    </p>
                                </td>
                            ))}
                        </tr>
                        <tr>
                            <th className="sticky left-0 z-10 border border-slate-200 bg-white px-2 py-2 text-left">
                                <p className="text-[11px] font-bold text-slate-900">
                                    Tingkat Kesesuaian Indikator
                                </p>
                            </th>
                            {rows.map((row) => (
                                <td
                                    key={`${row.id}-suitability-index`}
                                    className={`border border-slate-200 px-2 py-2 text-center ${
                                        row.suitabilityIndex !== null &&
                                        row.suitabilityIndex > 1
                                            ? 'bg-emerald-50 text-emerald-900'
                                            : 'bg-white text-slate-700'
                                    }`}
                                >
                                    <p className="text-[11px] font-bold">
                                        {formatMetric(row.suitabilityIndex)}
                                    </p>
                                </td>
                            ))}
                        </tr>
                        <tr className="bg-amber-50/70">
                            <th className="sticky left-0 z-10 border border-amber-200 bg-amber-50 px-2 py-2 text-left">
                                <p className="text-[11px] font-bold text-amber-950">
                                    Rerata
                                </p>
                            </th>
                            {rows.map((row) => (
                                <td
                                    key={`${row.id}-average`}
                                    className="border border-amber-200 px-2 py-2 text-center text-amber-950"
                                >
                                    <p className="text-[11px] font-bold">
                                        {formatMetric(row.average)}
                                    </p>
                                </td>
                            ))}
                        </tr>
                    </tbody>
                </table>
            </div>
        </section>
    );
}
