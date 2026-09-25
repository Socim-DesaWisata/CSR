import AppLayout from '@/Layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';

type Company = {
    id: number;
    name: string;
    status: string;
    email: string | null;
    phone: string | null;
};

export default function Companies({ companies }: { companies: Company[] }) {
    return (
        <AppLayout breadcrumb={{ parent: 'SROI', current: 'Company List' }}>
            <Head title="Perusahaan SROI" />
            <div className="mx-auto max-w-6xl space-y-5 p-5 md:p-8">
                <h1 className="text-2xl font-bold">Company List</h1>
                <div className="overflow-x-auto rounded-xl border bg-white">
                    <table className="w-full min-w-[520px] text-left text-sm">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="p-4">Perusahaan</th>
                                <th className="p-4">Email</th>
                                <th className="p-4">Telepon</th>
                                <th className="p-4">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {companies.map((company) => (
                                <tr key={company.id} className="border-t">
                                    <td className="p-4 font-semibold">
                                        {company.name}
                                    </td>
                                    <td className="p-4">
                                        {company.email ?? '—'}
                                    </td>
                                    <td className="p-4">
                                        {company.phone ?? '—'}
                                    </td>
                                    <td className="p-4">{company.status}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <Link
                    href={route('sroi.programs.index')}
                    className="inline-block text-sm font-semibold text-primary hover:underline"
                >
                    Kembali ke Program List
                </Link>
            </div>
        </AppLayout>
    );
}
