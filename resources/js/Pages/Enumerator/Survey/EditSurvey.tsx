import { MaterialIcon } from '@/Components/Enumerator';
import EnumeratorLayout from '@/Layouts/EnumeratorLayout';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import QuestionForm, {
    DescriptiveAnswers,
    QuestionAnswers,
} from './components/QuestionForm';
import RespondentForm, { RespondentData } from './components/RespondentForm';
import ReviewForm, { GpsLocation } from './components/ReviewForm';

interface Question {
    id: number;
    category: string | null;
    code: string;
    question_text: string;
    order_no: number;
}

interface ProjectStakeholder {
    id: number;
    name: string;
}

interface ProjectSroiQuestion {
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

interface ProjectSroiSection {
    id: number;
    title: string;
    description: string | null;
    orderNo: number;
    questions: ProjectSroiQuestion[];
}

interface ProjectSroiForm {
    id: number;
    name: string;
    description: string | null;
    sections: ProjectSroiSection[];
}

interface Project {
    id: number;
    company_id: number;
    name: string;
    company?: { id: number; name: string };
}

interface Respondent {
    id: number;
    name: string;
    stakeholder_id: number | null;
    address: string | null;
    phone: string | null;
    age: number | null;
    gender: string | null;
    respondent_status: string | null;
    education_level: string | null;
    main_occupation: string | null;
    monthly_income: number | null;
}

interface SubmissionMeta {
    id: number;
    assessment_type: string;
    photo_url: string | null;
    latitude: number | null;
    longitude: number | null;
    status: string;
}

interface Props {
    submission: SubmissionMeta;
    project: Project;
    respondent: Respondent;
    questions: Question[];
    answersMap: Record<string, number>;
    projectSroiForm?: ProjectSroiForm | null;
    projectStakeholders?: ProjectStakeholder[];
    sroiAnswersMap?: Record<number, string>;
    descriptiveQuestions: { id: number; title: string }[];
    descriptiveAnswersMap: Record<number, string>;
}

const steps = [
    { id: 1, label: 'Data Responden', icon: 'person' },
    { id: 2, label: 'Kuesioner', icon: 'quiz' },
    { id: 3, label: 'Review', icon: 'rate_review' },
];

const getSroiAnswerableQuestions = (
    form?: ProjectSroiForm | null,
): ProjectSroiQuestion[] =>
    form?.sections.flatMap((section) =>
        section.questions.filter(
            (question) => !question.isGroup && question.answerType,
        ),
    ) ?? [];

export default function EditSurvey({
    submission,
    project,
    respondent,
    questions,
    answersMap,
    projectSroiForm = null,
    projectStakeholders = [],
    sroiAnswersMap = {},
    descriptiveQuestions,
    descriptiveAnswersMap,
}: Props) {
    const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isSroi = submission.assessment_type.toUpperCase() === 'SROI';

    const [respondentData, setRespondentData] = useState<RespondentData>({
        name: respondent.name ?? '',
        stakeholder_id:
            respondent.stakeholder_id != null
                ? String(respondent.stakeholder_id)
                : '',
        address: respondent.address ?? '',
        phone: respondent.phone ?? '',
        age: respondent.age != null ? String(respondent.age) : '',
        gender: respondent.gender ?? '',
        respondent_status: respondent.respondent_status ?? '',
        education_level: respondent.education_level ?? '',
        main_occupation: respondent.main_occupation ?? '',
        monthly_income:
            respondent.monthly_income != null
                ? String(respondent.monthly_income)
                : '',
    });

    const [answers, setAnswers] = useState<QuestionAnswers>(answersMap);
    const [sroiAnswers, setSroiAnswers] =
        useState<Record<number, string>>(sroiAnswersMap);
    const [descriptiveAnswers, setDescriptiveAnswers] =
        useState<DescriptiveAnswers>(descriptiveAnswersMap);

    const [gpsLocation] = useState<GpsLocation>({
        latitude:
            submission.latitude != null ? Number(submission.latitude) : null,
        longitude:
            submission.longitude != null ? Number(submission.longitude) : null,
        error: null,
    });

    const stakeholderName =
        projectStakeholders.find(
            (stakeholder) =>
                String(stakeholder.id) === respondentData.stakeholder_id,
        )?.name ?? null;

    const goToStep = (step: 1 | 2 | 3) => setCurrentStep(step);
    const handleBack = () => router.visit(route('enumerator.survey.history'));

    const handleCloseQuestionnaire = () => {
        if (
            confirm(
                'Batalkan pengeditan? Perubahan yang belum disimpan akan hilang.',
            )
        ) {
            router.visit(route('enumerator.survey.history'));
        }
    };

    const buildFormData = (photo: File | null): FormData => {
        const fd = new FormData();

        fd.append('respondent[name]', respondentData.name);
        fd.append(
            'respondent[stakeholder_id]',
            respondentData.stakeholder_id ?? '',
        );
        fd.append('respondent[address]', respondentData.address);
        fd.append('respondent[phone]', respondentData.phone);
        fd.append('respondent[age]', respondentData.age);
        fd.append('respondent[gender]', respondentData.gender);
        fd.append(
            'respondent[respondent_status]',
            respondentData.respondent_status,
        );
        fd.append(
            'respondent[education_level]',
            respondentData.education_level,
        );
        fd.append(
            'respondent[main_occupation]',
            respondentData.main_occupation,
        );
        fd.append('respondent[monthly_income]', respondentData.monthly_income);

        if (photo) {
            fd.append('submission[photo]', photo);
        }

        fd.append(
            'submission[latitude]',
            String(gpsLocation.latitude ?? submission.latitude ?? ''),
        );
        fd.append(
            'submission[longitude]',
            String(gpsLocation.longitude ?? submission.longitude ?? ''),
        );
        fd.append('assessment_type', submission.assessment_type.toUpperCase());

        if (isSroi) {
            getSroiAnswerableQuestions(projectSroiForm).forEach(
                (question, index) => {
                    const value = sroiAnswers[question.id] ?? '';
                    fd.append(
                        `sroi_answers[${index}][project_sroi_question_id]`,
                        String(question.id),
                    );

                    if (question.answerType === 'number') {
                        fd.append(
                            `sroi_answers[${index}][value_number]`,
                            value,
                        );
                    } else {
                        fd.append(`sroi_answers[${index}][value_text]`, value);
                    }
                },
            );
        } else {
            Object.entries(answers).forEach(([key, value], index) => {
                const dashIdx = key.indexOf('-');
                const questionId = key.substring(0, dashIdx);
                const type = key.substring(dashIdx + 1);
                fd.append(`answers[${index}][question_id]`, questionId);
                fd.append(`answers[${index}][type]`, type);
                fd.append(`answers[${index}][value]`, String(value));
            });
        }

        Object.entries(descriptiveAnswers).forEach(([qId, answer], index) => {
            if (String(answer).trim()) {
                fd.append(`descriptive_answers[${index}][question_id]`, qId);
                fd.append(
                    `descriptive_answers[${index}][answer]`,
                    String(answer),
                );
            }
        });

        fd.append('_method', 'PUT');

        return fd;
    };

    const submitUpdate = (photo: File | null) => {
        if (!gpsLocation.latitude || !gpsLocation.longitude) {
            alert(
                'Koordinat GPS belum tersedia. Pastikan izin lokasi diaktifkan.',
            );
            return;
        }

        if (!respondentData.name.trim()) {
            alert('Nama responden wajib diisi.');
            goToStep(1);
            return;
        }

        if (isSroi) {
            const requiredQuestions =
                getSroiAnswerableQuestions(projectSroiForm);

            if (!respondentData.stakeholder_id) {
                alert('Stakeholder wajib dipilih untuk survei SROI.');
                goToStep(1);
                return;
            }

            if (
                requiredQuestions.length === 0 ||
                requiredQuestions.some(
                    (question) =>
                        !String(sroiAnswers[question.id] ?? '').trim(),
                )
            ) {
                alert('Semua pertanyaan SROI harus dijawab sebelum menyimpan.');
                goToStep(2);
                return;
            }
        } else {
            const isIKM = submission.assessment_type.toUpperCase() === 'IKM';
            const totalRequired = isIKM
                ? questions.reduce(
                      (acc, q) =>
                          acc +
                          (q.category === 'ikm-kepentingan' ||
                          q.category === 'ikm-kinerja'
                              ? 1
                              : 2),
                      0,
                  )
                : questions.length;

            if (Object.keys(answers).length < totalRequired) {
                alert('Semua pertanyaan harus dijawab sebelum menyimpan.');
                goToStep(2);
                return;
            }
        }

        setIsSubmitting(true);
        router.post(
            route('enumerator.survey.update', { submissionId: submission.id }),
            buildFormData(photo) as unknown as Record<string, string>,
            {
                onError: () => setIsSubmitting(false),
                onFinish: () => setIsSubmitting(false),
            },
        );
    };

    return (
        <EnumeratorLayout activeNav="tugasku">
            <Head title={`Edit Survei - ${project.name}`} />

            <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
                <MaterialIcon
                    name="edit_note"
                    className="text-base text-amber-600"
                />
                <span>
                    Anda sedang mengedit submission{' '}
                    <strong>#{submission.id}</strong> -{' '}
                    {submission.assessment_type}
                </span>
            </div>

            <div className="mb-6 flex items-center justify-center gap-0">
                {steps.map((step, index) => (
                    <div key={step.id} className="flex items-center">
                        <div className="flex flex-col items-center gap-1">
                            <button
                                onClick={() => {
                                    if (step.id < currentStep) {
                                        goToStep(step.id as 1 | 2 | 3);
                                    }
                                }}
                                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-200 ${
                                    currentStep === step.id
                                        ? 'border-primary bg-primary text-white shadow-md'
                                        : currentStep > step.id
                                          ? 'border-primary bg-primary/10 text-primary hover:bg-primary/20'
                                          : 'border-gray-300 bg-white text-gray-400'
                                } ${step.id < currentStep ? 'cursor-pointer' : 'cursor-default'}`}
                            >
                                {currentStep > step.id ? (
                                    <MaterialIcon
                                        name="check"
                                        className="text-sm font-bold"
                                    />
                                ) : (
                                    <MaterialIcon
                                        name={step.icon}
                                        className="text-sm"
                                    />
                                )}
                            </button>
                            <span
                                className={`text-xs font-medium ${
                                    currentStep === step.id
                                        ? 'text-primary'
                                        : currentStep > step.id
                                          ? 'text-primary/70'
                                          : 'text-gray-400'
                                }`}
                            >
                                {step.label}
                            </span>
                        </div>

                        {index < steps.length - 1 && (
                            <div
                                className={`mx-2 mb-4 h-0.5 w-16 sm:w-24 ${
                                    currentStep > step.id
                                        ? 'bg-primary'
                                        : 'bg-gray-200'
                                }`}
                            />
                        )}
                    </div>
                ))}
            </div>

            {currentStep === 1 && (
                <RespondentForm
                    data={respondentData}
                    isSroi={isSroi}
                    stakeholderOptions={projectStakeholders.map(
                        (stakeholder) => ({
                            value: String(stakeholder.id),
                            label: stakeholder.name,
                        }),
                    )}
                    onChange={setRespondentData}
                    onBack={handleBack}
                    onNext={() => goToStep(2)}
                />
            )}

            {currentStep === 2 && (
                <QuestionForm
                    questions={questions}
                    projectName={project.name}
                    companyName={project.company?.name}
                    answers={answers}
                    surveyType={submission.assessment_type}
                    onChange={setAnswers}
                    descriptiveQuestions={descriptiveQuestions}
                    descriptiveAnswers={descriptiveAnswers}
                    onDescriptiveChange={setDescriptiveAnswers}
                    projectSroiForm={projectSroiForm}
                    sroiAnswers={sroiAnswers}
                    onSroiChange={setSroiAnswers}
                    onBack={() => goToStep(1)}
                    onNext={() => goToStep(3)}
                    onClose={handleCloseQuestionnaire}
                />
            )}

            {currentStep === 3 && (
                <ReviewForm
                    mode="edit"
                    respondentData={respondentData}
                    answers={answers}
                    questions={questions}
                    surveyType={submission.assessment_type}
                    projectSroiForm={projectSroiForm}
                    sroiAnswers={sroiAnswers}
                    stakeholderName={stakeholderName}
                    gpsLocation={gpsLocation}
                    existingPhotoUrl={submission.photo_url}
                    onBack={() => goToStep(2)}
                    onEditRespondent={() => goToStep(1)}
                    onSubmit={submitUpdate}
                    isSubmitting={isSubmitting}
                />
            )}
        </EnumeratorLayout>
    );
}
