import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { FormEvent, useState } from 'react';

type Company = { id: number; name: string };
type Category = { id: number; company_id: number; name: string };
type Program = {
    id: number;
    company_id: number;
    category_id: number;
    name: string;
    pillar_name: string;
    initiator_owner_name: string;
    start_year: number;
    end_year: number;
    status: string;
    company: Company;
    category: { name: string };
};

export default function Programs({
    programs,
    companies,
    categories,
}: {
    programs: Program[];
    companies: Company[];
    categories: Category[];
}) {
    const { auth } = usePage().props as unknown as {
        auth: { user: { role: string } };
    };
    const isAdmin = ['admin', 'superadmin'].includes(auth.user.role);
    const [creating, setCreating] = useState(false);
    const form = useForm({
        company_id: '',
        category_id: '',
        name: '',
        pillar_name: '',
        initiator_owner_name: '',
        start_year: new Date().getFullYear(),
        end_year: new Date().getFullYear(),
        description: '',
        boundary_text: '',
        status: 'draft',
    });
    const available = categories.filter(
        (category) =>
            !isAdmin || category.company_id === Number(form.data.company_id),
    );
    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post(route('sroi.programs.store'), {
            onSuccess: () => setCreating(false),
        });
    };

    return (
        <AppLayout breadcrumb={{ parent: 'SROI', current: 'Program List' }}>
            <Head title="Program SROI" />
            <div className="mx-auto max-w-6xl space-y-6 p-5 md:p-8">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            Program SROI
                        </h1>
                        <p className="mt-1 text-sm text-slate-600">
                            Penilaian mandiri, terpisah dari proyek IKM dan
                            SLOI.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setCreating(!creating)}
                        className="rounded-lg bg-primary px-4 py-2 font-semibold text-white focus-visible:ring-2 focus-visible:ring-primary"
                        aria-expanded={creating}
                    >
                        Tambah Program
                    </button>
                </div>
                {creating && (
                    <form
                        onSubmit={submit}
                        className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 md:grid-cols-2"
                    >
                        {isAdmin && (
                            <label className="text-sm font-medium">
                                Perusahaan
                                <select
                                    value={form.data.company_id}
                                    onChange={(event) => {
                                        form.setData(
                                            'company_id',
                                            event.target.value,
                                        );
                                        form.setData('category_id', '');
                                    }}
                                    className="mt-1 block w-full rounded-lg border-slate-300"
                                    required
                                >
                                    <option value="">Pilih perusahaan</option>
                                    {companies.map((company) => (
                                        <option
                                            key={company.id}
                                            value={company.id}
                                        >
                                            {company.name}
                                        </option>
                                    ))}
                                </select>
                                {form.errors.company_id && (
                                    <span className="text-red-600">
                                        {form.errors.company_id}
                                    </span>
                                )}
                            </label>
                        )}
                        <label className="text-sm font-medium">
                            Kategori
                            <select
                                value={form.data.category_id}
                                onChange={(event) =>
                                    form.setData(
                                        'category_id',
                                        event.target.value,
                                    )
                                }
                                className="mt-1 block w-full rounded-lg border-slate-300"
                                required
                            >
                                <option value="">Pilih kategori</option>
                                {available.map((category) => (
                                    <option
                                        key={category.id}
                                        value={category.id}
                                    >
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                            {form.errors.category_id && (
                                <span className="text-red-600">
                                    {form.errors.category_id}
                                </span>
                            )}
                        </label>
                        {(
                            [
                                'name',
                                'pillar_name',
                                'initiator_owner_name',
                            ] as const
                        ).map((field) => (
                            <label key={field} className="text-sm font-medium">
                                {
                                    {
                                        name: 'Nama program',
                                        pillar_name: 'Pilar',
                                        initiator_owner_name: 'Pemilik program',
                                    }[field]
                                }
                                <input
                                    value={form.data[field]}
                                    onChange={(event) =>
                                        form.setData(field, event.target.value)
                                    }
                                    className="mt-1 block w-full rounded-lg border-slate-300"
                                    required
                                />
                                {form.errors[field] && (
                                    <span className="text-red-600">
                                        {form.errors[field]}
                                    </span>
                                )}
                            </label>
                        ))}
                        {(['start_year', 'end_year'] as const).map((field) => (
                            <label key={field} className="text-sm font-medium">
                                {field === 'start_year'
                                    ? 'Tahun mulai'
                                    : 'Tahun akhir'}
                                <input
                                    type="number"
                                    min="1900"
                                    max="2200"
                                    value={form.data[field]}
                                    onChange={(event) =>
                                        form.setData(
                                            field,
                                            Number(event.target.value),
                                        )
                                    }
                                    className="mt-1 block w-full rounded-lg border-slate-300"
                                    required
                                />
                                {form.errors[field] && (
                                    <span className="text-red-600">
                                        {form.errors[field]}
                                    </span>
                                )}
                            </label>
                        ))}
                        {(['description', 'boundary_text'] as const).map(
                            (field) => (
                                <label
                                    key={field}
                                    className="text-sm font-medium md:col-span-2"
                                >
                                    {field === 'description'
                                        ? 'Deskripsi'
                                        : 'Batas program'}
                                    <textarea
                                        value={form.data[field]}
                                        onChange={(event) =>
                                            form.setData(
                                                field,
                                                event.target.value,
                                            )
                                        }
                                        className="mt-1 block w-full rounded-lg border-slate-300"
                                        required
                                    />
                                    {form.errors[field] && (
                                        <span className="text-red-600">
                                            {form.errors[field]}
                                        </span>
                                    )}
                                </label>
                            ),
                        )}
                        {available.length === 0 && (
                            <p className="text-sm text-amber-800 md:col-span-2">
                                Kategori program belum tersedia untuk perusahaan
                                ini. Admin perlu membuatnya di katalog SROI.
                            </p>
                        )}
                        <button
                            disabled={form.processing}
                            type="submit"
                            className="rounded-lg bg-primary px-4 py-2 font-semibold text-white disabled:opacity-50"
                        >
                            Simpan Program
                        </button>
                    </form>
                )}
                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                    <table className="w-full min-w-[640px] text-left text-sm">
                        <thead className="bg-slate-50 text-slate-600">
                            <tr>
                                <th className="p-4">Program</th>
                                <th className="p-4">Perusahaan</th>
                                <th className="p-4">Periode</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {programs.map((program) => (
                                <tr
                                    key={program.id}
                                    className="border-t border-slate-100"
                                >
                                    <td className="p-4 font-semibold">
                                        {program.name}
                                        <span className="block text-xs font-normal text-slate-500">
                                            {program.category.name}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        {program.company.name}
                                    </td>
                                    <td className="p-4">
                                        {program.start_year}–{program.end_year}
                                    </td>
                                    <td className="p-4">{program.status}</td>
                                    <td className="p-4">
                                        <Link
                                            href={route('sroi.programs.stage', [
                                                program.id,
                                                'description',
                                            ])}
                                            aria-label={`Edit ${program.name}`}
                                            title="Edit program"
                                            className="inline-flex rounded-lg p-2 text-primary hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-primary"
                                        >
                                            <span
                                                className="material-symbols-outlined"
                                                aria-hidden="true"
                                            >
                                                edit
                                            </span>
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {programs.length === 0 && (
                        <p className="p-8 text-center text-slate-600">
                            Belum ada program SROI.
                        </p>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
