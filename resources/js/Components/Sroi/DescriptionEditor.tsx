import { useForm } from '@inertiajs/react';
import { FormEvent, useRef } from 'react';
import SectionEditor from './SectionEditor';
import type { Document, Program, Section } from './types';

const fieldLabel = (field: string) =>
    field.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function DescriptionEditor({
    program,
    isAdmin,
    canEdit,
    locations,
    documents,
}: {
    program: Program;
    isAdmin: boolean;
    canEdit: boolean;
    locations?: Section;
    documents: Document[];
}) {
    const fileInput = useRef<HTMLInputElement>(null);
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
        document: null as File | null,
    });
    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.transform((data) => ({ ...data, _method: 'put' }));
        form.post(route('sroi.programs.update', program.id), {
            forceFormData: true,
            onSuccess: () => {
                form.reset('document');
                if (fileInput.current) fileInput.current.value = '';
            },
        });
    };
    const inputClass = 'mt-1 block w-full rounded-lg border-slate-300';

    return (
        <section className="space-y-5 rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-bold">Deskripsi Program</h2>
            {canEdit ? (
                <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
                    {(
                        ['name', 'pillar_name', 'initiator_owner_name'] as const
                    ).map((field) => (
                        <label key={field} className="text-sm font-medium">
                            {fieldLabel(field)}
                            <input
                                value={form.data[field]}
                                onChange={(event) =>
                                    form.setData(field, event.target.value)
                                }
                                required
                                className={inputClass}
                            />
                            {form.errors[field] && (
                                <span role="alert" className="text-red-600">
                                    {form.errors[field]}
                                </span>
                            )}
                        </label>
                    ))}
                    {(['start_year', 'end_year'] as const).map((field) => (
                        <label key={field} className="text-sm font-medium">
                            {fieldLabel(field)}
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
                                required
                                className={inputClass}
                            />
                            {form.errors[field] && (
                                <span role="alert" className="text-red-600">
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
                            className={inputClass}
                        >
                            {['draft', 'active', 'archived'].map((status) => (
                                <option key={status}>{status}</option>
                            ))}
                        </select>
                    </label>
                    {(['description', 'boundary_text'] as const).map(
                        (field) => (
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
                                    rows={3}
                                    className={inputClass}
                                />
                                {form.errors[field] && (
                                    <span role="alert" className="text-red-600">
                                        {form.errors[field]}
                                    </span>
                                )}
                            </label>
                        ),
                    )}
                    <label className="text-sm font-medium md:col-span-2">
                        Dokumen Program (opsional)
                        <input
                            ref={fileInput}
                            type="file"
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                            onChange={(event) =>
                                form.setData(
                                    'document',
                                    event.target.files?.[0] ?? null,
                                )
                            }
                            aria-label="Unggah dokumen program"
                            className="mt-1 block w-full text-sm"
                        />
                        <span className="mt-1 block text-xs text-slate-500">
                            PDF, DOC, DOCX, XLS, XLSX, JPG, JPEG, PNG · maks. 10
                            MB
                        </span>
                        {form.errors.document && (
                            <span role="alert" className="text-red-600">
                                {form.errors.document}
                            </span>
                        )}
                    </label>
                    <button
                        type="submit"
                        disabled={form.processing}
                        className="w-fit rounded-lg bg-primary px-4 py-2 font-semibold text-white disabled:opacity-50 md:col-span-2"
                    >
                        Simpan Deskripsi
                    </button>
                </form>
            ) : (
                <div className="space-y-2 text-sm">
                    <p className="whitespace-pre-wrap">{program.description}</p>
                    <p className="whitespace-pre-wrap text-slate-600">
                        Batas: {program.boundary_text}
                    </p>
                </div>
            )}
            {locations && (
                <SectionEditor
                    section={locations}
                    program={program}
                    canEdit={canEdit}
                    embedded
                />
            )}
            {documents.length > 0 && (
                <div className="border-t border-slate-100 pt-4">
                    <h3 className="text-sm font-semibold">Dokumen Program</h3>
                    <ul className="mt-2 space-y-2 text-sm">
                        {documents.map((document) => (
                            <li key={document.id}>
                                <a
                                    href={route('sroi.documents.download', [
                                        program.id,
                                        document.id,
                                    ])}
                                    className="text-primary underline"
                                >
                                    {document.file_name}
                                </a>{' '}
                                <span className="text-slate-500">
                                    ({Math.ceil(document.size_bytes / 1024)} KB)
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </section>
    );
}
