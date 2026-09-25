import { usePage } from '@inertiajs/react';
import { Building2 } from 'lucide-react';
import { ReactNode } from 'react';
import Icon from './Icon';

interface HeaderProps {
    breadcrumb: {
        parent: string;
        current: string;
    };
}

export default function Header({ breadcrumb }: HeaderProps): ReactNode {
    const { auth } = usePage().props as {
        auth: { user: { name: string }; companyName?: string | null };
    };

    const displayName = auth.companyName ?? auth.user.name;

    return (
        <header className="sticky top-0 z-10 flex h-20 items-center justify-between gap-3 border-b border-slate-200 bg-card-light px-4 md:px-8">
            {/* Breadcrumb */}
            <div className="flex min-w-0 items-center gap-2 text-slate-500 md:gap-4">
                <span className="hidden truncate text-sm font-medium sm:block">
                    {breadcrumb.parent}
                </span>
                <Icon name="chevron_right" className="text-base" />
                <span className="truncate text-sm font-bold text-slate-900">
                    {breadcrumb.current}
                </span>
            </div>

            {/* Company / User Name */}
            <div className="hidden shrink-0 items-center gap-2.5 border-slate-200 bg-slate-50 px-4 py-2 shadow-sm lg:flex">
                <div className="flex size-8 items-center justify-center rounded-full bg-primary/10">
                    <Building2 className="size-4 text-primary" />
                </div>
                <span className="text-sm font-bold text-slate-800">
                    {displayName}
                </span>
            </div>
        </header>
    );
}
