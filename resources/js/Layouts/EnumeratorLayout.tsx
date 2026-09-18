import { MobileBottomNav, Sidebar, TopBar } from '@/Components/Enumerator';
import { Toaster } from '@/Components/ui/toaster';
import { router } from '@inertiajs/react';
import { PropsWithChildren, useEffect, useState } from 'react';

interface NavItem {
    label: string;
    icon: string;
    href: string;
    active?: boolean;
}

interface EnumeratorLayoutProps extends PropsWithChildren {
    activeNav?: string;
    fullWidth?: boolean;
}

export default function EnumeratorLayout({
    children,
    activeNav = 'dashboard',
    fullWidth = false,
}: EnumeratorLayoutProps) {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
        if (typeof window === 'undefined') {
            return false;
        }

        return (
            window.localStorage.getItem('enumerator-sidebar-collapsed') === '1'
        );
    });

    useEffect(() => {
        window.localStorage.setItem(
            'enumerator-sidebar-collapsed',
            isSidebarCollapsed ? '1' : '0',
        );
    }, [isSidebarCollapsed]);

    const navItems: NavItem[] = [
        {
            label: 'Dashboard',
            icon: 'dashboard',
            href: route('enumerator.list-survey'),
            active: activeNav === 'dashboard',
        },
        {
            label: 'SROI',
            icon: 'analytics',
            href: route('enumerator.sroi.index'),
            active: activeNav === 'sroi',
        },
        {
            label: 'Riwayat',
            icon: 'history',
            href: route('enumerator.survey.history'),
            active: activeNav === 'riwayat',
        },
        {
            label: 'Profil',
            icon: 'person',
            href: route('profile.edit'),
            active: activeNav === 'profil',
        },
    ];

    const handleLogout = () => {
        router.post(route('logout'));
    };

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50 pb-16 md:pb-0">
            {/* Desktop Sidebar */}
            <Sidebar
                navItems={navItems}
                userName="Enumerator"
                isOnline={true}
                onLogout={handleLogout}
                collapsed={isSidebarCollapsed}
                onToggleCollapse={() =>
                    setIsSidebarCollapsed((collapsed) => !collapsed)
                }
            />

            {/* Main Content Wrapper */}
            <main className="relative flex h-full min-w-0 flex-1 flex-col overflow-hidden">
                {/* Desktop Top Bar */}
                <TopBar profileImage="https://lh3.googleusercontent.com/aida-public/AB6AXuA3Akw0BRi5rbwckYP1b0uFE48O5Kzcz4Bqnw6dYEHhksrtKrnxqDUvLhiCjVIY7Z1jIJ_S4OnL6Rg5qNiHaJlgDgATV9AHam64rZXvmdsdbdBXFf2qlLGgqvQ6ssrei7iAZkbkFQOLO3i9Dkiw5R46Nag0bicWMRkdcNMTvuspmiTCKQKXlIqP04fy5p0PwdHkN0C1aMKZQFa93c85fQ7SeWSWW9iK2hHfLho4cD_STDyGBJdAV1DTqAOuw2sULydiuMSB3-COyAU" />

                {/* Scrollable Content */}
                <div
                    className={`flex-1 overflow-y-auto bg-gray-50 ${fullWidth ? 'p-2 sm:p-3 md:p-4' : 'p-4 md:p-8'}`}
                >
                    <div
                        className={`mx-auto flex flex-col gap-6 ${fullWidth ? 'max-w-none' : 'max-w-[1200px]'}`}
                    >
                        {children}
                    </div>
                </div>
            </main>
            {/* Mobile Bottom Navigation */}
            <MobileBottomNav navItems={navItems} />
            <Toaster />
        </div>
    );
}
