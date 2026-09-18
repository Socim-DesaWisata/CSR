import { Link } from '@inertiajs/react';
import { ReactNode } from 'react';
import Icon from './Icon';
import ProgressBar from './ProgressBar';
import StatusBadge from './StatusBadge';

export interface Project {
    id: number | string;
    code: string;
    name: string;
    type: 'IKM' | 'SLOI' | 'SROI';
    typeLabel: string;
    location: string;
    status: 'active' | 'draft' | 'closed';
    currentResponses: number;
    targetResponses: number;
    startDate?: string;
    endDate?: string;
    // Separate progress for IKM and SLOI
    ikmCurrentResponses?: number;
    ikmTargetResponses?: number;
    sloiCurrentResponses?: number;
    sloiTargetResponses?: number;
    city?: string;
    province?: string;
}

interface SortConfig {
    key: string;
    order: 'asc' | 'desc';
}

interface ProjectTableProps {
    projects: Project[];
    startIndex?: number;
    sortConfig?: SortConfig;
    onSort?: (key: string) => void;
    onEdit?: (project: Project) => void;
    onEditProject?: (project: Project) => void;
    onDelete?: (project: Project) => void;
}

const typeColors = {
    IKM: 'text-primary',
    SLOI: 'text-primary',
    SROI: 'text-primary',
};

function SortIcon({
    columnKey,
    sortConfig,
}: {
    columnKey: string;
    sortConfig?: SortConfig;
}) {
    if (!sortConfig || sortConfig.key !== columnKey) {
        return <Icon name="unfold_more" className="text-sm text-slate-300" />;
    }
    return sortConfig.order === 'asc' ? (
        <Icon name="expand_less" className="text-sm text-primary" />
    ) : (
        <Icon name="expand_more" className="text-sm text-primary" />
    );
}

export default function ProjectTable({
    projects,
    startIndex = 0,
    sortConfig,
    onSort,
    onEdit,
    onEditProject,
    onDelete,
}: ProjectTableProps): ReactNode {
    const handleSort = (key: string) => {
        if (onSort) {
            onSort(key);
        }
    };

    return (
        <div className="rounded-xl border border-slate-200 bg-white">
            {/* Table Header */}
            <div className="grid grid-cols-[auto,1fr,2fr,1fr,1fr,1fr,1fr,auto] gap-4 border-b border-slate-100 bg-slate-50 px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <div className="text-center">No</div>
                <div
                    className="flex cursor-pointer items-center gap-1 hover:text-slate-700"
                    onClick={() => handleSort('project_code')}
                >
                    Code
                    <SortIcon
                        columnKey="project_code"
                        sortConfig={sortConfig}
                    />
                </div>
                <div
                    className="flex cursor-pointer items-center gap-1 hover:text-slate-700"
                    onClick={() => handleSort('name')}
                >
                    Project Details
                    <SortIcon columnKey="name" sortConfig={sortConfig} />
                </div>
                <div className="text-center">Kota</div>
                <div
                    className="flex cursor-pointer items-center justify-center gap-1 hover:text-slate-700"
                    onClick={() => handleSort('status')}
                >
                    Status
                    <SortIcon columnKey="status" sortConfig={sortConfig} />
                </div>
                <div className="text-center">Progress IKM</div>
                <div className="text-center">Progress SLOI</div>
                <div className="text-center">Actions</div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-slate-100">
                {projects.map((project, index) => (
                    <div
                        key={project.id}
                        className="grid grid-cols-[auto,1fr,2fr,1fr,1fr,1fr,1fr,auto] items-center gap-4 px-6 py-5 transition-colors hover:bg-slate-50"
                    >
                        {/* No */}
                        <div className="text-center">
                            <span className="text-sm font-medium text-slate-600">
                                {startIndex + index + 1}
                            </span>
                        </div>

                        {/* Code */}
                        <div>
                            <span className="rounded border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-sm font-medium text-slate-700">
                                {project.code}
                            </span>
                        </div>

                        {/* Project Details */}
                        <div>
                            <Link
                                href={`/projects/${project.id}`}
                                className="font-semibold text-slate-900 hover:text-primary"
                            >
                                {project.name}
                            </Link>
                            <p className="mt-1 text-sm text-slate-500">
                                <span className={typeColors[project.type]}>
                                    {project.typeLabel}
                                </span>
                            </p>
                        </div>

                        {/* City */}
                        <div className="text-center">
                            <span className="text-sm text-slate-600">
                                {project.city || project.location || '-'}
                            </span>
                        </div>

                        {/* Status */}
                        <div className="text-center">
                            <StatusBadge status={project.status} />
                        </div>

                        {/* IKM Progress */}
                        <div>
                            {project.ikmTargetResponses !== undefined &&
                            project.ikmTargetResponses > 0 ? (
                                <ProgressBar
                                    current={project.ikmCurrentResponses || 0}
                                    total={project.ikmTargetResponses}
                                />
                            ) : (
                                <div className="text-center text-sm text-slate-400">
                                    -
                                </div>
                            )}
                        </div>

                        {/* SLOI Progress */}
                        <div>
                            {project.sloiTargetResponses !== undefined &&
                            project.sloiTargetResponses > 0 ? (
                                <ProgressBar
                                    current={project.sloiCurrentResponses || 0}
                                    total={project.sloiTargetResponses}
                                />
                            ) : (
                                <div className="text-center text-sm text-slate-400">
                                    -
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-center">
                            <ActionDropdown
                                project={project}
                                onEdit={onEdit}
                                onEditProject={onEditProject}
                                onDelete={onDelete}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Inline Action Dropdown Component ───────────────────

import { useEffect, useRef, useState } from 'react';

function ActionDropdown({
    project,
    onEdit,
    onEditProject,
    onDelete,
}: {
    project: Project;
    onEdit?: (project: Project) => void;
    onEditProject?: (project: Project) => void;
    onDelete?: (project: Project) => void;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () =>
            document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                }}
                className="flex size-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
                title="Aksi"
            >
                <Icon name="more_vert" className="text-xl" />
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full z-50 mt-1 w-48 overflow-hidden rounded-xl border border-slate-100 bg-white py-1.5 shadow-lg shadow-slate-200/50 ring-1 ring-black/5">
                    {/* Detail */}
                    <Link
                        href={`/projects/${project.id}`}
                        className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50 hover:text-primary"
                    >
                        <Icon name="visibility" className="text-base" />
                        <span className="font-medium">Detail Proyek</span>
                    </Link>

                    {/* Assign Enumerator */}
                    {onEdit && (
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                onEdit(project);
                            }}
                            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50 hover:text-primary"
                        >
                            <Icon name="group_add" className="text-base" />
                            <span className="font-medium">
                                Assign Enumerator
                            </span>
                        </button>
                    )}

                    {/* Edit */}
                    {onEditProject && (
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                onEditProject(project);
                            }}
                            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50 hover:text-primary"
                        >
                            <Icon name="edit" className="text-base" />
                            <span className="font-medium">Edit Proyek</span>
                        </button>
                    )}

                    {/* Delete */}
                    {onDelete && (
                        <div className="my-1 border-t border-slate-100"></div>
                    )}
                    {onDelete && (
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                onDelete(project);
                            }}
                            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50"
                        >
                            <Icon name="delete" className="text-base" />
                            <span className="font-medium">Hapus Proyek</span>
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
