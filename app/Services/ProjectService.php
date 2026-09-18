<?php

namespace App\Services;

use App\Models\InstrumentTemplate;
use App\Models\Project;
use App\Models\ProjectDescriptiveQuestion;
use App\Models\ProjectEnumeratorAssignment;
use App\Models\ProjectLocation;
use App\Models\ProjectSroiForm;
use App\Models\ProjectStakeholder;
use App\Models\Respondent;
use App\Models\SroiTemplate;
use App\Models\StakeholderOutcome;
use App\Models\Submission;
use App\Models\TemplateQuestion;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ProjectService
{
    protected const ALLOWED_SORTS = ['name', 'project_code', 'status', 'created_at', 'start_date', 'end_date'];

    protected const LIST_RELATIONS = ['locations.district.city.province', 'submissions', 'company'];

    public function getAllProjectsByCompany(int $companyId, array $params = []): LengthAwarePaginator
    {
        $query = Project::query()->where('company_id', $companyId);

        return $this->buildProjectListQuery($query, $params);
    }

    public function getAllProjectsForAdmin(array $params = []): LengthAwarePaginator
    {
        $query = Project::query();

        // Filter by company
        if (! empty($params['company_id'])) {
            $query->where('company_id', $params['company_id']);
        }

        // Filter by province (via project_locations → districts → cities → provinces)
        if (! empty($params['province_id'])) {
            $query->whereHas('locations.district.city.province', function ($q) use ($params) {
                $q->where('id', $params['province_id']);
            });
        }

        return $this->buildProjectListQuery($query, $params);
    }

    public function getAdminProjectSummary(array $params = []): array
    {
        $query = Project::query();

        if (! empty($params['company_id'])) {
            $query->where('company_id', $params['company_id']);
        }

        if (! empty($params['province_id'])) {
            $query->whereHas('locations.district.city.province', function ($q) use ($params) {
                $q->where('id', $params['province_id']);
            });
        }

        $projects = $query->get();

        return [
            'totalProjects' => $projects->count(),
            'activeProjects' => $projects->where('status', 'active')->count(),
            'draftProjects' => $projects->where('status', 'draft')->count(),
            'closedProjects' => $projects->where('status', 'closed')->count(),
            'totalRespondents' => $projects->sum(fn ($p) => $p->submissions()->count()),
        ];
    }

    public function getProjectsByEnumerator(int $enumeratorId, array $params = []): LengthAwarePaginator
    {
        $assignedProjectIds = ProjectEnumeratorAssignment::where('enumerator_id', $enumeratorId)
            ->pluck('project_id');

        $query = Project::query()
            ->whereIn('id', $assignedProjectIds)
            ->where('status', '!=', 'draft');

        return $this->buildProjectListQuery($query, $params);
    }

    public function getSroiProjectsByEnumerator(int $enumeratorId, array $params = []): LengthAwarePaginator
    {
        $assignedProjectIds = ProjectEnumeratorAssignment::where('enumerator_id', $enumeratorId)
            ->pluck('project_id');

        $query = Project::query()
            ->whereIn('id', $assignedProjectIds)
            ->where('status', '!=', 'draft')
            ->where('enable_sroi', true);

        return $this->buildProjectListQuery($query, $params);
    }

    public function getProjectSummary(int $companyId): array
    {
        $projects = Project::where('company_id', $companyId)->get();

        return [
            'totalProjects' => $projects->count(),
            'activeProjects' => $projects->where('status', 'active')->count(),
            'draftProjects' => $projects->where('status', 'draft')->count(),
            'closedProjects' => $projects->where('status', 'closed')->count(),
            'totalRespondents' => $projects->sum(fn ($p) => $p->submissions()->count()),
        ];
    }

    public function getEnumeratorsByCompany(int $companyId): array
    {
        return User::where('company_id', $companyId)
            ->where('role', 'enumerator')
            ->where('is_active', true)
            ->select('id', 'name', 'email', 'phone')
            ->orderBy('name')
            ->get()
            ->toArray();
    }

    public function getProjectEnumerators(int $projectId, int $companyId): array
    {
        return User::where('company_id', $companyId)
            ->where('role', 'enumerator')
            ->where('is_active', true)
            ->select('id', 'name', 'email', 'phone')
            ->orderBy('name')
            ->get()
            ->toArray();
    }

    public function assignEnumeratorsToProject(int $projectId, array $enumeratorIds, int $companyId): void
    {
        DB::transaction(function () use ($projectId, $enumeratorIds, $companyId) {
            ProjectEnumeratorAssignment::where('project_id', $projectId)
                ->where('company_id', $companyId)
                ->delete();

            if (! empty($enumeratorIds)) {
                $assignments = collect($enumeratorIds)->map(fn ($enumeratorId) => [
                    'company_id' => $companyId,
                    'project_id' => $projectId,
                    'enumerator_id' => $enumeratorId,
                    'created_at' => now(),
                ])->toArray();

                ProjectEnumeratorAssignment::insert($assignments);
            }
        });
    }

    public function createProject(array $data, int $companyId, ?int $userId = null): Project
    {
        return DB::transaction(function () use ($data, $companyId, $userId) {
            $project = $this->storeProject($data, $companyId, $userId);
            $this->storeProjectLocations($data['district_ids'] ?? [], $project->id, $companyId);
            $this->syncDescriptiveQuestions($project->id, $data['descriptive_questions'] ?? []);

            return $project->load('locations.district.city.province');
        });
    }

    public function updateProject(int $projectId, array $data, int $companyId): Project
    {
        return DB::transaction(function () use ($projectId, $data, $companyId) {
            $project = Project::where('id', $projectId)
                ->where('company_id', $companyId)
                ->firstOrFail();

            $templateIds = $this->resolveTemplateIds($data);

            $project->update([
                'name' => $data['name'],
                'description' => $data['description'] ?? null,
                'status' => $data['status'] ?? $project->status,
                'target_ikm_count' => $data['target_ikm_count'] ?? 0,
                'target_sloi_count' => $data['target_sloi_count'] ?? 0,
                'enable_ikm' => $data['enable_ikm'] ?? false,
                'enable_sloi' => $data['enable_sloi'] ?? false,
                'enable_sroi' => $data['enable_sroi'] ?? false,
                'ikm_template_id' => $templateIds['ikm'],
                'sloi_template_id' => $templateIds['sloi'],
                'start_date' => $data['start_date'] ?? null,
                'end_date' => $data['end_date'] ?? null,
            ]);

            // Sync locations if provided
            if (isset($data['district_ids'])) {
                DB::table('project_locations')
                    ->where('project_id', $projectId)
                    ->delete();

                if (! empty($data['district_ids'])) {
                    $uniqueDistrictIds = array_unique($data['district_ids']);
                    $this->storeProjectLocations($uniqueDistrictIds, $projectId, $companyId);
                }
            }

            // Sync descriptive questions
            $this->syncDescriptiveQuestions($projectId, $data['descriptive_questions'] ?? null);

            return $project->load('locations.district.city.province');
        });
    }

    public function patchProject(int $projectId, array $data, int $companyId): Project
    {
        return DB::transaction(function () use ($projectId, $data, $companyId) {
            $project = Project::where('id', $projectId)
                ->where('company_id', $companyId)
                ->firstOrFail();

            // Build update array only with provided fields
            $updateData = [];

            // Basic fields
            if (array_key_exists('name', $data)) {
                $updateData['name'] = $data['name'];
            }
            if (array_key_exists('description', $data)) {
                $updateData['description'] = $data['description'];
            }
            if (array_key_exists('status', $data)) {
                $updateData['status'] = $data['status'];
            }
            if (array_key_exists('target_ikm_count', $data)) {
                $updateData['target_ikm_count'] = $data['target_ikm_count'] ?? 0;
            }
            if (array_key_exists('target_sloi_count', $data)) {
                $updateData['target_sloi_count'] = $data['target_sloi_count'] ?? 0;
            }
            if (array_key_exists('enable_ikm', $data)) {
                $updateData['enable_ikm'] = $data['enable_ikm'];
            }
            if (array_key_exists('enable_sloi', $data)) {
                $updateData['enable_sloi'] = $data['enable_sloi'];
            }
            if (array_key_exists('enable_sroi', $data)) {
                $updateData['enable_sroi'] = $data['enable_sroi'];
            }
            if (array_key_exists('start_date', $data)) {
                $updateData['start_date'] = $data['start_date'];
            }
            if (array_key_exists('end_date', $data)) {
                $updateData['end_date'] = $data['end_date'];
            }

            // Handle template IDs
            if (array_key_exists('ikm_template_id', $data) || array_key_exists('sloi_template_id', $data)) {
                $templateIds = $this->resolveTemplateIds($data, $project);
                if (array_key_exists('ikm_template_id', $data)) {
                    $updateData['ikm_template_id'] = $templateIds['ikm'];
                }
                if (array_key_exists('sloi_template_id', $data)) {
                    $updateData['sloi_template_id'] = $templateIds['sloi'];
                }
            }

            // Update project if there are changes
            if (! empty($updateData)) {
                $project->update($updateData);
            }

            // Sync locations if provided
            if (array_key_exists('district_ids', $data)) {
                // Ensure unique district IDs
                $uniqueDistrictIds = array_unique(array_filter($data['district_ids']));

                // Get current district IDs
                $currentDistrictIds = DB::table('project_locations')
                    ->where('project_id', $projectId)
                    ->pluck('district_id')
                    ->toArray();

                // Find what to delete and what to add
                $toDelete = array_diff($currentDistrictIds, $uniqueDistrictIds);
                $toAdd = array_diff($uniqueDistrictIds, $currentDistrictIds);

                // Delete locations that are not in the new list
                if (! empty($toDelete)) {
                    DB::table('project_locations')
                        ->where('project_id', $projectId)
                        ->whereIn('district_id', $toDelete)
                        ->delete();
                }

                // Insert new locations
                if (! empty($toAdd)) {
                    $locations = collect($toAdd)->map(fn ($districtId) => [
                        'company_id' => $companyId,
                        'project_id' => $projectId,
                        'district_id' => $districtId,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ])->toArray();

                    DB::table('project_locations')->insert($locations);
                }
            }

            // Sync descriptive questions if provided
            if (array_key_exists('descriptive_questions', $data)) {
                $this->syncDescriptiveQuestions($projectId, $data['descriptive_questions']);
            }

            return $project->fresh()->load('locations.district.city.province');
        });
    }

    public function getProjectForEdit(int $projectId, int $companyId): array
    {
        $project = Project::where('id', $projectId)
            ->where('company_id', $companyId)
            ->with(['locations.district.city.province', 'descriptiveQuestions'])
            ->firstOrFail();

        $locations = $project->locations->map(function ($loc) {
            return [
                'id' => $loc->id,
                'province' => $loc->district->city->province,
                'city' => $loc->district->city,
                'district' => $loc->district,
            ];
        })->toArray();

        return [
            'id' => $project->id,
            'name' => $project->name,
            'description' => $project->description ?? '',
            'status' => $project->status ?? 'draft',
            'target_ikm_count' => $project->target_ikm_count,
            'target_sloi_count' => $project->target_sloi_count,
            'startDate' => $project->start_date?->format('Y-m-d') ?? '',
            'endDate' => $project->end_date?->format('Y-m-d') ?? '',
            'enable_ikm' => $project->enable_ikm,
            'enable_sloi' => $project->enable_sloi,
            'enable_sroi' => $project->enable_sroi,
            'ikm_template_id' => $project->ikm_template_id,
            'sloi_template_id' => $project->sloi_template_id,
            'locations' => $locations,
            'descriptive_questions' => $project->descriptiveQuestions
                ->map(fn ($q) => ['id' => $q->id, 'title' => $q->title])
                ->values()
                ->toArray(),
        ];
    }

    /**
     * Sync descriptive questions for a project.
     * Handles create, update, and delete.
     */
    protected function syncDescriptiveQuestions(int $projectId, ?array $questions): void
    {
        if ($questions === null) {
            return;
        }

        $incoming = collect($questions);
        $incomingIds = $incoming->pluck('id')->filter()->values();

        // Delete removed ones
        ProjectDescriptiveQuestion::where('project_id', $projectId)
            ->whereNotIn('id', $incomingIds)
            ->delete();

        foreach ($questions as $q) {
            if (! empty($q['id'])) {
                // Update existing
                ProjectDescriptiveQuestion::where('id', $q['id'])
                    ->where('project_id', $projectId)
                    ->update(['title' => $q['title']]);
            } else {
                // Create new
                ProjectDescriptiveQuestion::create([
                    'project_id' => $projectId,
                    'title' => $q['title'],
                ]);
            }
        }
    }

    // ─── PROJECT DETAIL ───────────────────────────────────────────

    public function getProjectDetail(int $projectId, string $detailType = 'overview', array $respondentParams = []): array
    {
        $project = Project::with([
            'company',
            'locations.district.city.province',
            'enumeratorAssignments.enumerator',
            'ikmTemplate',
            'sloiTemplate',
            'descriptiveQuestions',
            'stakeholders.outcomes',
        ])->findOrFail($projectId);

        $assessmentType = $this->resolveAssessmentType($detailType);

        // Base query: submissions for this project, optionally filtered by type
        $submissionsQuery = Submission::where('project_id', $projectId);
        if ($assessmentType) {
            $submissionsQuery->where('assessment_type', $assessmentType);
        }

        // For overview, IKM, and SLOI tabs: only show approved submissions
        if (in_array($detailType, ['overview', 'ikm', 'sloi'])) {
            $submissionsQuery->approved();
        }

        $submissions = $submissionsQuery->get();
        $submissionIds = $submissions->pluck('id');
        $respondentIds = $submissions->pluck('respondent_id')->filter()->unique();

        // Determine template_id for question scores
        $templateId = null;
        if ($assessmentType === 'IKM') {
            $templateId = $project->ikm_template_id;
        } elseif ($assessmentType === 'SLOI') {
            $templateId = $project->sloi_template_id;
        }

        // Compute per-type stats for overview metric cards AND for the IKM tab gauge
        $ikmStats = null;
        $sloiStats = null;
        if ($assessmentType === null) {
            // For overview: only show approved submissions
            $ikmSubmissions = Submission::where('project_id', $projectId)
                ->where('assessment_type', 'IKM')
                ->approved()
                ->get();
            $sloiSubmissions = Submission::where('project_id', $projectId)
                ->where('assessment_type', 'SLOI')
                ->approved()
                ->get();
            $ikmStats = $this->computeIkmStats($project, $ikmSubmissions);
            $sloiStats = $this->computeStats($project, $sloiSubmissions, 'SLOI');
        } elseif ($assessmentType === 'IKM') {
            // For IKM tab: compute per-type averages from already-filtered submissions
            $ikmStats = $this->computeIkmStats($project, $submissions);
        }

        // Compute SLOI reliability analysis only for SLOI tab
        $sloiReliability = null;
        $sloiAspectAnalysis = null;
        if ($assessmentType === 'SLOI') {
            $sloiReliability = $this->computeSloiReliabilityAnalysis($submissionIds, $templateId, $project->company->name);
            $sloiAspectAnalysis = $this->computeSloiAspectAnalysis($submissionIds, $templateId);
        }

        return [
            'project' => $this->formatProjectDetail($project),
            'stats' => $this->computeStats($project, $submissions, $assessmentType),
            'ikmStats' => $ikmStats,
            'sloiStats' => $sloiStats,
            'demographics' => $this->computeDemographics($respondentIds),
            'questionScores' => $this->computeQuestionScores($submissionIds, $templateId),
            'allQuestions' => $this->getAllQuestions($templateId, $project->name),
            'auditLog' => $this->computeAuditLog($projectId, $assessmentType, $detailType),
            'trendData' => $this->computeTrendData($projectId, $assessmentType, $detailType),
            'respondents' => $this->computeRespondents($projectId, $assessmentType, $templateId, $respondentParams),
            'enumeratorList' => $this->computeEnumeratorList($project),
            'sloiReliability' => $sloiReliability,
            'sloiAspectAnalysis' => $sloiAspectAnalysis,
            'sroiTemplates' => $this->getSroiTemplateOptions(),
            'projectSroiForms' => $this->getProjectSroiFormOptions($project),
            'projectSroiForm' => $this->getProjectSroiFormDetail($project),
        ];
    }

    protected function resolveAssessmentType(string $detailType): ?string
    {
        return match (strtolower($detailType)) {
            'ikm', 'ikm_respondent' => 'IKM',
            'sloi', 'sloi_respondent' => 'SLOI',
            'sroi', 'sroi_respondent' => 'SROI',
            default => null, // overview, enumerator = all types
        };
    }

    protected function getSroiTemplateOptions(): array
    {
        return SroiTemplate::query()
            ->active()
            ->withCount(['sections', 'questions'])
            ->orderBy('name')
            ->orderByDesc('version')
            ->get()
            ->map(fn (SroiTemplate $template) => [
                'id' => $template->id,
                'name' => $template->name,
                'version' => $template->version,
                'description' => $template->description,
                'sectionCount' => $template->sections_count,
                'questionCount' => $template->questions_count,
            ])
            ->values()
            ->toArray();
    }

    protected function getProjectSroiFormOptions(Project $project): array
    {
        return ProjectSroiForm::query()
            ->where('project_id', $project->id)
            ->with('sourceTemplate')
            ->orderByRaw("case status when 'active' then 0 when 'draft' then 1 else 2 end")
            ->orderByDesc('version')
            ->get()
            ->map(fn (ProjectSroiForm $form) => [
                'id' => $form->id,
                'name' => $form->name,
                'version' => $form->version,
                'status' => $form->status,
                'sourceTemplateName' => $form->sourceTemplate?->name,
            ])
            ->values()
            ->toArray();
    }

    protected function getProjectSroiFormDetail(Project $project): ?array
    {
        $form = ProjectSroiForm::query()
            ->where('project_id', $project->id)
            ->with([
                'sourceTemplate',
                'sections' => fn ($query) => $query->orderBy('order_no')->orderBy('id'),
                'sections.questions' => fn ($query) => $query->orderBy('order_no')->orderBy('id'),
            ])
            ->orderByRaw("case status when 'active' then 0 when 'draft' then 1 else 2 end")
            ->orderByDesc('version')
            ->first();

        if ($form === null) {
            return null;
        }

        return [
            'id' => $form->id,
            'name' => $form->name,
            'description' => $form->description,
            'version' => $form->version,
            'status' => $form->status,
            'sourceTemplateName' => $form->sourceTemplate?->name,
            'activatedAt' => $form->activated_at?->format('Y-m-d H:i'),
            'sections' => $form->sections->map(fn ($section) => [
                'id' => $section->id,
                'title' => $section->title,
                'description' => $section->description,
                'orderNo' => $section->order_no,
                'sourceTemplateSectionId' => $section->source_template_section_id,
                'questions' => $section->questions->map(fn ($question) => [
                    'id' => $question->id,
                    'sectionId' => $question->section_id,
                    'parentQuestionId' => $question->parent_question_id,
                    'sourceTemplateQuestionId' => $question->source_template_question_id,
                    'questionText' => $question->question_text,
                    'helpText' => $question->help_text,
                    'answerType' => $question->answer_type,
                    'unit' => $question->unit,
                    'isGroup' => $question->is_group,
                    'isActive' => $question->is_active,
                    'orderNo' => $question->order_no,
                ])->values()->toArray(),
            ])->values()->toArray(),
        ];
    }

    protected function formatProjectDetail(Project $project): array
    {
        $locations = $project->locations->map(function ($loc) {
            $district = $loc->district;
            $city = $district?->city;
            $province = $city?->province;

            return [
                'district' => $district?->name,
                'city' => $city?->name,
                'province' => $province?->name,
            ];
        });

        $enumerators = $project->enumeratorAssignments->map(function ($a) {
            return [
                'id' => $a->enumerator?->id,
                'name' => $a->enumerator?->name,
                'email' => $a->enumerator?->email,
            ];
        })->filter(fn ($e) => $e['id'] !== null)->values();

        return [
            'id' => $project->id,
            'name' => $project->name,
            'description' => $project->description,
            'projectCode' => $project->project_code,
            'status' => $project->status,
            'companyName' => $project->company?->name,
            'enableIkm' => $project->enable_ikm,
            'enableSloi' => $project->enable_sloi,
            'enableSroi' => $project->enable_sroi,
            'targetIkmCount' => $project->target_ikm_count,
            'targetSloiCount' => $project->target_sloi_count,
            'startDate' => $project->start_date?->format('Y-m-d'),
            'endDate' => $project->end_date?->format('Y-m-d'),
            'locations' => $locations,
            'enumerators' => $enumerators,
            'descriptiveQuestions' => $project->descriptiveQuestions->map(fn ($q) => [
                'id' => $q->id,
                'title' => $q->title,
            ])->toArray(),
            'stakeholders' => $project->stakeholders->map(fn (ProjectStakeholder $stakeholder) => [
                'id' => $stakeholder->id,
                'name' => $stakeholder->name,
                'outcomes' => $stakeholder->outcomes->map(fn (StakeholderOutcome $outcome) => [
                    'id' => $outcome->id,
                    'stakeholderId' => $outcome->stakeholder_id,
                    'outcome' => $outcome->outcome,
                ])->values()->toArray(),
            ])->values()->toArray(),
        ];
    }

    protected function computeStats(Project $project, $submissions, ?string $assessmentType): array
    {
        $totalResponses = $submissions->count();

        // Target depends on type
        $targetResponses = match ($assessmentType) {
            'IKM' => $project->target_ikm_count,
            'SLOI' => $project->target_sloi_count,
            default => $project->target_ikm_count + $project->target_sloi_count,
            //
        };

        $progress = $targetResponses > 0
            ? round(($totalResponses / $targetResponses) * 100, 1)
            : 0;

        // Average score from all answers in these submissions
        $avgScore = 0;
        $submissionIds = $submissions->pluck('id');
        if ($submissionIds->isNotEmpty()) {
            $avgScore = round(
                \App\Models\SubmissionTemplateAnswer::whereIn('submission_id', $submissionIds)
                    ->avg('value') ?? 0,
                2
            );
        }

        // Score label
        $scoreLabel = ($assessmentType === 'SLOI')
            ? $this->getSloiScoreLabel($avgScore)
            : $this->getScoreLabel($avgScore);

        return [
            'totalResponses' => $totalResponses,
            'targetResponses' => $targetResponses ?: 0,
            'progress' => $progress,
            'score' => $avgScore,
            'scoreLabel' => $scoreLabel,
        ];
    }

    protected function getScoreLabel(float $score): string
    {
        if ($score >= 5) {
            return 'Seumpurna';
        }

        if ($score >= 4.0) {
            return 'Sangat Baik';
        }
        if ($score >= 3.0) {
            return 'Baik';
        }
        if ($score >= 2.0) {
            return 'Cukup';
        }
        if ($score >= 1.0) {
            return 'Kurang';
        }

        return 'Belum Ada Data';
    }

    protected function getSloiScoreLabel(float $score): string
    {
        if ($score > 4.30) {
            return 'Full Trust';
        }
        if ($score > 3.93) {
            return 'High Approval';
        }
        if ($score > 3.56) {
            return 'Low Approval';
        }
        if ($score > 3.08) {
            return 'High Acceptance / Tolerance';
        }
        if ($score > 2.40) {
            return 'Low Acceptance / Tolerance';
        }
        if ($score > 0) {
            return 'Withheld / Withdrawn';
        }

        return 'Belum Ada Data';
    }

    protected function computeIkmStats(Project $project, $submissions): array
    {
        $totalResponses = $submissions->count();
        $targetResponses = $project->target_ikm_count;

        $progress = $targetResponses > 0
            ? round(($totalResponses / $targetResponses) * 100, 1)
            : 0;

        $submissionIds = $submissions->pluck('id');

        // Calculate average for kepentingan
        $avgScoreKepentingan = 0;
        if ($submissionIds->isNotEmpty()) {
            $avgScoreKepentingan = round(
                \App\Models\SubmissionTemplateAnswer::whereIn('submission_id', $submissionIds)
                    ->where('type', 'ikm-kepentingan')
                    ->avg('value') ?? 0,
                2
            );
        }

        // Calculate average for kinerja
        $avgScoreKinerja = 0;
        if ($submissionIds->isNotEmpty()) {
            $avgScoreKinerja = round(
                \App\Models\SubmissionTemplateAnswer::whereIn('submission_id', $submissionIds)
                    ->where('type', 'ikm-kinerja')
                    ->avg('value') ?? 0,
                2
            );
        }

        return [
            'totalResponses' => $totalResponses,
            'targetResponses' => $targetResponses ?: 0,
            'progress' => $progress,
            'scoreKepentingan' => $avgScoreKepentingan,
            'scoreKinerja' => $avgScoreKinerja,
            'scoreLabelKepentingan' => $this->getScoreLabel($avgScoreKepentingan),
            'scoreLabelKinerja' => $this->getScoreLabel($avgScoreKinerja),
        ];
    }

    protected function computeDemographics($respondentIds): array
    {
        if ($respondentIds->isEmpty()) {
            return [
                'genderDistribution' => [],
                'ageRange' => [],
                'educationLevel' => [],
            ];
        }

        $respondents = Respondent::whereIn('id', $respondentIds)->get();
        $total = $respondents->count();

        // Gender distribution — normalize raw DB values
        $genderMap = [
            'male' => 'Laki-laki',
            'female' => 'Perempuan',
            'laki-laki' => 'Laki-laki',
            'perempuan' => 'Perempuan',
        ];

        $normalizedGenders = $respondents->map(function ($r) use ($genderMap) {
            $raw = strtolower(trim($r->gender ?? ''));

            return $genderMap[$raw] ?? ($r->gender ?: 'Tidak Diketahui');
        });

        $genderCounts = $normalizedGenders->countBy();
        $genderDistribution = $genderCounts->map(function ($count, $gender) use ($total) {
            return [
                'gender' => $gender,
                'count' => $count,
                'percentage' => $total > 0 ? round(($count / $total) * 100, 1) : 0,
            ];
        })->values()->toArray();

        // Age range buckets
        $ageBuckets = [
            '17-25' => 0, '26-35' => 0, '36-45' => 0, '46-55' => 0, '56-65' => 0, '>65' => 0,
        ];
        foreach ($respondents as $r) {
            if ($r->age === null) {
                continue;
            }
            if ($r->age <= 25) {
                $ageBuckets['17-25']++;
            } elseif ($r->age <= 35) {
                $ageBuckets['26-35']++;
            } elseif ($r->age <= 45) {
                $ageBuckets['36-45']++;
            } elseif ($r->age <= 55) {
                $ageBuckets['46-55']++;
            } elseif ($r->age <= 65) {
                $ageBuckets['56-65']++;
            } else {
                $ageBuckets['>65']++;
            }
        }
        $ageRange = collect($ageBuckets)->map(function ($count, $range) {
            return [
                'range' => $range,
                'count' => $count,
            ];
        })->values()->toArray();

        $eduMap = [
            'sd' => 'SD',
            'smp' => 'SMP',
            'sma' => 'SMA',
            'smk' => 'SMA',
            'd1' => 'D1-D3',
            'd2' => 'D1-D3',
            'd3' => 'D1-D3',
            'd4' => 'D4/S1',
            's1' => 'D4/S1',
            's2' => 'S2',
            's3' => 'S3',
        ];

        $normalized = $respondents->map(function ($r) use ($eduMap) {
            $raw = strtolower(trim($r->education_level ?? ''));

            return $eduMap[$raw] ?? ($r->education_level ?: 'Tidak Diketahui');
        });

        $eduGroups = $normalized->countBy();
        $educationLevel = $eduGroups->map(function ($count, $label) use ($total) {
            return [
                'label' => $label,
                'value' => $count,
                'percentage' => $total > 0 ? round(($count / $total) * 100, 1) : 0,
            ];
        })->values()->toArray();

        return [
            'genderDistribution' => $genderDistribution,
            'ageRange' => $ageRange,
            'educationLevel' => $educationLevel,
        ];
    }

    protected function computeQuestionScores($submissionIds, ?int $templateId): array
    {
        if ($submissionIds->isEmpty() || ! $templateId) {
            return [];
        }

        // Get all questions for this template
        $questions = TemplateQuestion::where('template_id', $templateId)
            ->orderBy('order_no')
            ->get();

        // Split by category
        $importanceQuestions = $questions->where('category', 'ikm-kepentingan')->keyBy('code');
        $performanceQuestions = $questions->where('category', 'ikm-kinerja')->keyBy('code');

        // ── IKM Paired mode: kepentingan (Y) ↔ kinerja (X) by shared code ──
        if ($importanceQuestions->isNotEmpty() && $performanceQuestions->isNotEmpty()) {

            // Find codes that exist in BOTH categories
            $commonCodes = $importanceQuestions->keys()
                ->intersect($performanceQuestions->keys())
                ->values()
                ->toArray(); // plain array required by ->only()

            // dd($commonCodes);

            $importanceQuestionIds = $importanceQuestions->whereIn('code', $commonCodes)->pluck('id');
            $performanceQuestionIds = $performanceQuestions->whereIn('code', $commonCodes)->pluck('id');

            // dd($importanceQuestionIds, $performanceQuestionIds);

            // Avg per question_id — kepentingan → Y-axis (importance)
            $importanceAnswers = \App\Models\SubmissionTemplateAnswer::whereIn('submission_id', $submissionIds)
                ->whereIn('question_id', $importanceQuestionIds)
                ->groupBy('question_id')
                ->selectRaw('question_id, ROUND(AVG(value), 2) as avg_score')
                ->pluck('avg_score', 'question_id');

            // Avg per question_id — kinerja → X-axis (performance)
            $performanceAnswers = \App\Models\SubmissionTemplateAnswer::whereIn('submission_id', $submissionIds)
                ->whereIn('question_id', $performanceQuestionIds)
                ->groupBy('question_id')
                ->selectRaw('question_id, ROUND(AVG(value), 2) as avg_score')
                ->pluck('avg_score', 'question_id');

            // Build one data point per shared code
            $result = [];
            foreach ($commonCodes as $code) {
                $kepQ = $importanceQuestions[$code];   // kepentingan question
                $kinQ = $performanceQuestions[$code];  // kinerja question (same code)

                $imp = (float) ($importanceAnswers[$kepQ->id] ?? 0);   // Y-axis
                $perf = (float) ($performanceAnswers[$kinQ->id] ?? 0);  // X-axis

                $result[] = [
                    'id' => $code,
                    'question' => $kepQ->question_text,
                    'score' => round(($imp + $perf) / 2, 2),
                    'importance' => $imp,   // Y-axis (kepentingan)
                    'performance' => $perf,  // X-axis (kinerja)
                ];
            }

            // Sort by order_no of the kepentingan question
            usort($result, fn ($a, $b) => $importanceQuestions[$a['id']]->order_no <=> $importanceQuestions[$b['id']]->order_no
            );

            return $result;
        }

        // ── SLOI or other single-category mode: just compute average per question ──
        if ($questions->isNotEmpty()) {
            $questionIds = $questions->pluck('id');

            // Get average score per question
            $averageScores = \App\Models\SubmissionTemplateAnswer::whereIn('submission_id', $submissionIds)
                ->whereIn('question_id', $questionIds)
                ->groupBy('question_id')
                ->selectRaw('question_id, ROUND(AVG(value), 2) as avg_score')
                ->pluck('avg_score', 'question_id');

            // Build result with all questions
            $result = [];
            foreach ($questions as $question) {
                $avgScore = (float) ($averageScores[$question->id] ?? 0);

                $result[] = [
                    'id' => $question->code,
                    'question' => $question->question_text,
                    'score' => $avgScore,
                    'importance' => $avgScore,  // For SLOI, use same value
                    'performance' => $avgScore,  // For SLOI, use same value
                ];
            }

            return $result;
        }

        // If we don't have any questions, return empty array
        return [];
    }

    protected function computeSloiAspectAnalysis($submissionIds, ?int $templateId): ?array
    {
        if ($submissionIds->isEmpty() || ! $templateId) {
            return null;
        }

        $aspects = TemplateQuestion::where('template_id', $templateId)
            ->where('category', 'sloi')
            ->orderBy('order_no')
            ->pluck('aspect')
            ->unique()
            ->values();

        if ($aspects->isEmpty()) {
            return null;
        }

        $counts = DB::table('submission_template_answers')
            ->join('template_questions', 'submission_template_answers.question_id', '=', 'template_questions.id')
            ->whereIn('submission_template_answers.submission_id', $submissionIds)
            ->where('submission_template_answers.type', 'sloi')
            ->where('template_questions.template_id', $templateId)
            ->where('template_questions.category', 'sloi')
            ->whereNull('submission_template_answers.deleted_at')
            ->whereNull('template_questions.deleted_at')
            ->whereBetween('submission_template_answers.value', [1, 5])
            ->selectRaw('template_questions.aspect, submission_template_answers.value, COUNT(*) as total')
            ->groupBy('template_questions.aspect', 'submission_template_answers.value')
            ->get();

        $countsByAspect = [];
        $aspectTotals = [];
        $valueTotals = [];
        $grandTotal = 0;

        foreach ($aspects as $aspect) {
            $countsByAspect[$aspect] = [];
            $aspectTotals[$aspect] = 0;
        }

        foreach ($counts as $count) {
            $aspect = (string) $count->aspect;
            $value = (int) $count->value;
            $total = (int) $count->total;

            $countsByAspect[$aspect][$value] = $total;
            $aspectTotals[$aspect] = ($aspectTotals[$aspect] ?? 0) + $total;
            $valueTotals[$value] = ($valueTotals[$value] ?? 0) + $total;
            $grandTotal += $total;
        }

        $scaleRows = [
            1 => 'Sangat Tidak Setuju',
            2 => 'Tidak Setuju',
            3 => 'Ragu-Ragu',
            4 => 'Setuju',
            5 => 'Sangat setuju',
        ];

        $rows = [];
        foreach ($scaleRows as $value => $label) {
            $aspectCells = [];
            foreach ($aspects as $aspect) {
                $count = $countsByAspect[$aspect][$value] ?? 0;
                $total = $aspectTotals[$aspect] ?? 0;
                $aspectCells[$aspect] = [
                    'count' => $count,
                    'percentage' => $total > 0 ? round(($count / $total) * 100, 2) : 0,
                ];
            }

            $totalCount = $valueTotals[$value] ?? 0;
            $rows[] = [
                'value' => $value,
                'label' => $label,
                'aspects' => $aspectCells,
                'total' => [
                    'count' => $totalCount,
                    'percentage' => $grandTotal > 0 ? round(($totalCount / $grandTotal) * 100, 2) : 0,
                ],
            ];
        }

        $aspectSummary = [];
        foreach ($aspects as $aspect) {
            $aspectSummary[$aspect] = [
                'count' => $aspectTotals[$aspect] ?? 0,
                'percentage' => ($aspectTotals[$aspect] ?? 0) > 0 ? 100 : 0,
            ];
        }

        $positiveCount = ($valueTotals[4] ?? 0) + ($valueTotals[5] ?? 0);
        $doubtCount = $valueTotals[3] ?? 0;
        $doubtfulAspect = $aspects
            ->sortByDesc(fn ($aspect) => $countsByAspect[$aspect][3] ?? 0)
            ->first();

        return [
            'aspects' => $aspects->all(),
            'rows' => $rows,
            'totals' => [
                'aspects' => $aspectSummary,
                'total' => [
                    'count' => $grandTotal,
                    'percentage' => $grandTotal > 0 ? 100 : 0,
                ],
            ],
            'summary' => [
                'positivePercentage' => $grandTotal > 0 ? round(($positiveCount / $grandTotal) * 100, 2) : 0,
                'doubtPercentage' => $grandTotal > 0 ? round(($doubtCount / $grandTotal) * 100, 2) : 0,
                'doubtfulAspect' => $doubtfulAspect,
            ],
        ];
    }

    /**
     * Compute SLOI reliability & validity analysis.
     */
    protected function computeSloiReliabilityAnalysis($submissionIds, ?int $templateId, string $companyName): ?array
    {
        if ($submissionIds->isEmpty() || ! $templateId) {
            return null;
        }

        // Get all SLOI questions for this template
        $questions = TemplateQuestion::where('template_id', $templateId)
            ->orderBy('order_no')
            ->get(['id', 'code', 'question_text', 'order_no']);

        if ($questions->isEmpty()) {
            return null;
        }

        $questionIds = $questions->pluck('id')->toArray();
        $questionIdToCode = $questions->pluck('code', 'id')->toArray();

        // Fetch all raw answers: submission_id, question_id, value
        $rawAnswers = \App\Models\SubmissionTemplateAnswer::whereIn('submission_id', $submissionIds)
            ->whereIn('question_id', $questionIds)
            ->whereNull('deleted_at')
            ->get(['submission_id', 'question_id', 'value']);

        if ($rawAnswers->isEmpty()) {
            return null;
        }

        // Build respondent × question matrix
        // matrix[submissionId][questionId] = value
        $matrix = [];
        foreach ($rawAnswers as $answer) {
            $matrix[$answer->submission_id][$answer->question_id] = (float) $answer->value;
        }

        // Filter only complete respondents (those who answered ALL questions)
        $k = count($questionIds); // number of items
        $completeMatrix = [];
        foreach ($matrix as $subId => $answers) {
            if (count($answers) >= $k) {
                $completeMatrix[$subId] = $answers;
            }
        }

        $n = count($completeMatrix); // number of valid respondents
        if ($n < 2 || $k < 2) {
            return [
                'n' => $n,
                'k' => $k,
                'items' => [],
                'alpha' => 0,
                'alphaStatus' => $this->getSloiReliabilityStatus(0),
                'insufficientData' => true,
            ];
        }

        // ──── 1. Compute item scores and total scores ────
        // itemScores[questionId] = [val1, val2, ...]  (one per respondent)
        $itemScores = [];
        foreach ($questionIds as $qId) {
            $itemScores[$qId] = [];
        }
        $totalScores = []; // totalScores[submissionId] = sum of all item values

        foreach ($completeMatrix as $subId => $answers) {
            $total = 0;
            foreach ($questionIds as $qId) {
                $val = $answers[$qId] ?? 0;
                $itemScores[$qId][] = $val;
                $total += $val;
            }
            $totalScores[$subId] = $total;
        }

        $totalScoresArray = array_values($totalScores);

        // ──── 2. VAR — Item Variance (population variance) ────
        $itemVariances = [];
        foreach ($questionIds as $qId) {
            $itemVariances[$qId] = $this->computeVariance($itemScores[$qId]);
        }

        // ──── 3. VAR TOTAL — Total Score Variance ────
        $varTotal = $this->computeVariance($totalScoresArray);

        // ──── 4. Sum of item variances ────
        $sumItemVariances = array_sum($itemVariances);

        // ──── 5. ALPHA — Cronbach's Alpha ────
        // α = (k / (k - 1)) * (1 - Σσ²ᵢ / σ²total)
        $alpha = 0;
        if ($varTotal > 0) {
            $alpha = ($k / ($k - 1)) * (1 - ($sumItemVariances / $varTotal));
        }
        $alpha = round($alpha, 4);

        $alphaStatus = $this->getSloiReliabilityStatus($alpha);

        // ──── 6. PEARSON — Correlation of each item with total ────
        // ──── 7. VALIDITAS — Categorize each item by Pearson score ────
        $items = [];
        foreach ($questions as $question) {
            $qId = $question->id;
            $scores = $itemScores[$qId];

            // Compute Pearson correlation between item scores and total scores
            $pearson = $this->computePearsonCorrelation($scores, $totalScoresArray);
            $pearson = round($pearson, 4);

            $validityLabel = $this->getSloiValidityLabel($pearson);
            $isValid = $validityLabel !== 'Tidak valid';

            $mean = count($scores) > 0 ? round(array_sum($scores) / count($scores), 4) : 0;

            // Replace {perusahaan} or {project} with project name
            $questionText = str_ireplace(
                ['{perusahaan}'],
                "<strong>{$companyName}</strong>",
                $question->question_text
            );

            $items[] = [
                'code' => $questionIdToCode[$qId] ?? 'Q'.$qId,
                'question' => $questionText,
                'raw_question' => $question->question_text, // For tooltip
                'mean' => $mean,
                'pearson' => $pearson,
                'isValid' => $isValid,
                'validityLabel' => $validityLabel,
            ];
        }

        return [
            'n' => $n,
            'k' => $k,
            'items' => $items,
            'alpha' => $alpha,
            'alphaStatus' => $alphaStatus,
            'insufficientData' => false,
        ];
    }

    private function getSloiReliabilityStatus(float $alpha): string
    {
        if ($alpha >= 0.9) {
            return 'Reliabilitas sangat tinggi';
        }

        if ($alpha >= 0.7) {
            return 'Reliabilitas tinggi';
        }

        if ($alpha >= 0.6) {
            return 'Reliabilitas sedang';
        }

        if ($alpha > 0.5) {
            return 'Reliabilitas rendah';
        }

        return 'Tidak reliabel';
    }

    private function getSloiValidityLabel(float $pearson): string
    {
        if ($pearson >= 0.9) {
            return 'Reliabilitas sangat tinggi';
        }

        if ($pearson >= 0.7) {
            return 'Reliabilitas tinggi';
        }

        if ($pearson >= 0.6) {
            return 'Reliabilitas sedang';
        }

        if ($pearson > 0.5) {
            return 'Reliabilitas rendah';
        }

        return 'Tidak reliabel';
    }

    /**
     * Compute population variance for an array of numbers.
     */
    private function computeVariance(array $values): float
    {
        $n = count($values);
        if ($n < 2) {
            return 0.0;
        }

        $mean = array_sum($values) / $n;
        $sumSquaredDiffs = 0;
        foreach ($values as $val) {
            $sumSquaredDiffs += ($val - $mean) ** 2;
        }

        // Population variance (σ²) — consistent with Cronbach's Alpha formula
        return $sumSquaredDiffs / $n;
    }

    /**
     * Compute Pearson product-moment correlation between two arrays.
     */
    private function computePearsonCorrelation(array $x, array $y): float
    {
        $n = count($x);
        if ($n < 2 || $n !== count($y)) {
            return 0.0;
        }

        $sumX = array_sum($x);
        $sumY = array_sum($y);
        $sumXY = 0;
        $sumX2 = 0;
        $sumY2 = 0;

        for ($i = 0; $i < $n; $i++) {
            $sumXY += $x[$i] * $y[$i];
            $sumX2 += $x[$i] ** 2;
            $sumY2 += $y[$i] ** 2;
        }

        $numerator = ($n * $sumXY) - ($sumX * $sumY);
        $denominator = sqrt(
            (($n * $sumX2) - ($sumX ** 2)) *
            (($n * $sumY2) - ($sumY ** 2))
        );

        if ($denominator == 0) {
            return 0.0;
        }

        return $numerator / $denominator;
    }

    /**
     * Get all questions for a template with {project} replaced by project name (bold)
     */
    protected function getAllQuestions(?int $templateId, string $projectName): array
    {
        if (! $templateId) {
            return [];
        }

        $questions = TemplateQuestion::where('template_id', $templateId)
            ->orderBy('order_no')
            ->get(['id', 'code', 'category', 'aspect', 'question_text', 'order_no']);

        return $questions->map(function ($question) use ($projectName) {
            return [
                'id' => $question->code,
                'code' => $question->code,
                'category' => $question->category,
                'aspect' => $question->aspect,
                'question' => str_replace(
                    '{project}',
                    "<strong>{$projectName}</strong>",
                    $question->question_text
                ),
                'order_no' => $question->order_no,
            ];
        })->toArray();
    }

    protected function computeAuditLog(int $projectId, ?string $assessmentType, string $detailType = 'overview'): array
    {
        $query = Submission::where('project_id', $projectId)
            ->with(['respondent', 'enumerator'])
            ->orderByDesc('submitted_at')
            ->limit(10);

        if ($assessmentType) {
            $query->where('assessment_type', $assessmentType);
        }

        // For overview, IKM, and SLOI tabs: only show approved submissions
        if (in_array($detailType, ['overview', 'ikm', 'sloi'])) {
            $query->approved();
        }

        return $query->get()->map(function ($sub) {
            // Compute avg score for this submission
            $avgScore = $sub->templateAnswers()->avg('value');

            return [
                'id' => '#'.strtoupper($sub->assessment_type).'-'.$sub->id,
                'respondentName' => $sub->respondent?->name ?? '-',
                'enumerator' => $sub->enumerator?->name ?? '-',
                'date' => $sub->submitted_at?->format('M d, Y • H:i'),
                'score' => round($avgScore ?? 0, 1),
                'status' => $sub->status,
                'group' => $sub->respondent?->respondent_status === 'Penerima CSR' ? 'csr' : 'general',
            ];
        })->toArray();
    }

    protected function computeTrendData(int $projectId, ?string $assessmentType, string $detailType = 'overview'): array
    {
        $query = DB::table('submissions')
            ->join('submission_template_answers', 'submissions.id', '=', 'submission_template_answers.submission_id')
            ->where('submissions.project_id', $projectId)
            ->whereNotNull('submissions.submitted_at');

        if ($assessmentType) {
            $query->where('submissions.assessment_type', $assessmentType);
        }

        // For overview, IKM, and SLOI tabs: only show approved submissions
        if (in_array($detailType, ['overview', 'ikm', 'sloi'])) {
            $query->where('submissions.status', 'approved');
        }

        $monthExpression = DB::connection()->getDriverName() === 'sqlite'
            ? "strftime('%Y-%m', submissions.submitted_at)"
            : "DATE_FORMAT(submissions.submitted_at, '%Y-%m')";

        $monthly = $query
            ->selectRaw($monthExpression.' as month_key')
            ->selectRaw('ROUND(AVG(submission_template_answers.value), 2) as score')
            ->groupBy('month_key')
            ->orderBy('month_key')
            ->limit(6)
            ->get();

        if ($monthly->isEmpty()) {
            return [];
        }

        $maxScore = $monthly->max('score') ?: 1;

        return $monthly->map(function ($row) use ($maxScore) {
            return [
                'month' => strtoupper(Carbon::createFromFormat('Y-m', $row->month_key)->format('M')),
                'score' => (float) $row->score,
                'height' => round(($row->score / $maxScore) * 100),
            ];
        })->toArray();
    }

    protected function computeRespondents(int $projectId, ?string $assessmentType, ?int $templateId, array $params = []): array
    {
        $project = Project::with('sroiForms.sections.questions')->findOrFail($projectId);

        $query = Submission::where('project_id', $projectId)
            ->with(['respondent.stakeholder', 'enumerator', 'timelines.decidedBy', 'descriptiveAnswers.projectDescriptiveQuestion']);

        if ($assessmentType === 'SROI') {
            $query->with(['sroiAnswers.projectSroiQuestion']);
        } else {
            $query->with(['templateAnswers.question']);
        }

        if ($assessmentType) {
            $query->where('assessment_type', $assessmentType);
        }

        // ─── Filter options (computed before applying filters) ───
        $filterOptionsQuery = Submission::where('project_id', $projectId)
            ->with(['respondent', 'enumerator']);
        if ($assessmentType) {
            $filterOptionsQuery->where('assessment_type', $assessmentType);
        }
        $allSubmissions = $filterOptionsQuery->get();

        $enumeratorOptions = $allSubmissions
            ->map(fn ($s) => $s->enumerator?->name)
            ->filter()
            ->unique()
            ->sort()
            ->values()
            ->toArray();

        $statusOptions = $allSubmissions
            ->pluck('status')
            ->filter()
            ->unique()
            ->sort()
            ->values()
            ->toArray();

        $educationOptions = $allSubmissions
            ->map(fn ($s) => $s->respondent?->education_level)
            ->filter()
            ->unique()
            ->sort()
            ->values()
            ->toArray();

        $genderOptions = $allSubmissions
            ->map(fn ($s) => $s->respondent?->gender)
            ->filter()
            ->unique()
            ->sort()
            ->values()
            ->toArray();

        // ─── Apply filters ───────────────────────────────────
        $filterEnumerator = $params['enumerator'] ?? null;
        $filterStatus = $params['status'] ?? null;
        $filterEducation = $params['education'] ?? null;
        $filterGender = $params['gender'] ?? null;

        if (! empty($filterEnumerator)) {
            $query->whereHas('enumerator', function ($q) use ($filterEnumerator) {
                $q->where('name', $filterEnumerator);
            });
        }

        if (! empty($filterStatus)) {
            $query->where('status', $filterStatus);
        }

        if (! empty($filterEducation)) {
            $query->whereHas('respondent', function ($q) use ($filterEducation) {
                $q->where('education_level', $filterEducation);
            });
        }

        if (! empty($filterGender)) {
            $query->whereHas('respondent', function ($q) use ($filterGender) {
                $q->where('gender', $filterGender);
            });
        }

        // ─── Sorting ─────────────────────────────────────────
        $sortBy = $params['sort_by'] ?? 'submitted_at';
        $sortOrder = $params['sort_order'] ?? 'desc';

        if ($sortBy === 'submitted_at') {
            $query->orderBy('submitted_at', $sortOrder);
        } else {
            // For avgScore, we fall back to default order; scoring is computed after fetch
            $query->orderByDesc('submitted_at');
        }

        // ─── Pagination ──────────────────────────────────────
        $perPage = (int) ($params['per_page'] ?? 10);
        $paginated = $query->paginate($perPage)->withQueryString();

        // Get question headers if template exists
        $questions = [];
        if ($assessmentType === 'SROI') {
            $activeForm = $project->sroiForms()
                ->active()
                ->with(['sections.questions' => fn ($q) => $q->active()->orderBy('order_no')->orderBy('id')])
                ->latest('activated_at')
                ->latest('id')
                ->first();

            if ($activeForm) {
                $questions = $activeForm->sections
                    ->flatMap(function ($section) {
                        return $section->questions->map(fn ($q) => [
                            'id' => $q->id,
                            'question' => $q->question_text,
                            'sectionId' => $q->section_id,
                            'parentQuestionId' => $q->parent_question_id,
                            'isGroup' => $q->is_group,
                            'answerType' => $q->answer_type,
                            'unit' => $q->unit,
                            'orderNo' => $q->order_no,
                        ]);
                    })
                    ->values()
                    ->toArray();
            }
        } elseif ($templateId) {
            $questions = \App\Models\TemplateQuestion::where('template_id', $templateId)
                ->orderBy('order_no')
                ->get()
                ->map(fn ($q) => [
                    'code' => $q->code,
                    'question' => $q->question_text,
                    'category' => $q->category ?? null,
                ])
                ->toArray();
        }

        $rows = $paginated->getCollection()->map(function ($sub) use ($assessmentType) {
            $respondent = $sub->respondent;
            $stakeholder = $respondent?->stakeholder;

            // Build answer map: question_code => { kepentingan, kinerja }
            $answers = [];
            $totalScore = 0;
            $answerCount = 0;
            $kepScore = 0;
            $kepCount = 0;
            $kinScore = 0;
            $kinCount = 0;

            if ($assessmentType === 'SROI') {
                foreach ($sub->sroiAnswers as $answer) {
                    $code = (string) $answer->project_sroi_question_id;

                    $answers[$code] = [
                        'value_number' => $answer->value_number !== null ? (float) $answer->value_number : null,
                        'value_text' => $answer->value_text,
                    ];

                    if ($answer->value_number !== null) {
                        $totalScore += (float) $answer->value_number;
                        $answerCount++;
                    }
                }
            } else {
                foreach ($sub->templateAnswers as $answer) {
                    $code = $answer->question?->code ?? 'Q'.$answer->question_id;
                    $type = $answer->type ?? 'sloi';

                    if (! isset($answers[$code])) {
                        $answers[$code] = ['kepentingan' => null, 'kinerja' => null];
                    }

                    if ($type === 'ikm-kepentingan') {
                        $answers[$code]['kepentingan'] = $answer->value;
                        $kepScore += $answer->value ?? 0;
                        $kepCount++;
                    } elseif ($type === 'ikm-kinerja') {
                        $answers[$code]['kinerja'] = $answer->value;
                        $kinScore += $answer->value ?? 0;
                        $kinCount++;
                    } else {
                        $answers[$code]['kepentingan'] = $answer->value;
                        $answers[$code]['kinerja'] = $answer->value;
                    }

                    $totalScore += $answer->value ?? 0;
                    $answerCount++;
                }
            }

            return [
                'submissionId' => $sub->id,
                'submittedAt' => $sub->submitted_at?->format('Y-m-d H:i'),
                'status' => $sub->status,
                'enumerator' => $sub->enumerator?->name ?? '-',
                'latitude' => $sub->latitude,
                'longitude' => $sub->longitude,
                'photoPath' => $sub->photo_path,
                'avgScore' => $answerCount > 0 ? round($totalScore / $answerCount, 2) : 0,
                'avgKepentingan' => $kepCount > 0 ? round($kepScore / $kepCount, 2) : null,
                'avgKinerja' => $kinCount > 0 ? round($kinScore / $kinCount, 2) : null,
                'respondent' => $respondent ? [
                    'id' => $respondent->id,
                    'name' => $respondent->name,
                    'stakeholder' => $stakeholder ? [
                        'id' => $stakeholder->id,
                        'name' => $stakeholder->name,
                    ] : null,
                    'address' => $respondent->address,
                    'phone' => $respondent->phone,
                    'age' => $respondent->age,
                    'gender' => $respondent->gender,
                    'status' => $respondent->respondent_status,
                    'educationLevel' => $respondent->education_level,
                    'occupation' => $respondent->main_occupation,
                    'monthlyIncome' => $respondent->monthly_income,
                ] : null,
                'answers' => $answers,
                'timelines' => $sub->timelines->sortByDesc('decided_at')->values()->map(fn ($t) => [
                    'id' => $t->id,
                    'action' => $t->action,
                    'decidedAt' => $t->decided_at?->format('Y-m-d H:i'),
                    'decidedBy' => $t->decidedBy?->name ?? '-',
                    'notes' => $t->notes,
                ])->toArray(),
                'descriptiveAnswers' => $sub->descriptiveAnswers->map(fn ($ans) => [
                    'question' => $ans->projectDescriptiveQuestion?->title ?? '-',
                    'answer' => $ans->answer,
                ])->toArray(),
            ];
        })->toArray();

        // If sortBy is avgScore, sort the current page rows in PHP
        if ($sortBy === 'avg_score') {
            usort($rows, function ($a, $b) use ($sortOrder) {
                $cmp = $a['avgScore'] <=> $b['avgScore'];

                return $sortOrder === 'asc' ? $cmp : -$cmp;
            });
        }

        return [
            'questions' => $questions,
            'rows' => $rows,
            'pagination' => [
                'currentPage' => $paginated->currentPage(),
                'lastPage' => $paginated->lastPage(),
                'perPage' => $paginated->perPage(),
                'total' => $paginated->total(),
            ],
            'filterOptions' => [
                'enumerators' => $enumeratorOptions,
                'statuses' => $statusOptions,
                'educations' => $educationOptions,
                'genders' => $genderOptions,
            ],
        ];
    }

    protected function computeEnumeratorList(Project $project): array
    {
        $assignments = ProjectEnumeratorAssignment::where('project_id', $project->id)
            ->with('enumerator')
            ->get();

        $allSubmissions = Submission::where('project_id', $project->id)
            ->get()
            ->groupBy('enumerator_id');

        return $assignments->map(function ($assignment) use ($allSubmissions) {
            $enumerator = $assignment->enumerator;
            $submissions = $allSubmissions->get($enumerator->id, collect());

            $totalSubmissions = $submissions->count();
            $ikmSubmissions = $submissions->where('assessment_type', 'IKM')->count();
            $sloiSubmissions = $submissions->where('assessment_type', 'SLOI')->count();
            $latestSubmission = $submissions->sortByDesc('submitted_at')->first();

            return [
                'id' => $enumerator->id,
                'name' => $enumerator->name,
                'email' => $enumerator->email,
                'phone' => $enumerator->phone,
                'isActive' => $enumerator->is_active,
                'totalSubmissions' => $totalSubmissions,
                'ikmSubmissions' => $ikmSubmissions,
                'sloiSubmissions' => $sloiSubmissions,
                'lastSubmittedAt' => $latestSubmission?->submitted_at?->format('Y-m-d H:i'),
            ];
        })->toArray();
    }

    // ─── PROJECT LIST ───────────────────────────────────────────

    protected function buildProjectListQuery(Builder $query, array $params = []): LengthAwarePaginator
    {
        $query->with(self::LIST_RELATIONS);

        $this->applySearchFilter($query, $params['search'] ?? null);

        $this->applyStatusFilter($query, $params['status'] ?? null);

        $this->applySorting($query, $params['sort_by'] ?? null, $params['sort_order'] ?? null);

        $perPage = $params['per_page'] ?? 10;
        $paginated = $query->paginate($perPage)->withQueryString();

        $paginated->getCollection()->transform(fn ($project) => $this->formatProjectForList($project));

        return $paginated;
    }

    protected function applySearchFilter(Builder $query, ?string $search): void
    {
        if (! empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('project_code', 'like', "%{$search}%");
            });
        }
    }

    protected function applyStatusFilter(Builder $query, ?string $status): void
    {
        if (! empty($status) && $status !== 'all') {
            $query->where('status', $status);
        }
    }

    protected function applySorting(Builder $query, ?string $sortBy, ?string $sortOrder): void
    {
        $sortBy = $sortBy ?? 'created_at';
        $sortOrder = $sortOrder ?? 'desc';

        if (in_array($sortBy, self::ALLOWED_SORTS)) {
            $query->orderBy($sortBy, $sortOrder);
        } else {
            $query->orderBy('created_at', 'desc');
        }
    }

    protected function formatProjectForList(Project $project): array
    {
        $locationsString = $project->locations->map(function ($loc) {
            $district = $loc->district;
            $city = $district?->city;

            return $city ? $city->name : ($district?->name ?? '-');
        })->unique()->take(2)->implode(', ');

        // Get first city and province for separate display
        $firstLocation = $project->locations->first();
        $firstCity = $firstLocation?->district?->city;
        $firstProvince = $firstCity?->province;
        $cityName = $firstCity?->name ?? '-';
        $provinceName = $firstProvince?->name ?? '-';

        $fullLocations = $project->locations->map(function ($loc) {
            return [
                'id' => $loc->id,
                'province' => $loc->district?->city?->province,
                'city' => $loc->district?->city,
                'district' => $loc->district,
            ];
        })->toArray();

        $type = $this->determineProjectType($project);

        // Total responses (all types)
        $currentResponses = $project->submissions->count();
        $targetResponses = $project->target_ikm_count + $project->target_sloi_count;

        // Separate IKM responses
        $ikmCurrentResponses = $project->submissions->where('assessment_type', 'IKM')->count();
        $ikmTargetResponses = $project->target_ikm_count;

        // Separate SLOI responses
        $sloiCurrentResponses = $project->submissions->where('assessment_type', 'SLOI')->count();
        $sloiTargetResponses = $project->target_sloi_count;

        return [
            'id' => $project->id,
            'code' => $project->project_code,
            'institution' => $project->company->name ?? '-',
            'name' => $project->name,
            'type' => $type,
            'typeLabel' => $this->getTypeLabel($project),
            'location' => $locationsString ?: '-',
            'city' => $cityName,
            'province' => $provinceName,
            'status' => $project->status,
            'description' => $project->description,
            'target_ikm_count' => $project->target_ikm_count,
            'target_sloi_count' => $project->target_sloi_count,
            'enable_ikm' => $project->enable_ikm,
            'enable_sloi' => $project->enable_sloi,
            'enable_sroi' => $project->enable_sroi,
            'ikm_template_id' => $project->ikm_template_id,
            'sloi_template_id' => $project->sloi_template_id,
            'locations' => $fullLocations,
            'currentResponses' => $currentResponses,
            'targetResponses' => $targetResponses ?: 0,
            'ikmCurrentResponses' => $ikmCurrentResponses,
            'ikmTargetResponses' => $ikmTargetResponses,
            'sloiCurrentResponses' => $sloiCurrentResponses,
            'sloiTargetResponses' => $sloiTargetResponses,
            'startDate' => $project->start_date?->format('Y-m-d'),
            'endDate' => $project->end_date?->format('Y-m-d'),
        ];
    }

    protected function determineProjectType(Project $project): string
    {
        if ($project->enable_ikm) {
            return 'IKM';
        }
        if ($project->enable_sloi) {
            return 'SLOI';
        }
        if ($project->enable_sroi) {
            return 'SROI';
        }

        return 'IKM';
    }

    protected function getTypeLabel(Project $project): string
    {
        $types = [];
        if ($project->enable_ikm) {
            $types[] = 'IKM';
        }
        if ($project->enable_sloi) {
            $types[] = 'SLOI';
        }
        if ($project->enable_sroi) {
            $types[] = 'SROI';
        }

        return implode(' + ', $types) ?: 'IKM';
    }

    protected function storeProject(array $data, int $companyId, ?int $userId): Project
    {
        $templateIds = $this->resolveTemplateIds($data);

        return Project::create([
            'company_id' => $companyId,
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'project_code' => $this->generateProjectCode(),
            'status' => 'draft',
            'target_ikm_count' => $data['target_ikm_count'] ?? 0,
            'target_sloi_count' => $data['target_sloi_count'] ?? 0,
            'enable_ikm' => $data['enable_ikm'] ?? false,
            'enable_sloi' => $data['enable_sloi'] ?? false,
            'enable_sroi' => $data['enable_sroi'] ?? false,
            'ikm_template_id' => $templateIds['ikm'],
            'sloi_template_id' => $templateIds['sloi'],
            'start_date' => $data['start_date'] ?? null,
            'end_date' => $data['end_date'] ?? null,
            'created_by' => $userId,
        ]);
    }

    protected function resolveTemplateIds(array $data, ?Project $existingProject = null): array
    {
        $ikmTemplateId = $existingProject?->ikm_template_id ?? null;
        $sloiTemplateId = $existingProject?->sloi_template_id ?? null;

        // Only update if enable_ikm is explicitly set
        if (array_key_exists('enable_ikm', $data)) {
            if (! empty($data['enable_ikm'])) {
                $ikmTemplateId = InstrumentTemplate::where('type', 'IKM')
                    ->where('is_active', true)
                    ->value('id');
            } else {
                $ikmTemplateId = null;
            }
        }

        // Only update if enable_sloi is explicitly set
        if (array_key_exists('enable_sloi', $data)) {
            if (! empty($data['enable_sloi'])) {
                $sloiTemplateId = InstrumentTemplate::where('type', 'SLOI')
                    ->where('is_active', true)
                    ->value('id');
            } else {
                $sloiTemplateId = null;
            }
        }

        return [
            'ikm' => $ikmTemplateId,
            'sloi' => $sloiTemplateId,
        ];
    }

    protected function storeProjectLocations(array $districtIds, int $projectId, int $companyId): void
    {
        if (empty($districtIds)) {
            return;
        }

        // Ensure unique district IDs
        $uniqueDistrictIds = array_unique($districtIds);

        $locations = collect($uniqueDistrictIds)->map(fn ($districtId) => [
            'company_id' => $companyId,
            'project_id' => $projectId,
            'district_id' => $districtId,
            'created_at' => now(),
            'updated_at' => now(),
        ])->toArray();

        ProjectLocation::insert($locations);
    }

    protected function generateProjectCode(): string
    {
        do {
            $code = strtoupper(Str::random(6));
        } while (Project::where('project_code', $code)->exists());

        return $code;
    }
}
