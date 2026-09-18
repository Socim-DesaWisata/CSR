import { ReactNode } from 'react';

import {
    IKMAgeRangeChart,
    IKMEducationChart,
    IKMGenderPieChart,
    IKMHeader,
    IKMQuestionTable,
    IKMScoreGauge,
    IKMTrendChart,
    ServingQuality,
} from './IKM';

// ─── Types ─────────────────────────────────────────────────

interface StatsData {
    totalResponses: number;
    targetResponses: number;
    progress: number;
    score: number;
    scoreLabel: string;
}

interface GenderItem {
    gender: string;
    count: number;
    percentage: number;
}

interface AgeRangeItem {
    range: string;
    count: number;
}

interface EducationItem {
    label: string;
    value: number;
    percentage: number;
}

interface DemographicsData {
    genderDistribution: GenderItem[];
    ageRange: AgeRangeItem[];
    educationLevel: EducationItem[];
}

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

interface AuditLogItem {
    id: string;
    respondentName: string;
    enumerator: string;
    date: string;
    score: number;
    status: string;
    group: string;
}

interface TrendDataItem {
    month: string;
    score: number;
    height: number;
}

interface IkmStatsData {
    scoreKepentingan: number;
    scoreKinerja: number;
    scoreLabelKepentingan: string;
    scoreLabelKinerja: string;
    totalResponses: number;
    targetResponses: number;
    progress: number;
}

interface ProjectIKMProps {
    projectName: string;
    stats: StatsData;
    ikmStats: IkmStatsData | null;
    demographics: DemographicsData;
    questionScores: QuestionScoreItem[];
    allQuestions?: AllQuestionItem[];
    auditLog: AuditLogItem[];
    trendData: TrendDataItem[];
}

export default function ProjectIKM({
    projectName,
    stats,
    ikmStats,
    demographics,
    questionScores,
    allQuestions = [],
}: ProjectIKMProps): ReactNode {
    // Transform gender data for GenderPieChart
    const genderData = (() => {
        const male = demographics.genderDistribution.find(
            (g) => g.gender === 'Laki-laki',
        );
        const female = demographics.genderDistribution.find(
            (g) => g.gender === 'Perempuan',
        );
        const total =
            demographics.genderDistribution.reduce(
                (sum, g) => sum + g.count,
                0,
            ) || 0;
        return {
            male: {
                count: male?.count ?? 0,
                percentage: male?.percentage ?? 0,
            },
            female: {
                count: female?.count ?? 0,
                percentage: female?.percentage ?? 0,
            },
            total,
        };
    })();

    // Use backend-computed averages when available (correct per-type averages).
    // Fallback to 0 if ikmStats not passed (e.g. non-IKM context).
    const avgKepentingan = ikmStats?.scoreKepentingan ?? 0;
    const avgKinerja = ikmStats?.scoreKinerja ?? 0;

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <IKMHeader
                totalResponses={stats.totalResponses}
                progress={stats.progress}
                targetResponses={stats.targetResponses}
            />

            {/* Main Score & Trend Row */}
            <div className="grid gap-6 lg:grid-cols-5">
                <IKMScoreGauge
                    avgKepentingan={avgKepentingan}
                    avgKinerja={avgKinerja}
                />
                <IKMTrendChart
                    questionScores={questionScores}
                    allQuestions={allQuestions}
                    avgKepentingan={avgKepentingan}
                    avgKinerja={avgKinerja}
                />
            </div>

            {/* Demographics Row */}
            <div className="grid gap-6 lg:grid-cols-2">
                <IKMGenderPieChart data={genderData} />

                <div className="space-y-6">
                    <IKMEducationChart data={demographics.educationLevel} />
                    <IKMAgeRangeChart ageRange={demographics.ageRange} />
                </div>
            </div>

            <ServingQuality questionScores={questionScores} />

            <IKMQuestionTable
                questionScores={questionScores}
                allQuestions={allQuestions}
                projectName={projectName}
            />

            {/* Audit Log */}
            {/* <IKMAuditLog
                auditLog={auditLog}
                totalResponses={stats.totalResponses}
            /> */}
        </div>
    );
}
