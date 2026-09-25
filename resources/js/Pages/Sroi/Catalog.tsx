import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent, useState } from 'react';

type Company = {
    id: number;
    name: string;
    status: string;
    email: string | null;
    phone: string | null;
};
type Entry = {
    id: number;
    company_id: number;
    program_category_id?: number;
    stakeholder_category_id?: number;
    code: string;
    name: string;
    active: boolean;
};
type Kind =
    | 'program-categories'
    | 'stakeholder-categories'
    | 'stakeholder-lists'
    | 'outcome-categories';
type Catalogs = Record<Kind, Entry[]>;
const labels: Record<Kind, string> = {
    'program-categories': 'Kategori Program',
    'stakeholder-categories': 'Kategori Stakeholder',
    'stakeholder-lists': 'Daftar Stakeholder',
    'outcome-categories': 'Kategori Outcome',
};

function CatalogPanel({
    kind,
    catalogs,
    companies,
}: {
    kind: Kind;
    catalogs: Catalogs;
    companies: Company[];
}) {
    const [editing, setEditing] = useState<number | null>(null);
    const form = useForm({
        company_id: '',
        program_category_id: '',
        stakeholder_category_id: '',
        code: '',
        name: '',
        active: true,
    });
    const categoryOptions = catalogs['program-categories'].filter(
        (entry) => entry.company_id === Number(form.data.company_id),
    );
    const stakeholderOptions = catalogs['stakeholder-categories'].filter(
        (entry) =>
            entry.company_id === Number(form.data.company_id) &&
            entry.program_category_id === Number(form.data.program_category_id),
    );
    const rows = catalogs[kind].filter(
        (entry) =>
            !form.data.company_id ||
            entry.company_id === Number(form.data.company_id),
    );
    const edit = (entry: Entry) => {
        form.clearErrors();
        form.setData({
            company_id: String(entry.company_id),
            program_category_id: String(entry.program_category_id ?? ''),
            stakeholder_category_id: String(
                entry.stakeholder_category_id ?? '',
            ),
            code: entry.code,
            name: entry.name,
            active: Boolean(entry.active),
        });
        setEditing(entry.id);
    };
    const submit = (event: FormEvent) => {
        event.preventDefault();
        const data = {
            company_id: form.data.company_id,
            code: form.data.code,
            name: form.data.name,
            active: form.data.active,
            ...(kind !== 'program-categories'
                ? { program_category_id: form.data.program_category_id }
                : {}),
            ...(kind === 'stakeholder-lists'
                ? { stakeholder_category_id: form.data.stakeholder_category_id }
                : {}),
        };
        const options = {
            onSuccess: () => {
                setEditing(null);
                form.reset('code', 'name');
            },
        };
        form.transform(() => data);
        if (editing)
            form.put(route('sroi.catalog.update', [kind, editing]), options);
        else form.post(route('sroi.catalog.store', kind), options);
    };

    return (
        <section className="space-y-5 rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-bold">{labels[kind]}</h2>
            <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
                <label className="text-sm font-medium">
                    Perusahaan
                    <select
                        disabled={editing !== null}
                        required
                        value={form.data.company_id}
                        onChange={(event) =>
                            form.setData({
                                ...form.data,
                                company_id: event.target.value,
                                program_category_id: '',
                                stakeholder_category_id: '',
                            })
                        }
                        className="mt-1 block w-full rounded-lg border-slate-300"
                    >
                        <option value="">Pilih perusahaan</option>
                        {companies
                            .filter((company) => company.status === 'active')
                            .map((company) => (
                                <option key={company.id} value={company.id}>
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
                {kind !== 'program-categories' && (
                    <label className="text-sm font-medium">
                        Kategori Program
                        <select
                            disabled={editing !== null}
                            required
                            value={form.data.program_category_id}
                            onChange={(event) =>
                                form.setData({
                                    ...form.data,
                                    program_category_id: event.target.value,
                                    stakeholder_category_id: '',
                                })
                            }
                            className="mt-1 block w-full rounded-lg border-slate-300"
                        >
                            <option value="">Pilih kategori</option>
                            {categoryOptions.map((entry) => (
                                <option key={entry.id} value={entry.id}>
                                    {entry.name}
                                </option>
                            ))}
                        </select>
                        {form.errors.program_category_id && (
                            <span className="text-red-600">
                                {form.errors.program_category_id}
                            </span>
                        )}
                    </label>
                )}
                {kind === 'stakeholder-lists' && (
                    <label className="text-sm font-medium">
                        Kategori Stakeholder
                        <select
                            disabled={editing !== null}
                            required
                            value={form.data.stakeholder_category_id}
                            onChange={(event) =>
                                form.setData(
                                    'stakeholder_category_id',
                                    event.target.value,
                                )
                            }
                            className="mt-1 block w-full rounded-lg border-slate-300"
                        >
                            <option value="">Pilih kategori</option>
                            {stakeholderOptions.map((entry) => (
                                <option key={entry.id} value={entry.id}>
                                    {entry.name}
                                </option>
                            ))}
                        </select>
                        {form.errors.stakeholder_category_id && (
                            <span className="text-red-600">
                                {form.errors.stakeholder_category_id}
                            </span>
                        )}
                    </label>
                )}
                <label className="text-sm font-medium">
                    Kode
                    <input
                        required
                        maxLength={40}
                        value={form.data.code}
                        onChange={(event) =>
                            form.setData('code', event.target.value)
                        }
                        className="mt-1 block w-full rounded-lg border-slate-300"
                    />
                    {form.errors.code && (
                        <span className="text-red-600">{form.errors.code}</span>
                    )}
                </label>
                <label className="text-sm font-medium">
                    Nama
                    <input
                        required
                        maxLength={200}
                        value={form.data.name}
                        onChange={(event) =>
                            form.setData('name', event.target.value)
                        }
                        className="mt-1 block w-full rounded-lg border-slate-300"
                    />
                    {form.errors.name && (
                        <span className="text-red-600">{form.errors.name}</span>
                    )}
                </label>
                <label className="flex items-center gap-2 text-sm font-medium">
                    <input
                        type="checkbox"
                        checked={form.data.active}
                        onChange={(event) =>
                            form.setData('active', event.target.checked)
                        }
                    />
                    Aktif
                </label>
                <div className="flex gap-2">
                    <button
                        type="submit"
                        disabled={form.processing}
                        className="rounded-lg bg-primary px-4 py-2 font-semibold text-white disabled:opacity-50"
                    >
                        {editing ? 'Simpan Perubahan' : 'Tambah Kategori'}
                    </button>
                    {editing && (
                        <button
                            type="button"
                            onClick={() => {
                                setEditing(null);
                                form.reset();
                            }}
                            className="rounded-lg border px-4 py-2"
                        >
                            Batal
                        </button>
                    )}
                </div>
            </form>
            <div className="overflow-x-auto">
                <table className="w-full min-w-[480px] text-left text-sm">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="p-3">Kode</th>
                            <th className="p-3">Nama</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((entry) => (
                            <tr key={entry.id} className="border-t">
                                <td className="p-3">{entry.code}</td>
                                <td className="p-3">{entry.name}</td>
                                <td className="p-3">
                                    {entry.active ? 'Aktif' : 'Nonaktif'}
                                </td>
                                <td className="p-3">
                                    <button
                                        type="button"
                                        onClick={() => edit(entry)}
                                        className="text-primary underline focus-visible:ring-2"
                                    >
                                        Ubah
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {rows.length === 0 && (
                    <p className="p-5 text-center text-slate-600">
                        Belum ada data.
                    </p>
                )}
            </div>
        </section>
    );
}

export default function Catalog({
    companies,
    catalogs,
}: {
    companies: Company[];
    catalogs: Catalogs;
}) {
    return (
        <AppLayout
            breadcrumb={{ parent: 'SROI', current: 'Stakeholder & Outcome' }}
        >
            <Head title="Katalog SROI" />
            <div className="mx-auto max-w-6xl space-y-5 p-5 md:p-8">
                <h1 className="text-2xl font-bold">
                    Katalog Stakeholder & Outcome
                </h1>
                <p className="text-sm text-slate-600">
                    Kategori milik perusahaan. Buat kategori program sebelum
                    menambahkan program SROI.
                </p>
                {(Object.keys(labels) as Kind[]).map((kind) => (
                    <CatalogPanel
                        key={kind}
                        kind={kind}
                        catalogs={catalogs}
                        companies={companies}
                    />
                ))}
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
