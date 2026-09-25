import { useForm } from '@inertiajs/react';
import { FormEvent } from 'react';
import type { Program } from './types';

const fieldLabel = (field: string) =>
    field.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
export default function DescriptionEditor({
    program,
    isAdmin,
}: {
    program: Program;
    isAdmin: boolean;
}) {
    const form = useForm({
        ...(isAdmin ? { company_id: program.company_id } : {}),
        category_id: program.category_id,
        name: program.name,
        pillar_name: program.pillar_name,
        initiator_owner_name: program.initiator_owner_name,
        start_year: program.start_year,
        end_year: program.end_year,
        description: program.description,
        boundary_text: program.boundary_text,
        status: program.status,
    });
    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.put(route('sroi.programs.update', program.id));
    };
    return (
        <form
            onSubmit={submit}
            className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 md:grid-cols-2"
        >
            <h2 className="text-lg font-bold md:col-span-2">
                Deskripsi Program
            </h2>
            {(['name', 'pillar_name', 'initiator_owner_name'] as const).map(
                (field) => (
                    <label key={field} className="text-sm font-medium">
                        {fieldLabel(field)}
                        <input
                            value={form.data[field]}
                            onChange={(event) =>
                                form.setData(field, event.target.value)
                            }
                            required
                            className="mt-1 block w-full rounded-lg border-slate-300"
                        />
                        {form.errors[field] && (
                            <span className="text-red-600">
                                {form.errors[field]}
                            </span>
                        )}
                    </label>
                ),
            )}
            {(['start_year', 'end_year'] as const).map((field) => (
                <label key={field} className="text-sm font-medium">
                    {fieldLabel(field)}
                    <input
                        type="number"
                        min="1900"
                        max="2200"
                        value={form.data[field]}
                        onChange={(event) =>
                            form.setData(field, Number(event.target.value))
                        }
                        required
                        className="mt-1 block w-full rounded-lg border-slate-300"
                    />
                    {form.errors[field] && (
                        <span className="text-red-600">
                            {form.errors[field]}
                        </span>
                    )}
                </label>
            ))}
            <label className="text-sm font-medium">
                Status
                <select
                    value={form.data.status}
                    onChange={(event) =>
                        form.setData('status', event.target.value)
                    }
                    className="mt-1 block w-full rounded-lg border-slate-300"
                >
                    {['draft', 'active', 'archived'].map((status) => (
                        <option key={status}>{status}</option>
                    ))}
                </select>
            </label>
            {(['description', 'boundary_text'] as const).map((field) => (
                <label
                    key={field}
                    className="text-sm font-medium md:col-span-2"
                >
                    {fieldLabel(field)}
                    <textarea
                        value={form.data[field]}
                        onChange={(event) =>
                            form.setData(field, event.target.value)
                        }
                        required
                        className="mt-1 block w-full rounded-lg border-slate-300"
                    />
                    {form.errors[field] && (
                        <span className="text-red-600">
                            {form.errors[field]}
                        </span>
                    )}
                </label>
            ))}
            <button
                type="submit"
                disabled={form.processing}
                className="rounded-lg bg-primary px-4 py-2 font-semibold text-white disabled:opacity-50"
            >
                Simpan Deskripsi
            </button>
        </form>
    );
}
