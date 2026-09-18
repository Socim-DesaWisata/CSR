import {
    Icon,
    Pagination,
    SearchInput,
    SummaryCard,
} from '@/Components/Company';
import CompanyLayout from '@/Layouts/AppLayout';
import { Head, router } from '@inertiajs/react';
import debounce from 'lodash/debounce';
import { useCallback, useState } from 'react';
import ModalUserForm from './components/ModalUserForm';

interface User {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    role: 'superadmin' | 'admin' | 'company' | 'enumerator';
    is_active: boolean;
    created_at: string;
    company: {
        id: number;
        name: string;
    } | null;
}

interface Summary {
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    adminCount: number;
    companyCount: number;
    enumeratorCount: number;
}

interface PaginatedUsers {
    data: User[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface Filters {
    search: string | null;
    role: string;
    status: string;
    sort_by: string;
    sort_order: string;
    per_page: number;
}

interface Props {
    users: PaginatedUsers;
    summary: Summary;
    filters: Filters;
    companies: { id: number; name: string }[];
}

const roleTabs = [
    { key: 'all', label: 'Semua' },
    { key: 'superadmin', label: 'Super Admin' },
    { key: 'admin', label: 'Admin' },
    { key: 'company', label: 'Company' },
    { key: 'enumerator', label: 'Enumerator' },
];

const roleLabels: Record<string, string> = {
    superadmin: 'Super Admin',
    admin: 'Admin',
    company: 'Company',
    enumerator: 'Enumerator',
};

const roleStyles: Record<string, string> = {
    superadmin: 'bg-red-50 text-red-700 border-red-200',
    admin: 'bg-purple-50 text-purple-700 border-purple-200',
    company: 'bg-blue-50 text-blue-700 border-blue-200',
    enumerator: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const perPageOptions = [10, 25, 50, 100];

type SortKey = 'name' | 'email' | 'role' | 'is_active' | 'created_at';

const sortableColumns: { key: SortKey; label: string }[] = [
    { key: 'name', label: 'Nama' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role' },
    { key: 'is_active', label: 'Status' },
    { key: 'created_at', label: 'Terdaftar' },
];

export default function ListUser({
    users,
    summary,
    filters,
    companies,
}: Props) {
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    const openCreateModal = () => {
        setSelectedUser(null);
        setIsModalOpen(true);
    };

    const openEditModal = (user: User) => {
        setSelectedUser(user);
        setIsModalOpen(true);
    };

    const navigateWithFilters = (overrides: Record<string, unknown>) => {
        router.get(
            route('users.index'),
            { ...filters, page: 1, ...overrides },
            { preserveState: true, preserveScroll: true },
        );
    };

    const debouncedSearch = useCallback(
        debounce((value: string) => {
            navigateWithFilters({ search: value || null });
        }, 300),
        [filters],
    );

    const handleSearchChange = (value: string) => {
        setSearchQuery(value);
        debouncedSearch(value);
    };

    const handleRoleFilter = (role: string) => {
        navigateWithFilters({ role });
    };

    const handleSort = (key: string) => {
        const newOrder =
            filters.sort_by === key && filters.sort_order === 'asc'
                ? 'desc'
                : 'asc';
        navigateWithFilters({ sort_by: key, sort_order: newOrder });
    };

    const handlePageChange = (page: number) => {
        router.get(
            route('users.index'),
            { ...filters, page },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handlePerPageChange = (perPage: number) => {
        navigateWithFilters({ per_page: perPage });
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    return (
        <CompanyLayout
            breadcrumb={{ parent: 'Dashboard', current: 'Pengguna' }}
        >
            <Head title="Manajemen Pengguna" />

            <div className="p-8">
                {/* Header */}
                <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">
                            Manajemen Pengguna
                        </h1>
                        <p className="mt-2 text-slate-500">
                            Kelola semua pengguna yang terdaftar dalam sistem.
                        </p>
                    </div>
                    <button
                        onClick={openCreateModal}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    >
                        <Icon name="person_add" className="text-[20px]" />
                        Tambah Pengguna
                    </button>
                </div>

                {/* Summary Cards */}
                <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
                    <SummaryCard
                        icon="groups"
                        iconBgColor="bg-primary/10"
                        iconColor="text-primary"
                        title="Total Pengguna"
                        value={summary.totalUsers}
                        subtitle={`${summary.activeUsers} aktif`}
                    />
                    <SummaryCard
                        icon="admin_panel_settings"
                        iconBgColor="bg-purple-50"
                        iconColor="text-purple-600"
                        title="Admin"
                        value={summary.adminCount}
                        subtitle="Admin & Super Admin"
                    />
                    <SummaryCard
                        icon="business"
                        iconBgColor="bg-blue-50"
                        iconColor="text-blue-600"
                        title="Company"
                        value={summary.companyCount}
                        subtitle="Akun perusahaan"
                    />
                    <SummaryCard
                        icon="person_search"
                        iconBgColor="bg-emerald-50"
                        iconColor="text-emerald-600"
                        title="Enumerator"
                        value={summary.enumeratorCount}
                        subtitle="Surveyor lapangan"
                    />
                </div>

                {/* Filters */}
                <div className="mb-6 flex flex-wrap items-center gap-4">
                    <SearchInput
                        placeholder="Cari nama, email, atau perusahaan..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                    />
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-500">Role:</span>
                        <select
                            value={filters.role || 'all'}
                            onChange={(e) => handleRoleFilter(e.target.value)}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                            {roleTabs.map((tab) => (
                                <option key={tab.key} value={tab.key}>
                                    {tab.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-500">Status:</span>
                        <select
                            value={filters.status || 'all'}
                            onChange={(e) =>
                                navigateWithFilters({ status: e.target.value })
                            }
                            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                            <option value="all">Semua</option>
                            <option value="active">Aktif</option>
                            <option value="inactive">Nonaktif</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-500">
                            Tampilkan:
                        </span>
                        <select
                            value={filters.per_page || 10}
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

                {/* Table */}
                <div className="mb-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
                    {users.data.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50">
                                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                            No
                                        </th>
                                        {sortableColumns.map((col) => (
                                            <th
                                                key={col.key}
                                                className="cursor-pointer px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 transition-colors hover:text-slate-900"
                                                onClick={() =>
                                                    handleSort(col.key)
                                                }
                                            >
                                                <div className="flex items-center gap-1">
                                                    {col.label}
                                                    {filters.sort_by ===
                                                    col.key ? (
                                                        <Icon
                                                            name={
                                                                filters.sort_order ===
                                                                'asc'
                                                                    ? 'arrow_upward'
                                                                    : 'arrow_downward'
                                                            }
                                                            className="text-sm text-primary"
                                                        />
                                                    ) : (
                                                        <Icon
                                                            name="unfold_more"
                                                            className="text-sm text-slate-300"
                                                        />
                                                    )}
                                                </div>
                                            </th>
                                        ))}
                                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                            Perusahaan
                                        </th>
                                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                            Telepon
                                        </th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {users.data.map((user, index) => (
                                        <tr
                                            key={user.id}
                                            className="transition-colors hover:bg-slate-50"
                                        >
                                            <td className="px-6 py-4 text-slate-500">
                                                {(users.current_page - 1) *
                                                    users.per_page +
                                                    index +
                                                    1}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-slate-900">
                                                    {user.name}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">
                                                {user.email}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${roleStyles[user.role]}`}
                                                >
                                                    {roleLabels[user.role]}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                                                        user.is_active
                                                            ? 'bg-emerald-50 text-emerald-700'
                                                            : 'bg-red-50 text-red-600'
                                                    }`}
                                                >
                                                    <span
                                                        className={`size-1.5 rounded-full ${user.is_active ? 'bg-emerald-500' : 'bg-red-500'}`}
                                                    />
                                                    {user.is_active
                                                        ? 'Aktif'
                                                        : 'Nonaktif'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500">
                                                {formatDate(user.created_at)}
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">
                                                {user.company?.name ?? '-'}
                                            </td>
                                            <td className="px-6 py-4 text-slate-500">
                                                {user.phone ?? '-'}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() =>
                                                        openEditModal(user)
                                                    }
                                                    className="inline-flex items-center justify-center rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus:outline-none"
                                                    title="Edit Pengguna"
                                                >
                                                    <Icon
                                                        name="edit"
                                                        className="text-[20px]"
                                                    />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-12 text-center">
                            <Icon
                                name="person_off"
                                className="mx-auto text-5xl text-slate-300"
                            />
                            <h3 className="mt-4 text-lg font-semibold text-slate-900">
                                {searchQuery ||
                                (filters.role && filters.role !== 'all')
                                    ? 'Tidak ada pengguna yang ditemukan'
                                    : 'Belum ada pengguna'}
                            </h3>
                            <p className="mt-2 text-slate-500">
                                {searchQuery ||
                                (filters.role && filters.role !== 'all')
                                    ? 'Coba ubah filter atau kata kunci pencarian Anda.'
                                    : 'Pengguna akan muncul di sini setelah terdaftar.'}
                            </p>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {users.last_page > 1 && (
                    <div className="mb-8">
                        <Pagination
                            currentPage={users.current_page}
                            totalPages={users.last_page}
                            totalItems={users.total}
                            itemsPerPage={users.per_page}
                            onPageChange={handlePageChange}
                        />
                    </div>
                )}

                {/* Info total data */}
                {/* {users.total > 0 && (
                    <div className="text-sm text-slate-500">
                        Menampilkan {users.from} - {users.to} dari{' '}
                        {users.total} pengguna
                    </div>
                )} */}

                <ModalUserForm
                    show={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    companies={companies}
                    user={selectedUser}
                />
            </div>
        </CompanyLayout>
    );
}
