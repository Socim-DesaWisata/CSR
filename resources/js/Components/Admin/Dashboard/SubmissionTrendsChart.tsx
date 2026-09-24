import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/Components/ui/card';
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from '@/Components/ui/chart';
import { TrendingUp } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import type { SubmissionTrend } from './types';

interface SubmissionTrendsChartProps {
    data: SubmissionTrend[];
}

const areaChartConfig: ChartConfig = {
    ikm: { label: 'IKM', color: 'hsl(var(--chart-1))' },
    sloi: { label: 'SLOI', color: 'hsl(var(--chart-2))' },
};

export function SubmissionTrendsChart({ data }: SubmissionTrendsChartProps) {
    return (
        <Card className="border-0 shadow-lg lg:col-span-2">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <TrendingUp className="h-5 w-5 text-primary" />
                            Tren Submissions
                        </CardTitle>
                        <CardDescription>
                            Volume submissions dalam 30 hari terakhir
                        </CardDescription>
                    </div>
                    <div className="flex gap-4 text-xs">
                        <span className="flex items-center gap-1.5">
                            <span className="h-3 w-3 rounded-full bg-emerald-500" />
                            IKM
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="h-3 w-3 rounded-full bg-blue-500" />
                            SLOI
                        </span>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <ChartContainer
                    config={areaChartConfig}
                    className="h-[280px] w-full"
                >
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient
                                id="colorIkm"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >
                                <stop
                                    offset="5%"
                                    stopColor="#10b981"
                                    stopOpacity={0.3}
                                />
                                <stop
                                    offset="95%"
                                    stopColor="#10b981"
                                    stopOpacity={0}
                                />
                            </linearGradient>
                            <linearGradient
                                id="colorSloi"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >
                                <stop
                                    offset="5%"
                                    stopColor="#3b82f6"
                                    stopOpacity={0.3}
                                />
                                <stop
                                    offset="95%"
                                    stopColor="#3b82f6"
                                    stopOpacity={0}
                                />
                            </linearGradient>
                        </defs>
                        <CartesianGrid
                            strokeDasharray="3 3"
                            className="stroke-slate-200 dark:stroke-slate-700"
                        />
                        <XAxis
                            dataKey="date"
                            className="text-xs"
                            tick={{ fontSize: 11 }}
                        />
                        <YAxis className="text-xs" tick={{ fontSize: 11 }} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Area
                            type="monotone"
                            dataKey="ikm"
                            stroke="#10b981"
                            strokeWidth={2}
                            fill="url(#colorIkm)"
                        />
                        <Area
                            type="monotone"
                            dataKey="sloi"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            fill="url(#colorSloi)"
                        />
                    </AreaChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
