import { Link } from '@inertiajs/react';
import Logo from './Icons/Logo';
import MaterialIcon from './Icons/MaterialIcon';

interface NavItem {
    label: string;
    icon: string;
    href: string;
    active?: boolean;
}

interface SidebarProps {
    navItems: NavItem[];
    userName?: string;
    isOnline?: boolean;
    onLogout?: () => void;
    collapsed?: boolean;
    onToggleCollapse?: () => void;
}

export default function Sidebar({
    navItems,
    userName = 'Enumerator',
    isOnline = true,
    onLogout,
    collapsed = false,
    onToggleCollapse,
}: SidebarProps) {
    return (
        <>
            {/* Sidebar */}
            <aside
                className={`relative hidden h-full flex-shrink-0 flex-col border-r border-gray-200 bg-gray-50 transition-all duration-300 md:flex ${collapsed ? 'w-20' : 'w-64'}`}
            >
                {/* Logo */}
                <div
                    className={`flex items-center p-6 ${collapsed ? 'justify-center' : 'gap-3'}`}
                >
                    <div className="flex size-8 items-center justify-center text-primary">
                        <Logo />
                    </div>
                    {!collapsed && (
                        <h2 className="text-xl font-bold tracking-tight text-gray-900">
                            Sistem Survei
                        </h2>
                    )}
                    <button
                        type="button"
                        onClick={onToggleCollapse}
                        aria-expanded={!collapsed}
                        aria-label={
                            collapsed ? 'Buka sidebar' : 'Tutup sidebar'
                        }
                        title={collapsed ? 'Buka sidebar' : 'Tutup sidebar'}
                        className={`absolute flex size-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 shadow-sm transition-colors hover:bg-gray-100 ${collapsed ? 'left-1/2 top-20 -translate-x-1/2' : 'right-3 top-5'}`}
                    >
                        <MaterialIcon
                            name={collapsed ? 'chevron_right' : 'chevron_left'}
                            className="text-[20px]"
                        />
                    </button>
                </div>

                {/* User Status */}
                {!collapsed && (
                    <div className="px-4 py-2">
                        <div className="flex flex-col gap-1">
                            <h1 className="text-base font-bold text-gray-900">
                                {userName}
                            </h1>
                            <div className="flex items-center gap-2">
                                <span
                                    className={`block size-2 rounded-full ${isOnline ? 'bg-primary' : 'bg-gray-400'}`}
                                />
                                <p className="text-sm font-medium text-gray-500">
                                    {isOnline ? 'Online' : 'Offline'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Navigation */}
                <div
                    className={`flex-1 overflow-y-auto py-4 ${collapsed ? 'px-3 pt-14' : 'px-4'}`}
                >
                    <nav className="flex flex-col gap-2">
                        {navItems.map((item) => (
                            <Link
                                key={item.label}
                                href={item.href}
                                aria-label={item.label}
                                title={collapsed ? item.label : undefined}
                                className={`group flex items-center rounded-lg py-2.5 transition-colors ${collapsed ? 'justify-center px-0' : 'gap-3 px-3'} ${
                                    item.active
                                        ? 'bg-gray-200 text-primary'
                                        : 'text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                <MaterialIcon
                                    name={item.icon}
                                    filled={item.active}
                                />
                                {!collapsed && (
                                    <p
                                        className={`text-sm ${item.active ? 'font-bold' : 'font-medium'}`}
                                    >
                                        {item.label}
                                    </p>
                                )}
                            </Link>
                        ))}
                    </nav>
                </div>

                {/* Logout Button */}
                <div
                    className={`border-t border-gray-200 p-4 ${collapsed ? 'px-3' : ''}`}
                >
                    <button
                        onClick={onLogout}
                        aria-label="Log Out"
                        title={collapsed ? 'Log Out' : undefined}
                        className={`flex w-full items-center py-2 text-gray-500 transition-colors hover:text-red-500 ${collapsed ? 'justify-center px-0' : 'gap-3 px-3'}`}
                    >
                        <MaterialIcon name="logout" />
                        {!collapsed && (
                            <p className="text-sm font-medium">Log Out</p>
                        )}
                    </button>
                </div>
            </aside>
        </>
    );
}
