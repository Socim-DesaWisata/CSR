import { ReactNode } from 'react';

interface SLOIHeaderProps {
    totalResponses: number;
    progress: number;
    targetResponses: number;
}

export default function SLOIHeader({
    totalResponses,
    progress,
    targetResponses,
}: SLOIHeaderProps): ReactNode {
    return (
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex-1">
                <div className="mb-2 flex flex-wrap items-center gap-3">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                        Dashboard SLOI
                    </h1>
                </div>
                <p className="text-sm text-slate-500">
                    Analitik penilaian Social License
                    to Operate.
                </p>
            </div>

            <div className="flex flex-wrap gap-6">
                <div className="text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Total Respons
                    </p>
                    <p className="text-2xl font-bold text-slate-900">
                        {totalResponses.toLocaleString()}
                    </p>
                </div>
                <div className="text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Progres
                    </p>
                    <p className="text-2xl font-bold text-primary">
                        {progress}%
                    </p>
                </div>
                <div className="text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Target Responden
                    </p>
                    <p className="text-2xl font-bold text-slate-900">
                        {targetResponses.toLocaleString()}
                    </p>
                </div>
            </div>
        </div>
    );
}
