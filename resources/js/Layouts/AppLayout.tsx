import Footer from '@/Components/Company/Footer';
import Header from '@/Components/Company/Header';
import Sidebar from '@/Components/Company/Sidebar';
import { Toaster } from '@/Components/ui/toaster';
import { usePage } from '@inertiajs/react';
import { PropsWithChildren, ReactNode, useEffect, useState } from 'react';

interface AppLayoutProps extends PropsWithChildren {
    breadcrumb: {
        parent: string;
        current: string;
    };
}

export default function AppLayout({
    children,
    breadcrumb,
}: AppLayoutProps): ReactNode {
    const { auth } = usePage().props as unknown as {
        auth: { user: { role: string } };
    };
    const currentPath = window.location.pathname;
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
        if (typeof window === 'undefined') {
            return false;
        }

        return (
            window.innerWidth < 768 ||
            window.localStorage.getItem('company-sidebar-collapsed') === '1'
        );
    });

    useEffect(() => {
        window.localStorage.setItem(
            'company-sidebar-collapsed',
            isSidebarCollapsed ? '1' : '0',
        );
    }, [isSidebarCollapsed]);

    return (
        <div className="flex h-screen overflow-hidden bg-background-light text-slate-900 antialiased">
            <Sidebar
                collapsed={isSidebarCollapsed}
                currentRoute={currentPath}
                user={{ role: auth.user.role }}
            />
            {!isSidebarCollapsed && (
                <button
                    type="button"
                    onClick={() => setIsSidebarCollapsed(true)}
                    aria-label="Tutup sidebar"
                    className="fixed bottom-0 left-0 right-0 top-20 z-20 bg-black/30 md:hidden"
                />
            )}

            <main className="flex min-w-0 flex-1 flex-col overflow-y-auto">
                <Header
                    breadcrumb={breadcrumb}
                    sidebarCollapsed={isSidebarCollapsed}
                    onToggleSidebar={() =>
                        setIsSidebarCollapsed((collapsed) => !collapsed)
                    }
                />
                <div className="flex-1">{children}</div>
                <Footer />
            </main>

            <Toaster />
        </div>
    );
}
