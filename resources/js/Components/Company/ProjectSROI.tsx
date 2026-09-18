import { router } from '@inertiajs/react';
import {
    Archive,
    CheckCircle,
    Eye,
    FileText,
    Layers3,
    Pencil,
    Plus,
    Save,
    Trash2,
    X,
} from 'lucide-react';
import { ReactNode, useEffect, useMemo, useState } from 'react';

interface ProjectData {
    id: number;
    name: string;
    enableSroi: boolean;
}

interface SroiTemplateOption {
    id: number;
    name: string;
    version: number;
    description: string | null;
    sectionCount: number;
    questionCount: number;
}

interface ProjectSroiFormOption {
    id: number;
    name: string;
    version: number;
    status: string;
    sourceTemplateName: string | null;
}

interface ProjectSroiQuestionData {
    id: number;
    sectionId: number;
    parentQuestionId: number | null;
    sourceTemplateQuestionId: number | null;
    questionText: string;
    helpText: string | null;
    answerType: 'text' | 'number' | null;
    unit: string | null;
    isGroup: boolean;
    isActive: boolean;
    orderNo: number;
}

interface ProjectSroiSectionData {
    id: number;
    title: string;
    description: string | null;
    orderNo: number;
    sourceTemplateSectionId: number | null;
    questions: ProjectSroiQuestionData[];
}

interface ProjectSroiFormData {
    id: number;
    name: string;
    description: string | null;
    version: number;
    status: string;
    sourceTemplateName: string | null;
    activatedAt: string | null;
    sections: ProjectSroiSectionData[];
}

interface ProjectSROIProps {
    project: ProjectData;
    templates: SroiTemplateOption[];
    forms: ProjectSroiFormOption[];
    form: ProjectSroiFormData | null;
    canEdit: boolean;
}

interface SectionFormState {
    title: string;
    description: string;
    order_no: number | '';
}

interface QuestionFormState {
    section_id: number | '';
    parent_question_id: number | '';
    question_text: string;
    help_text: string;
    answer_type: 'text' | 'number' | '';
    unit: string;
    is_group: boolean;
    is_active: boolean;
    order_no: number | '';
}

const emptySection: SectionFormState = {
    title: '',
    description: '',
    order_no: '',
};

const emptyQuestion: QuestionFormState = {
    section_id: '',
    parent_question_id: '',
    question_text: '',
    help_text: '',
    answer_type: 'text',
    unit: '',
    is_group: false,
    is_active: true,
    order_no: '',
};

export default function ProjectSROI({
    project,
    templates,
    forms,
    form,
    canEdit,
}: ProjectSROIProps): ReactNode {
    const [templateId, setTemplateId] = useState<number | ''>(
        templates[0]?.id ?? '',
    );
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [formState, setFormState] = useState({
        name: form?.name ?? '',
        description: form?.description ?? '',
    });
    const [sectionForm, setSectionForm] = useState<SectionFormState>({
        ...emptySection,
    });
    const [editingSectionId, setEditingSectionId] = useState<number | null>(
        null,
    );
    const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
    const [questionForm, setQuestionForm] = useState<QuestionFormState>({
        ...emptyQuestion,
    });
    const [editingQuestionId, setEditingQuestionId] = useState<number | null>(
        null,
    );
    const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
    const [inlineQuestionSectionId, setInlineQuestionSectionId] = useState<
        number | null
    >(null);

    useEffect(() => {
        setFormState({
            name: form?.name ?? '',
            description: form?.description ?? '',
        });
    }, [form]);

    const questions = useMemo(
        () => form?.sections.flatMap((section) => section.questions) ?? [],
        [form],
    );
    const selectedTemplate = templates.find(
        (template) => template.id === templateId,
    );
    const baseUrl = form
        ? `/projects/${project.id}/sroi/forms/${form.id}`
        : `/projects/${project.id}/sroi/forms`;

    const submit = (
        method: 'post' | 'patch' | 'delete',
        url: string,
        data: Record<string, unknown> = {},
        onSuccess?: () => void,
    ) => {
        setProcessing(true);
        setErrors({});

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                setProcessing(false);
                onSuccess?.();
            },
            onError: (validationErrors: Record<string, string>) => {
                setErrors(validationErrors);
                setProcessing(false);
            },
        };

        if (method === 'post') {
            router.post(url, data as never, options);
            return;
        }

        if (method === 'patch') {
            router.patch(url, data as never, options);
            return;
        }

        router.delete(url, { ...options, data: data as never });
    };

    const resetSectionForm = () => {
        setEditingSectionId(null);
        setSectionForm({ ...emptySection });
        setIsSectionModalOpen(false);
        setErrors({});
    };

    const resetQuestionForm = () => {
        setEditingQuestionId(null);
        setQuestionForm({ ...emptyQuestion });
        setIsQuestionModalOpen(false);
        setInlineQuestionSectionId(null);
        setErrors({});
    };

    const openCreateSectionModal = () => {
        setEditingSectionId(null);
        setSectionForm({ ...emptySection });
        setErrors({});
        setIsSectionModalOpen(true);
    };

    const openEditSectionModal = (section: ProjectSroiSectionData) => {
        setEditingSectionId(section.id);
        setSectionForm({
            title: section.title,
            description: section.description ?? '',
            order_no: section.orderNo,
        });
        setErrors({});
        setIsSectionModalOpen(true);
    };

    const openInlineQuestionForm = (section: ProjectSroiSectionData) => {
        setInlineQuestionSectionId(section.id);
        setEditingQuestionId(null);
        setQuestionForm({
            ...emptyQuestion,
            section_id: section.id,
            order_no: section.questions.length + 1,
        });
        setErrors({});
    };

    const openEditQuestionModal = (question: ProjectSroiQuestionData) => {
        setEditingQuestionId(question.id);
        setQuestionForm({
            section_id: question.sectionId,
            parent_question_id: question.parentQuestionId ?? '',
            question_text: question.questionText,
            help_text: question.helpText ?? '',
            answer_type: question.answerType ?? '',
            unit: question.unit ?? '',
            is_group: question.isGroup,
            is_active: question.isActive,
            order_no: question.orderNo,
        });
        setErrors({});
        setIsQuestionModalOpen(true);
    };

    const useTemplate = () => {
        if (templateId) {
            submit('post', `/projects/${project.id}/sroi/forms`, {
                template_id: templateId,
            });
        }
    };

    const saveForm = (status?: string) => {
        if (form) {
            submit('patch', baseUrl, {
                name: formState.name,
                description: formState.description,
                status: status ?? form.status,
            });
        }
    };

    const saveSection = () => {
        if (!form) {
            return;
        }

        const url = editingSectionId
            ? `${baseUrl}/sections/${editingSectionId}`
            : `${baseUrl}/sections`;

        submit(
            editingSectionId ? 'patch' : 'post',
            url,
            { ...sectionForm },
            () => resetSectionForm(),
        );
    };

    const saveQuestion = (closeAfterSave = true) => {
        if (!form) {
            return;
        }

        const url = editingQuestionId
            ? `${baseUrl}/questions/${editingQuestionId}`
            : `${baseUrl}/questions`;

        const payload = {
            ...questionForm,
            parent_question_id: questionForm.parent_question_id || null,
            answer_type: questionForm.answer_type || null,
        };

        submit(editingQuestionId ? 'patch' : 'post', url, payload, () => {
            if (closeAfterSave) {
                resetQuestionForm();
                return;
            }

            setQuestionForm({
                ...emptyQuestion,
                section_id: questionForm.section_id,
            });
        });
    };

    if (!project.enableSroi) {
        return (
            <Empty
                title="SROI belum aktif"
                text="Aktifkan tipe penilaian SROI pada pengaturan proyek."
            />
        );
    }

    if (!form) {
        return (
            <div className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div>
                    <h2 className="text-xl font-black text-slate-900">
                        Gunakan Template SROI
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Pilih template master untuk membuat form SROI khusus
                        proyek.
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-[1fr_auto]">
                    <Select
                        label="Template SROI"
                        value={String(templateId)}
                        onChange={(value) => setTemplateId(Number(value))}
                    >
                        {templates.map((template) => (
                            <option key={template.id} value={template.id}>
                                {template.name} v{template.version}
                            </option>
                        ))}
                    </Select>
                    <div className="flex items-end">
                        <Action
                            icon={<Layers3 className="size-4" />}
                            onClick={useTemplate}
                            disabled={!templateId || processing || !canEdit}
                            green
                        >
                            Gunakan Template
                        </Action>
                    </div>
                </div>

                {selectedTemplate && (
                    <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
                        <span className="font-bold text-slate-800">
                            {selectedTemplate.sectionCount} section
                        </span>{' '}
                        dan{' '}
                        <span className="font-bold text-slate-800">
                            {selectedTemplate.questionCount} pertanyaan
                        </span>{' '}
                        akan dicopy ke proyek ini.
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-xl font-black text-slate-900">
                                Form SROI Proyek
                            </h2>
                            <StatusPill status={form.status} />
                        </div>
                        <p className="mt-1 text-sm text-slate-500">
                            {form.sourceTemplateName
                                ? `Bersumber dari ${form.sourceTemplateName}`
                                : 'Form custom proyek'}
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Action
                            icon={<Eye className="size-4" />}
                            onClick={() =>
                                router.visit(`${baseUrl}/preview`, {
                                    preserveScroll: true,
                                })
                            }
                        >
                            Preview
                        </Action>
                        {canEdit && (
                            <>
                                <Action
                                    icon={<Save className="size-4" />}
                                    onClick={() => saveForm()}
                                    disabled={processing}
                                    green
                                >
                                    Simpan Form
                                </Action>
                                <Action
                                    icon={<CheckCircle className="size-4" />}
                                    onClick={() => saveForm('active')}
                                    disabled={processing}
                                    dark
                                >
                                    Aktifkan
                                </Action>
                                <Action
                                    icon={<Archive className="size-4" />}
                                    onClick={() => saveForm('archived')}
                                    disabled={processing}
                                >
                                    Arsipkan
                                </Action>
                            </>
                        )}
                    </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <Input
                        label="Nama Form"
                        value={formState.name}
                        onChange={(value) =>
                            setFormState((current) => ({
                                ...current,
                                name: value,
                            }))
                        }
                        error={errors.name}
                    />
                    <Textarea
                        label="Deskripsi"
                        value={formState.description}
                        onChange={(value) =>
                            setFormState((current) => ({
                                ...current,
                                description: value,
                            }))
                        }
                        error={errors.description}
                    />
                </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h3 className="text-lg font-black text-slate-900">
                            Struktur Section dan Pertanyaan
                        </h3>
                        <p className="text-sm text-slate-500">
                            Kelola section, lalu tambahkan pertanyaan langsung
                            dari bagian bawah setiap section.
                        </p>
                    </div>
                    {canEdit && (
                        <Action
                            icon={<Plus className="size-4" />}
                            onClick={openCreateSectionModal}
                            disabled={processing}
                            green
                        >
                            Tambah Section
                        </Action>
                    )}
                </div>

                {form.sections.length === 0 ? (
                    <Empty
                        title="Belum ada section"
                        text="Klik Tambah Section untuk mulai menyusun form SROI."
                    />
                ) : (
                    <div className="space-y-4">
                        {form.sections.map((section) => (
                            <SectionCard
                                key={section.id}
                                canEdit={canEdit}
                                errors={errors}
                                form={form}
                                inlineQuestionSectionId={
                                    inlineQuestionSectionId
                                }
                                processing={processing}
                                questionForm={questionForm}
                                questions={questions}
                                section={section}
                                onCancelInlineQuestion={resetQuestionForm}
                                onDeleteQuestion={(question) =>
                                    submit(
                                        'delete',
                                        `${baseUrl}/questions/${question.id}`,
                                    )
                                }
                                onDeleteSection={() =>
                                    submit(
                                        'delete',
                                        `${baseUrl}/sections/${section.id}`,
                                    )
                                }
                                onEditQuestion={openEditQuestionModal}
                                onEditSection={openEditSectionModal}
                                onOpenInlineQuestion={openInlineQuestionForm}
                                onQuestionFormChange={setQuestionForm}
                                onSaveInlineQuestion={() => saveQuestion(false)}
                            />
                        ))}
                    </div>
                )}
            </div>

            <SectionModal
                errors={errors}
                isOpen={isSectionModalOpen}
                isEditing={editingSectionId !== null}
                processing={processing}
                sectionForm={sectionForm}
                onClose={resetSectionForm}
                onSave={saveSection}
                onSectionFormChange={setSectionForm}
            />

            <QuestionModal
                errors={errors}
                form={form}
                isOpen={isQuestionModalOpen}
                processing={processing}
                questionForm={questionForm}
                questions={questions}
                editingQuestionId={editingQuestionId}
                onClose={resetQuestionForm}
                onQuestionFormChange={setQuestionForm}
                onSave={() => saveQuestion(true)}
            />
        </div>
    );
}

function SectionCard({
    canEdit,
    errors,
    form,
    inlineQuestionSectionId,
    processing,
    questionForm,
    questions,
    section,
    onCancelInlineQuestion,
    onDeleteQuestion,
    onDeleteSection,
    onEditQuestion,
    onEditSection,
    onOpenInlineQuestion,
    onQuestionFormChange,
    onSaveInlineQuestion,
}: {
    canEdit: boolean;
    errors: Record<string, string>;
    form: ProjectSroiFormData;
    inlineQuestionSectionId: number | null;
    processing: boolean;
    questionForm: QuestionFormState;
    questions: ProjectSroiQuestionData[];
    section: ProjectSroiSectionData;
    onCancelInlineQuestion: () => void;
    onDeleteQuestion: (question: ProjectSroiQuestionData) => void;
    onDeleteSection: () => void;
    onEditQuestion: (question: ProjectSroiQuestionData) => void;
    onEditSection: (section: ProjectSroiSectionData) => void;
    onOpenInlineQuestion: (section: ProjectSroiSectionData) => void;
    onQuestionFormChange: (form: QuestionFormState) => void;
    onSaveInlineQuestion: () => void;
}): ReactNode {
    return (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-black text-slate-900">
                            {section.orderNo}. {section.title}
                        </h4>
                        <SourcePill
                            isTemplate={!!section.sourceTemplateSectionId}
                        />
                    </div>
                    {section.description && (
                        <p className="mt-1 text-sm text-slate-500">
                            {section.description}
                        </p>
                    )}
                </div>

                {canEdit && (
                    <div className="flex gap-2">
                        <IconButton
                            label="Edit section"
                            onClick={() => onEditSection(section)}
                        >
                            <Pencil className="size-4" />
                        </IconButton>
                        <IconButton
                            label="Hapus section"
                            onClick={onDeleteSection}
                            danger
                        >
                            <Trash2 className="size-4" />
                        </IconButton>
                    </div>
                )}
            </div>

            <div className="mt-4 space-y-3">
                {section.questions.length === 0 && (
                    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-5 text-center text-sm text-slate-500">
                        Belum ada pertanyaan pada section ini.
                    </div>
                )}

                {section.questions.map((question) => (
                    <div
                        key={question.id}
                        className="rounded-lg border border-slate-200 bg-white p-4"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="rounded bg-slate-100 px-2 py-1 text-xs font-bold text-slate-500">
                                        Q{question.orderNo}
                                    </span>
                                    <SourcePill
                                        isTemplate={
                                            !!question.sourceTemplateQuestionId
                                        }
                                    />
                                    {question.isGroup && (
                                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-black uppercase text-blue-700">
                                            Group
                                        </span>
                                    )}
                                    {!question.isActive && (
                                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase text-slate-500">
                                            Nonaktif
                                        </span>
                                    )}
                                </div>
                                <p className="mt-2 font-semibold text-slate-800">
                                    {question.questionText}
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                    {question.isGroup
                                        ? 'Tidak membutuhkan jawaban langsung'
                                        : `${question.answerType ?? 'text'}${question.unit ? ` - ${question.unit}` : ''}`}
                                </p>
                            </div>

                            {canEdit && (
                                <div className="flex gap-2">
                                    <IconButton
                                        label="Edit pertanyaan"
                                        onClick={() => onEditQuestion(question)}
                                    >
                                        <Pencil className="size-4" />
                                    </IconButton>
                                    <IconButton
                                        label="Hapus pertanyaan"
                                        onClick={() =>
                                            onDeleteQuestion(question)
                                        }
                                        danger
                                    >
                                        <Trash2 className="size-4" />
                                    </IconButton>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {canEdit && inlineQuestionSectionId !== section.id && (
                    <button
                        type="button"
                        onClick={() => onOpenInlineQuestion(section)}
                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-primary/50 bg-white px-4 py-4 text-sm font-black text-primary transition hover:border-primary hover:bg-primary/5"
                    >
                        <Plus className="size-4" />
                        Tambah Pertanyaan
                    </button>
                )}

                {canEdit && inlineQuestionSectionId === section.id && (
                    <div className="rounded-lg border border-primary/30 bg-white p-4">
                        <QuestionFields
                            errors={errors}
                            form={form}
                            questionForm={questionForm}
                            questions={questions}
                            editingQuestionId={null}
                            onQuestionFormChange={onQuestionFormChange}
                        />
                        <div className="mt-4 flex justify-end gap-2">
                            <Action
                                icon={<X className="size-4" />}
                                onClick={onCancelInlineQuestion}
                                disabled={processing}
                            >
                                Batal
                            </Action>
                            <Action
                                icon={<Save className="size-4" />}
                                onClick={onSaveInlineQuestion}
                                disabled={processing}
                                green
                            >
                                Simpan Pertanyaan
                            </Action>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function SectionModal({
    errors,
    isOpen,
    isEditing,
    processing,
    sectionForm,
    onClose,
    onSave,
    onSectionFormChange,
}: {
    errors: Record<string, string>;
    isOpen: boolean;
    isEditing: boolean;
    processing: boolean;
    sectionForm: SectionFormState;
    onClose: () => void;
    onSave: () => void;
    onSectionFormChange: (form: SectionFormState) => void;
}): ReactNode {
    if (!isOpen) {
        return null;
    }

    return (
        <ModalShell
            title={isEditing ? 'Edit Section' : 'Tambah Section'}
            onClose={onClose}
        >
            <div className="space-y-4">
                <Input
                    label="Judul Section"
                    value={sectionForm.title}
                    onChange={(value) =>
                        onSectionFormChange({ ...sectionForm, title: value })
                    }
                    error={errors.title}
                />
                <Textarea
                    label="Deskripsi"
                    value={sectionForm.description}
                    onChange={(value) =>
                        onSectionFormChange({
                            ...sectionForm,
                            description: value,
                        })
                    }
                    error={errors.description}
                />
                <Input
                    label="Urutan"
                    type="number"
                    value={String(sectionForm.order_no)}
                    onChange={(value) =>
                        onSectionFormChange({
                            ...sectionForm,
                            order_no: value === '' ? '' : Number(value),
                        })
                    }
                    error={errors.order_no}
                />
                <div className="flex justify-end gap-2 pt-2">
                    <Action
                        icon={<X className="size-4" />}
                        onClick={onClose}
                        disabled={processing}
                    >
                        Batal
                    </Action>
                    <Action
                        icon={<Save className="size-4" />}
                        onClick={onSave}
                        disabled={processing}
                        green
                    >
                        Simpan
                    </Action>
                </div>
            </div>
        </ModalShell>
    );
}

function QuestionModal({
    errors,
    form,
    isOpen,
    processing,
    questionForm,
    questions,
    editingQuestionId,
    onClose,
    onQuestionFormChange,
    onSave,
}: {
    errors: Record<string, string>;
    form: ProjectSroiFormData;
    isOpen: boolean;
    processing: boolean;
    questionForm: QuestionFormState;
    questions: ProjectSroiQuestionData[];
    editingQuestionId: number | null;
    onClose: () => void;
    onQuestionFormChange: (form: QuestionFormState) => void;
    onSave: () => void;
}): ReactNode {
    if (!isOpen) {
        return null;
    }

    return (
        <ModalShell title="Edit Pertanyaan" onClose={onClose} wide>
            <QuestionFields
                errors={errors}
                form={form}
                questionForm={questionForm}
                questions={questions}
                editingQuestionId={editingQuestionId}
                onQuestionFormChange={onQuestionFormChange}
            />
            <div className="mt-4 flex justify-end gap-2">
                <Action
                    icon={<X className="size-4" />}
                    onClick={onClose}
                    disabled={processing}
                >
                    Batal
                </Action>
                <Action
                    icon={<Save className="size-4" />}
                    onClick={onSave}
                    disabled={processing}
                    green
                >
                    Simpan Perubahan
                </Action>
            </div>
        </ModalShell>
    );
}

function QuestionFields({
    errors,
    form,
    questionForm,
    questions,
    editingQuestionId,
    onQuestionFormChange,
}: {
    errors: Record<string, string>;
    form: ProjectSroiFormData;
    questionForm: QuestionFormState;
    questions: ProjectSroiQuestionData[];
    editingQuestionId: number | null;
    onQuestionFormChange: (form: QuestionFormState) => void;
}): ReactNode {
    const parentQuestionOptions = questions.filter(
        (question) =>
            question.sectionId === questionForm.section_id &&
            question.id !== editingQuestionId,
    );

    const update = <K extends keyof QuestionFormState>(
        key: K,
        value: QuestionFormState[K],
    ) => {
        if (key === 'section_id') {
            const nextSectionId = value as QuestionFormState['section_id'];
            const nextParentQuestionId =
                nextSectionId === '' ||
                !questions.some(
                    (question) =>
                        question.sectionId === nextSectionId &&
                        question.id === questionForm.parent_question_id,
                )
                    ? ''
                    : questionForm.parent_question_id;

            onQuestionFormChange({
                ...questionForm,
                section_id: nextSectionId,
                parent_question_id: nextParentQuestionId,
            });

            return;
        }

        onQuestionFormChange({ ...questionForm, [key]: value });
    };

    return (
        <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
                <Select
                    label="Section"
                    value={String(questionForm.section_id)}
                    onChange={(value) => update('section_id', Number(value))}
                    error={errors.section_id}
                >
                    <option value="">Pilih section</option>
                    {form.sections.map((section) => (
                        <option key={section.id} value={section.id}>
                            {section.title}
                        </option>
                    ))}
                </Select>
                <Select
                    label="Parent Question"
                    value={String(questionForm.parent_question_id)}
                    onChange={(value) =>
                        update(
                            'parent_question_id',
                            value === '' ? '' : Number(value),
                        )
                    }
                    error={errors.parent_question_id}
                >
                    <option value="">Tanpa parent</option>
                    {parentQuestionOptions.map((question) => (
                        <option key={question.id} value={question.id}>
                            {question.questionText}
                        </option>
                    ))}
                </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-[160px_1fr]">
                <Input
                    label="Urutan"
                    type="number"
                    value={String(questionForm.order_no)}
                    onChange={(value) =>
                        update('order_no', value === '' ? '' : Number(value))
                    }
                    error={errors.order_no}
                />
            </div>

            <Textarea
                label="Pertanyaan"
                value={questionForm.question_text}
                onChange={(value) => update('question_text', value)}
                error={errors.question_text}
            />
            <Textarea
                label="Help Text"
                value={questionForm.help_text}
                onChange={(value) => update('help_text', value)}
                error={errors.help_text}
            />

            <div className="grid gap-4 md:grid-cols-2">
                <Select
                    label="Tipe Jawaban"
                    value={questionForm.answer_type}
                    onChange={(value) =>
                        update('answer_type', value as 'text' | 'number' | '')
                    }
                    error={errors.answer_type}
                    disabled={questionForm.is_group}
                >
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                </Select>
                <Input
                    label="Unit"
                    value={questionForm.unit}
                    onChange={(value) => update('unit', value)}
                    error={errors.unit}
                />
            </div>

            <div className="grid gap-2 md:grid-cols-2">
                <Check
                    label="Group"
                    checked={questionForm.is_group}
                    onChange={(checked) => {
                        onQuestionFormChange({
                            ...questionForm,
                            is_group: checked,
                            answer_type: checked ? '' : 'text',
                        });
                    }}
                />
                <Check
                    label="Active"
                    checked={questionForm.is_active}
                    onChange={(checked) => update('is_active', checked)}
                />
            </div>
        </div>
    );
}

function ModalShell({
    children,
    onClose,
    title,
    wide = false,
}: {
    children: ReactNode;
    onClose: () => void;
    title: string;
    wide?: boolean;
}): ReactNode {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
            <button
                type="button"
                aria-label="Tutup modal"
                className="absolute inset-0 bg-slate-900/40"
                onClick={onClose}
            />
            <div
                className={`relative max-h-[90vh] w-full overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl ${
                    wide ? 'max-w-3xl' : 'max-w-xl'
                }`}
            >
                <div className="mb-5 flex items-center justify-between gap-4">
                    <h3 className="text-lg font-black text-slate-900">
                        {title}
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    >
                        <X className="size-5" />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}

function Empty({ title, text }: { title: string; text: string }): ReactNode {
    return (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <FileText className="mx-auto mb-3 size-9 text-slate-300" />
            <h3 className="font-bold text-slate-800">{title}</h3>
            <p className="mt-1 text-sm text-slate-500">{text}</p>
        </div>
    );
}

function StatusPill({ status }: { status: string }): ReactNode {
    const className =
        status === 'active'
            ? 'bg-green-100 text-green-700'
            : status === 'archived'
              ? 'bg-slate-100 text-slate-600'
              : 'bg-amber-100 text-amber-700';

    return (
        <span
            className={`rounded-full px-2.5 py-1 text-xs font-black uppercase ${className}`}
        >
            {status}
        </span>
    );
}

function SourcePill({ isTemplate }: { isTemplate: boolean }): ReactNode {
    return (
        <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${
                isTemplate
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-purple-50 text-purple-700'
            }`}
        >
            {isTemplate ? 'Template' : 'Custom'}
        </span>
    );
}

function Action({
    children,
    icon,
    onClick,
    disabled,
    green = false,
    dark = false,
}: {
    children: ReactNode;
    icon: ReactNode;
    onClick: () => void;
    disabled?: boolean;
    green?: boolean;
    dark?: boolean;
}): ReactNode {
    const className = green
        ? 'bg-green-600 text-white hover:bg-green-700'
        : dark
          ? 'bg-slate-700 text-white hover:bg-slate-800'
          : 'border border-slate-300 text-slate-700 hover:bg-slate-50';

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition disabled:opacity-50 ${className}`}
        >
            {icon}
            {children}
        </button>
    );
}

function IconButton({
    children,
    label,
    danger = false,
    onClick,
}: {
    children: ReactNode;
    label: string;
    danger?: boolean;
    onClick: () => void;
}): ReactNode {
    return (
        <button
            type="button"
            aria-label={label}
            title={label}
            onClick={onClick}
            className={`flex size-8 items-center justify-center rounded-lg border transition ${
                danger
                    ? 'border-red-200 text-red-600 hover:bg-red-50'
                    : 'border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800'
            }`}
        >
            {children}
        </button>
    );
}

function Input({
    label,
    value,
    onChange,
    type = 'text',
    error,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    type?: string;
    error?: string;
}): ReactNode {
    return (
        <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                {label}
            </span>
            <input
                type={type}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {error && <ErrorText>{error}</ErrorText>}
        </label>
    );
}

function Textarea({
    label,
    value,
    onChange,
    error,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    error?: string;
}): ReactNode {
    return (
        <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                {label}
            </span>
            <textarea
                value={value}
                onChange={(event) => onChange(event.target.value)}
                rows={3}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {error && <ErrorText>{error}</ErrorText>}
        </label>
    );
}

function Select({
    label,
    value,
    onChange,
    children,
    error,
    disabled = false,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    children: ReactNode;
    error?: string;
    disabled?: boolean;
}): ReactNode {
    return (
        <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                {label}
            </span>
            <select
                value={value}
                disabled={disabled}
                onChange={(event) => onChange(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:bg-slate-100"
            >
                {children}
            </select>
            {error && <ErrorText>{error}</ErrorText>}
        </label>
    );
}

function Check({
    label,
    checked,
    onChange,
    disabled = false,
}: {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
}): ReactNode {
    return (
        <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-slate-700">
            <input
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={(event) => onChange(event.target.checked)}
                className="rounded border-slate-300 text-primary focus:ring-primary disabled:opacity-50"
            />
            {label}
        </label>
    );
}

function ErrorText({ children }: { children: ReactNode }): ReactNode {
    return (
        <p className="mt-1 text-xs font-semibold text-red-600">{children}</p>
    );
}
