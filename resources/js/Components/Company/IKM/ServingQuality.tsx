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
        <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900">
                    Analisis Serving Quality dan TKI
                </h3>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="size-3 rounded bg-blue-100 ring-1 ring-blue-200" />
                    Nilai memenuhi kriteria
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-sm">
                    <thead>
                        <tr>
                            <th className="w-56 border border-slate-300 bg-white px-3 py-2" />
                            <th
                                className="border border-slate-300 bg-green-50 px-3 py-2 text-center font-bold text-slate-900"
                                colSpan={rows.length}
                            >
                                Analisis Serving Quality dan TKI
                            </th>
                        </tr>
                        <tr>
                            <th className="border border-slate-300 bg-white px-3 py-2" />
                            {rows.map((row) => (
                                <th
                                    key={row.id}
                                    className="min-w-16 border border-slate-300 bg-green-50 px-3 py-2 text-center font-bold text-slate-900"
                                >
                                    {row.id}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <th className="border border-slate-300 bg-white px-3 py-2 text-left font-semibold text-slate-900">
                                Serving Quality
                            </th>
                            {rows.map((row) => (
                                <td
                                    key={`${row.id}-serving-quality`}
                                    className={`border border-slate-300 px-3 py-2 text-center text-slate-900 ${
                                        row.servingQuality > 0
                                            ? 'bg-blue-100 font-semibold'
                                            : 'bg-white'
                                    }`}
                                >
                                    {formatMetric(row.servingQuality)}
                                </td>
                            ))}
                        </tr>
                        <tr>
                            <th className="border border-slate-300 bg-white px-3 py-2 text-left font-semibold text-slate-900">
                                Tingkat Kesesuaian Indikator
                            </th>
                            {rows.map((row) => (
                                <td
                                    key={`${row.id}-suitability-index`}
                                    className={`border border-slate-300 px-3 py-2 text-center text-slate-900 ${
                                        row.suitabilityIndex !== null &&
                                        row.suitabilityIndex > 1
                                            ? 'bg-blue-100 font-semibold'
                                            : 'bg-white'
                                    }`}
                                >
                                    {formatMetric(row.suitabilityIndex)}
                                </td>
                            ))}
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                <h4 className="mb-2 font-bold text-slate-900">
                    Rumus Perhitungan
                </h4>
                <div className="grid gap-2 md:grid-cols-2">
                    <div>
                        <p className="font-semibold text-slate-800">
                            Serving Quality
                        </p>
                        <p>Kinerja - Kepentingan</p>
                    </div>
                    <div>
                        <p className="font-semibold text-slate-800">
                            Tingkat Kesesuaian Indikator
                        </p>
                        <p>Kinerja / Kepentingan</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
