<?php

namespace App\Http\Controllers\Enumerator;

use App\Http\Controllers\Controller;
use App\Http\Requests\Survey\StoreSurveyRequest;
use App\Http\Requests\Survey\UpdateSurveyRequest;
use App\Http\Resources\Survey\HistorySurveyResource;
use App\Models\Project;
use App\Services\SurveyService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class SurveyController extends Controller
{
    protected $surveyService;

    public function __construct(SurveyService $surveyService)
    {
        $this->surveyService = $surveyService;
    }

    public function surveyRespondentPage($projectId, Request $request)
    {
        $project = Project::with('company')->findOrFail($projectId);
        $projectCode = $request->projectCode;
        $surveyType = strtoupper((string) $request->surveyType);
        abort_unless(in_array($surveyType, ['IKM', 'SLOI'], true), 404);
        $isCodeTrue = $this->surveyService->checkProjectCode($projectCode, $projectId);

        if ($isCodeTrue == true) {
            $questions = $this->surveyService->getQuestionsBySurveyType($project, $surveyType);

            // Load descriptive questions for this project
            $descriptiveQuestions = $project->descriptiveQuestions()->select('id', 'title')->get();

            return Inertia::render('Enumerator/Survey/RespondentSurvey', [
                'project' => $project,
                'surveyType' => $surveyType,
                'questions' => $questions,
                'descriptiveQuestions' => $descriptiveQuestions,
            ]);
        } else {
            return redirect()->back()->with('error', 'Kode yang dimasukkan salah');
        }
    }

    public function storeDataSurvey(StoreSurveyRequest $request, $projectId)
    {
        $project = Project::findOrFail($projectId);
        $enumeratorId = Auth::id();

        $result = $this->surveyService->storeSurvey(
            $request->validated(),
            $project,
            $enumeratorId
        );

        // Jika data sudah pernah disubmit sebelumnya
        // if (!$result['is_new']) {
        //     return back()->with('error', 'Data survei untuk responden ini sudah pernah dikirim sebelumnya.');
        // }

        if ($request->input('redirect_to') === 'continue') {
            return redirect()
                ->route('enumerator.survey.respondent', [
                    'projectId' => $projectId,
                    'projectCode' => $project->project_code,
                    'surveyType' => $request->input('assessment_type'),
                ])
                ->with('success', 'Survei berhasil disimpan. Silakan isi data responden berikutnya.');
        }

        return redirect()
            ->route('enumerator.list-survey')
            ->with('success', 'Survei berhasil disimpan.');
    }

    /**
     * Riwayat submission enumerator — paginated, filterable, sortable.
     */
    public function historyPage(Request $request)
    {
        $enumeratorId = Auth::id();

        $result = $this->surveyService->getEnumeratorHistory($enumeratorId, [
            'project_id' => $request->input('project_id'),
            'status' => $request->input('status'),
            'assessment_type' => $request->input('assessment_type'),
            'sort_by' => $request->input('sort_by', 'submitted_at'),
            'sort_order' => $request->input('sort_order', 'desc'),
            'per_page' => $request->input('per_page', 12),
        ]);

        return Inertia::render('Enumerator/Survey/HistorySurvey', [
            'submissions' => HistorySurveyResource::collection($result['submissions']),
            'projects' => $result['projects'],
            'stats' => $result['stats'],
            'filters' => [
                'project_id' => $request->input('project_id'),
                'status' => $request->input('status'),
                'assessment_type' => $request->input('assessment_type'),
                'sort_by' => $request->input('sort_by', 'submitted_at'),
                'sort_order' => $request->input('sort_order', 'desc'),
                'per_page' => (int) $request->input('per_page', 12),
            ],
        ]);
    }

    /**
     * Show the edit form for an existing submission.
     */
    public function editPage(int $submissionId)
    {
        $enumeratorId = Auth::id();

        $data = $this->surveyService->getSubmissionForEdit($submissionId, $enumeratorId);

        if ($data['submission']->status === 'approved') {
            abort(403, 'Submission yang sudah disetujui tidak dapat diedit.');
        }

        // Descriptive questions for the project
        $descriptiveQuestions = $data['submission']->project
            ->descriptiveQuestions()
            ->select('id', 'title')
            ->get();

        return Inertia::render('Enumerator/Survey/EditSurvey', [
            'submission' => [
                'id' => $data['submission']->id,
                'assessment_type' => $data['submission']->assessment_type,
                'photo_url' => $data['submission']->photo_path
                    ? asset('storage/'.$data['submission']->photo_path)
                    : null,
                'latitude' => $data['submission']->latitude,
                'longitude' => $data['submission']->longitude,
                'status' => $data['submission']->status,
            ],
            'project' => $data['submission']->project,
            'respondent' => $data['submission']->respondent,
            'questions' => $data['questions'],
            'answersMap' => $data['answersMap'],
            'descriptiveQuestions' => $descriptiveQuestions,
            'descriptiveAnswersMap' => $data['descriptiveAnswersMap'],
        ]);
    }

    /**
     * Update an existing submission (respondent, answers, optional photo, GPS).
     */
    public function updateDataSurvey(UpdateSurveyRequest $request, int $submissionId)
    {
        $enumeratorId = Auth::id();

        $this->surveyService->updateSurvey(
            $request->validated(),
            $submissionId,
            $enumeratorId,
        );

        return redirect()
            ->route('enumerator.survey.history')
            ->with('success', 'Submission berhasil diperbarui.');
    }
}
