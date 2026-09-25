import { Link } from '@inertiajs/react';
import { ReactNode } from 'react';
import Icon from './Icon';

interface NavItemProps {
    href: string;
    icon: string;
    label: string;
    active?: boolean;
    disabled?: boolean;
    roles?: string[];
    hideForRoles?: string[];
}

interface SidebarProps {
    currentRoute?: string;
    collapsed?: boolean;
    user: { role: string };
}

const navItems: NavItemProps[] = [
    { href: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
    { href: '/projects', icon: 'assignment', label: 'Projects' },
    {
        href: '/enumerators',
        icon: 'group',
        label: 'Enumerators',
        hideForRoles: ['superadmin', 'admin'],
    },
    {
        href: '/sroi/program',
        icon: 'insights',
        label: 'SROI',
        roles: ['admin', 'superadmin', 'company'],
    },
    { href: '/profile', icon: 'settings', label: 'Settings' },
    {
        href: '/templates',
        icon: 'folder',
        label: 'Templates',
        roles: ['superadmin', 'admin'],
    },
    {
        href: '/companies',
        icon: 'business',
        label: 'Companies',
        roles: ['superadmin', 'admin'],
    },
    {
        href: '/users',
        icon: 'manage_accounts',
        label: 'Users',
        roles: ['superadmin', 'admin'],
    },
];

function NavItem({
    href,
    icon,
    label,
    active = false,
    disabled = false,
    collapsed = false,
}: NavItemProps & { collapsed?: boolean }): ReactNode {
    const baseClasses = collapsed
        ? 'flex h-12 items-center justify-center rounded-lg transition-all'
        : 'flex items-center gap-4 rounded-lg px-4 py-3 transition-all';
    const activeClasses = disabled
        ? 'cursor-not-allowed opacity-40'
        : active
          ? 'bg-white/15 ring-1 ring-white/20'
          : 'hover:bg-white/10';
    const content = (
        <>
            <Icon name={icon} />
            {!collapsed && <span className="font-medium">{label}</span>}
        </>
    );

    if (disabled) {
        return (
            <span
                className={`${baseClasses} ${activeClasses}`}
                role="link"
                aria-disabled="true"
                aria-label={label}
                title="Pilih program terlebih dahulu"
            >
                {content}
            </span>
        );
    }

    return (
        <Link
            href={href}
            className={`${baseClasses} ${activeClasses}`}
            aria-label={label}
            title={collapsed ? label : undefined}
        >
            {content}
        </Link>
    );
}

export default function Sidebar({
    currentRoute,
    collapsed = false,
    user,
}: SidebarProps): ReactNode {
    const sroiMode = currentRoute?.startsWith('/sroi');
    const programId = currentRoute?.match(/^\/sroi\/program\/(\d+)/)?.[1];
    const stageHref = (stage: string) =>
        programId ? `/sroi/program/${programId}/${stage}` : '/sroi/program';
    const stageItem = (
        stage: string,
        icon: string,
        label: string,
    ): NavItemProps => ({
        href: stageHref(stage),
        icon,
        label,
        disabled: !programId,
    });
    const sroiGroups: { heading: string; items: NavItemProps[] }[] = [
        {
            heading: 'Utama',
            items: [
                { href: '/sroi', icon: 'dashboard', label: 'Dashboard' },
                {
                    href: '/sroi/program',
                    icon: 'list_alt',
                    label: 'Program List',
                },
                stageItem('report', 'description', 'SROI Report'),
            ],
        },
        {
            heading: 'Perencanaan',
            items: [
                stageItem('description', 'article', 'General Description'),
                stageItem(
                    'theory-of-change',
                    'account_tree',
                    'Theory of Change',
                ),
                stageItem('lfa', 'schema', 'LFA'),
                stageItem('roadmap', 'route', 'Roadmap'),
            ],
        },
        {
            heading: 'Penilaian',
            items: [
                stageItem('scope', 'fact_check', 'Program Scope'),
                stageItem(
                    'stakeholder',
                    'groups',
                    'Stakeholder Identification',
                ),
                stageItem('outcome', 'checklist', 'Outcome Identification'),
                stageItem('table', 'table_chart', 'SROI Table'),
                stageItem('calculation', 'calculate', 'SROI Calculation'),
            ],
        },
        {
            heading: 'Admin',
            items: [
                {
                    href: '/sroi/catalog',
                    icon: 'category',
                    label: 'Stakeholder & Outcome',
                    roles: ['admin', 'superadmin'],
                },
                {
                    href: '/sroi/companies',
                    icon: 'business',
                    label: 'Company List',
                    roles: ['admin', 'superadmin'],
                },
            ],
        },
    ];

    return (
        <aside
            id="app-sidebar"
            className={`flex flex-shrink-0 flex-col bg-primary text-white transition-all duration-300 ${
                collapsed
                    ? 'relative z-10 w-14 items-center'
                    : 'fixed bottom-0 left-0 top-20 z-30 w-72 md:relative md:inset-auto md:z-10'
            }`}
        >
            <div
                className={`flex items-center border-b border-white/10 ${
                    collapsed ? 'justify-center px-2 py-5' : 'px-6 py-6'
                }`}
            >
                <Link
                    href="/"
                    className="flex items-center justify-center overflow-hidden"
                    aria-label="Beranda"
                >
                    <img
                        src={
                            collapsed
                                ? '/img/LogoTab.svg'
                                : '/img/LogoHeader.svg'
                        }
                        alt="Logo"
                        className={
                            collapsed
                                ? 'size-9 object-contain'
                                : 'h-10 w-auto opacity-75 brightness-0 invert filter'
                        }
                    />
                </Link>
            </div>

            <nav
                className={`flex-1 overflow-y-auto ${
                    collapsed
                        ? 'w-full space-y-2 px-2 py-5'
                        : 'mt-4 space-y-1 px-4'
                }`}
            >
                {sroiMode && (
                    <NavItem
                        href="/dashboard"
                        icon="arrow_back"
                        label="Kembali ke CSR"
                        collapsed={collapsed}
                    />
                )}
                {sroiMode
                    ? sroiGroups.map((group) => {
                          const items = group.items.filter(
                              (item) =>
                                  !item.roles ||
                                  item.roles.includes(user.role.toLowerCase()),
                          );
                          if (!items.length) return null;
                          return (
                              <div key={group.heading} className="pt-3">
                                  {!collapsed && (
                                      <p className="px-4 pb-2 text-xs font-semibold uppercase tracking-wide text-white/60">
                                          {group.heading}
                                      </p>
                                  )}
                                  {items.map((item) => (
                                      <NavItem
                                          key={`${group.heading}-${item.label}`}
                                          {...item}
                                          collapsed={collapsed}
                                          active={currentRoute === item.href}
                                      />
                                  ))}
                              </div>
                          );
                      })
                    : navItems
                          .filter((item) => {
                              const userRole = user.role.toLowerCase();
                              const isAllowedByRoles =
                                  !item.roles ||
                                  item.roles
                                      .map((r) => r.toLowerCase())
                                      .includes(userRole);
                              const isHiddenByRoles =
                                  item.hideForRoles &&
                                  item.hideForRoles
                                      .map((r) => r.toLowerCase())
                                      .includes(userRole);
                              return isAllowedByRoles && !isHiddenByRoles;
                          })
                          .map((item) => (
                              <NavItem
                                  key={item.href}
                                  {...item}
                                  collapsed={collapsed}
                                  active={
                                      currentRoute === item.href ||
                                      currentRoute?.startsWith(item.href + '/')
                                  }
                              />
                          ))}
            </nav>
        </aside>
    );
}
