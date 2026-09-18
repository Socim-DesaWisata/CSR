import { PageHeader } from '@/Components/Enumerator';
import EnumeratorLayout from '@/Layouts/EnumeratorLayout';
import { Head, router } from '@inertiajs/react';
import {
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronUp,
    ClipboardList,
    MapPin,
    X,
} from 'lucide-react';
import { useMemo, useState } from 'react';

// ─── Types ──────────────────────────────────────────────────

interface ProjectOption {
    id: number;
    name: string;
}

interface RespondentData {
    name: string;
    phone: string | null;
    address: string | null;
    gender: string | null;
    age: number | null;
}

interface SubmissionItem {
    id: number;
    assessmentType: string;
    status: string;
    submittedAt: string | null;
    submissionNumber: number;
    photoPath: string | null;
    latitude: number;
    longitude: number;
    project: { id: number; name: string };
    respondent: RespondentData | null;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginationMeta {
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    total: number;
    per_page: number;
}

interface Stats {
    total: number;
    approved: number;
    submitted: number;
    rejected: number;
    overallAvg: number;
}

interface Filters {
    project_id: string | null;
    status: string | null;
    assessment_type: string | null;
    sort_by: string;
    sort_order: 'asc' | 'desc';
    per_page: number;
}

interface Props {
    submissions: {
        data: SubmissionItem[];
        links: PaginationLink[];
        meta: PaginationMeta;
    };
    projects: ProjectOption[];
    stats: Stats;
    filters: Filters;
}

// ─── Helpers ────────────────────────────────────────────────

const statusLabel: Record<string, string> = {
    submitted: 'Submitted',
    approved: 'Approved',
    rejected: 'Revisi',
};

const formatDate = (dateString: string | null) => {
    if (!dateString) return '—';
    try {
        const date = new Date(dateString.replace(' ', 'T'));
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    } catch {
        return dateString;
    }
};

const formatGender = (gender: string | null) => {
    if (!gender) return '';
    if (gender.toLowerCase() === 'male') return 'Pria';
    if (gender.toLowerCase() === 'female') return 'Wanita';
    return gender;
};

// ─── Component ──────────────────────────────────────────────

export default function HistorySurvey({
    submissions,
    projects,
    stats,
    filters,
}: Props) {
    const [localFilters, setLocalFilters] = useState({
        project_id: filters.project_id || '',
        status: filters.status || '',
        assessment_type: filters.assessment_type || '',
        sort_by:
            filters.sort_by === 'submitted_at'
                ? filters.sort_by
                : 'submitted_at',
        sort_order: filters.sort_order || 'desc',
        per_page: filters.per_page || 10,
    });

    const hasActiveFilter =
        !!localFilters.project_id ||
        !!localFilters.status ||
        !!localFilters.assessment_type;

    const navigate = (overrides: Record<string, string | number>) => {
        const params = { ...localFilters, ...overrides, page: 1 };
        const cleaned = Object.fromEntries(
            Object.entries(params).filter(
                ([, v]) => v !== '' && v !== undefined && v !== null && v !== 0,
            ),
        );
        router.get(route('enumerator.survey.history'), cleaned, {
            preserveState: true,
            replace: true,
        });
    };

    const handleFilterChange = (key: string, value: string) => {
        setLocalFilters((prev) => ({ ...prev, [key]: value }));
        navigate({ [key]: value });
    };

    const handleSort = (field: string) => {
        const newOrder =
            localFilters.sort_by === field && localFilters.sort_order === 'desc'
                ? 'asc'
                : 'desc';
        setLocalFilters((prev) => ({
            ...prev,
            sort_by: field,
            sort_order: newOrder,
        }));
        navigate({ sort_by: field, sort_order: newOrder });
    };

    const clearFilters = () => {
        setLocalFilters({
            project_id: '',
            status: '',
            assessment_type: '',
            sort_by: 'submitted_at',
            sort_order: 'desc',
            per_page: 10,
        });
        router.get(
            route('enumerator.survey.history'),
            {},
            { preserveState: true, replace: true },
        );
    };

    const handlePageChange = (page: number) => {
        const params = { ...localFilters, page };
        const cleaned = Object.fromEntries(
            Object.entries(params).filter(
                ([, v]) => v !== '' && v !== undefined && v !== null && v !== 0,
            ),
        );
        router.get(route('enumerator.survey.history'), cleaned, {
            preserveState: true,
            replace: true,
        });
    };

    const { meta } = submissions;
    const pageNumbers = useMemo(() => {
        const pages: number[] = [];
        const delta = 2;
        for (
            let i = Math.max(1, meta.current_page - delta);
            i <= Math.min(meta.last_page, meta.current_page + delta);
            i++
        ) {
            pages.push(i);
        }
        return pages;
    }, [meta.current_page, meta.last_page]);

    const SortButton = ({
        field,
        children,
    }: {
        field: string;
        children: React.ReactNode;
    }) => (
        <button
            onClick={() => handleSort(field)}
            className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                localFilters.sort_by === field
                    ? 'border-slate-400 bg-slate-800 text-white'
                    : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700'
            }`}
        >
            {children}
            {localFilters.sort_by === field &&
                (localFilters.sort_order === 'asc' ? (
                    <ChevronUp className="size-3" />
                ) : (
                    <ChevronDown className="size-3" />
                ))}
        </button>
    );

    return (
        <EnumeratorLayout activeNav="riwayat">
            <Head title="Riwayat Survei" />

            {/* ── Header ── */}
            <PageHeader
                title="Riwayat Survei"
                description="Semua data survei yang telah kamu kumpulkan."
            />

            {/* ── Stats Row ── */}
            <div className="mb-6 border-b border-slate-200 pb-6 pt-2">
                {/* Mobile: Stacked Layout */}
                <div className="flex flex-col gap-4 lg:hidden">
                    {/* Total */}
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold tabular-nums text-slate-900 sm:text-4xl">
                            {stats.total}
                        </span>
                        <span className="text-sm text-slate-500">
                            Total Survei
                        </span>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <div className="flex flex-col rounded-lg bg-slate-50 p-3">
                            <span className="text-xl font-bold tabular-nums text-slate-800 sm:text-2xl">
                                {stats.submitted}
                            </span>
                            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                                Submitted
                            </span>
                        </div>
                        <div className="flex flex-col rounded-lg bg-slate-50 p-3">
                            <span className="text-xl font-bold tabular-nums text-slate-800 sm:text-2xl">
                                {stats.approved}
                            </span>
                            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                                Approved
                            </span>
                        </div>
                        <div className="flex flex-col rounded-lg bg-slate-50 p-3">
                            <span className="text-xl font-bold tabular-nums text-slate-800 sm:text-2xl">
                                {stats.rejected}
                            </span>
                            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                                Revisi
                            </span>
                        </div>
                        <div className="flex flex-col rounded-lg bg-slate-50 p-3">
                            <span className="text-xl font-bold tabular-nums text-slate-800 sm:text-2xl">
                                {stats.overallAvg.toFixed(2)}
                            </span>
                            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                                Rata-Rata
                            </span>
                        </div>
                    </div>
                </div>

                {/* Desktop: Horizontal Layout */}
                <div className="hidden items-center gap-6 lg:flex">
                    <div>
                        <span className="text-4xl font-bold tabular-nums text-slate-900">
                            {stats.total}
                        </span>
                        <span className="ml-2 text-sm text-slate-500">
                            Total Survei
                        </span>
                    </div>
                    <div className="h-8 w-px bg-slate-200" />
                    <div className="flex items-center gap-6 text-sm text-slate-600">
                        <span className="flex flex-col">
                            <span className="text-2xl font-bold tabular-nums text-slate-800">
                                {stats.submitted}
                            </span>
                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Submitted
                            </span>
                        </span>
                        <span className="flex flex-col">
                            <span className="text-2xl font-bold tabular-nums text-slate-800">
                                {stats.approved}
                            </span>
                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Approved
                            </span>
                        </span>
                        <span className="flex flex-col">
                            <span className="text-2xl font-bold tabular-nums text-slate-800">
                                {stats.rejected}
                            </span>
                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Revisi
                            </span>
                        </span>
                    </div>
                    <div className="h-8 w-px bg-slate-200" />
                </div>
            </div>

            {/* ── Filters ── */}
            <div className="mb-4 space-y-3">
                {/* Mobile: Full Width Selects */}
                <div className="flex flex-col gap-2 sm:hidden">
                    <select
                        value={localFilters.project_id}
                        onChange={(e) =>
                            handleFilterChange('project_id', e.target.value)
                        }
                        className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-600 focus:border-slate-400 focus:outline-none focus:ring-0"
                    >
                        <option value="">Semua Proyek</option>
                        {projects.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.name}
                            </option>
                        ))}
                    </select>

                    <select
                        value={localFilters.status}
                        onChange={(e) =>
                            handleFilterChange('status', e.target.value)
                        }
                        className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-600 focus:border-slate-400 focus:outline-none focus:ring-0"
                    >
                        <option value="">Semua Status</option>
                        <option value="submitted">Submitted</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Revisi</option>
                    </select>

                    <select
                        value={localFilters.assessment_type}
                        onChange={(e) =>
                            handleFilterChange(
                                'assessment_type',
                                e.target.value,
                            )
                        }
                        className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-600 focus:border-slate-400 focus:outline-none focus:ring-0"
                    >
                        <option value="">Semua Tipe</option>
                        <option value="IKM">IKM</option>
                        <option value="SLOI">SLOI</option>
                    </select>
                </div>

                {/* Desktop: Horizontal Layout */}
                <div className="hidden items-end gap-3 sm:flex">
                    <select
                        value={localFilters.project_id}
                        onChange={(e) =>
                            handleFilterChange('project_id', e.target.value)
                        }
                        className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 focus:border-slate-400 focus:outline-none focus:ring-0"
                    >
                        <option value="">Semua Proyek</option>
                        {projects.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.name}
                            </option>
                        ))}
                    </select>

                    <select
                        value={localFilters.status}
                        onChange={(e) =>
                            handleFilterChange('status', e.target.value)
                        }
                        className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 focus:border-slate-400 focus:outline-none focus:ring-0"
                    >
                        <option value="">Semua Status</option>
                        <option value="submitted">Submitted</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Revisi</option>
                    </select>

                    <select
                        value={localFilters.assessment_type}
                        onChange={(e) =>
                            handleFilterChange(
                                'assessment_type',
                                e.target.value,
                            )
                        }
                        className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 focus:border-slate-400 focus:outline-none focus:ring-0"
                    >
                        <option value="">Semua Tipe</option>
                        <option value="IKM">IKM</option>
                        <option value="SLOI">SLOI</option>
                    </select>

                    <div className="flex gap-1.5">
                        <SortButton field="submitted_at">Tanggal</SortButton>
                    </div>

                    {hasActiveFilter && (
                        <button
                            onClick={clearFilters}
                            className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-[11px] text-slate-400 transition-colors hover:text-slate-600"
                        >
                            <X className="size-3" />
                            Reset
                        </button>
                    )}
                </div>

                {/* Sort Buttons - Full Width on Mobile */}
                <div className="flex items-center gap-2 sm:hidden">
                    <div className="flex flex-1 gap-1.5">
                        <SortButton field="submitted_at">Tanggal</SortButton>
                    </div>
                    {hasActiveFilter && (
                        <button
                            onClick={clearFilters}
                            className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-3 py-1.5 text-[11px] text-slate-400 transition-colors hover:border-slate-300 hover:text-slate-600"
                        >
                            <X className="size-3" />
                            Reset
                        </button>
                    )}
                </div>
            </div>

            {/* ── Submission Grid ── */}
            {submissions.data.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 py-20">
                    <ClipboardList className="mb-2 size-10 text-slate-300" />
                    <p className="text-sm text-slate-400">
                        Belum ada riwayat survei.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 pb-4 sm:grid-cols-2 lg:grid-cols-3">
                    {submissions.data.map((item) => (
                        <div
                            key={item.id}
                            className="group relative flex flex-col overflow-hidden rounded-xl border bg-white shadow-sm transition-shadow hover:shadow-md"
                            style={{
                                borderColor: 'rgb(226 232 240)',
                            }}
                        >
                            {/* Card top accent */}
                            <div className="absolute left-0 top-0 h-1 w-full bg-primary" />

                            {/* Card top */}
                            <div className="flex-1 p-5 pt-6">
                                {/* Badges row */}
                                <div className="mb-3 flex items-start justify-between gap-3">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                                            {item.assessmentType}
                                        </span>
                                        <span
                                            className={`rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                                                item.status === 'approved'
                                                    ? 'bg-emerald-700 text-white'
                                                    : item.status === 'rejected'
                                                      ? 'bg-amber-600 text-white'
                                                      : 'bg-indigo-600 text-white'
                                            }`}
                                        >
                                            {statusLabel[item.status] ??
                                                item.status}
                                        </span>
                                    </div>
                                    <span className="shrink-0 rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                                        Pengiriman ke-{item.submissionNumber}
                                    </span>
                                </div>

                                {/* Respondent */}
                                <h3 className="mb-1 text-base font-semibold leading-snug text-slate-900">
                                    {item.respondent?.name ?? '—'}
                                </h3>
                                <p className="mb-4 text-xs text-slate-500">
                                    {item.project.name}
                                </p>
                            </div>

                            {/* Card footer */}
                            <div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50/50 p-4 text-xs">
                                {/* Date & Details Row */}
                                <div className="flex items-center justify-between text-slate-500">
                                    <span className="font-medium">
                                        {formatDate(item.submittedAt)}
                                    </span>
                                    {item.respondent?.gender && (
                                        <span className="text-slate-400">
                                            {formatGender(
                                                item.respondent.gender,
                                            )}
                                            {item.respondent.age
                                                ? `, ${item.respondent.age}th`
                                                : ''}
                                        </span>
                                    )}
                                </div>

                                {/* Actions Row */}
                                <div className="flex items-center gap-2">
                                    {item.latitude !== 0 &&
                                        item.longitude !== 0 && (
                                            <a
                                                href={`https://maps.google.com/?q=${item.latitude},${item.longitude}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 transition-all hover:border-red-300 hover:bg-red-50 active:scale-95"
                                            >
                                                <MapPin className="size-3.5" />
                                                <span>Lokasi</span>
                                            </a>
                                        )}
                                    {(item.status === 'submitted' ||
                                        item.status === 'rejected') && (
                                        <a
                                            href={route(
                                                'enumerator.survey.edit',
                                                { submissionId: item.id },
                                            )}
                                            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border-2 border-primary bg-primary px-4 py-2 text-xs font-bold text-white transition-all hover:bg-primary/90 active:scale-95"
                                        >
                                            <svg
                                                className="size-3.5"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                                strokeWidth={2.5}
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                />
                                            </svg>
                                            <span>Edit Survei</span>
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Pagination ── */}
            {meta.last_page > 1 && (
                <div className="flex flex-col gap-4 pb-6 sm:flex-row sm:items-center sm:justify-between">
                    {/* Info & Per Page - Mobile Stacked, Desktop Horizontal */}
                    <div className="flex items-center justify-between gap-3 sm:justify-start">
                        <span className="text-xs tabular-nums text-slate-400">
                            {meta.from}–{meta.to} / {meta.total}
                        </span>
                        <select
                            value={localFilters.per_page}
                            onChange={(e) => {
                                const val = Number(e.target.value);
                                setLocalFilters((prev) => ({
                                    ...prev,
                                    per_page: val,
                                }));
                                navigate({ per_page: val });
                            }}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-500 focus:border-slate-400 focus:outline-none focus:ring-0"
                        >
                            {[10, 25, 50].map((n) => (
                                <option key={n} value={n}>
                                    {n} per halaman
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Pagination Controls */}
                    <div className="flex items-center justify-center gap-1">
                        <button
                            onClick={() =>
                                handlePageChange(meta.current_page - 1)
                            }
                            disabled={meta.current_page <= 1}
                            className="rounded-lg border border-slate-200 p-2 text-slate-400 transition-colors hover:border-slate-300 hover:text-slate-600 disabled:opacity-30 disabled:hover:border-slate-200"
                        >
                            <ChevronLeft className="size-4" />
                        </button>

                        {/* Show first page on mobile if not in range */}
                        {pageNumbers[0] > 1 && (
                            <>
                                <button
                                    onClick={() => handlePageChange(1)}
                                    className="hidden min-w-[32px] rounded-lg border border-slate-200 px-2 py-1.5 text-xs tabular-nums text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-50 sm:block"
                                >
                                    1
                                </button>
                                {pageNumbers[0] > 2 && (
                                    <span className="hidden px-1 text-xs text-slate-300 sm:inline">
                                        ···
                                    </span>
                                )}
                            </>
                        )}

                        {/* Page Numbers */}
                        {pageNumbers.map((p) => (
                            <button
                                key={p}
                                onClick={() => handlePageChange(p)}
                                className={`min-w-[32px] rounded-lg border px-2 py-1.5 text-xs tabular-nums transition-colors ${
                                    p === meta.current_page
                                        ? 'border-slate-800 bg-slate-800 font-bold text-white'
                                        : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                                }`}
                            >
                                {p}
                            </button>
                        ))}

                        {/* Show last page on mobile if not in range */}
                        {pageNumbers[pageNumbers.length - 1] <
                            meta.last_page && (
                            <>
                                {pageNumbers[pageNumbers.length - 1] <
                                    meta.last_page - 1 && (
                                    <span className="hidden px-1 text-xs text-slate-300 sm:inline">
                                        ···
                                    </span>
                                )}
                                <button
                                    onClick={() =>
                                        handlePageChange(meta.last_page)
                                    }
                                    className="hidden min-w-[32px] rounded-lg border border-slate-200 px-2 py-1.5 text-xs tabular-nums text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-50 sm:block"
                                >
                                    {meta.last_page}
                                </button>
                            </>
                        )}

                        <button
                            onClick={() =>
                                handlePageChange(meta.current_page + 1)
                            }
                            disabled={meta.current_page >= meta.last_page}
                            className="rounded-lg border border-slate-200 p-2 text-slate-400 transition-colors hover:border-slate-300 hover:text-slate-600 disabled:opacity-30 disabled:hover:border-slate-200"
                        >
                            <ChevronRight className="size-4" />
                        </button>
                    </div>
                </div>
            )}
        </EnumeratorLayout>
    );
}
