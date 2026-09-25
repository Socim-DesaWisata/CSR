import Modal from '@/Components/Modal';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { router, usePage } from '@inertiajs/react';
import {
    ChevronDown,
    LogOut,
    PanelLeftClose,
    PanelLeftOpen,
    UserRound,
} from 'lucide-react';
import { ReactNode, useState } from 'react';
import Icon from './Icon';

interface HeaderProps {
    breadcrumb: {
        parent: string;
        current: string;
    };
    sidebarCollapsed: boolean;
    onToggleSidebar: () => void;
}

export default function Header({
    breadcrumb,
    sidebarCollapsed,
    onToggleSidebar,
}: HeaderProps): ReactNode {
    const { auth } = usePage().props as {
        auth: { user: { name: string } };
    };
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    return (
        <>
            <header className="sticky top-0 z-20 flex h-20 items-center justify-between gap-3 border-b border-slate-200 bg-card-light px-4 md:px-8">
                <div className="flex min-w-0 items-center gap-2 text-slate-500 md:gap-4">
                    <button
                        type="button"
                        onClick={onToggleSidebar}
                        aria-controls="app-sidebar"
                        aria-expanded={!sidebarCollapsed}
                        aria-label={
                            sidebarCollapsed ? 'Buka sidebar' : 'Tutup sidebar'
                        }
                        title={
                            sidebarCollapsed ? 'Buka sidebar' : 'Tutup sidebar'
                        }
                        className="flex size-10 shrink-0 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                    >
                        {sidebarCollapsed ? (
                            <PanelLeftOpen className="size-5" />
                        ) : (
                            <PanelLeftClose className="size-5" />
                        )}
                    </button>
                    <span className="hidden truncate text-sm font-medium sm:block">
                        {breadcrumb.parent}
                    </span>
                    <Icon
                        name="chevron_right"
                        className="hidden text-base sm:block"
                    />
                    <span className="truncate text-sm font-bold text-slate-900">
                        {breadcrumb.current}
                    </span>
                </div>

                <Menu as="div" className="relative shrink-0">
                    <MenuButton className="flex max-w-32 items-center gap-2 rounded-lg bg-slate-50 px-2 py-2 text-slate-800 transition-colors hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary sm:max-w-56 sm:px-3">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                            <UserRound className="size-4 text-primary" />
                        </span>
                        <span className="truncate text-sm font-bold">
                            {auth.user.name}
                        </span>
                        <ChevronDown
                            className="size-4 shrink-0 text-slate-500"
                            aria-hidden="true"
                        />
                    </MenuButton>
                    <MenuItems className="absolute right-0 z-30 mt-2 w-44 rounded-lg border border-slate-200 bg-white p-1 shadow-lg focus:outline-none">
                        <MenuItem>
                            <button
                                type="button"
                                onClick={() => setShowLogoutModal(true)}
                                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-slate-700 data-[focus]:bg-slate-100"
                            >
                                <LogOut className="size-4" aria-hidden="true" />
                                Logout
                            </button>
                        </MenuItem>
                    </MenuItems>
                </Menu>
            </header>

            <Modal
                show={showLogoutModal}
                onClose={() => setShowLogoutModal(false)}
                maxWidth="sm"
            >
                <div className="p-6">
                    <div className="mb-4 flex items-center justify-center">
                        <div className="flex size-14 items-center justify-center rounded-full bg-red-100 text-red-600">
                            <LogOut className="size-7" />
                        </div>
                    </div>
                    <h3 className="mb-2 text-center text-lg font-bold text-gray-900">
                        Konfirmasi Logout
                    </h3>
                    <p className="mb-6 text-center text-sm text-gray-600">
                        Apakah Anda yakin ingin keluar dari aplikasi? Anda harus
                        login kembali untuk mengakses sistem.
                    </p>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => setShowLogoutModal(false)}
                            className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 focus:ring-2 focus:ring-gray-100"
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            onClick={() => router.post(route('logout'))}
                            className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-red-700 focus:ring-2 focus:ring-red-200"
                        >
                            Ya, Keluar
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    );
}
