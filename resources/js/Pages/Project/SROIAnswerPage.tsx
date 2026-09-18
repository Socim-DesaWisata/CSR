import SROIFormTable, {
    SroiSectionView,
} from '@/Components/Company/SROI/SROIFormTable';
import CompanyLayout from '@/Layouts/AppLayout';
import { Head, router } from '@inertiajs/react';
import {
    ArrowLeft,
    Building2,
    CalendarDays,
    FileText,
    Hash,
    UserRound,
} from 'lucide-react';
import { ReactNode } from 'react';

interface ProjectPreview {
    id: number;
    name: string;
    projectCode: string;
    companyName: string | null;
}

interface FormPreview {
    id: number;
    name: string;
    description: string | null;
    version: number;
    status: string;
    sourceTemplateName: string | null;
}

interface SubmissionPreview {
    id: number;
    submittedAt: string | null;
    respondentName: string | null;
    stakeholderName: string | null;
    enumeratorName: string | null;
}

interface Props {
    project: ProjectPreview;
    form: FormPreview;
    submission: SubmissionPreview;
    sections: SroiSectionView[];
    answers: Record<number, string | number | null>;
}

export default function SROIAnswerPage({
    project,
    form,
    submission,
    sections,
    answers,
}: Props): ReactNode {
    const backToList = () => {
        router.visit(
            route('projects.show', {
                id: project.id,
                detailType: 'sroi_respondent',
            }),
        );
    };

    return (
        <CompanyLayout
            breadcrumb={{ parent: 'Proyek', current: 'Jawaban SROI' }}
        >
            <Head title={`Jawaban SROI - ${project.name}`} />

            <div className="min-h-screen bg-slate-100 px-3 py-4 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-5xl space-y-4">
                    <div className="flex items-center justify-between gap-3">
                        <button
                            type="button"
                            onClick={backToList}
                            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 transition hover:text-slate-950"
                        >
                            <ArrowLeft className="size-4" />
                            Kembali ke SROI Respondent
                        </button>
                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Submission #{submission.id}
                        </span>
                    </div>

                    <div className="border border-slate-400 bg-white">
                        <div className="border-b border-slate-300 bg-slate-50 px-4 py-3">
                            <h1 className="text-base font-bold text-slate-900">
                                {form.name}
                            </h1>
                            {form.description && (
                                <p className="mt-1 text-sm text-slate-600">
                                    {form.description}
                                </p>
                            )}
                        </div>
                        <div className="grid gap-0 md:grid-cols-3">
                            <InfoCard
                                label="Perusahaan"
                                value={project.companyName || '-'}
                                icon={<Building2 className="size-4" />}
                            />
                            <InfoCard
                                label="Project"
                                value={project.name}
                                icon={<FileText className="size-4" />}
                            />
                            <InfoCard
                                label="Kode Project"
                                value={project.projectCode}
                                icon={<Hash className="size-4" />}
                            />
                        </div>
                        <div className="grid gap-0 border-t border-slate-300 md:grid-cols-2">
                            <InfoCard
                                label="Respondent"
                                value={submission.respondentName || '-'}
                                icon={<UserRound className="size-4" />}
                            />
                            <InfoCard
                                label="Stakeholder"
                                value={submission.stakeholderName || '-'}
                                icon={<Building2 className="size-4" />}
                            />
                            <InfoCard
                                label="Enumerator"
                                value={submission.enumeratorName || '-'}
                                icon={<UserRound className="size-4" />}
                            />
                            <InfoCard
                                label="Tanggal"
                                value={submission.submittedAt || '-'}
                                icon={<CalendarDays className="size-4" />}
                            />
                        </div>
                    </div>

                    <SROIFormTable sections={sections} answers={answers} />
                </div>
            </div>
        </CompanyLayout>
    );
}

function InfoCard({
    label,
    value,
    icon,
}: {
    label: string;
    value: string;
    icon: ReactNode;
}): ReactNode {
    return (
        <div className="border-r border-slate-300 px-4 py-3 last:border-r-0 md:last:border-r-0">
            <div className="flex items-start gap-3">
                <div className="mt-0.5 text-slate-500">{icon}</div>
                <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        {label}
                    </p>
                    <p className="text-sm font-medium text-slate-900">
                        {value}
                    </p>
                </div>
            </div>
        </div>
    );
}
