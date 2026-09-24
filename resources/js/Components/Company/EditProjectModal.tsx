import { Icon } from '@/Components/Company';
import ProjectForm, {
    type DescriptiveQuestion,
    type LocationEntry,
    type ProjectFormData,
    type Province,
} from '@/Components/Company/ProjectForm';
import { router } from '@inertiajs/react';
import { ReactNode, useEffect, useState } from 'react';

export interface EditProjectData {
    id: number | string;
    name: string;
    description: string;
    status: string;
    target_ikm_count: number;
    target_sloi_count: number;
    startDate: string;
    endDate: string;
    enable_ikm: boolean;
    enable_sloi: boolean;
    ikm_template_id: number | null;
    sloi_template_id: number | null;
    locations: LocationEntry[];
    descriptive_questions: DescriptiveQuestion[];
}

interface EditProjectModalProps {
    isOpen: boolean;
    project: EditProjectData | null;
    provinces: Province[];
    onClose: () => void;
}

export default function EditProjectModal({
    isOpen,
    project,
    provinces,
    onClose,
}: EditProjectModalProps): ReactNode {
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [touched, setTouched] = useState(false);
    const [initialLocations, setInitialLocations] = useState<LocationEntry[]>(
        [],
    );
    const [data, setDataState] = useState<ProjectFormData>({
        name: '',
        description: '',
        status: 'draft',
        target_ikm_count: 0,
        target_sloi_count: 0,
        start_date: '',
        end_date: '',
        enable_ikm: false,
        enable_sloi: false,
        ikm_template_id: null,
        sloi_template_id: null,
        district_ids: [],
        descriptive_questions: [],
    });

    // Populate form when project data changes
    useEffect(() => {
        if (isOpen && project) {
            setErrors({});
            setTouched(false);
            setDataState({
                name: project.name || '',
                description: project.description || '',
                status: project.status || 'draft',
                target_ikm_count: project.target_ikm_count || 0,
                target_sloi_count: project.target_sloi_count || 0,
                start_date: project.startDate || '',
                end_date: project.endDate || '',
                enable_ikm: project.enable_ikm || false,
                enable_sloi: project.enable_sloi || false,
                ikm_template_id: project.ikm_template_id,
                sloi_template_id: project.sloi_template_id,
                district_ids: project.locations.map((l) => l.district.id),
                descriptive_questions: project.descriptive_questions ?? [],
            });
            setInitialLocations(project.locations);
        }
    }, [isOpen, project]);

    const setData = <K extends keyof ProjectFormData>(
        key: K,
        value: ProjectFormData[K],
    ) => {
        setDataState((prev) => ({ ...prev, [key]: value }));
        // Clear error for this field when user types
        if (errors[key]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[key];
                return newErrors;
            });
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        // Validate nama proyek
        if (!data.name || data.name.trim() === '') {
            newErrors.name = 'Nama proyek wajib diisi';
        }

        // Validate deskripsi
        if (!data.description || data.description.trim() === '') {
            newErrors.description = 'Deskripsi proyek wajib diisi';
        }

        // Validate tanggal mulai
        if (!data.start_date || data.start_date.trim() === '') {
            newErrors.start_date = 'Tanggal mulai proyek wajib diisi';
        }

        // Validate tanggal selesai
        if (!data.end_date || data.end_date.trim() === '') {
            newErrors.end_date = 'Tanggal selesai proyek wajib diisi';
        }

        // Validate target IKM jika enable_ikm aktif
        if (data.enable_ikm) {
            if (!data.target_ikm_count || data.target_ikm_count <= 0) {
                newErrors.target_ikm_count =
                    'Target responden IKM harus lebih dari 0';
            }
        }

        // Validate target SLOI jika enable_sloi aktif
        if (data.enable_sloi) {
            if (!data.target_sloi_count || data.target_sloi_count <= 0) {
                newErrors.target_sloi_count =
                    'Target responden SLOI harus lebih dari 0';
            }
        }

        // Validate lokasi proyek
        if (!data.district_ids || data.district_ids.length === 0) {
            newErrors.district_ids = 'Minimal harus ada 1 lokasi proyek';
        }

        // Validate at least one assessment type is enabled
        if (!data.enable_ikm && !data.enable_sloi) {
            newErrors.enable_ikm =
                'Minimal harus memilih 1 jenis penilaian (IKM atau SLOI)';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (!project) return;

        // Mark form as touched
        setTouched(true);

        // Validate form before submit
        if (!validateForm()) {
            // Scroll to first error
            const firstError = document.querySelector('.text-red-500');
            if (firstError) {
                firstError.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                });
            }
            return;
        }

        setSubmitting(true);
        setErrors({});

        router.patch(
            `/projects/${project.id}`,
            data as unknown as Parameters<typeof router.patch>[1],
            {
                preserveScroll: true,
                onSuccess: () => {
                    setSubmitting(false);
                    onClose();
                },
                onError: (errs) => {
                    setErrors(errs as Record<string, string>);
                    setSubmitting(false);
                },
            },
        );
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-10 backdrop-blur-sm">
            <div className="relative w-full max-w-4xl rounded-2xl border border-slate-200 bg-white shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-200 px-8 py-5">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Edit Proyek
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Ubah detail proyek yang sudah ada
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex size-9 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                    >
                        <Icon name="close" className="text-xl" />
                    </button>
                </div>

                {/* Body */}
                <div className="max-h-[70vh] overflow-y-auto px-8 py-6">
                    <ProjectForm
                        data={data}
                        setData={setData}
                        errors={errors}
                        provinces={provinces}
                        initialLocations={initialLocations}
                        showStatusField
                    />
                </div>

                {/* Footer */}
                <div className="border-t border-slate-200 bg-slate-50">
                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-3 px-8 py-5">
                        <button
                            onClick={onClose}
                            disabled={submitting}
                            className="rounded-lg px-6 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-200 disabled:opacity-50"
                        >
                            Batal
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="flex items-center gap-2 rounded-lg bg-primary-btn px-8 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary-btn/20 transition-all hover:bg-primary-btn-hover active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {submitting ? (
                                'Menyimpan...'
                            ) : (
                                <>
                                    Simpan Perubahan
                                    <Icon name="save" className="text-sm" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
