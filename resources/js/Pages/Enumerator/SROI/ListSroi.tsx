import {
    PageHeader,
    ProjectCard,
    ProjectData,
    SearchInput,
} from '@/Components/Enumerator';
import EnumeratorLayout from '@/Layouts/EnumeratorLayout';
import { Head, Link, router } from '@inertiajs/react';
import { debounce } from 'lodash';
import { useCallback, useEffect, useState } from 'react';

interface PaginatedProjects {
    data: ProjectData[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
}

interface ListSroiProps {
    projects: PaginatedProjects;
    filters: {
        search?: string;
    };
}

export default function ListSroi({ projects, filters }: ListSroiProps) {
    const [searchQuery, setSearchQuery] = useState(filters.search || '');

    const debouncedSearch = useCallback(
        debounce((query: string) => {
            router.get(
                route('enumerator.sroi.index'),
                { search: query },
                { preserveState: true, replace: true },
            );
        }, 300),
        [],
    );

    useEffect(() => {
        setSearchQuery(filters.search || '');
    }, [filters.search]);

    const handleSearchChange = (query: string) => {
        setSearchQuery(query);
        debouncedSearch(query);
    };

    const handlePageChange = (page: number) => {
        if (page < 1 || page > projects.last_page) {
            return;
        }

        router.get(
            route('enumerator.sroi.index'),
            { search: searchQuery, page },
            { preserveState: true, replace: true },
        );
    };

    return (
        <EnumeratorLayout activeNav="sroi">
            <Head title="Project SROI" />

            <PageHeader
                title="Project SROI"
                description="Lihat project SROI yang telah ditugaskan kepada Anda."
            />

            <SearchInput
                placeholder="Cari berdasarkan nama project..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full lg:max-w-md"
            />

            {projects.data.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 pb-10 md:grid-cols-2 xl:grid-cols-3">
                    {projects.data.map((project) => (
                        <ProjectCard
                            key={project.id}
                            project={project}
                            actions={
                                <div className="grid grid-cols-2 gap-3">
                                    <Link
                                        href={route(
                                            'enumerator.sroi.data',
                                            project.id,
                                        )}
                                        className="flex items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-dark"
                                    >
                                        Data
                                    </Link>
                                    <button
                                        type="button"
                                        disabled
                                        className="cursor-not-allowed rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-bold text-gray-400"
                                    >
                                        Perhitungan
                                    </button>
                                </div>
                            }
                        />
                    ))}
                </div>
            ) : (
                <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
                    <h2 className="text-lg font-semibold text-gray-900">
                        Belum ada project SROI
                    </h2>
                    <p className="mt-2 text-sm text-gray-500">
                        Project SROI yang ditugaskan kepada Anda akan muncul di
                        sini.
                    </p>
                </div>
            )}

            {projects.last_page > 1 && (
                <div className="flex flex-col gap-3 border-t border-gray-200 pb-6 pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-sm text-gray-500">
                        Menampilkan {projects.from}–{projects.to} dari{' '}
                        {projects.total} project
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() =>
                                handlePageChange(projects.current_page - 1)
                            }
                            disabled={projects.current_page <= 1}
                            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Sebelumnya
                        </button>
                        <span className="px-2 text-sm text-gray-500">
                            {projects.current_page} / {projects.last_page}
                        </span>
                        <button
                            type="button"
                            onClick={() =>
                                handlePageChange(projects.current_page + 1)
                            }
                            disabled={
                                projects.current_page >= projects.last_page
                            }
                            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Berikutnya
                        </button>
                    </div>
                </div>
            )}
        </EnumeratorLayout>
    );
}
