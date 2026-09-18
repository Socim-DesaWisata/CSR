import { Info } from 'lucide-react';
import { ReactNode, useMemo } from 'react';

interface QuestionScoreItem {
    id: string;
    question: string;
    score: number;
    importance: number;
    performance: number;
}

interface AllQuestionItem {
    id: string;
    code: string;
    category: string;
    aspect: string;
    question: string;
    order_no: number;
}

interface IKMQuestionTableProps {
    questionScores: QuestionScoreItem[];
    allQuestions?: AllQuestionItem[];
    projectName: string;
}

function formatScore(value: number): string {
    return value.toFixed(2);
}

function replaceProjectPlaceholder(
    question: string,
    projectName: string,
): string {
    return question.replaceAll('{project}', `<strong>${projectName}</strong>`);
}

function getCategoryLabel(category: string): string {
    return category === 'ikm-kinerja' ? 'Kinerja' : 'Kepentingan';
}

export default function IKMQuestionTable({
    questionScores,
    allQuestions = [],
    projectName,
}: IKMQuestionTableProps): ReactNode {
    const rows = useMemo(() => {
        const scoreMap = new Map(
            questionScores.map((score) => [score.id, score]),
        );
        const ikmQuestions = allQuestions
            .filter((question) =>
                ['ikm-kepentingan', 'ikm-kinerja'].includes(question.category),
            )
            .sort((a, b) => a.order_no - b.order_no);

        if (ikmQuestions.length > 0) {
            return ikmQuestions.map((question, index) => {
                const score = scoreMap.get(question.code);
                const average =
                    question.category === 'ikm-kinerja'
                        ? score?.performance
                        : score?.importance;

                return {
                    id: `${question.category}-${question.code}`,
                    no: index + 1,
                    aspect: question.aspect ?? '-',
                    category: getCategoryLabel(question.category),
                    question: replaceProjectPlaceholder(
                        question.question,
                        projectName,
                    ),
                    average: average ?? 0,
                    averageColor:
                        question.category === 'ikm-kinerja'
                            ? 'emerald'
                            : 'blue',
                };
            });
        }

        return questionScores.flatMap((score, index) => [
            {
                id: `ikm-kepentingan-${score.id}`,
                no: index + 1,
                aspect: '-',
                category: 'Kepentingan',
                question: replaceProjectPlaceholder(
                    score.question ?? `Pertanyaan ${score.id}`,
                    projectName,
                ),
                average: score.importance,
                averageColor: 'blue',
            },
            {
                id: `ikm-kinerja-${score.id}`,
                no: index + 1 + questionScores.length,
                aspect: '-',
                category: 'Kinerja',
                question: replaceProjectPlaceholder(
                    score.question ?? `Pertanyaan ${score.id}`,
                    projectName,
                ),
                average: score.performance,
                averageColor: 'emerald',
            },
        ]);
    }, [allQuestions, projectName, questionScores]);

    if (rows.length === 0) {
        return (
            <div className="rounded-xl border border-slate-100 bg-white p-8 shadow-sm">
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-slate-50">
                        <Info className="size-7 text-slate-300" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900">
                        Tabel Pertanyaan IKM
                    </h3>
                    <p className="mt-2 max-w-sm text-sm text-slate-400">
                        Belum tersedia. Data pertanyaan akan ditampilkan setelah
                        survei IKM memiliki jawaban.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-slate-100 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-4">
                <h3 className="text-base font-bold text-slate-900">
                    Tabel Pertanyaan IKM
                </h3>
                <p className="mt-0.5 text-xs text-slate-400">
                    Daftar 17 pertanyaan Kepentingan dan 17 pertanyaan Kinerja
                    beserta rerata setiap pertanyaan.
                </p>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/50">
                            <th className="whitespace-nowrap px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                No
                            </th>
                            <th className="min-w-[12rem] px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                Aspect
                            </th>
                            <th className="whitespace-nowrap px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                Jenis
                            </th>
                            <th className="min-w-[28rem] px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                Pertanyaan
                            </th>
                            <th className="whitespace-nowrap px-6 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                Rerata
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {rows.map((row, index) => (
                            <tr
                                key={row.id}
                                className={`transition-colors hover:bg-slate-50/50 ${
                                    index % 2 === 0 ? 'bg-white' : 'bg-slate-25'
                                }`}
                            >
                                <td className="whitespace-nowrap px-6 py-3.5">
                                    <span className="inline-flex size-7 items-center justify-center rounded-md bg-slate-100 font-mono text-xs font-bold text-slate-600">
                                        {row.no}
                                    </span>
                                </td>
                                <td className="px-4 py-3.5 text-xs font-semibold leading-relaxed text-slate-600">
                                    {row.aspect}
                                </td>
                                <td className="whitespace-nowrap px-4 py-3.5">
                                    <span
                                        className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                                            row.averageColor === 'emerald'
                                                ? 'bg-emerald-50 text-emerald-700'
                                                : 'bg-blue-50 text-blue-700'
                                        }`}
                                    >
                                        {row.category}
                                    </span>
                                </td>
                                <td className="px-4 py-3.5 text-xs leading-relaxed text-slate-600">
                                    <div
                                        className="[&>strong]:font-bold [&>strong]:text-slate-900"
                                        dangerouslySetInnerHTML={{
                                            __html: row.question,
                                        }}
                                    />
                                </td>
                                <td className="whitespace-nowrap px-6 py-3.5 text-center">
                                    <span
                                        className={`inline-flex min-w-14 justify-center rounded-lg px-2.5 py-1 font-mono text-xs font-bold ${
                                            row.averageColor === 'emerald'
                                                ? 'bg-emerald-50 text-emerald-700'
                                                : 'bg-blue-50 text-blue-700'
                                        }`}
                                    >
                                        {formatScore(row.average)}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
