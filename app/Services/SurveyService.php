<?php

namespace App\Services;

use App\Models\Project;
use App\Models\Respondent;
use App\Models\Submission;
use App\Models\SubmissionDescriptiveAnswer;
use App\Models\SubmissionTemplateAnswer;
use App\Models\TemplateQuestion;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;

class SurveyService
{
    public function checkProjectCode($projectCode, $projectId)
    {
        $project = Project::findOrFail($projectId);
        if ($project->project_code == $projectCode) {
            return true;
        }

        return false;
    }

    /**
     * Load pertanyaan berdasarkan surveyType (IKM / SLOI).
     * Mengambil template_id dari project, lalu load questions-nya.
     */
    public function getQuestionsBySurveyType(Project $project, string $surveyType)
    {
        $templateId = match (strtoupper($surveyType)) {
            'IKM' => $project->ikm_template_id,
            'SLOI' => $project->sloi_template_id,
            default => null,
        };

        if (! $templateId) {
            return collect([]);
        }

        $questions = TemplateQuestion::where('template_id', $templateId)
            ->orderBy('order_no')
            ->get(['id', 'category', 'code', 'question_text', 'order_no']);

        // Replace {project} and {perusahaan} placeholders with actual names (bold)
        $projectName = $project->name;

        // Ensure we handle missing company relation gracefully
        $companyName = $project->company ? $project->company->name : 'Perusahaan';

        $questions->each(function ($question) use ($projectName, $companyName) {
            $question->question_text = str_ireplace(
                ['{project}', '{perusahaan}'],
                ["<strong>{$projectName}</strong>", "<strong>{$companyName}</strong>"],
                $question->question_text
            );
        });

        return $questions;
    }

    /**
     * Store survey data: respondent (once), submission (once), answers (many).
     */
    public function storeSurvey(array $data, Project $project, int $enumeratorId): array
    {
        return DB::transaction(function () use ($data, $project, $enumeratorId) {
            $respondentData = $data['respondent'];
            $submissionData = $data['submission'];
            $answers = $data['answers'] ?? [];
            $assessmentType = $data['assessment_type'];

            // 1. Respondent — sekali saja per project + phone
            $uniqueKeys = [
                'project_id' => $project->id,
                'phone' => $respondentData['phone'] ?? null,
            ];

            if (empty($uniqueKeys['phone'])) {
                $uniqueKeys = [
                    'project_id' => $project->id,
                    'name' => $respondentData['name'],
                ];
            }

            [$respondent, $respondentCreated] = $this->firstOrCreateRespondent(
                $uniqueKeys,
                array_merge($respondentData, [
                    'company_id' => $project->company_id,
                    'project_id' => $project->id,
                    'created_by' => $enumeratorId,
                ])
            );

            // 2. Submission — sekali saja per project + respondent
            $existingSubmission = Submission::where('project_id', $project->id)
                ->where('respondent_id', $respondent->id)
                ->first();

            if ($existingSubmission) {
                return [
                    'respondent' => $respondent,
                    'submission' => $existingSubmission,
                    'is_new' => false,
                ];
            }

            /** @var UploadedFile $photo */
            $photo = $submissionData['photo'];
            $photoPath = $photo->store('submissions', 'public');

            $submission = Submission::create([
                'company_id' => $project->company_id,
                'project_id' => $project->id,
                'assessment_type' => $assessmentType,
                'respondent_id' => $respondent->id,
                'enumerator_id' => $enumeratorId,
                'status' => 'submitted',
                'photo_path' => $photoPath,
                'photo_mime' => $photo->getClientMimeType(),
                'photo_size_bytes' => $photo->getSize(),
                'latitude' => $submissionData['latitude'],
                'longitude' => $submissionData['longitude'],
            ]);

            $answerRecords = array_map(fn ($answer) => [
                'submission_id' => $submission->id,
                'question_id' => $answer['question_id'],
                'type' => $answer['type'],
                'value' => $answer['value'],
                'created_at' => now(),
            ], $answers);

            SubmissionTemplateAnswer::insert($answerRecords);

            // 4. Submission descriptive answers (optional)
            $descriptiveAnswers = $data['descriptive_answers'] ?? [];
            if (! empty($descriptiveAnswers)) {
                $descriptiveRecords = array_map(fn ($da) => [
                    'submission_id' => $submission->id,
                    'project_descriptive_question_id' => $da['question_id'],
                    'answer' => $da['answer'],
                    'created_at' => now(),
                ], $descriptiveAnswers);
                SubmissionDescriptiveAnswer::insert($descriptiveRecords);
            }

            return [
                'respondent' => $respondent,
                'submission' => $submission,
                'is_new' => true,
            ];
        });
    }

    /**
     * Get paginated submission history for an enumerator with
     * optional project filter, sorting, ordering, and stats.
     */
    public function getEnumeratorHistory(int $enumeratorId, array $params): array
    {
        $projectId = $params['project_id'] ?? null;
        $sortBy = $params['sort_by'] ?? 'submitted_at';
        $sortOrder = $params['sort_order'] ?? 'desc';
        $perPage = (int) ($params['per_page'] ?? 12);
        $status = $params['status'] ?? null;
        $assessmentType = $params['assessment_type'] ?? null;

        // Allowed sort columns
        $allowedSorts = ['submitted_at', 'assessment_type', 'status'];
        if (! in_array($sortBy, $allowedSorts)) {
            $sortBy = 'submitted_at';
        }
        $sortOrder = $sortOrder === 'asc' ? 'asc' : 'desc';

        // Base query for submission history cards
        $query = Submission::query()
            ->where('enumerator_id', $enumeratorId)
            ->whereNull('deleted_at')
            ->with(['project:id,name', 'respondent:id,name,phone,address,gender,age'])
            ->select('submissions.*')
            ->selectRaw('(
                SELECT COUNT(*)
                FROM submissions sequence_submissions
                WHERE sequence_submissions.enumerator_id = submissions.enumerator_id
                  AND sequence_submissions.deleted_at IS NULL
                  AND (
                      sequence_submissions.submitted_at < submissions.submitted_at
                      OR (
                          sequence_submissions.submitted_at = submissions.submitted_at
                          AND sequence_submissions.id <= submissions.id
                      )
                  )
            ) as submission_number');

        // Filter by project
        if ($projectId) {
            $query->where('project_id', $projectId);
        }

        // Filter by status
        if ($status) {
            $query->where('status', $status);
        }

        // Filter by assessment type
        if ($assessmentType) {
            $query->where('assessment_type', $assessmentType);
        }

        $query->orderBy($sortBy, $sortOrder);

        $paginated = $query->paginate($perPage)->withQueryString();

        // Project list for filter dropdown (only projects this enumerator has submissions for)
        $projects = Submission::where('enumerator_id', $enumeratorId)
            // ->whereNull('deleted_at')
            ->join('projects', 'submissions.project_id', '=', 'projects.id')
            ->select('projects.id', 'projects.name')
            ->distinct()
            ->orderBy('projects.name')
            ->get();

        // Summary stats
        $statsQuery = Submission::where('enumerator_id', $enumeratorId)
            ->whereNull('deleted_at');

        $totalSubmissions = (clone $statsQuery)->count();
        $approvedCount = (clone $statsQuery)->where('status', 'approved')->count();
        $submittedCount = (clone $statsQuery)->where('status', 'submitted')->count();
        $rejectedCount = (clone $statsQuery)->where('status', 'rejected')->count();

        // Overall average
        $overallAvg = DB::table('submissions')
            ->join('submission_template_answers', 'submissions.id', '=', 'submission_template_answers.submission_id')
            ->where('submissions.enumerator_id', $enumeratorId)
            ->whereNull('submissions.deleted_at')
            ->whereNull('submission_template_answers.deleted_at')
            ->avg('submission_template_answers.value');

        return [
            'submissions' => $paginated,
            'projects' => $projects,
            'stats' => [
                'total' => $totalSubmissions,
                'approved' => $approvedCount,
                'submitted' => $submittedCount,
                'rejected' => $rejectedCount,
                'overallAvg' => round((float) $overallAvg, 2),
            ],
        ];
    }

    /**
     * Load a single submission with all data needed for the edit page.
     */
    public function getSubmissionForEdit(int $submissionId, int $enumeratorId): array
    {
        $submission = Submission::with([
            'respondent',
            'project:id,name,company_id,ikm_template_id,sloi_template_id,enable_ikm,enable_sloi',
            'project.company:id,name',
        ])
            ->where('enumerator_id', $enumeratorId)
            ->findOrFail($submissionId);

        // Load questions for this assessment type
        $project = $submission->project;
        $questions = $this->getQuestionsBySurveyType($project, $submission->assessment_type);

        // Load existing answers as key→value map (same format as QuestionAnswers on frontend)
        $answersRaw = SubmissionTemplateAnswer::where('submission_id', $submissionId)
            ->whereNull('deleted_at')
            ->get(['question_id', 'type', 'value']);

        $answersMap = [];
        foreach ($answersRaw as $a) {
            $key = "{$a->question_id}-{$a->type}";
            $answersMap[$key] = $a->value;
        }

        // Load existing descriptive answers as questionId → answer map
        $descriptiveAnswersRaw = SubmissionDescriptiveAnswer::where('submission_id', $submissionId)
            ->whereNull('deleted_at')
            ->get(['project_descriptive_question_id', 'answer']);

        $descriptiveAnswersMap = [];
        foreach ($descriptiveAnswersRaw as $da) {
            $descriptiveAnswersMap[$da->project_descriptive_question_id] = $da->answer;
        }

        return [
            'submission' => $submission,
            'questions' => $questions,
            'answersMap' => $answersMap,
            'descriptiveAnswersMap' => $descriptiveAnswersMap,
        ];
    }

    /**
     * Update an existing submission: respondent data, optional photo, GPS, and answers (full replace).
     */
    public function updateSurvey(array $data, int $submissionId, int $enumeratorId): void
    {
        DB::transaction(function () use ($data, $submissionId, $enumeratorId) {
            $submission = Submission::where('enumerator_id', $enumeratorId)
                ->findOrFail($submissionId);

            if ($submission->status === 'approved') {
                abort(403, 'Submission yang sudah disetujui tidak dapat diedit.');
            }

            $respondent = $submission->respondent;
            $respondentData = $data['respondent'];
            $submissionData = $data['submission'];
            $answers = $data['answers'] ?? [];
            $assessmentType = strtoupper($data['assessment_type'] ?? $submission->assessment_type);

            // 1. Update respondent
            if ($respondent) {
                $respondent->update([
                    'name' => $respondentData['name'],
                    'address' => $respondentData['address'] ?? null,
                    'phone' => $respondentData['phone'] ?? null,
                    'age' => $respondentData['age'] ?? null,
                    'gender' => $respondentData['gender'] ?? null,
                    'respondent_status' => $respondentData['respondent_status'] ?? null,
                    'education_level' => $respondentData['education_level'] ?? null,
                    'main_occupation' => $respondentData['main_occupation'] ?? null,
                    'monthly_income' => $respondentData['monthly_income'] ?? null,
                ]);
            }

            // 2. Update photo (only if a new file was uploaded)
            $updateFields = [
                'assessment_type' => $assessmentType,
                'latitude' => $submissionData['latitude'],
                'longitude' => $submissionData['longitude'],
                'status' => 'submitted', // reset to submitted after edit
            ];

            if (! empty($submissionData['photo'])) {
                /** @var \Illuminate\Http\UploadedFile $photo */
                $photo = $submissionData['photo'];
                $updateFields['photo_path'] = $photo->store('submissions', 'public');
                $updateFields['photo_mime'] = $photo->getClientMimeType();
                $updateFields['photo_size_bytes'] = $photo->getSize();
            }

            $submission->update($updateFields);

            // 3. Replace answers: soft-delete old, insert new
            SubmissionTemplateAnswer::where('submission_id', $submissionId)->delete();

            $answerRecords = array_map(fn ($answer) => [
                'submission_id' => $submissionId,
                'question_id' => $answer['question_id'],
                'type' => $answer['type'],
                'value' => $answer['value'],
                'created_at' => now(),
            ], $answers);

            SubmissionTemplateAnswer::insert($answerRecords);

            // 4. Replace descriptive answers: soft-delete old, insert new
            SubmissionDescriptiveAnswer::where('submission_id', $submissionId)->delete();

            $descriptiveAnswers = $data['descriptive_answers'] ?? [];
            if (! empty($descriptiveAnswers)) {
                $descriptiveRecords = array_map(fn ($da) => [
                    'submission_id' => $submissionId,
                    'project_descriptive_question_id' => $da['question_id'],
                    'answer' => $da['answer'],
                    'created_at' => now(),
                ], $descriptiveAnswers);
                SubmissionDescriptiveAnswer::insert($descriptiveRecords);
            }
        });
    }

    private function firstOrCreateRespondent(array $uniqueKeys, array $allData): array
    {
        $respondent = Respondent::where(function ($q) use ($uniqueKeys) {
            foreach ($uniqueKeys as $col => $val) {
                $q->where($col, $val);
            }
        })->first();

        if ($respondent) {
            return [$respondent, false];
        }

        $respondent = Respondent::create($allData);

        return [$respondent, true];
    }
}
