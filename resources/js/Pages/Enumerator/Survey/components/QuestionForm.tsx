import {
    LikertScaleQuestion,
    MaterialIcon,
    SurveyFooter,
    SurveyHeader,
    SurveyProgressCard,
} from '@/Components/Enumerator';
import React, { useMemo } from 'react';

// Question interface — sesuai kolom tabel template_questions
interface Question {
    id: number;
    category: string | null;
    code: string;
    question_text: string;
    order_no: number;
}

// For IKM: each question has two answer slots (kepentingan + kinerja)
// Key format: `${questionId}-ikm-kepentingan` | `${questionId}-ikm-kinerja` | `${questionId}-sloi`
export type QuestionAnswers = Record<string, number>;

// Descriptive answers: questionId (number) -> answer text
export type DescriptiveAnswers = Record<number, string>;

interface DescriptiveQuestion {
    id: number;
    title: string;
}

interface SroiQuestion {
    id: number;
    sectionId: number;
    parentQuestionId: number | null;
    questionText: string;
    helpText: string | null;
    answerType: 'text' | 'number' | null;
    unit: string | null;
    isGroup: boolean;
    orderNo: number;
}

interface SroiSection {
    id: number;
    title: string;
    description: string | null;
    orderNo: number;
    questions: SroiQuestion[];
}

interface SroiForm {
    id: number;
    name: string;
    description: string | null;
    sections: SroiSection[];
}

interface QuestionFormProps {
    questions: Question[];
    projectName?: string;
    companyName?: string;
    answers: QuestionAnswers;
    surveyType: string; // 'IKM' | 'SLOI'
    onChange: (answers: QuestionAnswers) => void;
    descriptiveQuestions?: DescriptiveQuestion[];
    descriptiveAnswers?: DescriptiveAnswers;
    onDescriptiveChange?: (answers: DescriptiveAnswers) => void;
    onBack: () => void;
    onNext: () => void;
    onClose: () => void;
    projectSroiForm?: SroiForm | null;
    sroiAnswers?: Record<number, string>;
    onSroiChange?: (answers: Record<number, string>) => void;
}

const IKM_LABELS: {
    kepentingan: { min: string; max: string };
    kinerja: { min: string; max: string };
} = {
    kepentingan: { min: 'Tidak Penting', max: 'Sangat Penting' },
    kinerja: { min: 'Tidak Baik', max: 'Sangat Baik' },
};

const SLOI_LABELS = { min: 'Sangat Tidak Setuju', max: 'Sangat Setuju' };

export default function QuestionForm({
    questions,
    projectName,
    companyName,
    answers,
    surveyType,
    onChange,
    descriptiveQuestions = [],
    descriptiveAnswers = {},
    onDescriptiveChange,
    onBack,
    onNext,
    onClose,
    projectSroiForm = null,
    sroiAnswers = {},
    onSroiChange,
}: QuestionFormProps) {
    const isIKM = surveyType.toUpperCase() === 'IKM';
    const isSROI = surveyType.toUpperCase() === 'SROI';

    if (isSROI && projectSroiForm) {
        const orderedSections = [...projectSroiForm.sections].sort(
            (left, right) => left.orderNo - right.orderNo || left.id - right.id,
        );
        const totalRequired = orderedSections.reduce(
            (total, section) =>
                total +
                section.questions.filter(
                    (question) => !question.isGroup && question.answerType,
                ).length,
            0,
        );
        const progressPercentage =
            totalRequired === 0
                ? 0
                : Math.round(
                      (Object.keys(sroiAnswers).length / totalRequired) * 100,
                  );
        const isComplete = Object.keys(sroiAnswers).length === totalRequired;

        const questionsByParent = (questions: SroiQuestion[]) =>
            questions.reduce<Map<number | null, SroiQuestion[]>>(
                (map, question) => {
                    const key = question.parentQuestionId ?? null;
                    map.set(key, [...(map.get(key) ?? []), question]);
                    return map;
                },
                new Map(),
            );

        const renderQuestionTree = (
            question: SroiQuestion,
            map: Map<number | null, SroiQuestion[]>,
            depth = 0,
        ): React.ReactNode => {
            const children = map.get(question.id) ?? [];
            const paddingClass =
                depth === 0 ? 'pl-0' : depth === 1 ? 'pl-4' : 'pl-8';
            const answerId = question.id;

            return (
                <div key={question.id} className={`space-y-3 ${paddingClass}`}>
                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <p className="text-sm font-semibold text-slate-900">
                            {question.questionText}
                        </p>
                        {question.helpText && (
                            <p className="mt-1 text-sm text-slate-500">
                                {question.helpText}
                            </p>
                        )}

                        {!question.isGroup && question.answerType && (
                            <div className="mt-3">
                                {question.answerType === 'text' ? (
                                    <textarea
                                        rows={4}
                                        value={sroiAnswers[answerId] ?? ''}
                                        onChange={(event) =>
                                            onSroiChange?.({
                                                ...sroiAnswers,
                                                [answerId]: event.target.value,
                                            })
                                        }
                                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
                                        placeholder="Tulis jawaban..."
                                    />
                                ) : (
                                    <input
                                        type="number"
                                        value={sroiAnswers[answerId] ?? ''}
                                        onChange={(event) =>
                                            onSroiChange?.({
                                                ...sroiAnswers,
                                                [answerId]: event.target.value,
                                            })
                                        }
                                        className="h-12 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
                                        placeholder={question.unit ?? '0'}
                                    />
                                )}
                            </div>
                        )}
                    </div>

                    {children.length > 0 && (
                        <div className="space-y-3">
                            {children
                                .sort(
                                    (left, right) =>
                                        left.orderNo - right.orderNo ||
                                        left.id - right.id,
                                )
                                .map((child) =>
                                    renderQuestionTree(child, map, depth + 1),
                                )}
                        </div>
                    )}
                </div>
            );
        };

        return (
            <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 pb-8">
                <SurveyHeader
                    title="Survei SROI"
                    subtitle="Publik &amp; Masyarakat"
                    onClose={onClose}
                />
                <SurveyProgressCard
                    percentage={progressPercentage}
                    title="Kelengkapan Survei"
                    description="Lengkapi seluruh section dan pertanyaan SROI berikut."
                />
                <div className="flex flex-col gap-4">
                    {orderedSections.map((section) => {
                        const map = questionsByParent(section.questions);
                        const roots = map.get(null) ?? [];

                        return (
                            <div
                                key={section.id}
                                className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                            >
                                <div className="mb-3">
                                    <h3 className="text-base font-bold text-slate-900">
                                        {section.title}
                                    </h3>
                                    {section.description && (
                                        <p className="mt-1 text-sm text-slate-600">
                                            {section.description}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-4">
                                    {roots.map((question) =>
                                        renderQuestionTree(question, map),
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
                <SurveyFooter
                    onBack={onBack}
                    onSubmit={onNext}
                    backLabel="Kembali"
                    submitLabel="Review Jawaban"
                    submitIcon="rate_review"
                    isSubmitDisabled={!isComplete}
                />
            </div>
        );
    }

    const totalRequired = useMemo(() => {
        if (!isIKM) return questions.length;
        return questions.reduce(
            (acc, q) =>
                acc +
                (q.category === 'ikm-kepentingan' ||
                q.category === 'ikm-kinerja'
                    ? 1
                    : 2),
            0,
        );
    }, [questions, isIKM]);

    const progressPercentage = useMemo(() => {
        if (totalRequired === 0) return 0;
        return Math.round((Object.keys(answers).length / totalRequired) * 100);
    }, [answers, totalRequired]);

    const handleAnswerChange = (key: string, value: number) => {
        onChange({ ...answers, [key]: value });
    };

    const isComplete = Object.keys(answers).length === totalRequired;

    // Group by category
    const groupedQuestions = useMemo(() => {
        const groups: Record<string, Question[]> = {};
        questions.forEach((q) => {
            const cat = q.category || 'Umum';
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(q);
        });
        return groups;
    }, [questions]);

    let questionNumber = 0;

    return (
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 pb-8">
            {/* Survey Header */}
            <SurveyHeader
                title={isIKM ? 'Survei IKM' : 'Survei SLOI'}
                subtitle="Publik &amp; Masyarakat"
                onClose={onClose}
            />

            {/* Progress Card */}
            <SurveyProgressCard
                percentage={progressPercentage}
                title="Kelengkapan Survei"
                description={
                    isIKM
                        ? 'Tiap aspek dinilai dari 2 sisi: Kepentingan dan Kinerja.'
                        : 'Mohon lengkapi semua pertanyaan untuk melanjutkan.'
                }
            />

            {/* Project & Company Name */}
            {(projectName || companyName) && (
                <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    {companyName && (
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                                <MaterialIcon
                                    name="domain"
                                    className="text-xl"
                                />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-gray-500">
                                    Perusahaan
                                </p>
                                <p className="text-base font-bold text-gray-900">
                                    {companyName}
                                </p>
                            </div>
                        </div>
                    )}
                    {projectName && companyName && (
                        <div className="h-px bg-gray-100" />
                    )}
                    {projectName && (
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <MaterialIcon
                                    name="apartment"
                                    className="text-xl"
                                />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-gray-500">
                                    Nama Project
                                </p>
                                <p className="text-base font-bold text-gray-900">
                                    {projectName}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* IKM legend */}
            {/* {isIKM && (
                <div className="flex flex-wrap gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm">
                    <div className="flex items-center gap-2">
                        <span className="inline-flex size-5 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700">
                            K
                        </span>
                        <span className="font-semibold text-blue-700">
                            Kepentingan
                        </span>
                        <span className="text-gray-400">— skala 1–4</span>
                    </div>
                    <div className="h-4 w-px bg-gray-200" />
                    <div className="flex items-center gap-2">
                        <span className="inline-flex size-5 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700">
                            P
                        </span>
                        <span className="font-semibold text-emerald-700">
                            Kinerja (Performa)
                        </span>
                        <span className="text-gray-400">— skala 1–4</span>
                    </div>
                </div>
            )} */}

            {/* Questions */}
            {questions.length === 0 ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
                    <p className="text-sm font-medium text-amber-700">
                        Tidak ada pertanyaan ditemukan untuk tipe survei ini.
                    </p>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {Object.entries(groupedQuestions).map(
                        ([category, catQuestions]) => {
                            if (isIKM) {
                                questionNumber = 0;
                            }

                            return (
                                <div
                                    key={category}
                                    className="flex flex-col gap-4"
                                >
                                    {Object.keys(groupedQuestions).length >
                                        1 && (
                                        <div className="flex items-center gap-2">
                                            <div className="h-px flex-1 bg-gray-200" />
                                            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                                                {category === 'ikm-kepentingan'
                                                    ? 'IKM Kepentingan'
                                                    : category === 'ikm-kinerja'
                                                      ? 'IKM Kinerja'
                                                      : category}
                                            </span>
                                            <div className="h-px flex-1 bg-gray-200" />
                                        </div>
                                    )}

                                    {catQuestions.map((question) => {
                                        if (isIKM) {
                                            const type = question.category;

                                            if (
                                                type === 'ikm-kepentingan' ||
                                                type === 'ikm-kinerja'
                                            ) {
                                                const key = `${question.id}-${type}`;
                                                const isKepentingan =
                                                    type === 'ikm-kepentingan';
                                                const qNum = ++questionNumber;
                                                return (
                                                    <div key={question.id}>
                                                        <div className="p-4">
                                                            <LikertScaleQuestion
                                                                questionNumber={
                                                                    qNum
                                                                }
                                                                question={
                                                                    question.question_text
                                                                }
                                                                name={key}
                                                                value={
                                                                    answers[key]
                                                                }
                                                                onChange={(v) =>
                                                                    handleAnswerChange(
                                                                        key,
                                                                        v,
                                                                    )
                                                                }
                                                                scaleSize={4}
                                                                minLabel={
                                                                    isKepentingan
                                                                        ? IKM_LABELS
                                                                              .kepentingan
                                                                              .min
                                                                        : IKM_LABELS
                                                                              .kinerja
                                                                              .min
                                                                }
                                                                maxLabel={
                                                                    isKepentingan
                                                                        ? IKM_LABELS
                                                                              .kepentingan
                                                                              .max
                                                                        : IKM_LABELS
                                                                              .kinerja
                                                                              .max
                                                                }
                                                                isAnswered={
                                                                    answers[
                                                                        key
                                                                    ] !==
                                                                    undefined
                                                                }
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            // Fallback for legacy database templates
                                            const kepKey = `${question.id}-ikm-kepentingan`;
                                            const kinKey = `${question.id}-ikm-kinerja`;
                                            const kepNumber = ++questionNumber;
                                            const kinNumber = ++questionNumber;
                                            return (
                                                <React.Fragment
                                                    key={question.id}
                                                >
                                                    {/* ── IKM Kepentingan ── */}
                                                    <div className="rounded-xl border border-blue-100 bg-white shadow-sm">
                                                        <div className="flex items-center gap-2 rounded-t-xl border-b border-blue-100 bg-blue-50 px-4 py-2.5">
                                                            <span className="inline-flex size-5 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white">
                                                                K
                                                            </span>
                                                            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                                                                IKM Kepentingan
                                                            </span>
                                                        </div>
                                                        <div className="p-4">
                                                            <LikertScaleQuestion
                                                                questionNumber={
                                                                    kepNumber
                                                                }
                                                                question={`Bagaimana Kepentingan ${question.question_text}?`}
                                                                name={kepKey}
                                                                value={
                                                                    answers[
                                                                        kepKey
                                                                    ]
                                                                }
                                                                onChange={(v) =>
                                                                    handleAnswerChange(
                                                                        kepKey,
                                                                        v,
                                                                    )
                                                                }
                                                                scaleSize={4}
                                                                minLabel={
                                                                    IKM_LABELS
                                                                        .kepentingan
                                                                        .min
                                                                }
                                                                maxLabel={
                                                                    IKM_LABELS
                                                                        .kepentingan
                                                                        .max
                                                                }
                                                                isAnswered={
                                                                    answers[
                                                                        kepKey
                                                                    ] !==
                                                                    undefined
                                                                }
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* ── IKM Kinerja ── */}
                                                    <div className="rounded-xl border border-emerald-100 bg-white shadow-sm">
                                                        <div className="flex items-center gap-2 rounded-t-xl border-b border-emerald-100 bg-emerald-50 px-4 py-2.5">
                                                            <span className="inline-flex size-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">
                                                                P
                                                            </span>
                                                            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                                                                IKM Kinerja
                                                            </span>
                                                        </div>
                                                        <div className="p-4">
                                                            <LikertScaleQuestion
                                                                questionNumber={
                                                                    kinNumber
                                                                }
                                                                question={`Bagaimana Kinerja ${question.question_text}?`}
                                                                name={kinKey}
                                                                value={
                                                                    answers[
                                                                        kinKey
                                                                    ]
                                                                }
                                                                onChange={(v) =>
                                                                    handleAnswerChange(
                                                                        kinKey,
                                                                        v,
                                                                    )
                                                                }
                                                                scaleSize={4}
                                                                minLabel={
                                                                    IKM_LABELS
                                                                        .kinerja
                                                                        .min
                                                                }
                                                                maxLabel={
                                                                    IKM_LABELS
                                                                        .kinerja
                                                                        .max
                                                                }
                                                                isAnswered={
                                                                    answers[
                                                                        kinKey
                                                                    ] !==
                                                                    undefined
                                                                }
                                                            />
                                                        </div>
                                                    </div>
                                                </React.Fragment>
                                            );
                                        }

                                        // SLOI — single answer
                                        questionNumber++;
                                        const sloiKey = `${question.id}-sloi`;
                                        return (
                                            <LikertScaleQuestion
                                                key={question.id}
                                                questionNumber={questionNumber}
                                                question={
                                                    question.question_text
                                                }
                                                name={sloiKey}
                                                value={answers[sloiKey]}
                                                onChange={(value) =>
                                                    handleAnswerChange(
                                                        sloiKey,
                                                        value,
                                                    )
                                                }
                                                scaleSize={5}
                                                minLabel={SLOI_LABELS.min}
                                                maxLabel={SLOI_LABELS.max}
                                                isAnswered={
                                                    answers[sloiKey] !==
                                                    undefined
                                                }
                                            />
                                        );
                                    })}
                                </div>
                            );
                        },
                    )}
                </div>
            )}

            {/* ── Pertanyaan Kualitatif ── */}
            {descriptiveQuestions.length > 0 && (
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                        <div className="h-px flex-1 bg-gray-200" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                            Pertanyaan Kualitatif
                        </span>
                        <div className="h-px flex-1 bg-gray-200" />
                    </div>

                    {descriptiveQuestions.map((dq, idx) => (
                        <div
                            key={dq.id}
                            className="rounded-xl border border-violet-100 bg-white shadow-sm"
                        >
                            <div className="flex items-center gap-2 rounded-t-xl border-b border-gray-400 bg-gray-400/10 px-4 py-2.5">
                                <span className="inline-flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                                    {idx + 1}
                                </span>
                                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                                    Pertanyaan Kualitatif
                                </span>
                            </div>
                            <div className="p-4">
                                <p className="mb-3 text-sm font-medium text-gray-800">
                                    {dq.title}
                                </p>
                                <textarea
                                    id={`descriptive-${dq.id}`}
                                    rows={4}
                                    placeholder="Tuliskan jawaban Anda di sini..."
                                    value={descriptiveAnswers[dq.id] ?? ''}
                                    onChange={(e) => {
                                        if (onDescriptiveChange) {
                                            onDescriptiveChange({
                                                ...descriptiveAnswers,
                                                [dq.id]: e.target.value,
                                            });
                                        }
                                    }}
                                    className="w-full resize-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 outline-none transition-all placeholder:text-gray-400 focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-100"
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Footer Actions */}
            <SurveyFooter
                onBack={onBack}
                onSubmit={onNext}
                backLabel="Kembali"
                submitLabel="Review Jawaban"
                submitIcon="rate_review"
                isSubmitDisabled={!isComplete}
            />
        </div>
    );
}
