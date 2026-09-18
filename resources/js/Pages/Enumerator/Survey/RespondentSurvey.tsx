import { MaterialIcon } from '@/Components/Enumerator';
import EnumeratorLayout from '@/Layouts/EnumeratorLayout';
import { Head, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
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

interface DescriptiveQuestion {
    id: number;
    title: string;
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
    company?: {
        id: number;
        name: string;
    };
}

interface Props {
    project: Project;
    surveyType: string;
    questions: Question[];
    projectSroiForm?: ProjectSroiForm | null;
    projectStakeholders?: ProjectStakeholder[];
    descriptiveQuestions: DescriptiveQuestion[];
}

const steps = [
    { id: 1, label: 'Data Responden', icon: 'person' },
    { id: 2, label: 'Kuesioner', icon: 'quiz' },
    { id: 3, label: 'Review', icon: 'rate_review' },
];

export default function RespondentSurvey({
    project,
    surveyType,
    questions,
    projectSroiForm,
    projectStakeholders = [],
    descriptiveQuestions,
}: Props) {
    const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Respondent state — 1:1 dengan kolom tabel `respondents`
    const [respondentData, setRespondentData] = useState<RespondentData>({
        name: '',
        stakeholder_id: '',
        address: '',
        phone: '',
        age: '',
        gender: '',
        respondent_status: '',
        education_level: '',
        main_occupation: '',
        monthly_income: '',
    });

    const [answers, setAnswers] = useState<QuestionAnswers>({});
    const [sroiAnswers, setSroiAnswers] = useState<Record<number, string>>({});
    const isSroi = surveyType.toUpperCase() === 'SROI';

    // Descriptive answers state
    const [descriptiveAnswers, setDescriptiveAnswers] =
        useState<DescriptiveAnswers>({});

    // GPS state
    const [gpsLocation, setGpsLocation] = useState<GpsLocation>({
        latitude: null,
        longitude: null,
        error: null,
    });

    // Auto-fetch GPS saat halaman load
    useEffect(() => {
        if (!navigator.geolocation) {
            setGpsLocation({
                latitude: null,
                longitude: null,
                error: 'Browser tidak mendukung GPS.',
            });
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setGpsLocation({
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude,
                    error: null,
                });
            },
            (err) => {
                setGpsLocation({
                    latitude: null,
                    longitude: null,
                    error: `Gagal mendapatkan lokasi: ${err.message}`,
                });
            },
            { enableHighAccuracy: true, timeout: 10000 },
        );
    }, []);

    const goToStep = (step: 1 | 2 | 3) => setCurrentStep(step);

    const handleBackFromRespondent = () => {
        router.visit(route('enumerator.list-survey'));
    };

    const handleCloseQuestionnaire = () => {
        if (
            confirm(
                'Apakah Anda yakin ingin menutup survei? Data yang belum disimpan akan hilang.',
            )
        ) {
            router.visit(route('enumerator.list-survey'));
        }
    };

    const buildFormData = (
        photo: File,
        redirectTo: 'final' | 'continue',
    ): FormData => {
        const formData = new FormData();

        // Respondent fields — sesuai kolom tabel `respondents`
        formData.append('respondent[name]', respondentData.name);
        formData.append(
            'respondent[stakeholder_id]',
            respondentData.stakeholder_id ?? '',
        );
        formData.append('respondent[address]', respondentData.address);
        formData.append('respondent[phone]', respondentData.phone);
        formData.append('respondent[age]', respondentData.age);
        formData.append('respondent[gender]', respondentData.gender);
        formData.append(
            'respondent[respondent_status]',
            respondentData.respondent_status,
        );
        formData.append(
            'respondent[education_level]',
            respondentData.education_level,
        );
        formData.append(
            'respondent[main_occupation]',
            respondentData.main_occupation,
        );
        formData.append(
            'respondent[monthly_income]',
            respondentData.monthly_income,
        );

        // Submission fields
        formData.append('submission[photo]', photo);
        formData.append(
            'submission[latitude]',
            String(gpsLocation.latitude ?? ''),
        );
        formData.append(
            'submission[longitude]',
            String(gpsLocation.longitude ?? ''),
        );

        // Assessment type
        formData.append('assessment_type', surveyType);

        // Redirect intent
        formData.append('redirect_to', redirectTo);

        // Answers: [{question_id, type, value}, ...]
        // Key format: `${questionId}-${type}` e.g. "3-ikm-kepentingan", "3-ikm-kinerja", "5-sloi"
        if (isSroi) {
            Object.entries(sroiAnswers).forEach(
                ([questionId, value], index) => {
                    const question = projectSroiForm?.sections
                        .flatMap((section) => section.questions)
                        .find((item) => item.id === Number(questionId));

                    formData.append(
                        `sroi_answers[${index}][project_sroi_question_id]`,
                        questionId,
                    );

                    if (question?.answerType === 'number') {
                        formData.append(
                            `sroi_answers[${index}][value_number]`,
                            value,
                        );
                    } else {
                        formData.append(
                            `sroi_answers[${index}][value_text]`,
                            value,
                        );
                    }
                },
            );
        } else {
            Object.entries(answers).forEach(([key, value], index) => {
                const dashIdx = key.indexOf('-');
                const questionId = key.substring(0, dashIdx);
                const type = key.substring(dashIdx + 1);
                formData.append(`answers[${index}][question_id]`, questionId);
                formData.append(`answers[${index}][type]`, type);
                formData.append(`answers[${index}][value]`, String(value));
            });
        }

        // Descriptive answers: [{question_id, answer}, ...]
        Object.entries(descriptiveAnswers).forEach(([qId, answer], index) => {
            if (answer.trim()) {
                formData.append(
                    `descriptive_answers[${index}][question_id]`,
                    qId,
                );
                formData.append(
                    `descriptive_answers[${index}][answer]`,
                    answer,
                );
            }
        });

        return formData;
    };

    const submitSurvey = (photo: File, redirectTo: 'final' | 'continue') => {
        setIsSubmitting(true);
        const formData = buildFormData(photo, redirectTo);

        router.post(
            route('enumerator.survey.store', { projectId: project.id }),
            formData as unknown as Record<string, string>,
            {
                onSuccess: () => {
                    if (redirectTo === 'continue') {
                        setRespondentData({
                            name: '',
                            stakeholder_id: '',
                            address: '',
                            phone: '',
                            age: '',
                            gender: '',
                            respondent_status: '',
                            education_level: '',
                            main_occupation: '',
                            monthly_income: '',
                        });
                        setAnswers({});
                        setSroiAnswers({});
                        setDescriptiveAnswers({});
                        setCurrentStep(1);
                    }
                },
                onError: () => setIsSubmitting(false),
                onFinish: () => setIsSubmitting(false),
            },
        );
    };

    const handleFinalSubmit = (photo: File | null) => {
        if (!photo) return; // In create mode, photo is always required
        submitSurvey(photo, 'final');
    };

    const handleSubmitAndContinue = (photo: File | null) => {
        if (!photo) return; // In create mode, photo is always required
        submitSurvey(photo, 'continue');
    };

    return (
        <EnumeratorLayout activeNav="tugasku">
            <Head title={`Survei — ${project.name}`} />

            {/* Step Indicator */}
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

            {/* Step Content */}
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
                    onBack={handleBackFromRespondent}
                    onNext={() => goToStep(2)}
                />
            )}

            {currentStep === 2 && (
                <QuestionForm
                    questions={questions}
                    projectName={project.name}
                    companyName={project.company?.name}
                    answers={answers}
                    surveyType={surveyType}
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
                    respondentData={respondentData}
                    answers={answers}
                    questions={questions}
                    surveyType={surveyType}
                    projectSroiForm={projectSroiForm}
                    sroiAnswers={sroiAnswers}
                    stakeholderName={
                        projectStakeholders.find(
                            (item) =>
                                String(item.id) ===
                                respondentData.stakeholder_id,
                        )?.name ?? null
                    }
                    gpsLocation={gpsLocation}
                    onBack={() => goToStep(2)}
                    onEditRespondent={() => goToStep(1)}
                    onSubmit={handleFinalSubmit}
                    onSubmitAndContinue={handleSubmitAndContinue}
                    isSubmitting={isSubmitting}
                />
            )}
        </EnumeratorLayout>
    );
}
