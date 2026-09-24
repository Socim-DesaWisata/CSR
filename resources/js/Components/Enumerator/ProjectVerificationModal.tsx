import { useState } from 'react';
import MaterialIcon from './Icons/MaterialIcon';
import Modal from './Modal';
import { ProjectData, ProjectType } from './ProjectCard';
import Button from './UI/Button';

interface ProjectVerificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: ProjectData | null;
    onSubmit: (projectCode: string, surveyType: ProjectType) => void;
}

export default function ProjectVerificationModal({
    isOpen,
    onClose,
    project,
    onSubmit,
}: ProjectVerificationModalProps) {
    const [projectCode, setProjectCode] = useState('');
    const [surveyType, setSurveyType] = useState<ProjectType | null>(null);
    const [error, setError] = useState('');

    const handleSubmit = () => {
        // Validate
        if (!projectCode.trim()) {
            setError('Kode project harus diisi');
            return;
        }

        if (!surveyType) {
            setError('Pilih tipe survei');
            return;
        }

        setError('');
        onSubmit(projectCode, surveyType);
        handleClose();
    };

    const handleClose = () => {
        setProjectCode('');
        setSurveyType(null);
        setError('');
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} maxWidth="lg">
            <div className="flex max-h-[90vh] flex-col overflow-y-auto">
                {/* Header Section */}
                <div className="p-8 pb-4">
                    <div className="flex flex-col gap-3">
                        <div className="mb-2 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <MaterialIcon
                                name="verified_user"
                                className="text-3xl"
                            />
                        </div>
                        <h2 className="text-2xl font-bold leading-tight tracking-tight text-gray-900 sm:text-3xl">
                            Verifikasi Project
                        </h2>
                        <p className="text-sm font-normal leading-relaxed text-gray-500">
                            Masukkan kode project dan tipe survei.
                        </p>
                    </div>
                </div>

                {/* Form Section */}
                <div className="flex flex-col gap-6 p-8 pt-2">
                    {/* Error Message */}
                    {error && (
                        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                            <MaterialIcon name="error" className="text-lg" />
                            {error}
                        </div>
                    )}

                    {/* Project Code Input */}
                    <div className="flex flex-col gap-2">
                        <label
                            className="text-sm font-semibold text-gray-900"
                            htmlFor="project-code"
                        >
                            Kode Project
                        </label>
                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
                                <MaterialIcon name="123" />
                            </div>
                            <input
                                className="h-14 w-full rounded-xl border border-gray-200 bg-gray-50 pl-12 pr-4 text-lg font-medium text-gray-900 transition-all placeholder:text-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/50"
                                id="project-code"
                                placeholder="Contoh: 123-456"
                                type="text"
                                value={projectCode}
                                onChange={(e) => setProjectCode(e.target.value)}
                            />
                        </div>
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                            <MaterialIcon name="info" className="text-[14px]" />
                            Kode terdiri dari 6 digit angka
                        </span>
                    </div>

                    {/* Survey Type Selection */}
                    <div className="flex flex-col gap-3">
                        <label className="text-sm font-semibold text-gray-900">
                            Tipe Survei
                        </label>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {/* Option IKM */}
                            {project?.enable_ikm && (
                                <label className="group relative cursor-pointer">
                                    <input
                                        className="peer sr-only"
                                        name="survey_type"
                                        type="radio"
                                        value="IKM"
                                        checked={surveyType === 'IKM'}
                                        onChange={() => setSurveyType('IKM')}
                                    />
                                    <div className="flex h-full flex-col items-start rounded-xl border border-gray-200 bg-gray-50 p-4 transition-all duration-200 hover:border-primary/50 peer-checked:border-primary peer-checked:bg-primary/5 peer-checked:ring-1 peer-checked:ring-primary">
                                        <div className="mb-2 flex w-full items-center justify-between">
                                            <MaterialIcon
                                                name="thumbs_up_down"
                                                className="text-primary"
                                            />
                                            <div className="flex size-4 items-center justify-center rounded-full border border-gray-400 peer-checked:border-primary peer-checked:bg-primary group-has-[:checked]:border-primary group-has-[:checked]:bg-primary">
                                                <div className="size-2 rounded-full bg-white opacity-0 group-has-[:checked]:opacity-100" />
                                            </div>
                                        </div>
                                        <span className="mb-1 text-base font-bold text-gray-900">
                                            IKM
                                        </span>
                                        <span className="text-xs leading-tight text-gray-500">
                                            Indeks Kepuasan Masyarakat
                                        </span>
                                    </div>
                                </label>
                            )}

                            {/* Option SLOI */}
                            {project?.enable_sloi && (
                                <label className="group relative cursor-pointer">
                                    <input
                                        className="peer sr-only"
                                        name="survey_type"
                                        type="radio"
                                        value="SLOI"
                                        checked={surveyType === 'SLOI'}
                                        onChange={() => setSurveyType('SLOI')}
                                    />
                                    <div className="flex h-full flex-col items-start rounded-xl border border-gray-200 bg-gray-50 p-4 transition-all duration-200 hover:border-primary/50 peer-checked:border-primary peer-checked:bg-primary/5 peer-checked:ring-1 peer-checked:ring-primary">
                                        <div className="mb-2 flex w-full items-center justify-between">
                                            <MaterialIcon
                                                name="apartment"
                                                className="text-primary"
                                            />
                                            <div className="flex size-4 items-center justify-center rounded-full border border-gray-400 group-has-[:checked]:border-primary group-has-[:checked]:bg-primary">
                                                <div className="size-2 rounded-full bg-white opacity-0 group-has-[:checked]:opacity-100" />
                                            </div>
                                        </div>
                                        <span className="mb-1 text-base font-bold text-gray-900">
                                            SLOI
                                        </span>
                                        <span className="text-xs leading-tight text-gray-500">
                                            Layanan Organisasi Internal
                                        </span>
                                    </div>
                                </label>
                            )}
                        </div>
                    </div>

                    {/* Action Button */}
                    <Button
                        variant="primary"
                        icon="arrow_forward"
                        fullWidth
                        onClick={handleSubmit}
                        className="mt-4 h-12"
                    >
                        Lanjutkan
                    </Button>
                </div>

                {/* Footer Section */}
                <div className="px-8 pb-8 pt-2">
                    <div className="flex items-start gap-3 rounded-lg border border-primary/10 bg-primary/10 p-3">
                        <MaterialIcon
                            name="help"
                            className="shrink-0 text-xl text-primary"
                        />
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-primary">
                                Butuh bantuan?
                            </span>
                            <p className="text-xs text-gray-500">
                                Hubungi PIC anda jika kode tidak valid.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
