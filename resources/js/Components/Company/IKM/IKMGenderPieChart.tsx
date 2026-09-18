import { ReactNode } from 'react';

interface GenderData {
    male: { count: number; percentage: number };
    female: { count: number; percentage: number };
    total: number;
}

interface IKMGenderPieChartProps {
    data?: GenderData;
}

export default function IKMGenderPieChart({
    data = {
        male: { count: 1013, percentage: 55 },
        female: { count: 829, percentage: 45 },
        total: 1842,
    },
}: IKMGenderPieChartProps): ReactNode {
    return (
        <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Perbandingan Gender Responden
            </h3>
            <div className="flex flex-col items-center">
                {/* Pie Chart */}
                <div className="relative my-12 size-64">
                    <svg viewBox="0 0 100 100" className="-rotate-90">
                        {(() => {
                            const r = 40;
                            const circumference = 2 * Math.PI * r;
                            const maleDash =
                                (data.male.percentage / 100) * circumference;
                            const femaleDash =
                                (data.female.percentage / 100) * circumference;
                            return (
                                <>
                                    {/* Male */}
                                    <circle
                                        cx="50"
                                        cy="50"
                                        r={r}
                                        fill="transparent"
                                        stroke="#166534"
                                        strokeWidth="20"
                                        strokeDasharray={`${maleDash} ${circumference}`}
                                    />
                                    {/* Female */}
                                    <circle
                                        cx="50"
                                        cy="50"
                                        r={r}
                                        fill="transparent"
                                        stroke="#86efac"
                                        strokeWidth="20"
                                        strokeDasharray={`${femaleDash} ${circumference}`}
                                        strokeDashoffset={`${-maleDash}`}
                                    />
                                </>
                            );
                        })()}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-xs font-bold uppercase text-slate-400">
                            Total
                        </span>
                        <span className="text-2xl font-black text-slate-800">
                            {data.total.toLocaleString()}
                        </span>
                    </div>
                </div>
                {/* Legend */}
                <div className="flex justify-center gap-8">
                    <div className="flex items-center gap-2">
                        <div className="size-4 rounded-full bg-green-800"></div>
                        <div>
                            <p className="text-sm font-bold text-slate-700">
                                Laki-laki
                            </p>
                            <p className="text-xs text-slate-500">
                                {data.male.count.toLocaleString()} (
                                {data.male.percentage}%)
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="size-4 rounded-full bg-green-300"></div>
                        <div>
                            <p className="text-sm font-bold text-slate-700">
                                Perempuan
                            </p>
                            <p className="text-xs text-slate-500">
                                {data.female.count.toLocaleString()} (
                                {data.female.percentage}%)
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
