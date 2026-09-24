<?php

namespace App\Services;

use App\Models\Project;
use App\Models\ProjectEnumeratorAssignment;
use App\Models\Submission;
use App\Models\SubmissionTemplateAnswer;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class DashboardService
{
    /**
     * @return array{stats: array, projects: array, scoreDistribution: array, activities: array, dateLabels: array, trendData: array, projectList: array, selectedProjectId: int|null}
     */
    public function getCompanyDashboardData(int $companyId, ?int $selectedProjectId = null): array
    {
        return [
            'stats' => $this->getStats($companyId),
            'projects' => $this->getProjectPerformance($companyId),
            'scoreDistribution' => $this->getScoreDistributionSeparate($companyId),
            'activities' => $this->getRecentActivities($companyId),
            'dateLabels' => $this->getDateLabels(),
            'trendData' => $this->getTrendData($companyId, $selectedProjectId),
            'projectList' => $this->getProjectList($companyId),
            'selectedProjectId' => $selectedProjectId,
        ];
    }

    /**
     * @return array{totalProjects: int, activeProjects: int, enumerators: int, monthlyResponses: int, trends: array}
     */
    protected function getStats(int $companyId): array
    {
        $now = Carbon::now();

        $totalProjects = Project::where('company_id', $companyId)->count();
        $activeProjects = Project::where('company_id', $companyId)->active()->count();

        $enumerators = ProjectEnumeratorAssignment::where('company_id', $companyId)
            ->distinct('enumerator_id')
            ->count('enumerator_id');

        $monthlyResponses = Submission::where('company_id', $companyId)
            ->whereMonth('submitted_at', $now->month)
            ->whereYear('submitted_at', $now->year)
            ->count();

        // Trends: compare with previous month
        $lastMonth = $now->copy()->subMonth();

        $lastMonthProjects = Project::where('company_id', $companyId)
            ->where('created_at', '<', $now->startOfMonth())
            ->count();
        $newProjectsThisMonth = $totalProjects - $lastMonthProjects;

        $operationalRate = $totalProjects > 0
            ? round(($activeProjects / $totalProjects) * 100, 1)
            : 0;

        $lastMonthResponses = Submission::where('company_id', $companyId)
            ->whereMonth('submitted_at', $lastMonth->month)
            ->whereYear('submitted_at', $lastMonth->year)
            ->count();

        $responseGrowth = $lastMonthResponses > 0
            ? round((($monthlyResponses - $lastMonthResponses) / $lastMonthResponses) * 100, 0)
            : ($monthlyResponses > 0 ? 100 : 0);

        $lastYearEnumerators = ProjectEnumeratorAssignment::where('company_id', $companyId)
            ->where('created_at', '<', $now->copy()->subYear())
            ->distinct('enumerator_id')
            ->count('enumerator_id');
        $enumeratorGrowth = $lastYearEnumerators > 0
            ? round((($enumerators - $lastYearEnumerators) / $lastYearEnumerators) * 100, 0)
            : ($enumerators > 0 ? 100 : 0);

        return [
            'totalProjects' => $totalProjects,
            'activeProjects' => $activeProjects,
            'enumerators' => $enumerators,
            'monthlyResponses' => $monthlyResponses,
            'trends' => [
                'newProjectsThisMonth' => $newProjectsThisMonth,
                'operationalRate' => $operationalRate,
                'enumeratorGrowth' => $enumeratorGrowth,
                'responseGrowth' => $responseGrowth,
            ],
        ];
    }

    /**
     * @return array<int, array{name: string, ikmKepentingan: float, ikmKinerja: float, sloi: float}>
     */
    protected function getProjectPerformance(int $companyId): array
    {
        $projects = Project::where('company_id', $companyId)
            ->active()
            ->with('submissions.templateAnswers')
            ->latest()
            ->limit(3)
            ->get();

        return $projects->map(function (Project $project) {
            $allAnswers = $project->submissions->flatMap->templateAnswers;

            $ikmKepentinganAvg = $allAnswers->where('type', 'ikm-kepentingan')->avg('value') ?? 0;
            $ikmKinerjaAvg = $allAnswers->where('type', 'ikm-kinerja')->avg('value') ?? 0;
            $sloiAvg = $allAnswers->where('type', 'sloi')->avg('value') ?? 0;

            return [
                'name' => $project->name,
                'ikmKepentingan' => round($ikmKepentinganAvg, 2),
                'ikmKinerja' => round($ikmKinerjaAvg, 2),
                'sloi' => round($sloiAvg, 2),
            ];
        })->values()->toArray();
    }

    /**
     * @return array{ikm: array, sloi: array}
     */
    protected function getScoreDistributionSeparate(int $companyId): array
    {
        $projectIds = Project::where('company_id', $companyId)->pluck('id');

        return [
            'ikm' => $this->getScoreDistributionByType($projectIds, 'IKM'),
            'sloi' => $this->getScoreDistributionByType($projectIds, 'SLOI'),
        ];
    }

    /**
     * @return array{percentage: int, percentageLabel: string, scores: array, totalSubmissions: int}
     */
    protected function getScoreDistributionByType($projectIds, string $type): array
    {
        $submissions = Submission::whereIn('project_id', $projectIds)
            ->where('assessment_type', $type)
            ->get();

        if ($submissions->isEmpty()) {
            return $this->emptyScoreDistributionByType($type);
        }

        $submissionIds = $submissions->pluck('id');

        // avg score per submission
        $submissionScores = SubmissionTemplateAnswer::whereIn('submission_id', $submissionIds)
            ->select('submission_id', DB::raw('AVG(value) as avg_score'))
            ->groupBy('submission_id')
            ->get();

        $total = $submissionScores->count();

        if ($total === 0) {
            return $this->emptyScoreDistributionByType($type);
        }

        if ($type === 'IKM') {
            // IKM uses 1-4 scale
            $sangatBaik = $submissionScores->where('avg_score', '>=', 3.5)->count();
            $baik = $submissionScores->whereBetween('avg_score', [2.5, 3.4999])->count();
            $cukup = $submissionScores->whereBetween('avg_score', [1.5, 2.4999])->count();
            $kurang = $submissionScores->where('avg_score', '<', 1.5)->count();

            $positivePercentage = round((($sangatBaik + $baik) / $total) * 100);

            return [
                'percentage' => $positivePercentage,
                'percentageLabel' => 'Positif',
                'totalSubmissions' => $submissions->count(),
                'scores' => [
                    ['label' => 'Sangat Baik (≥3.5)', 'value' => round(($sangatBaik / $total) * 100).'%'],
                    ['label' => 'Baik (2.5-3.49)', 'value' => round(($baik / $total) * 100).'%'],
                    ['label' => 'Cukup (1.5-2.49)', 'value' => round(($cukup / $total) * 100).'%'],
                    ['label' => 'Kurang (<1.5)', 'value' => round(($kurang / $total) * 100).'%'],
                ],
            ];
        } else {
            // SLOI uses 1-6 scale
            $sangatBaik = $submissionScores->where('avg_score', '>=', 5)->count();
            $baik = $submissionScores->whereBetween('avg_score', [4, 4.9999])->count();
            $cukup = $submissionScores->whereBetween('avg_score', [3, 3.9999])->count();
            $kurangBaik = $submissionScores->whereBetween('avg_score', [2, 2.9999])->count();
            $kurang = $submissionScores->whereBetween('avg_score', [1, 1.9999])->count();
            $sangatKurang = $submissionScores->where('avg_score', '<', 1)->count();

            $positivePercentage = round((($sangatBaik + $baik) / $total) * 100);

            return [
                'percentage' => $positivePercentage,
                'percentageLabel' => 'Positif',
                'totalSubmissions' => $submissions->count(),
                'scores' => [
                    ['label' => 'Sangat Baik (≥5)', 'value' => round(($sangatBaik / $total) * 100).'%'],
                    ['label' => 'Baik (4-4.99)', 'value' => round(($baik / $total) * 100).'%'],
                    ['label' => 'Cukup (3-3.99)', 'value' => round(($cukup / $total) * 100).'%'],
                    ['label' => 'Kurang Puas (2-2.99)', 'value' => round(($kurangBaik / $total) * 100).'%'],
                    ['label' => 'Kurang (1-1.99)', 'value' => round(($kurang / $total) * 100).'%'],
                    ['label' => 'Sangat Kurang (<1)', 'value' => round(($sangatKurang / $total) * 100).'%'],
                ],
            ];
        }
    }

    /**
     * @return array{percentage: int, percentageLabel: string, scores: array}
     */
    protected function getScoreDistribution(int $companyId): array
    {
        $projectIds = Project::where('company_id', $companyId)->pluck('id');

        $submissionIds = Submission::whereIn('project_id', $projectIds)->pluck('id');

        if ($submissionIds->isEmpty()) {
            return $this->emptyScoreDistribution();
        }

        // avg score per submission
        $submissionScores = SubmissionTemplateAnswer::whereIn('submission_id', $submissionIds)
            ->select('submission_id', DB::raw('AVG(value) as avg_score'))
            ->groupBy('submission_id')
            ->get();

        $total = $submissionScores->count();

        if ($total === 0) {
            return $this->emptyScoreDistribution();
        }

        $sangatBaik = $submissionScores->where('avg_score', '>=', 3.5)->count();
        $baik = $submissionScores->whereBetween('avg_score', [2.5, 3.4999])->count();
        $cukup = $submissionScores->whereBetween('avg_score', [1.5, 2.4999])->count();
        $kurang = $submissionScores->where('avg_score', '<', 1.5)->count();

        $positivePercentage = round((($sangatBaik + $baik) / $total) * 100);

        return [
            'percentage' => $positivePercentage,
            'percentageLabel' => 'Positif',
            'scores' => [
                ['label' => 'Sangat Baik', 'value' => round(($sangatBaik / $total) * 100).'%'],
                ['label' => 'Baik', 'value' => round(($baik / $total) * 100).'%'],
                ['label' => 'Cukup', 'value' => round(($cukup / $total) * 100).'%'],
                ['label' => 'Kurang', 'value' => round(($kurang / $total) * 100).'%'],
            ],
        ];
    }

    /**
     * @return array{percentage: int, percentageLabel: string, scores: array, totalSubmissions: int}
     */
    protected function emptyScoreDistributionByType(string $type): array
    {
        if ($type === 'IKM') {
            return [
                'percentage' => 0,
                'percentageLabel' => 'Positif',
                'totalSubmissions' => 0,
                'scores' => [
                    ['label' => 'Sangat Baik (≥3.5)', 'value' => '0%'],
                    ['label' => 'Baik (2.5-3.49)', 'value' => '0%'],
                    ['label' => 'Cukup (1.5-2.49)', 'value' => '0%'],
                    ['label' => 'Kurang (<1.5)', 'value' => '0%'],
                ],
            ];
        } else {
            return [
                'percentage' => 0,
                'percentageLabel' => 'Positif',
                'totalSubmissions' => 0,
                'scores' => [
                    ['label' => 'Sangat Baik (≥5)', 'value' => '0%'],
                    ['label' => 'Baik (4-4.99)', 'value' => '0%'],
                    ['label' => 'Cukup (3-3.99)', 'value' => '0%'],
                    ['label' => 'Kurang Puas (2-2.99)', 'value' => '0%'],
                    ['label' => 'Kurang (1-1.99)', 'value' => '0%'],
                    ['label' => 'Sangat Kurang (<1)', 'value' => '0%'],
                ],
            ];
        }
    }

    /**
     * @return array{percentage: int, percentageLabel: string, scores: array}
     */
    protected function emptyScoreDistribution(): array
    {
        return [
            'percentage' => 0,
            'percentageLabel' => 'Positif',
            'scores' => [
                ['label' => 'Sangat Baik', 'value' => '0%'],
                ['label' => 'Baik', 'value' => '0%'],
                ['label' => 'Cukup', 'value' => '0%'],
                ['label' => 'Kurang', 'value' => '0%'],
            ],
        ];
    }

    /**
     * @return array<int, array{icon: string, iconBgColor: string, iconColor: string, title: string, description: string, time: string}>
     */
    protected function getRecentActivities(int $companyId): array
    {
        $submissions = Submission::where('company_id', $companyId)
            ->with(['project', 'enumerator', 'respondent'])
            ->orderByDesc('submitted_at')
            ->limit(3)
            ->get();

        return $submissions->map(function (Submission $submission) {
            $icon = match ($submission->assessment_type) {
                'IKM' => 'sentiment_satisfied',
                'SLOI' => 'handshake',
                default => 'description',
            };

            $iconBgColor = match ($submission->assessment_type) {
                'IKM' => 'bg-blue-500/10',
                'SLOI' => 'bg-amber-500/10',
                default => 'bg-slate-500/10',
            };

            $iconColor = match ($submission->assessment_type) {
                'IKM' => 'text-blue-500',
                'SLOI' => 'text-amber-500',
                default => 'text-slate-500',
            };

            $respondentName = $submission->respondent?->name ?? 'Responden';
            $projectName = $submission->project?->name ?? 'Proyek';
            $enumeratorName = $submission->enumerator?->name ?? 'Enumerator';

            return [
                'icon' => $icon,
                'iconBgColor' => $iconBgColor,
                'iconColor' => $iconColor,
                'title' => "Survei {$submission->assessment_type} dikirim",
                'description' => "{$projectName}: {$respondentName} oleh {$enumeratorName}",
                'time' => $submission->submitted_at
                    ? $submission->submitted_at->diffForHumans()
                    : '-',
            ];
        })->values()->toArray();
    }

    /**
     * @return array<int, string>
     */
    protected function getDateLabels(): array
    {
        $labels = [];
        $now = Carbon::now();

        for ($i = 5; $i >= 0; $i--) {
            $date = $now->copy()->subDays($i * 6);
            $labels[] = $date->translatedFormat('d M');
        }

        return $labels;
    }

    /**
     * Get trend data for approved submissions per project
     *
     * @return array<int, array{date: string, count: int}>
     */
    protected function getTrendData(int $companyId, ?int $projectId = null): array
    {
        $now = Carbon::now();
        $data = [];

        // Get submissions for last 30 days (6 points, each 5 days)
        for ($i = 5; $i >= 0; $i--) {
            $endDate = $now->copy()->subDays($i * 5);
            $startDate = $endDate->copy()->subDays(4);

            $query = Submission::where('company_id', $companyId)
                ->where('status', 'approved') // Only approved submissions
                ->whereBetween('submitted_at', [$startDate->startOfDay(), $endDate->endOfDay()]);

            // Filter by project if selected
            if ($projectId) {
                $query->where('project_id', $projectId);
            }

            $count = $query->count();

            $data[] = [
                'date' => $endDate->translatedFormat('d M'),
                'count' => $count,
            ];
        }

        return $data;
    }

    /**
     * Get list of projects for filter dropdown
     *
     * @return array<int, array{id: int, name: string}>
     */
    protected function getProjectList(int $companyId): array
    {
        return Project::where('company_id', $companyId)
            ->select('id', 'name')
            ->orderBy('name')
            ->get()
            ->map(fn ($project) => [
                'id' => $project->id,
                'name' => $project->name,
            ])
            ->toArray();
    }

    // ==========================================
    // ADMIN DASHBOARD
    // ==========================================

    public function getAdminDashboardData(): array
    {
        return [
            'stats' => $this->getAdminStats(),
            'recentCompanies' => $this->getRecentCompanies(),
            'recentProjects' => $this->getRecentProjects(),
            'submissionTrends' => $this->getSubmissionTrends(),
            'projectsByStatus' => $this->getProjectsByStatus(),
            'submissionsByType' => $this->getSubmissionsByType(),
            'recentActivities' => $this->getAdminRecentActivities(),
            'topProvinces' => $this->getTopProvinces(),
        ];
    }

    protected function getAdminStats(): array
    {
        $now = Carbon::now();
        $lastMonth = $now->copy()->subMonth();

        $totalCompanies = \App\Models\Company::count();
        $activeCompanies = \App\Models\Company::where('status', 'active')->count();

        $totalUsers = \App\Models\User::count();
        $totalEnumerators = \App\Models\User::where('role', 'enumerator')->count();

        $totalProjects = Project::count();
        $activeProjects = Project::active()->count();

        $totalSubmissions = Submission::count();
        $totalRespondents = \App\Models\Respondent::count();

        $pendingSubmissions = Submission::where('status', 'submitted')->count();
        $approvedSubmissions = Submission::where('status', 'approved')->count();
        $rejectedSubmissions = Submission::where('status', 'rejected')->count();

        // Growth calculations (compare with last month)
        $companiesLastMonth = \App\Models\Company::where('created_at', '<', $now->startOfMonth())->count();
        $companiesGrowth = $companiesLastMonth > 0
            ? round((($totalCompanies - $companiesLastMonth) / $companiesLastMonth) * 100)
            : ($totalCompanies > 0 ? 100 : 0);

        $usersLastMonth = \App\Models\User::where('created_at', '<', $now->copy()->startOfMonth())->count();
        $usersGrowth = $usersLastMonth > 0
            ? round((($totalUsers - $usersLastMonth) / $usersLastMonth) * 100)
            : ($totalUsers > 0 ? 100 : 0);

        $projectsLastMonth = Project::where('created_at', '<', $now->copy()->startOfMonth())->count();
        $projectsGrowth = $projectsLastMonth > 0
            ? round((($totalProjects - $projectsLastMonth) / $projectsLastMonth) * 100)
            : ($totalProjects > 0 ? 100 : 0);

        $submissionsThisMonth = Submission::whereMonth('submitted_at', $now->month)
            ->whereYear('submitted_at', $now->year)
            ->count();
        $submissionsLastMonth = Submission::whereMonth('submitted_at', $lastMonth->month)
            ->whereYear('submitted_at', $lastMonth->year)
            ->count();
        $submissionsGrowth = $submissionsLastMonth > 0
            ? round((($submissionsThisMonth - $submissionsLastMonth) / $submissionsLastMonth) * 100)
            : ($submissionsThisMonth > 0 ? 100 : 0);

        return [
            'totalCompanies' => $totalCompanies,
            'activeCompanies' => $activeCompanies,
            'totalUsers' => $totalUsers,
            'totalEnumerators' => $totalEnumerators,
            'totalProjects' => $totalProjects,
            'activeProjects' => $activeProjects,
            'totalSubmissions' => $totalSubmissions,
            'totalRespondents' => $totalRespondents,
            'pendingSubmissions' => $pendingSubmissions,
            'approvedSubmissions' => $approvedSubmissions,
            'rejectedSubmissions' => $rejectedSubmissions,
            'trends' => [
                'companiesGrowth' => $companiesGrowth,
                'usersGrowth' => $usersGrowth,
                'projectsGrowth' => $projectsGrowth,
                'submissionsGrowth' => $submissionsGrowth,
            ],
        ];
    }

    protected function getRecentCompanies(): array
    {
        return \App\Models\Company::select('id', 'name', 'status')
            ->withCount(['projects', 'users'])
            ->orderByDesc('created_at')
            ->limit(4)
            ->get()
            ->map(fn ($c) => [
                'id' => $c->id,
                'name' => $c->name,
                'status' => $c->status ?? 'active',
                'projects_count' => $c->projects_count,
                'users_count' => $c->users_count,
            ])
            ->toArray();
    }

    protected function getRecentProjects(): array
    {
        return Project::with('company:id,name')
            ->withCount('submissions')
            ->orderByDesc('created_at')
            ->limit(3)
            ->get()
            ->map(fn (Project $p) => [
                'id' => $p->id,
                'name' => $p->name,
                'project_code' => $p->project_code,
                'status' => $p->status,
                'company' => ['name' => $p->company?->name ?? '-'],
                'submissions_count' => $p->submissions_count,
                'target_ikm_count' => $p->target_ikm_count ?? 0,
                'target_sloi_count' => $p->target_sloi_count ?? 0,
            ])
            ->toArray();
    }

    protected function getSubmissionTrends(): array
    {
        $now = Carbon::now();
        $data = [];

        for ($i = 6; $i >= 0; $i--) {
            $date = $now->copy()->subDays($i * 5);
            $start = $date->copy()->startOfDay();
            $end = $date->copy()->endOfDay();

            $ikm = Submission::where('assessment_type', 'IKM')
                ->whereBetween('submitted_at', [$start, $end])->count();
            $sloi = Submission::where('assessment_type', 'SLOI')
                ->whereBetween('submitted_at', [$start, $end])->count();

            $data[] = [
                'date' => $date->translatedFormat('d M'),
                'ikm' => $ikm,
                'sloi' => $sloi,
            ];
        }

        return $data;
    }

    protected function getProjectsByStatus(): array
    {
        return Project::select('status', DB::raw('COUNT(*) as count'))
            ->whereNull('deleted_at')
            ->groupBy('status')
            ->get()
            ->map(fn ($row) => [
                'status' => ucfirst($row->status),
                'count' => $row->count,
            ])
            ->toArray();
    }

    protected function getSubmissionsByType(): array
    {
        return Submission::select('assessment_type as type', DB::raw('COUNT(*) as count'))
            ->whereNull('deleted_at')
            ->groupBy('assessment_type')
            ->get()
            ->map(fn ($row) => [
                'type' => $row->type,
                'count' => $row->count,
            ])
            ->toArray();
    }

    protected function getAdminRecentActivities(): array
    {
        $activities = [];
        $counter = 1;

        // Submissions terbaru
        $submissions = Submission::with(['project', 'enumerator', 'respondent'])
            ->orderByDesc('submitted_at')
            ->limit(3)
            ->get();

        foreach ($submissions as $s) {
            $statusLabel = match ($s->status) {
                'approved' => 'disetujui',
                'rejected' => 'ditolak',
                'submitted' => 'dikirim',
                default => $s->status,
            };

            $activities[] = [
                'id' => $counter++,
                'type' => 'submission',
                'action' => "Submission {$s->assessment_type} {$statusLabel}",
                'description' => ($s->project?->name ?? 'Proyek').': '.($s->respondent?->name ?? 'Responden').' oleh '.($s->enumerator?->name ?? 'Enumerator'),
                'time' => $s->submitted_at ? $s->submitted_at->diffForHumans() : '-',
            ];
        }

        // Proyek terbaru
        $projects = Project::with('company:id,name')
            ->orderByDesc('created_at')
            ->limit(2)
            ->get();

        foreach ($projects as $p) {
            $activities[] = [
                'id' => $counter++,
                'type' => 'project',
                'action' => 'Proyek '.($p->status === 'active' ? 'aktif' : 'dibuat'),
                'description' => $p->name.' - '.($p->company?->name ?? '-'),
                'time' => $p->created_at ? $p->created_at->diffForHumans() : '-',
            ];
        }

        // Sort by time (most recent first) — activities are already sorted above
        return array_slice($activities, 0, 5);
    }

    protected function getTopProvinces(): array
    {
        return DB::table('submissions as s')
            ->join('project_locations as pl', 'pl.project_id', '=', 's.project_id')
            ->join('districts as d', 'pl.district_id', '=', 'd.id')
            ->join('cities as c', 'd.city_id', '=', 'c.id')
            ->join('provinces as prov', 'c.province_id', '=', 'prov.id')
            ->whereNull('s.deleted_at')
            ->whereNull('pl.deleted_at')
            ->select('prov.name', DB::raw('COUNT(DISTINCT s.id) as count'))
            ->groupBy('prov.name')
            ->orderByDesc('count')
            ->limit(5)
            ->get()
            ->map(fn ($row) => [
                'name' => $row->name,
                'count' => (int) $row->count,
            ])
            ->toArray();
    }
}
