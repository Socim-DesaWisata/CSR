import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { FileText } from 'lucide-react';
import type { SubmissionTypeData } from './types';

interface SubmissionTypeChartProps {
    data: SubmissionTypeData[];
}

export function SubmissionTypeChart({ data }: SubmissionTypeChartProps) {
    const total = data.reduce((acc, i) => acc + i.count, 0);

    const colors: Record<string, string> = {
        IKM: 'bg-emerald-500',
        SLOI: 'bg-blue-500',
    };

    return (
        <Card className="border-0 shadow-lg">
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                    <FileText className="h-4 w-4 text-primary" />
                    Tipe Submission
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {data.map((item) => {
                        const percentage = Math.round(
                            (item.count / total) * 100,
                        );
                        return (
                            <div key={item.type} className="space-y-1.5">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium">
                                        {item.type}
                                    </span>
                                    <span className="text-slate-500">
                                        {item.count.toLocaleString()} (
                                        {percentage}
                                        %)
                                    </span>
                                </div>
                                <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                                    <div
                                        className={
                                            'h-full rounded-full transition-all ' +
                                            colors[item.type]
                                        }
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
