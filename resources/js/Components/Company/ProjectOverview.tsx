import { Icon, MetricCard } from '@/Components/Company';
import { router } from '@inertiajs/react';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { ReactNode, useState } from 'react';

// ─── Types ─────────────────────────────────────────────────

interface LocationItem {
    district: string | null;
    city: string | null;
    province: string | null;
}

interface EnumeratorItem {
    id: number;
    name: string;
    email: string;
}

interface StakeholderOutcomeItem {
    id: number;
    stakeholderId: number;
    outcome: string;
}

interface StakeholderItem {
    id: number;
    name: string;
    outcomes: StakeholderOutcomeItem[];
}

interface ProjectData {
    id: number;
    name: string;
    description: string | null;
    projectCode: string;
    status: string;
    companyName: string | null;
    enableIkm: boolean;
    enableSloi: boolean;
    enableSroi: boolean;
    targetIkmCount: number;
    targetSloiCount: number;
    startDate: string | null;
    endDate: string | null;
    locations: LocationItem[];
    enumerators: EnumeratorItem[];
    descriptiveQuestions: {
        id: number;
        title: string;
    }[];
    stakeholders: StakeholderItem[];
}

interface StatsData {
    totalResponses: number;
    targetResponses: number;
    progress: number;
    score: number;
    scoreLabel: string;
}

interface IkmStatsData {
    totalResponses: number;
    targetResponses: number;
    progress: number;
    scoreKepentingan: number;
    scoreKinerja: number;
    scoreLabelKepentingan: string;
    scoreLabelKinerja: string;
}

interface AuditLogItem {
    id: string;
    respondentName: string;
    enumerator: string;
    date: string;
    score: number;
    status: string;
    group: string;
}

interface ProjectOverviewProps {
    project: ProjectData;
    stats: StatsData;
    ikmStats: IkmStatsData | null;
    sloiStats: StatsData | null;
    auditLog: AuditLogItem[];
    canEdit?: boolean;
}

// ─── Helpers ───────────────────────────────────────────────

function formatDate(dateStr: string | null): string {
    if (!dateStr) return '-';
    try {
        return new Date(dateStr).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    } catch {
        return dateStr;
    }
}

function statusBadgeClass(status: string): string {
    switch (status) {
        case 'active':
            return 'bg-green-100 text-green-700';
        case 'draft':
            return 'bg-amber-100 text-amber-700';
        case 'closed':
            return 'bg-slate-100 text-slate-600';
        case 'archived':
            return 'bg-red-100 text-red-700';
        default:
            return 'bg-slate-100 text-slate-600';
    }
}

// ─── Component ─────────────────────────────────────────────

export default function ProjectOverview({
    project,
    stats,
    ikmStats,
    sloiStats,
    auditLog,
    canEdit = true,
}: ProjectOverviewProps): ReactNode {
    const [stakeholderModal, setStakeholderModal] = useState<
        StakeholderItem | null | false
    >(false);
    const [outcomeModal, setOutcomeModal] = useState<{
        stakeholderId: number;
        outcome?: StakeholderOutcomeItem;
    } | null>(null);
    const [stakeholderName, setStakeholderName] = useState('');
    const [outcomeText, setOutcomeText] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);
    const effectiveSloiStats = sloiStats ?? stats;
    const assessmentTypes = [
        {
            key: 'ikm',
            enabled: project.enableIkm,
            label: 'IKM',
            icon: 'sentiment_satisfied',
            color: 'text-blue-600',
            bg: 'bg-blue-50',
        },
        {
            key: 'sloi',
            enabled: project.enableSloi,
            label: 'SLOI',
            icon: 'handshake',
            color: 'text-amber-600',
            bg: 'bg-amber-50',
        },
    ];

    const submit = (
        method: 'post' | 'patch' | 'delete',
        url: string,
        data: Record<string, unknown> = {},
        onSuccess?: () => void,
    ) => {
        setProcessing(true);
        setErrors({});

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                setProcessing(false);
                onSuccess?.();
            },
            onError: (validationErrors: Record<string, string>) => {
                setErrors(validationErrors);
                setProcessing(false);
            },
            onFinish: () => setProcessing(false),
        };

        if (method === 'post') router.post(url, data as never, options);
        if (method === 'patch') router.patch(url, data as never, options);
        if (method === 'delete') router.delete(url, options);
    };

    const openStakeholderModal = (
        stakeholder: StakeholderItem | null = null,
    ) => {
        setErrors({});
        setStakeholderName(stakeholder?.name ?? '');
        setStakeholderModal(stakeholder);
    };

    const openOutcomeModal = (
        stakeholderId: number,
        outcome?: StakeholderOutcomeItem,
    ) => {
        setErrors({});
        setOutcomeText(outcome?.outcome ?? '');
        setOutcomeModal({ stakeholderId, outcome });
    };

    const submitStakeholder = () => {
        const stakeholder = stakeholderModal || null;

        submit(
            stakeholder ? 'patch' : 'post',
            stakeholder
                ? `/projects/${project.id}/stakeholders/${stakeholder.id}`
                : `/projects/${project.id}/stakeholders`,
            { name: stakeholderName },
            () => setStakeholderModal(false),
        );
    };

    const submitOutcome = () => {
        if (!outcomeModal) return;

        submit(
            outcomeModal.outcome ? 'patch' : 'post',
            outcomeModal.outcome
                ? `/projects/${project.id}/stakeholder-outcomes/${outcomeModal.outcome.id}`
                : `/projects/${project.id}/stakeholder-outcomes`,
            outcomeModal.outcome
                ? { outcome: outcomeText }
                : {
                      stakeholder_id: outcomeModal.stakeholderId,
                      outcome: outcomeText,
                  },
            () => setOutcomeModal(null),
        );
    };

    return (
        <>
            {/* ─── Metric Cards ─────────────────────────────── */}
            <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
                {project.enableIkm && ikmStats && (
                    <>
                        <MetricCard
                            icon="star"
                            iconBgColor="bg-blue-50"
                            iconColor="text-blue-600"
                            label="IKM Kepentingan"
                            value={ikmStats.scoreKepentingan}
                            unit="/ 4.0"
                            badge={{
                                text: ikmStats.scoreLabelKepentingan,
                                type:
                                    ikmStats.scoreKepentingan >= 4
                                        ? 'positive'
                                        : 'stable',
                            }}
                            footer={
                                <p className="text-xs text-slate-500">
                                    Tingkat kepentingan dinilai{' '}
                                    <span className="font-bold text-blue-600">
                                        {ikmStats.scoreLabelKepentingan}
                                    </span>
                                </p>
                            }
                        />
                        <MetricCard
                            icon="sentiment_satisfied"
                            iconBgColor="bg-indigo-50"
                            iconColor="text-indigo-600"
                            label="IKM Kinerja"
                            value={ikmStats.scoreKinerja}
                            unit="/ 4.0"
                            badge={{
                                text: ikmStats.scoreLabelKinerja,
                                type:
                                    ikmStats.scoreKinerja >= 4
                                        ? 'positive'
                                        : 'stable',
                            }}
                            footer={
                                <p className="text-xs text-slate-500">
                                    Kualitas kinerja dinilai{' '}
                                    <span className="font-bold text-indigo-600">
                                        {ikmStats.scoreLabelKinerja}
                                    </span>
                                </p>
                            }
                        />
                    </>
                )}
                {project.enableSloi && (
                    <MetricCard
                        icon="handshake"
                        iconBgColor="bg-amber-50"
                        iconColor="text-amber-600"
                        label="SLOI Level"
                        value={effectiveSloiStats.scoreLabel}
                        badge={{ text: 'STABIL', type: 'stable' }}
                        footer={
                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <div
                                        key={i}
                                        className={`h-1.5 flex-1 rounded-full ${
                                            i <=
                                            Math.ceil(effectiveSloiStats.score)
                                                ? 'bg-primary'
                                                : 'bg-slate-200'
                                        }`}
                                    />
                                ))}
                            </div>
                        }
                    />
                )}
            </div>

            {/* ─── Project Information ──────────────────────── */}
            <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Detail Proyek */}
                <div className="rounded-xl border border-slate-100 bg-white shadow-sm">
                    <div className="border-b border-slate-100 px-6 py-4">
                        <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
                            <Icon
                                name="info"
                                className="text-lg text-primary"
                            />
                            Informasi Proyek
                        </h3>
                    </div>
                    <div className="space-y-4 p-6">
                        <InfoRow
                            label="Kode Proyek"
                            value={
                                <span className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-sm font-semibold text-slate-700">
                                    {project.projectCode}
                                </span>
                            }
                        />
                        <InfoRow
                            label="Status"
                            value={
                                <span
                                    className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase ${statusBadgeClass(project.status)}`}
                                >
                                    {project.status}
                                </span>
                            }
                        />
                        <InfoRow
                            label="Perusahaan"
                            value={project.companyName || '-'}
                        />
                        <InfoRow
                            label="Deskripsi"
                            value={project.description || '-'}
                        />
                    </div>
                </div>

                {/* Waktu & Target */}
                <div className="rounded-xl border border-slate-100 bg-white shadow-sm">
                    <div className="border-b border-slate-100 px-6 py-4">
                        <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
                            <Icon
                                name="calendar_month"
                                className="text-lg text-primary"
                            />
                            Jadwal & Target
                        </h3>
                    </div>
                    <div className="space-y-4 p-6 font-bold">
                        <InfoRow
                            label="Tanggal Mulai Project"
                            value={formatDate(project.startDate)}
                        />
                        <InfoRow
                            label="Tanggal Selesai Project"
                            value={formatDate(project.endDate)}
                        />
                        <InfoRow
                            label="Target IKM"
                            value={
                                project.enableIkm
                                    ? `${project.targetIkmCount.toLocaleString()} responden`
                                    : '-'
                            }
                        />
                        <InfoRow
                            label="Target SLOI"
                            value={
                                project.enableSloi
                                    ? `${project.targetSloiCount.toLocaleString()} responden`
                                    : '-'
                            }
                        />
                        {/* <InfoRow
                            label="Total Responden"
                            value={`${stats.totalResponses.toLocaleString()} / ${stats.targetResponses.toLocaleString()}`}
                        /> */}
                    </div>
                </div>
            </div>

            <div className="mb-8 rounded-xl border border-slate-100 bg-white shadow-sm">
                <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-4">
                    <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
                        <Icon name="groups" className="text-lg text-primary" />
                        Stakeholder & Outcome
                        <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                            {project.stakeholders.length}
                        </span>
                    </h3>
                    {canEdit && (
                        <button
                            type="button"
                            onClick={() => openStakeholderModal()}
                            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white transition hover:bg-primary/90"
                        >
                            <Plus className="size-4" />
                            Tambah Stakeholder
                        </button>
                    )}
                </div>
                <div className="p-6">
                    {project.stakeholders.length === 0 ? (
                        <p className="text-center text-sm text-slate-400">
                            Belum ada stakeholder.
                        </p>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {project.stakeholders.map((stakeholder) => (
                                <div
                                    key={stakeholder.id}
                                    className="rounded-xl border border-slate-200 bg-slate-50/60 p-4"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900">
                                                {stakeholder.name}
                                            </p>
                                            <p className="mt-1 text-xs text-slate-500">
                                                {stakeholder.outcomes.length}{' '}
                                                outcome
                                            </p>
                                        </div>
                                        {canEdit && (
                                            <div className="flex items-center gap-2">
                                                <MiniIconButton
                                                    label="Edit stakeholder"
                                                    onClick={() =>
                                                        openStakeholderModal(
                                                            stakeholder,
                                                        )
                                                    }
                                                >
                                                    <Pencil className="size-4" />
                                                </MiniIconButton>
                                                <MiniIconButton
                                                    label="Hapus stakeholder"
                                                    danger
                                                    onClick={() =>
                                                        submit(
                                                            'delete',
                                                            `/projects/${project.id}/stakeholders/${stakeholder.id}`,
                                                        )
                                                    }
                                                >
                                                    <Trash2 className="size-4" />
                                                </MiniIconButton>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-4 flex flex-col gap-3">
                                        {stakeholder.outcomes.length === 0 ? (
                                            <div className="rounded-lg border border-dashed border-slate-200 bg-white px-4 py-3 text-sm text-slate-400">
                                                Belum ada outcome.
                                            </div>
                                        ) : (
                                            stakeholder.outcomes.map(
                                                (outcome, index) => (
                                                    <div
                                                        key={outcome.id}
                                                        className="flex items-start justify-between gap-4 rounded-lg border border-slate-200 bg-white px-4 py-3"
                                                    >
                                                        <div className="flex min-w-0 items-start gap-3">
                                                            <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                                                {index + 1}
                                                            </div>
                                                            <p className="text-sm leading-relaxed text-slate-700">
                                                                {
                                                                    outcome.outcome
                                                                }
                                                            </p>
                                                        </div>
                                                        {canEdit && (
                                                            <div className="flex items-center gap-2">
                                                                <MiniIconButton
                                                                    label="Edit outcome"
                                                                    onClick={() =>
                                                                        openOutcomeModal(
                                                                            stakeholder.id,
                                                                            outcome,
                                                                        )
                                                                    }
                                                                >
                                                                    <Pencil className="size-4" />
                                                                </MiniIconButton>
                                                                <MiniIconButton
                                                                    label="Hapus outcome"
                                                                    danger
                                                                    onClick={() =>
                                                                        submit(
                                                                            'delete',
                                                                            `/projects/${project.id}/stakeholder-outcomes/${outcome.id}`,
                                                                        )
                                                                    }
                                                                >
                                                                    <Trash2 className="size-4" />
                                                                </MiniIconButton>
                                                            </div>
                                                        )}
                                                    </div>
                                                ),
                                            )
                                        )}

                                        {canEdit && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    openOutcomeModal(
                                                        stakeholder.id,
                                                    )
                                                }
                                                className="inline-flex w-fit items-center gap-2 rounded-lg border border-dashed border-primary/30 bg-white px-3 py-2 text-sm font-medium text-primary transition hover:border-primary hover:bg-primary/5"
                                            >
                                                <Plus className="size-4" />
                                                Tambah Outcome
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ─── Assessment Types ────────────────────────── */}
            <div className="mb-8 rounded-xl border border-slate-100 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-6 py-4">
                    <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
                        <Icon
                            name="assessment"
                            className="text-lg text-primary"
                        />
                        Tipe Penilaian
                    </h3>
                </div>
                <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-3">
                    {assessmentTypes.map((at) => (
                        <div
                            key={at.key}
                            className={`flex items-center gap-3 rounded-lg border p-4 ${
                                at.enabled
                                    ? 'border-primary/20 bg-primary/5'
                                    : 'border-slate-100 bg-slate-50 opacity-50'
                            }`}
                        >
                            <div
                                className={`flex size-10 items-center justify-center rounded-lg ${at.bg}`}
                            >
                                <Icon
                                    name={at.icon}
                                    className={`text-xl ${at.color}`}
                                />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-900">
                                    {at.label}
                                </p>
                                <p className="text-xs text-slate-500">
                                    {at.enabled ? 'Aktif' : 'Tidak aktif'}
                                </p>
                            </div>
                            {at.enabled && (
                                <Icon
                                    name="check_circle"
                                    className="ml-auto text-lg text-primary"
                                />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* ─── Pertanyaan Kualitatif ───────────────────────── */}
            <div className="mb-8 rounded-xl border border-slate-100 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-6 py-4">
                    <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
                        <Icon
                            name="help_outline"
                            className="text-lg text-primary"
                        />
                        Pertanyaan Kualitatif
                        <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                            {project.descriptiveQuestions.length}
                        </span>
                    </h3>
                </div>
                <div className="p-6">
                    {project.descriptiveQuestions.length === 0 ? (
                        <p className="text-center text-sm text-slate-400">
                            Belum ada Pertanyaan Kualitatif.
                        </p>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {project.descriptiveQuestions.map((q, i) => (
                                <div
                                    key={q.id}
                                    className="flex items-start gap-4 rounded-lg border border-slate-100 bg-slate-50/50 p-4"
                                >
                                    <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                        {i + 1}
                                    </div>
                                    <p className="text-sm font-medium leading-relaxed text-slate-800">
                                        {q.title}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ─── Locations & Enumerators ──────────────────── */}
            <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Lokasi */}
                <div className="rounded-xl border border-slate-100 bg-white shadow-sm">
                    <div className="border-b border-slate-100 px-6 py-4">
                        <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
                            <Icon
                                name="location_on"
                                className="text-lg text-primary"
                            />
                            Lokasi Proyek
                            <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                                {project.locations.length}
                            </span>
                        </h3>
                    </div>
                    <div className="max-h-72 overflow-y-auto p-6">
                        {project.locations.length === 0 ? (
                            <p className="text-center text-sm text-slate-400">
                                Belum ada lokasi
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {project.locations.map((loc, i) => (
                                    <div
                                        key={i}
                                        className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50/50 p-3"
                                    >
                                        <Icon
                                            name="place"
                                            className="mt-0.5 text-base text-primary"
                                        />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-slate-800">
                                                {loc.district || '-'}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {[loc.city, loc.province]
                                                    .filter(Boolean)
                                                    .join(', ') || '-'}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Enumerator */}
                <div className="rounded-xl border border-slate-100 bg-white shadow-sm">
                    <div className="border-b border-slate-100 px-6 py-4">
                        <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
                            <Icon
                                name="badge"
                                className="text-lg text-primary"
                            />
                            Enumerator Ditugaskan
                            <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                                {project.enumerators.length}
                            </span>
                        </h3>
                    </div>
                    <div className="max-h-72 overflow-y-auto p-6">
                        {project.enumerators.length === 0 ? (
                            <p className="text-center text-sm text-slate-400">
                                Belum ada enumerator yang ditugaskan
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {project.enumerators.map((en) => (
                                    <div
                                        key={en.id}
                                        className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50/50 p-3"
                                    >
                                        <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                                            {en.name
                                                .split(' ')
                                                .map((w) => w[0])
                                                .slice(0, 2)
                                                .join('')
                                                .toUpperCase()}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-slate-800">
                                                {en.name}
                                            </p>
                                            <p className="truncate text-xs text-slate-500">
                                                {en.email}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ─── Recent Submissions ──────────────────────── */}
            {/* <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-6 py-4">
                    <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
                        <Icon name="history" className="text-lg text-primary" />
                        Pengiriman Terbaru
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/50">
                                <th className="px-6 py-4 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                    ID
                                </th>
                                <th className="px-6 py-4 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                    Responden
                                </th>
                                <th className="px-6 py-4 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                    Enumerator
                                </th>
                                <th className="px-6 py-4 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                    Tanggal
                                </th>
                                <th className="px-6 py-4 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                    Skor
                                </th>
                                <th className="px-6 py-4 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {auditLog.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-6 py-8 text-center text-sm text-slate-400"
                                    >
                                        Belum ada pengiriman data
                                    </td>
                                </tr>
                            )}
                            {auditLog.map((log) => (
                                <tr
                                    key={log.id}
                                    className="transition-colors hover:bg-slate-50"
                                >
                                    <td className="px-6 py-4 font-mono text-sm text-slate-900">
                                        {log.id}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-slate-700">
                                        {log.respondentName}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">
                                        {log.enumerator}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">
                                        {log.date}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={`text-sm font-bold ${log.score >= 4
                                                    ? 'text-green-600'
                                                    : log.score >= 3
                                                        ? 'text-amber-600'
                                                        : 'text-red-600'
                                                }`}
                                        >
                                            {log.score}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase ${log.status === 'approved'
                                                    ? 'bg-green-100 text-green-700'
                                                    : log.status === 'submitted'
                                                        ? 'bg-amber-100 text-amber-700'
                                                        : 'bg-red-100 text-red-700'
                                                }`}
                                        >
                                            {log.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div> */}

            {stakeholderModal !== false && (
                <SimpleModal
                    title={
                        stakeholderModal
                            ? 'Edit Stakeholder'
                            : 'Tambah Stakeholder'
                    }
                    onClose={() => setStakeholderModal(false)}
                >
                    <div className="space-y-4">
                        <label className="block">
                            <span className="mb-1 block text-sm font-medium text-slate-700">
                                Nama Stakeholder
                            </span>
                            <input
                                type="text"
                                value={stakeholderName}
                                onChange={(event) =>
                                    setStakeholderName(event.target.value)
                                }
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                            {errors.name && (
                                <ErrorText>{errors.name}</ErrorText>
                            )}
                        </label>
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setStakeholderModal(false)}
                                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={submitStakeholder}
                                disabled={processing}
                                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                            >
                                Simpan
                            </button>
                        </div>
                    </div>
                </SimpleModal>
            )}

            {outcomeModal && (
                <SimpleModal
                    title={
                        outcomeModal.outcome ? 'Edit Outcome' : 'Tambah Outcome'
                    }
                    onClose={() => setOutcomeModal(null)}
                >
                    <div className="space-y-4">
                        <label className="block">
                            <span className="mb-1 block text-sm font-medium text-slate-700">
                                Outcome
                            </span>
                            <textarea
                                value={outcomeText}
                                onChange={(event) =>
                                    setOutcomeText(event.target.value)
                                }
                                rows={4}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                            {errors.outcome && (
                                <ErrorText>{errors.outcome}</ErrorText>
                            )}
                        </label>
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setOutcomeModal(null)}
                                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={submitOutcome}
                                disabled={processing}
                                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                            >
                                Simpan
                            </button>
                        </div>
                    </div>
                </SimpleModal>
            )}
        </>
    );
}

// ─── Helper Component ──────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
    return (
        <div className="flex items-start justify-between gap-4">
            <span className="whitespace-nowrap text-sm text-slate-500">
                {label}
            </span>
            <span className="text-right text-sm font-medium text-slate-800">
                {value}
            </span>
        </div>
    );
}

function MiniIconButton({
    children,
    label,
    danger = false,
    onClick,
}: {
    children: ReactNode;
    label: string;
    danger?: boolean;
    onClick: () => void;
}): ReactNode {
    return (
        <button
            type="button"
            aria-label={label}
            title={label}
            onClick={onClick}
            className={`flex size-8 items-center justify-center rounded-lg border transition ${
                danger
                    ? 'border-red-200 text-red-600 hover:bg-red-50'
                    : 'border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800'
            }`}
        >
            {children}
        </button>
    );
}

function SimpleModal({
    title,
    onClose,
    children,
}: {
    title: string;
    onClose: () => void;
    children: ReactNode;
}): ReactNode {
    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-10 backdrop-blur-sm">
            <div
                className="absolute inset-0"
                aria-hidden="true"
                onClick={onClose}
            />
            <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                    <h3 className="text-base font-bold text-slate-900">
                        {title}
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex size-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                    >
                        <X className="size-5" />
                    </button>
                </div>
                <div className="p-6">{children}</div>
            </div>
        </div>
    );
}

function ErrorText({ children }: { children: ReactNode }): ReactNode {
    return (
        <p className="mt-1 text-xs font-semibold text-red-600">{children}</p>
    );
}
