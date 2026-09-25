import { router, useForm } from '@inertiajs/react';
import { FormEvent, useEffect, useState } from 'react';
import type { Choice, Program, Row, Section, Value } from './types';

const fieldLabel = (field: string) =>
    field.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
export default function SectionEditor({
    section,
    program,
    canEdit,
}: {
    section: Section;
    program: Program;
    canEdit: boolean;
}) {
    const [editing, setEditing] = useState<number | null>(null);
    const [open, setOpen] = useState(false);
    const [areaChoices, setAreaChoices] = useState<Record<string, Choice[]>>(
        {},
    );
    const fields = Object.entries(section.fields);
    const blank = Object.fromEntries(
        fields.map(([field, type]) => [
            field,
            type.startsWith('boolean') ? false : '',
        ]),
    ) as Record<string, Value>;
    const form = useForm<Record<string, Value>>(blank);
    useEffect(() => {
        if (section.key !== 'locations') return;
        const controller = new AbortController();
        const levels = [
            ['city_id', 'cities', form.data.province_id],
            ['district_id', 'districts', form.data.city_id],
            ['village_id', 'villages', form.data.district_id],
        ] as const;
        levels.forEach(([field, level, parent]) => {
            if (!parent) {
                setAreaChoices((current) => ({ ...current, [field]: [] }));
                return;
            }
            fetch(
                `${route('sroi.areas.index', [program.id, level])}?parent=${parent}`,
                { signal: controller.signal },
            )
                .then((response) => (response.ok ? response.json() : []))
                .then((items: Choice[]) =>
                    setAreaChoices((current) => ({
                        ...current,
                        [field]: items,
                    })),
                )
                .catch(() => {});
        });
        return () => controller.abort();
    }, [
        section.key,
        program.id,
        form.data.province_id,
        form.data.city_id,
        form.data.district_id,
    ]);
    const change = (field: string, value: Value) => {
        if (section.key !== 'locations') {
            form.setData(field, value);
            return;
        }
        const next = { ...form.data, [field]: value };
        if (field === 'province_id') {
            next.city_id = '';
            next.district_id = '';
            next.village_id = '';
        }
        if (field === 'city_id') {
            next.district_id = '';
            next.village_id = '';
        }
        if (field === 'district_id') next.village_id = '';
        form.setData(next);
    };
    const edit = (row: Row) => {
        form.clearErrors();
        form.setData(
            Object.fromEntries(
                fields.map(([field]) => [field, row[field] ?? '']),
            ),
        );
        setEditing(row.id);
        setOpen(true);
    };
    const add = () => {
        form.clearErrors();
        form.setData(blank);
        setEditing(null);
        setOpen(true);
    };
    const submit = (event: FormEvent) => {
        event.preventDefault();
        const options = {
            onSuccess: () => {
                setOpen(false);
                setEditing(null);
                form.setData(blank);
            },
        };
        if (editing)
            form.put(
                route('sroi.entries.update', [
                    program.id,
                    section.key,
                    editing,
                ]),
                options,
            );
        else
            form.post(
                route('sroi.entries.store', [program.id, section.key]),
                options,
            );
    };

    return (
        <section className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-lg font-bold text-slate-900">
                        {section.title}
                    </h2>
                    <p className="text-sm text-slate-500">
                        {section.rows.length} data tersimpan
                    </p>
                </div>
                {canEdit &&
                    (section.key !== 'scopes' || section.rows.length === 0) && (
                        <button
                            type="button"
                            onClick={add}
                            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white focus-visible:ring-2 focus-visible:ring-primary"
                        >
                            Tambah
                        </button>
                    )}
            </div>
            {form.errors.record && (
                <p role="alert" className="mt-3 text-sm text-red-600">
                    {form.errors.record}
                </p>
            )}
            {section.rows.length > 0 && (
                <div className="mt-4 divide-y divide-slate-100 border-t border-slate-100">
                    {section.rows.map((row) => (
                        <div
                            key={row.id}
                            className="flex flex-wrap items-start justify-between gap-3 py-3"
                        >
                            <div className="min-w-0 flex-1 text-sm text-slate-700">
                                <span className="mr-2 font-semibold text-slate-900">
                                    #{row.id}
                                </span>
                                {fields.slice(0, 3).map(([field]) => (
                                    <span
                                        key={field}
                                        className="mr-3 break-words"
                                    >
                                        {fieldLabel(field)}:{' '}
                                        {String(row[field] ?? '—')}
                                    </span>
                                ))}
                            </div>
                            {canEdit && (
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => edit(row)}
                                        className="rounded-lg border border-slate-300 px-3 py-1 text-sm focus-visible:ring-2"
                                    >
                                        Ubah
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (
                                                window.confirm(
                                                    'Hapus data ini?',
                                                )
                                            )
                                                router.delete(
                                                    route(
                                                        'sroi.entries.destroy',
                                                        [
                                                            program.id,
                                                            section.key,
                                                            row.id,
                                                        ],
                                                    ),
                                                );
                                        }}
                                        className="rounded-lg border border-red-200 px-3 py-1 text-sm text-red-700 focus-visible:ring-2"
                                    >
                                        Hapus
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
            {open && (
                <form
                    onSubmit={submit}
                    className="mt-5 grid gap-4 border-t border-slate-200 pt-5 md:grid-cols-2"
                >
                    {fields.map(([field, descriptor]) => {
                        const optional = descriptor.endsWith('?');
                        const [kind, values] = descriptor
                            .replace(/\?$/, '')
                            .split(':');
                        const options: Choice[] =
                            kind === 'enum'
                                ? values
                                      .split(',')
                                      .map((name) => ({ id: name, name }))
                                : (areaChoices[field] ??
                                  section.choices[field] ??
                                  []);
                        const filtered = [
                            'indicator_id',
                            'financial_proxy_id',
                        ].includes(field)
                            ? options.filter(
                                  (option) =>
                                      option.outcome_id ===
                                      Number(form.data.outcome_id),
                              )
                            : options;
                        const label = fieldLabel(field);
                        const common =
                            'mt-1 block w-full rounded-lg border-slate-300 text-sm focus:border-primary focus:ring-primary';
                        return (
                            <label
                                key={field}
                                className="text-sm font-medium text-slate-700"
                            >
                                {label}
                                {optional ? ' (opsional)' : ''}
                                {kind === 'text' ? (
                                    <textarea
                                        value={String(form.data[field] ?? '')}
                                        onChange={(event) =>
                                            form.setData(
                                                field,
                                                event.target.value,
                                            )
                                        }
                                        required={!optional}
                                        className={common}
                                        rows={3}
                                    />
                                ) : kind === 'enum' ||
                                  kind === 'reference' ||
                                  kind === 'boolean' ? (
                                    <select
                                        value={
                                            kind === 'boolean'
                                                ? String(
                                                      form.data[field] ?? false,
                                                  )
                                                : String(form.data[field] ?? '')
                                        }
                                        onChange={(event) =>
                                            change(
                                                field,
                                                kind === 'boolean'
                                                    ? event.target.value ===
                                                          'true'
                                                    : event.target.value,
                                            )
                                        }
                                        required={!optional}
                                        className={common}
                                    >
                                        <option value="">Pilih {label}</option>
                                        {kind === 'boolean' ? (
                                            <>
                                                <option value="true">Ya</option>
                                                <option value="false">
                                                    Tidak
                                                </option>
                                            </>
                                        ) : (
                                            filtered.map((option) => (
                                                <option
                                                    key={option.id}
                                                    value={option.id}
                                                >
                                                    {option.name}
                                                </option>
                                            ))
                                        )}
                                    </select>
                                ) : (
                                    <input
                                        type={
                                            [
                                                'year',
                                                'money',
                                                'number',
                                                'percent',
                                                'decimal',
                                            ].includes(kind)
                                                ? 'number'
                                                : 'text'
                                        }
                                        step={
                                            kind === 'year'
                                                ? 1
                                                : kind === 'money'
                                                  ? '0.01'
                                                  : 'any'
                                        }
                                        min={
                                            kind === 'year'
                                                ? program.start_year
                                                : [
                                                        'money',
                                                        'number',
                                                        'percent',
                                                    ].includes(kind)
                                                  ? 0
                                                  : undefined
                                        }
                                        max={
                                            kind === 'year'
                                                ? program.end_year
                                                : kind === 'percent'
                                                  ? 100
                                                  : undefined
                                        }
                                        value={String(form.data[field] ?? '')}
                                        onChange={(event) =>
                                            form.setData(
                                                field,
                                                event.target.value,
                                            )
                                        }
                                        required={!optional}
                                        className={common}
                                    />
                                )}
                                {form.errors[field] && (
                                    <span
                                        role="alert"
                                        className="mt-1 block text-red-600"
                                    >
                                        {form.errors[field]}
                                    </span>
                                )}
                            </label>
                        );
                    })}
                    <div className="flex gap-2 md:col-span-2">
                        <button
                            type="submit"
                            disabled={form.processing}
                            className="rounded-lg bg-primary px-4 py-2 font-semibold text-white disabled:opacity-50"
                        >
                            Simpan
                        </button>
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="rounded-lg border border-slate-300 px-4 py-2"
                        >
                            Batal
                        </button>
                    </div>
                </form>
            )}
        </section>
    );
}
