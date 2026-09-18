import {
    ChevronLeft,
    ChevronRight,
    Eye,
    FileText,
    Filter,
    X,
} from 'lucide-react';
import { ReactNode, useMemo, useState } from 'react';
import SubmissionDetailModal from './SubmissionDetailModal';

export interface RespondentData {
    id: number;
    name: string;
    stakeholder?: { id: number; name: string } | null;
    address: string | null;
    phone: string | null;
    age: number | null;
    gender: string | null;
    status: string | null;
    educationLevel: string | null;
    occupation: string | null;
    monthlyIncome: number | null;
}

export interface SROIRespondentRow {
    submissionId: number;
    submittedAt: string | null;
    status: string;
    enumerator: string;
    latitude: number | null;
    longitude: number | null;
    photoPath: string | null;
    respondent: RespondentData | null;
    timelines: {
        id: number;
        action: string;
        decidedAt: string | null;
        decidedBy: string;
        notes: string | null;
    }[];
    descriptiveAnswers?: { question: string; answer: string | null }[];
}

export interface PaginationData {
    currentPage: number;
    lastPage: number;
    perPage: number;
    total: number;
}

export interface FilterOptions {
    enumerators: string[];
    statuses: string[];
    educations: string[];
    genders: string[];
}

export interface SROIRespondentsData {
    rows: SROIRespondentRow[];
    pagination: PaginationData;
    filterOptions: FilterOptions;
}

export interface RespondentFilters {
    enumerator: string;
    resp_status: string;
    education: string;
    gender: string;
    sort_by: string;
    sort_order: string;
    per_page: number;
}

interface Props {
    respondents: SROIRespondentsData;
    projectId: number;
    filters: RespondentFilters;
    onNavigate: (params: Record<string, string | number>) => void;
}

export default function SROIRespondentTable({
    respondents,
    projectId,
    filters,
    onNavigate,
}: Props): ReactNode {
    const { rows, pagination, filterOptions } = respondents;
    const [selected, setSelected] = useState<SROIRespondentRow | null>(null);
    const hasActiveFilter =
        filters.enumerator ||
        filters.resp_status ||
        filters.education ||
        filters.gender;

    const navigate = (params: Record<string, string | number>) => {
        const query: Record<string, string | number> = {
            enumerator: filters.enumerator,
            resp_status: filters.resp_status,
            education: filters.education,
            gender: filters.gender,
            sort_by: filters.sort_by,
            sort_order: filters.sort_order,
            per_page: filters.per_page,
            ...params,
        };

        const cleaned = Object.fromEntries(
            Object.entries(query).filter(
                ([, v]) => v !== '' && v !== undefined && v !== null,
            ),
        );
        onNavigate(cleaned);
    };

    const pageNumbers = useMemo(() => {
        const pages: number[] = [];
        for (
            let i = Math.max(1, pagination.currentPage - 2);
            i <= Math.min(pagination.lastPage, pagination.currentPage + 2);
            i++
        ) {
            pages.push(i);
        }
        return pages;
    }, [pagination]);

    const startItem =
        pagination.total === 0
            ? 0
            : (pagination.currentPage - 1) * pagination.perPage + 1;
    const endItem = Math.min(
        pagination.currentPage * pagination.perPage,
        pagination.total,
    );

    return (
        <div className="space-y-6">
            <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <Filter className="size-4" />
                        Filter
                    </div>
                    {hasActiveFilter && (
                        <button
                            onClick={() =>
                                navigate({
                                    enumerator: '',
                                    resp_status: '',
                                    education: '',
                                    gender: '',
                                    page: 1,
                                })
                            }
                            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                        >
                            <X className="size-3" />
                            Reset Filter
                        </button>
                    )}
                </div>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    <SelectFilter
                        label="Enumerator"
                        value={filters.enumerator}
                        onChange={(value) =>
                            navigate({ enumerator: value, page: 1 })
                        }
                        options={filterOptions.enumerators}
                    />
                    <SelectFilter
                        label="Status Submission"
                        value={filters.resp_status}
                        onChange={(value) =>
                            navigate({ resp_status: value, page: 1 })
                        }
                        options={filterOptions.statuses}
                        transformLabel={(value) =>
                            value.charAt(0).toUpperCase() + value.slice(1)
                        }
                    />
                    <SelectFilter
                        label="Pendidikan"
                        value={filters.education}
                        onChange={(value) =>
                            navigate({ education: value, page: 1 })
                        }
                        options={filterOptions.educations}
                    />
                    <SelectFilter
                        label="Gender"
                        value={filters.gender}
                        onChange={(value) =>
                            navigate({ gender: value, page: 1 })
                        }
                        options={filterOptions.genders}
                    />
                </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                    Nama Respondent
                                </th>
                                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                    Enumerator
                                </th>
                                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                    Stakeholder
                                </th>
                                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                    Tanggal
                                </th>
                                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                    Aksi
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {rows.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="px-6 py-10 text-center text-sm text-slate-400"
                                    >
                                        Belum ada submission SROI
                                    </td>
                                </tr>
                            ) : (
                                rows.map((row) => (
                                    <tr
                                        key={row.submissionId}
                                        className="hover:bg-slate-50"
                                    >
                                        <td className="px-4 py-3 font-medium text-slate-800">
                                            {row.respondent?.name ?? '-'}
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">
                                            {row.enumerator}
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">
                                            {row.respondent?.stakeholder
                                                ?.name ?? '-'}
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">
                                            {row.submittedAt ?? '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        (window.location.href =
                                                            route(
                                                                'projects.sroi.answers.show',
                                                                {
                                                                    project:
                                                                        projectId,
                                                                    submission:
                                                                        row.submissionId,
                                                                },
                                                            ))
                                                    }
                                                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                                                >
                                                    <Eye className="size-4" />
                                                    Lihat Jawaban
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setSelected(row)
                                                    }
                                                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                                                >
                                                    <FileText className="size-4" />
                                                    Lihat Detail
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
                    <div>
                        Menampilkan {startItem} - {endItem} dari{' '}
                        {pagination.total}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() =>
                                navigate({ page: pagination.currentPage - 1 })
                            }
                            disabled={pagination.currentPage <= 1}
                        >
                            <ChevronLeft className="size-4" />
                        </button>
                        {pageNumbers.map((page) => (
                            <button
                                key={page}
                                onClick={() => navigate({ page })}
                                className={
                                    page === pagination.currentPage
                                        ? 'rounded bg-primary px-2 py-1 text-white'
                                        : 'rounded px-2 py-1 hover:bg-slate-100'
                                }
                            >
                                {page}
                            </button>
                        ))}
                        <button
                            onClick={() =>
                                navigate({ page: pagination.currentPage + 1 })
                            }
                            disabled={
                                pagination.currentPage >= pagination.lastPage
                            }
                        >
                            <ChevronRight className="size-4" />
                        </button>
                    </div>
                </div>
            </div>

            {selected && (
                <SubmissionDetailModal
                    data={{
                        submissionId: selected.submissionId,
                        submittedAt: selected.submittedAt,
                        photoPath: selected.photoPath,
                        latitude: selected.latitude,
                        longitude: selected.longitude,
                        enumerator: selected.enumerator,
                        respondent: selected.respondent
                            ? {
                                  name: selected.respondent.name,
                                  gender: selected.respondent.gender,
                                  age: selected.respondent.age,
                                  educationLevel:
                                      selected.respondent.educationLevel,
                                  address: selected.respondent.address,
                                  phone: selected.respondent.phone,
                                  status: selected.respondent.status,
                                  occupation: selected.respondent.occupation,
                                  monthlyIncome:
                                      selected.respondent.monthlyIncome,
                              }
                            : null,
                        timelines: selected.timelines,
                        descriptiveAnswers: selected.descriptiveAnswers,
                    }}
                    onClose={() => setSelected(null)}
                />
            )}
        </div>
    );
}

function SelectFilter({
    label,
    value,
    onChange,
    options,
    transformLabel,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: string[];
    transformLabel?: (value: string) => string;
}): ReactNode {
    return (
        <div>
            <label className="mb-1 block text-[11px] font-medium text-slate-500">
                {label}
            </label>
            <select
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700"
            >
                <option value="">Semua</option>
                {options.map((option) => (
                    <option key={option} value={option}>
                        {transformLabel ? transformLabel(option) : option}
                    </option>
                ))}
            </select>
        </div>
    );
}
