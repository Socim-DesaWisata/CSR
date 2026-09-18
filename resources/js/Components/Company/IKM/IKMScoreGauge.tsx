import { ChartContainer, type ChartConfig } from '@/Components/ui/chart';
import { ReactNode } from 'react';
import {
    Label,
    PolarGrid,
    PolarRadiusAxis,
    RadialBar,
    RadialBarChart,
} from 'recharts';

interface IKMScoreGaugeProps {
    avgKepentingan: number; // 1–4
    avgKinerja: number; // 1–4
    IKMScore?: number; // kept for backward compat but not rendered
    trustLevel?: string;
}

// Map score 1-4 to an endAngle so the arc fills proportionally.
function scoreToAngle(score: number, max = 4): number {
    return Math.round((score / max) * 360);
}

type GaugeKind = 'kepentingan' | 'kinerja';

interface ConversionCategory {
    interval: number;
    label: string;
    mutu: string;
}

const conversionRows = [
    {
        perception: '1',
        conversionInterval: '25,00 - 64,99',
        ikmInterval: '1,00 - 2,5996',
        kepentingan: 'Tidak Penting',
        kinerja: 'Tidak Puas',
        mutu: 'D',
    },
    {
        perception: '2',
        conversionInterval: '65,00 - 76,60',
        ikmInterval: '2,60 - 3,064',
        kepentingan: 'Kurang Penting',
        kinerja: 'Kurang Puas',
        mutu: 'C',
    },
    {
        perception: '3',
        conversionInterval: '76,61 - 88,30',
        ikmInterval: '3,0644 - 3,532',
        kepentingan: 'Penting',
        kinerja: 'Puas',
        mutu: 'B',
    },
    {
        perception: '4',
        conversionInterval: '88,31 - 100,00',
        ikmInterval: '3,5324 - 4,000',
        kepentingan: 'Sangat Penting',
        kinerja: 'Sangat Puas',
        mutu: 'A',
    },
];

function getConversionCategory(
    score: number,
    kind: GaugeKind,
): ConversionCategory {
    const interval = score * 25;

    if (interval >= 88.31) {
        return {
            interval,
            label: kind === 'kepentingan' ? 'Sangat Penting' : 'Sangat Puas',
            mutu: 'A',
        };
    }

    if (interval >= 76.61) {
        return {
            interval,
            label: kind === 'kepentingan' ? 'Penting' : 'Puas',
            mutu: 'B',
        };
    }

    if (interval >= 65) {
        return {
            interval,
            label: kind === 'kepentingan' ? 'Kurang Penting' : 'Kurang Puas',
            mutu: 'C',
        };
    }

    return {
        interval,
        label: kind === 'kepentingan' ? 'Tidak Penting' : 'Tidak Puas',
        mutu: 'D',
    };
}

interface RadialGaugeProps {
    value: number;
    label: string;
    color: string;
    kind: GaugeKind;
    max?: number;
}

function RadialGauge({
    value,
    label,
    color,
    kind,
    max = 4,
}: RadialGaugeProps): ReactNode {
    const endAngle = scoreToAngle(value, max);
    const conversion = getConversionCategory(value, kind);

    const config: ChartConfig = {
        value: { label, color },
    };

    const data = [{ value, fill: color }];

    return (
        <div className="flex flex-col items-center">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-black">
                {label}
            </p>
            <ChartContainer
                config={config}
                className="mx-auto aspect-square w-full max-w-[160px]"
            >
                <RadialBarChart
                    data={data}
                    startAngle={0}
                    endAngle={endAngle}
                    innerRadius={52}
                    outerRadius={72}
                >
                    <PolarGrid
                        gridType="circle"
                        radialLines={false}
                        stroke="none"
                        className="first:fill-muted last:fill-background"
                        polarRadius={[62, 52]}
                    />
                    <RadialBar dataKey="value" background cornerRadius={6} />
                    <PolarRadiusAxis
                        tick={false}
                        tickLine={false}
                        axisLine={false}
                    >
                        <Label
                            content={({ viewBox }) => {
                                if (
                                    viewBox &&
                                    'cx' in viewBox &&
                                    'cy' in viewBox
                                ) {
                                    return (
                                        <text
                                            x={viewBox.cx}
                                            y={viewBox.cy}
                                            textAnchor="middle"
                                            dominantBaseline="middle"
                                        >
                                            <tspan
                                                x={viewBox.cx}
                                                y={viewBox.cy}
                                                style={{
                                                    fill: '#0f172a',
                                                    fontSize: 22,
                                                    fontWeight: 700,
                                                }}
                                            >
                                                {value.toFixed(2)}
                                            </tspan>
                                            <tspan
                                                x={viewBox.cx}
                                                y={(viewBox.cy ?? 0) + 18}
                                                style={{
                                                    fill: '#94a3b8',
                                                    fontSize: 9,
                                                    fontWeight: 500,
                                                }}
                                            >
                                                {conversion.label}
                                            </tspan>
                                        </text>
                                    );
                                }
                            }}
                        />
                    </PolarRadiusAxis>
                </RadialBarChart>
            </ChartContainer>
        </div>
    );
}

export default function IKMScoreGauge({
    avgKepentingan,
    avgKinerja,
}: IKMScoreGaugeProps): ReactNode {
    return (
        <div className="lg:col-span-2">
            <div className="flex h-full flex-col rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Rerata Skor IKM
                </h3>

                <div className="flex flex-1 flex-row items-center justify-center gap-4">
                    {/* Chart 1 — Kepentingan */}
                    <div className="flex-1">
                        <RadialGauge
                            value={avgKepentingan}
                            label="Kepentingan"
                            color="#3b82f6"
                            kind="kepentingan"
                        />
                    </div>

                    {/* Divider */}
                    <div className="hidden h-24 w-px bg-slate-100 sm:block" />

                    {/* Chart 2 — Kinerja */}
                    <div className="flex-1">
                        <RadialGauge
                            value={avgKinerja}
                            label="Kinerja"
                            color="#22c55e"
                            kind="kinerja"
                        />
                    </div>
                </div>

                {/* Legend */}
                <div className="mt-1 overflow-hidden rounded-lg border border-slate-200 text-[10px] leading-tight text-slate-700">
                    <table className="w-full table-fixed border-collapse">
                        <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-[0.02em] text-slate-600">
                            <tr>
                                <th className="w-[12%] border-b border-r border-slate-200 px-1 py-1">
                                    Nilai Persepsi
                                </th>
                                <th className="w-[20%] border-b border-r border-slate-200 px-1 py-1">
                                    Nilai Interval Konversi IKM
                                </th>
                                <th className="w-[18%] border-b border-r border-slate-200 px-1 py-1">
                                    Nilai Interval IKM
                                </th>
                                <th className="w-[20%] border-b border-r border-slate-200 px-1 py-1">
                                    Kepentingan Unit Pelayanan
                                </th>
                                <th className="w-[20%] border-b border-r border-slate-200 px-1 py-1">
                                    Kinerja Unit Pelayanan
                                </th>
                                <th className="w-[10%] border-b border-slate-200 px-1 py-1">
                                    Mutu
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {conversionRows.map((row) => (
                                <tr
                                    key={row.perception}
                                    className="bg-white text-[10px]"
                                >
                                    <td className="border-r border-slate-100 px-1 py-0.5 text-center font-medium">
                                        {row.perception}
                                    </td>
                                    <td className="border-r border-slate-100 px-1 py-0.5 text-center">
                                        {row.conversionInterval}
                                    </td>
                                    <td className="border-r border-slate-100 px-1 py-0.5 text-center">
                                        {row.ikmInterval}
                                    </td>
                                    <td className="border-r border-slate-100 px-1 py-0.5 text-center">
                                        {row.kepentingan}
                                    </td>
                                    <td className="border-r border-slate-100 px-1 py-0.5 text-center">
                                        {row.kinerja}
                                    </td>
                                    <td className="px-1 py-0.5 text-center font-semibold">
                                        {row.mutu}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
