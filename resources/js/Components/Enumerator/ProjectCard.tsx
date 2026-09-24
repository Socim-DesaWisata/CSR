import { ReactNode } from 'react';
import MaterialIcon from './Icons/MaterialIcon';
import Badge from './UI/Badge';
import Button from './UI/Button';

export type ProjectStatus =
    | 'active'
    | 'upcoming'
    | 'finished'
    | 'closed'
    | 'archived';
export type ProjectType = 'IKM' | 'SLOI';

export interface ProjectData {
    id: string | number;
    name: string;
    institution: string;
    type: ProjectType;
    status: ProjectStatus;
    startDate: string;
    endDate: string;
    enable_ikm?: boolean;
    enable_sloi?: boolean;
}

interface ProjectCardProps {
    project: ProjectData;
    onStartSurvey?: (project: ProjectData) => void;
    onViewReport?: (project: ProjectData) => void;
    showActions?: boolean;
    actions?: ReactNode;
}

const typeVariants: Record<ProjectType, 'blue' | 'purple'> = {
    IKM: 'blue',
    SLOI: 'purple',
};

const statusConfig: Record<
    ProjectStatus,
    { label: string; variant: 'green' | 'amber' | 'gray'; icon: string }
> = {
    active: { label: 'Sedang Berjalan', variant: 'green', icon: 'date_range' },
    upcoming: {
        label: 'Akan Datang',
        variant: 'amber',
        icon: 'event_upcoming',
    },
    finished: { label: 'Selesai', variant: 'gray', icon: 'event_available' },
    closed: { label: 'Selesai', variant: 'gray', icon: 'event_available' },
    archived: { label: 'Diarsipkan', variant: 'gray', icon: 'archive' },
};

export default function ProjectCard({
    project,
    onStartSurvey,
    onViewReport,
    showActions = true,
    actions,
}: ProjectCardProps) {
    const statusInfo = statusConfig[project.status];

    const enabledTypes: ProjectType[] = [];
    if (project.enable_ikm) {
        enabledTypes.push('IKM');
    }
    if (project.enable_sloi) {
        enabledTypes.push('SLOI');
    }
    if (enabledTypes.length === 0) {
        enabledTypes.push(project.type);
    }

    const opacityClass =
        project.status === 'finished'
            ? 'opacity-75'
            : project.status === 'upcoming'
              ? 'opacity-90'
              : '';

    const renderButton = () => {
        switch (project.status) {
            case 'active':
                return (
                    <Button
                        variant="primary"
                        icon="arrow_forward"
                        fullWidth
                        onClick={() => onStartSurvey?.(project)}
                    >
                        Mulai Survei
                    </Button>
                );
            case 'upcoming':
                return (
                    <Button variant="disabled" icon="lock" fullWidth disabled>
                        Belum Dibuka
                    </Button>
                );
            case 'finished':
            case 'closed':
            case 'archived':
                return (
                    <Button
                        variant="outline"
                        icon="description"
                        fullWidth
                        onClick={() => onViewReport?.(project)}
                    >
                        Lihat Laporan
                    </Button>
                );
        }
    };

    const getIconColor = () => {
        switch (project.status) {
            case 'active':
                return 'text-primary';
            case 'upcoming':
                return 'text-amber-500';
            case 'finished':
            case 'closed':
            case 'archived':
                return 'text-gray-400';
        }
    };

    return (
        <article
            className={`group flex flex-col rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:border-primary/30 hover:shadow-md ${opacityClass}`}
        >
            <div className="flex flex-1 flex-col gap-4 p-5">
                {/* Header with badges */}
                <div className="flex items-start justify-between">
                    <div className="flex flex-wrap gap-1.5">
                        {enabledTypes.map((t) => (
                            <Badge key={t} variant={typeVariants[t]}>
                                {t}
                            </Badge>
                        ))}
                    </div>
                    <Badge variant={statusInfo.variant} rounded="full">
                        {statusInfo.label}
                    </Badge>
                </div>

                {/* Title and Institution */}
                <div>
                    <h3 className="mb-1 text-lg font-bold leading-snug text-gray-900 transition-colors group-hover:text-primary">
                        {project.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-gray-500">
                        <MaterialIcon
                            name="account_balance"
                            className="text-[18px]"
                        />
                        <p className="text-sm font-medium">
                            {project.institution}
                        </p>
                    </div>
                </div>

                {/* Date Range */}
                <div className="mt-auto border-t border-gray-200 pt-4">
                    <div className="flex items-center gap-2 text-gray-700">
                        <MaterialIcon
                            name={statusInfo.icon}
                            className={`text-[20px] ${getIconColor()}`}
                        />
                        <p className="text-sm font-medium">
                            {project.startDate} - {project.endDate}
                        </p>
                    </div>
                </div>
            </div>

            {actions !== undefined ? (
                <div className="p-5 pt-0">{actions}</div>
            ) : (
                showActions && <div className="p-5 pt-0">{renderButton()}</div>
            )}
        </article>
    );
}
