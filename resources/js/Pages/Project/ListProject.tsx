import {
    AssignEnumeratorModal,
    EnumeratorType,
    FilterTabs,
    Icon,
    Pagination,
    Project,
    ProjectTable,
    SearchInput,
    SummaryCard,
} from '@/Components/Company';
import EditProjectModal, {
    type EditProjectData,
} from '@/Components/Company/EditProjectModal';
import type { Province } from '@/Components/Company/ProjectForm';
import CompanyLayout from '@/Layouts/AppLayout';
import { Head, Link, router } from '@inertiajs/react';
import debounce from 'lodash/debounce';
import { useCallback, useState } from 'react';

interface Summary {
    totalProjects: number;
    activeProjects: number;
    draftProjects: number;
    closedProjects: number;
    totalRespondents: number;
}

interface PaginatedProjects {
    data: Project[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface Filters {
    search: string | null;
    status: string;
    sort_by: string;
    sort_order: string;
    per_page: number;
    company_id?: string | null;
    province_id?: string | null;
}

interface CompanyOption {
    id: number;
    name: string;
}

interface Props {
    projects: PaginatedProjects;
    summary: Summary;
    enumerators: EnumeratorType[];
    filters: Filters;
    provinces: Province[];
    canEdit?: boolean;
    companies?: CompanyOption[];
}

const filterTabs = [
    { key: 'all', label: 'Semua' },
    { key: 'active', label: 'Aktif' },
    { key: 'draft', label: 'Draft' },
    { key: 'closed', label: 'Selesai' },
];

const perPageOptions = [10, 25, 50, 100];

export default function ListProject({
    projects,
    summary,
    enumerators,
    filters,
    provinces,
    canEdit = true,
    companies = [],
}: Props) {
    const [searchQuery, setSearchQuery] = useState(filters.search || '');

    // Assign Enumerator Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState<Project | null>(
        null,
    );
    const [assignedEnumeratorIds, setAssignedEnumeratorIds] = useState<
        number[]
    >([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Edit Project Modal state
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editProject, setEditProject] = useState<EditProjectData | null>(
        null,
    );

    const isAdminView = !canEdit;

    // Build clean filter params (exclude null/empty values)
    const buildFilterParams = (
        overrides: Record<string, string | number | null | undefined> = {},
    ) => {
        const merged: Record<string, string | number | null | undefined> = {
            ...filters,
            ...overrides,
        };
        const clean: Record<string, string | number> = {};
        for (const [key, val] of Object.entries(merged)) {
            if (val !== null && val !== undefined && val !== '') {
                clean[key] = val;
            }
        }
        return clean;
    };

    // Debounced search
    const debouncedSearch = useCallback(
        debounce((value: string) => {
            router.get(
                '/projects',
                buildFilterParams({ search: value || null, page: 1 }),
                { preserveState: true, preserveScroll: true },
            );
        }, 300),
        [filters],
    );

    const handleSearchChange = (value: string) => {
        setSearchQuery(value);
        debouncedSearch(value);
    };

    const handleFilterChange = (status: string) => {
        router.get('/projects', buildFilterParams({ status, page: 1 }), {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleSort = (key: string) => {
        const newOrder =
            filters.sort_by === key && filters.sort_order === 'asc'
                ? 'desc'
                : 'asc';
        router.get(
            '/projects',
            buildFilterParams({ sort_by: key, sort_order: newOrder, page: 1 }),
            { preserveState: true, preserveScroll: true },
        );
    };

    const handlePageChange = (page: number) => {
        router.get('/projects', buildFilterParams({ page }), {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handlePerPageChange = (perPage: number) => {
        router.get(
            '/projects',
            buildFilterParams({ per_page: perPage, page: 1 }),
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleCompanyFilter = (companyId: string) => {
        router.get(
            '/projects',
            buildFilterParams({ company_id: companyId || null, page: 1 }),
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleProvinceFilter = (provinceId: string) => {
        router.get(
            '/projects',
            buildFilterParams({ province_id: provinceId || null, page: 1 }),
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleEdit = async (project: Project) => {
        setSelectedProject(project);
        try {
            const response = await fetch(
                `/api/projects/${project.id}/enumerators`,
            );
            const data = await response.json();
            setAssignedEnumeratorIds(data.map((e: { id: number }) => e.id));
        } catch (error) {
            setAssignedEnumeratorIds([]);
        }
        setIsModalOpen(true);
    };

    const handleDelete = (project: Project) => {
        if (
            confirm(
                `Apakah Anda yakin ingin menghapus proyek "${project.name}"?`,
            )
        ) {
            router.delete(`/projects/${project.id}`);
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedProject(null);
        setAssignedEnumeratorIds([]);
    };

    const handleAssignEnumerators = (
        projectId: number | string,
        enumeratorIds: number[],
    ) => {
        setIsSubmitting(true);
        router.post(
            `/projects/${projectId}/assign-enumerators`,
            { enumerator_ids: enumeratorIds },
            {
                preserveScroll: true,
                onSuccess: () => {
                    handleCloseModal();
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            },
        );
    };

    return (
        <CompanyLayout breadcrumb={{ parent: 'Dashboard', current: 'Proyek' }}>
            <Head title="Proyek" />

            <div className="p-8">
                {/* Header Halaman */}
                <div className="mb-8 flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">
                            Portofolio Proyek
                        </h1>
                        <p className="mt-2 text-slate-500">
                            {isAdminView
                                ? 'Pantau seluruh proyek dari semua perusahaan.'
                                : 'Pantau performa dampak sosial melalui survei IKM dan SLOI.'}
                        </p>
                    </div>
                    {canEdit && (
                        <Link
                            href="/projects/create"
                            className="flex items-center gap-2 rounded-lg bg-primary-btn px-5 py-3 font-semibold text-white transition-colors hover:bg-primary-btn-hover"
                        >
                            <Icon name="add" />
                            Buat Proyek
                        </Link>
                    )}
                </div>

                {/* Kartu Ringkasan */}
                <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-3">
                    <SummaryCard
                        icon="folder"
                        iconBgColor="bg-primary/10"
                        iconColor="text-primary"
                        title="Total Proyek"
                        value={summary.totalProjects.toString()}
                        subtitle={`${summary.activeProjects} aktif`}
                    />
                    <SummaryCard
                        icon="groups"
                        iconBgColor="bg-primary/10"
                        iconColor="text-primary"
                        title="Total Responden"
                        value={summary.totalRespondents.toString()}
                        subtitle="Dari semua proyek"
                    />
                    <SummaryCard
                        icon="draft"
                        iconBgColor="bg-amber-50"
                        iconColor="text-amber-600"
                        title="Proposal Draft"
                        value={summary.draftProjects.toString()}
                        subtitle="Menunggu aktivasi"
                    />
                </div>

                {/* Bagian Filter */}
                <div className="mb-6 flex flex-wrap items-center gap-4">
                    <SearchInput
                        placeholder="Cari berdasarkan nama proyek atau kode..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                    />
                    <FilterTabs
                        tabs={filterTabs}
                        activeTab={filters.status}
                        onTabChange={handleFilterChange}
                    />
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-500">
                            Tampilkan:
                        </span>
                        <select
                            value={filters.per_page}
                            onChange={(e) =>
                                handlePerPageChange(Number(e.target.value))
                            }
                            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                            {perPageOptions.map((option) => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Admin Filters: Company & Province */}
                {isAdminView && (
                    <div className="mb-6 flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-600">
                                Perusahaan:
                            </span>
                            <select
                                value={filters.company_id || ''}
                                onChange={(e) =>
                                    handleCompanyFilter(e.target.value)
                                }
                                className="min-w-[200px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            >
                                <option value="">Semua Perusahaan</option>
                                {companies.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-600">
                                Provinsi:
                            </span>
                            <select
                                value={filters.province_id || ''}
                                onChange={(e) =>
                                    handleProvinceFilter(e.target.value)
                                }
                                className="min-w-[200px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            >
                                <option value="">Semua Provinsi</option>
                                {provinces.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}

                {/* Tabel Proyek */}
                <div className="mb-6">
                    {projects.data.length > 0 ? (
                        <ProjectTable
                            projects={projects.data}
                            startIndex={
                                (projects.current_page - 1) * projects.per_page
                            }
                            sortConfig={{
                                key: filters.sort_by,
                                order: filters.sort_order as 'asc' | 'desc',
                            }}
                            onSort={handleSort}
                            onEdit={canEdit ? handleEdit : undefined}
                            onEditProject={
                                canEdit
                                    ? async (project) => {
                                          try {
                                              const res = await fetch(
                                                  `/api/projects/${project.id}/edit-data`,
                                              );
                                              const data: EditProjectData =
                                                  await res.json();
                                              setEditProject(data);
                                              setIsEditModalOpen(true);
                                          } catch {
                                              setEditProject(
                                                  project as unknown as EditProjectData,
                                              );
                                              setIsEditModalOpen(true);
                                          }
                                      }
                                    : undefined
                            }
                            onDelete={canEdit ? handleDelete : undefined}
                        />
                    ) : (
                        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
                            <Icon
                                name="folder_off"
                                className="mx-auto text-5xl text-slate-300"
                            />
                            <h3 className="mt-4 text-lg font-semibold text-slate-900">
                                {searchQuery || filters.status !== 'all'
                                    ? 'Tidak ada proyek yang ditemukan'
                                    : 'Belum ada proyek'}
                            </h3>
                            <p className="mt-2 text-slate-500">
                                {searchQuery || filters.status !== 'all'
                                    ? 'Coba ubah filter atau kata kunci pencarian Anda.'
                                    : 'Mulai buat proyek pertama Anda untuk melacak dampak sosial.'}
                            </p>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {projects.last_page > 1 && (
                    <div className="mb-8">
                        <Pagination
                            currentPage={projects.current_page}
                            totalPages={projects.last_page}
                            totalItems={projects.total}
                            itemsPerPage={projects.per_page}
                            onPageChange={handlePageChange}
                        />
                    </div>
                )}

                {/* Info total data */}
                {projects.total > 0 && (
                    <div className="text-sm text-slate-500">
                        Menampilkan {projects.from} - {projects.to} dari{' '}
                        {projects.total} proyek
                    </div>
                )}
            </div>

            {/* Assign Enumerator Modal — only for company role */}
            {canEdit && (
                <AssignEnumeratorModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    project={selectedProject}
                    enumerators={enumerators || []}
                    assignedEnumeratorIds={assignedEnumeratorIds}
                    onSubmit={handleAssignEnumerators}
                    isLoading={isSubmitting}
                />
            )}

            {/* Edit Project Modal — only for company role */}
            {canEdit && (
                <EditProjectModal
                    isOpen={isEditModalOpen}
                    project={editProject}
                    provinces={provinces || []}
                    onClose={() => {
                        setIsEditModalOpen(false);
                        setEditProject(null);
                    }}
                />
            )}
        </CompanyLayout>
    );
}
