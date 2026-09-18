import { ReactNode } from 'react';

export interface SroiQuestionView {
    id: number;
    questionText: string;
    helpText: string | null;
    answerType: 'text' | 'number' | null;
    unit: string | null;
    isGroup: boolean;
    parentQuestionId: number | null;
    orderNo: number;
}

export interface SroiSectionView {
    id: number;
    title: string;
    description: string | null;
    orderNo: number;
    questions: SroiQuestionView[];
}

export type SroiAnswerMap = Record<number, string | number | null>;

interface Props {
    sections: SroiSectionView[];
    answers?: SroiAnswerMap;
}

export default function SROIFormTable({
    sections,
    answers = {},
}: Props): ReactNode {
    return (
        <div className="overflow-hidden border border-slate-500 bg-white shadow-sm">
            <table className="w-full table-fixed border-collapse">
                <thead>
                    <tr className="bg-blue-100 text-slate-950">
                        <th className="w-[32%] border border-slate-500 px-3 py-2 text-left text-sm font-bold">
                            Pertanyaan
                        </th>
                        <th className="border border-slate-500 px-3 py-2 text-left text-sm font-bold">
                            Jawaban
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {sections.map((section) => (
                        <SectionRows
                            key={section.id}
                            section={section}
                            answers={answers}
                        />
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function SectionRows({
    section,
    answers,
}: {
    section: SroiSectionView;
    answers: SroiAnswerMap;
}): ReactNode {
    const orderedQuestions = [...section.questions].sort(
        (left, right) => left.orderNo - right.orderNo || left.id - right.id,
    );
    const questionsByParent = orderedQuestions.reduce<
        Map<number | null, SroiQuestionView[]>
    >((map, question) => {
        const key = question.parentQuestionId ?? null;
        map.set(key, [...(map.get(key) ?? []), question]);
        return map;
    }, new Map());
    const rootQuestions = questionsByParent.get(null) ?? [];

    return (
        <>
            <tr className="bg-slate-100">
                <td
                    colSpan={2}
                    className="border border-slate-500 px-3 py-3 text-center text-base font-bold text-slate-900"
                >
                    {section.title}
                </td>
            </tr>
            {section.description && (
                <tr>
                    <td
                        colSpan={2}
                        className="border border-slate-500 px-3 py-2 text-sm text-slate-600"
                    >
                        {section.description}
                    </td>
                </tr>
            )}
            {rootQuestions.map((question) => (
                <QuestionTreeRows
                    key={question.id}
                    question={question}
                    questionsByParent={questionsByParent}
                    answers={answers}
                />
            ))}
        </>
    );
}

function QuestionTreeRows({
    question,
    questionsByParent,
    answers,
}: {
    question: SroiQuestionView;
    questionsByParent: Map<number | null, SroiQuestionView[]>;
    answers: SroiAnswerMap;
}): ReactNode {
    const children = questionsByParent.get(question.id) ?? [];

    if (children.length === 0) {
        return (
            <tr>
                <QuestionCell question={question} />
                <td className="border border-slate-500 px-3 py-3 align-top text-[15px] leading-8 text-slate-900">
                    <AnswerContent question={question} answers={answers} />
                </td>
            </tr>
        );
    }

    const rightRows = flattenRightRows(children, questionsByParent);

    return (
        <>
            <tr>
                <QuestionCell question={question} rowSpan={rightRows.length} />
                <RightQuestionCell question={rightRows[0]} answers={answers} />
            </tr>
            {rightRows.slice(1).map((rowQuestion) => (
                <tr key={rowQuestion.id}>
                    <RightQuestionCell
                        question={rowQuestion}
                        answers={answers}
                    />
                </tr>
            ))}
        </>
    );
}

function flattenRightRows(
    children: SroiQuestionView[],
    questionsByParent: Map<number | null, SroiQuestionView[]>,
): SroiQuestionView[] {
    return children.flatMap((child) => [
        child,
        ...flattenRightRows(
            questionsByParent.get(child.id) ?? [],
            questionsByParent,
        ),
    ]);
}

function QuestionCell({
    question,
    rowSpan,
}: {
    question: SroiQuestionView;
    rowSpan?: number;
}): ReactNode {
    return (
        <td
            rowSpan={rowSpan}
            className="w-[32%] border border-slate-500 px-3 py-3 align-middle text-[15px] leading-8 text-slate-900"
        >
            <QuestionText question={question} />
        </td>
    );
}

function RightQuestionCell({
    question,
    answers,
}: {
    question: SroiQuestionView;
    answers: SroiAnswerMap;
}): ReactNode {
    return (
        <td className="border border-slate-500 px-3 py-3 align-top text-[15px] leading-8 text-slate-900">
            <QuestionText
                question={question}
                strong={question.isGroup || question.answerType === null}
            />
            <AnswerContent question={question} answers={answers} />
        </td>
    );
}

function QuestionText({
    question,
    strong = false,
}: {
    question: SroiQuestionView;
    strong?: boolean;
}): ReactNode {
    return (
        <div className={strong ? 'font-bold text-slate-900' : 'text-slate-900'}>
            {question.questionText}
            {question.helpText && (
                <p className="mt-1 text-sm font-normal leading-6 text-slate-600">
                    {question.helpText}
                </p>
            )}
        </div>
    );
}

function AnswerContent({
    question,
    answers,
}: {
    question: SroiQuestionView;
    answers: SroiAnswerMap;
}): ReactNode {
    if (question.isGroup || question.answerType === null) {
        return null;
    }

    if (Object.prototype.hasOwnProperty.call(answers, question.id)) {
        return (
            <p className="mt-2 font-semibold text-slate-950">
                {answers[question.id] ?? '-'}
            </p>
        );
    }

    return question.answerType === 'number' ? null : (
        <BlankTextLines lines={2} />
    );
}

function BlankTextLines({ lines }: { lines: number }): ReactNode {
    return (
        <div className="mt-2 space-y-2">
            {Array.from({ length: lines }).map((_, index) => (
                <p key={index}>-</p>
            ))}
        </div>
    );
}
