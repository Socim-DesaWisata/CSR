import { Icon } from '@/Components/Company';
import ProjectForm, { type Province } from '@/Components/Company/ProjectForm';
import CompanyLayout from '@/Layouts/AppLayout';
import { PageProps } from '@/types';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function CreateProject() {
    const { provinces } = usePage<PageProps<{ provinces: Province[] }>>().props;
    const [targetError, setTargetError] = useState<string>('');

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        description: '',
        target_ikm_count: 0,
        target_sloi_count: 0,
        start_date: '',
        end_date: '',
        enable_ikm: false,
        enable_sloi: false,
        ikm_template_id: null as number | null,
        sloi_template_id: null as number | null,
        district_ids: [] as number[],
        descriptive_questions: [] as { id: number | null; title: string }[],
    });

    const handleSubmit = () => {
        if (data.target_ikm_count === 0 && data.target_sloi_count === 0) {
            setTargetError(
                'Target responden tidak boleh 0. Harap isi minimal salah satu target (IKM atau SLOI).',
            );
            return;
        }

        setTargetError('');
        post('/projects', {
            onSuccess: () => {
                reset();
            },
        });
    };

    const handleCancel = () => {
        router.visit('/projects');
    };

    return (
        <CompanyLayout
            breadcrumb={{ parent: 'Manajemen Proyek', current: 'Buat Proyek' }}
        >
            <Head title="Buat Proyek Baru" />

            <div className="mx-auto max-w-4xl px-8 py-10">
                {/* Header Halaman */}
                <div className="mb-8">
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                        Buat Proyek Baru
                    </h1>
                    <p className="mt-2 text-slate-500">
                        Mulai penilaian dampak Anda dengan mengisi detail
                        penting di bawah ini.
                    </p>
                </div>

                {/* Progress Tracker */}
                {/* <StepProgress
                    currentStep={1}
                    totalSteps={3}
                    steps={formSteps}
                /> */}

                {/* Form Section */}
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="p-8">
                        <ProjectForm
                            data={data}
                            setData={setData}
                            errors={errors}
                            provinces={provinces}
                            targetError={targetError}
                            setTargetError={setTargetError}
                        />
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-8 py-6">
                        <button
                            onClick={handleCancel}
                            className="rounded-lg px-6 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-200"
                        >
                            Batal
                        </button>
                        <div className="flex items-center gap-4">
                            <span className="text-xs font-medium text-slate-400">
                                Semua progress disimpan sebagai draft
                            </span>
                            <button
                                onClick={handleSubmit}
                                disabled={processing}
                                className="flex items-center gap-2 rounded-lg bg-primary-btn px-8 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary-btn/20 transition-all hover:bg-primary-btn-hover active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {processing ? (
                                    'Menyimpan...'
                                ) : (
                                    <>
                                        Simpan Proyek
                                        <Icon name="save" className="text-sm" />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Help Text */}
                <p className="mt-8 text-center text-xs text-slate-400">
                    Butuh bantuan menyiapkan proyek?{' '}
                    <Link
                        href="#"
                        className="font-bold text-primary hover:underline"
                    >
                        Baca panduan kami
                    </Link>{' '}
                    atau{' '}
                    <Link
                        href="#"
                        className="font-bold text-primary hover:underline"
                    >
                        Hubungi Dukungan
                    </Link>
                </p>
            </div>
        </CompanyLayout>
    );
}
