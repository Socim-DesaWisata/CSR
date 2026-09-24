<?php

namespace App\Http\Controllers;

use App\Http\Requests\Company\CreateProjectRequest;
use App\Http\Requests\Project\UpdateProjectRequest;
use App\Models\Project;
use App\Services\AreaService;
use App\Services\ProjectService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ProjectController extends Controller
{
    protected ProjectService $projectService;

    protected AreaService $areaService;

    public function __construct(ProjectService $projectService, AreaService $areaService)
    {
        $this->projectService = $projectService;
        $this->areaService = $areaService;
    }

    public function listProjectPage(Request $request)
    {
        $user = Auth::user();
        $isAdmin = in_array($user->role, ['admin', 'superadmin']);

        $params = [
            'search' => $request->input('search'),
            'status' => $request->input('status', 'all'),
            'sort_by' => $request->input('sort_by', 'created_at'),
            'sort_order' => $request->input('sort_order', 'desc'),
            'per_page' => $request->input('per_page', 10),
        ];

        if ($isAdmin) {
            $params['company_id'] = $request->input('company_id');
            $params['province_id'] = $request->input('province_id');

            $projects = $this->projectService->getAllProjectsForAdmin($params);
            $summary = $this->projectService->getAdminProjectSummary($params);
            $enumerators = [];
            $companies = \App\Models\Company::select('id', 'name')->orderBy('name')->get()->toArray();
        } else {
            $companyId = $user->company_id;
            $projects = $this->projectService->getAllProjectsByCompany($companyId, $params);
            $summary = $this->projectService->getProjectSummary($companyId);
            $enumerators = $this->projectService->getEnumeratorsByCompany($companyId);
            $companies = [];
        }

        $provinces = $this->areaService->getAllProvinces();
        // dd($projects);

        return Inertia::render('Project/ListProject', [
            'projects' => $projects,
            'summary' => $summary,
            'enumerators' => $enumerators,
            'filters' => $params,
            'provinces' => $provinces,
            'canEdit' => ! $isAdmin,
            'companies' => $companies,
        ]);
    }

    public function detailProject(Request $request, int $id)
    {
        $user = Auth::user();
        $isAdmin = in_array($user->role, ['admin', 'superadmin']);

        $detailType = $request->input('detailType', 'overview');

        $respondentParams = [
            'enumerator' => $request->input('enumerator'),
            'status' => $request->input('resp_status'),
            'education' => $request->input('education'),
            'gender' => $request->input('gender'),
            'sort_by' => $request->input('sort_by', 'submitted_at'),
            'sort_order' => $request->input('sort_order', 'desc'),
            'per_page' => $request->input('per_page', default: 10),
            'page' => $request->input('page', 1),
        ];

        $data = $this->projectService->getProjectDetail($id, $detailType, $respondentParams);

        return Inertia::render('Project/DetailProject', [
            'project' => $data['project'],
            'detailType' => $detailType,
            'stats' => $data['stats'],
            'ikmStats' => $data['ikmStats'],
            'sloiStats' => $data['sloiStats'],
            'demographics' => $data['demographics'],
            'questionScores' => $data['questionScores'],
            'allQuestions' => $data['allQuestions'],
            'auditLog' => $data['auditLog'],
            'trendData' => $data['trendData'],
            'respondents' => $data['respondents'],
            'enumeratorList' => $data['enumeratorList'],
            'sloiReliability' => $data['sloiReliability'] ?? null,
            'sloiAspectAnalysis' => $data['sloiAspectAnalysis'] ?? null,
            'respondentFilters' => [
                'enumerator' => $request->input('enumerator', ''),
                'resp_status' => $request->input('resp_status', ''),
                'education' => $request->input('education', ''),
                'gender' => $request->input('gender', ''),
                'sort_by' => $request->input('sort_by', 'submitted_at'),
                'sort_order' => $request->input('sort_order', 'desc'),
                'per_page' => $request->input('per_page', 10),
            ],
            'canEdit' => ! $isAdmin,
        ]);
    }

    public function createProjectPage()
    {
        $provinces = $this->areaService->getAllProvinces();

        return Inertia::render('Project/CreateProject', [
            'provinces' => $provinces,
        ]);
    }

    public function storeProject(CreateProjectRequest $request)
    {
        try {
            $user = Auth::user();
            $companyId = $user->company_id;

            $project = $this->projectService->createProject(
                $request->validated(),
                $companyId,
                $user->id
            );

            return redirect()
                ->route('projects.show', $project->id)
                ->with('success', 'Proyek berhasil dibuat.');
        } catch (\Throwable $th) {
            return redirect()->back()->with('error', 'Terjadi kesalahan saat membuat proyek: '.$th->getMessage());
        }

    }

    public function updateProject(UpdateProjectRequest $request, int $id)
    {
        try {
            $user = Auth::user();
            $companyId = $user->company_id;

            $this->projectService->updateProject(
                $id,
                $request->validated(),
                $companyId
            );

            return redirect()->back()->with('success', 'Proyek berhasil diperbarui.');
        } catch (\Throwable $th) {
            return redirect()->back()->with('error', 'Terjadi kesalahan: '.$th->getMessage());
        }
    }

    public function patchProject(Request $request, int $id)
    {
        try {
            $user = Auth::user();
            $companyId = $user->company_id;

            // Validate only fields that are present
            $validated = $request->validate([
                'name' => ['sometimes', 'string', 'max:200'],
                'description' => ['sometimes', 'nullable', 'string'],
                'status' => ['sometimes', 'string', 'in:draft,active'],
                'start_date' => ['sometimes', 'nullable', 'date'],
                'end_date' => ['sometimes', 'nullable', 'date', 'after_or_equal:start_date'],
                'target_ikm_count' => ['sometimes', 'nullable', 'integer', 'min:0'],
                'target_sloi_count' => ['sometimes', 'nullable', 'integer', 'min:0'],
                'enable_ikm' => ['sometimes', 'boolean'],
                'enable_sloi' => ['sometimes', 'boolean'],
                'ikm_template_id' => ['sometimes', 'nullable', 'integer', 'exists:instrument_templates,id'],
                'sloi_template_id' => ['sometimes', 'nullable', 'integer', 'exists:instrument_templates,id'],
                'district_ids' => ['sometimes', 'array'],
                'district_ids.*' => ['integer', 'exists:districts,id'],
                'descriptive_questions' => ['sometimes', 'nullable', 'array'],
                'descriptive_questions.*.id' => ['nullable', 'integer'],
                'descriptive_questions.*.title' => ['required', 'string', 'max:500'],
            ], [
                'name.max' => 'Nama proyek maksimal 200 karakter.',
                'end_date.after_or_equal' => 'Tanggal selesai harus setelah atau sama dengan tanggal mulai.',
                'district_ids.*.exists' => 'Kecamatan yang dipilih tidak valid.',
            ]);

            // Clean up empty values
            $cleanData = [];
            foreach ($validated as $key => $value) {
                if ($value === '' && in_array($key, ['description', 'start_date', 'end_date', 'ikm_template_id', 'sloi_template_id'])) {
                    $cleanData[$key] = null;
                } else {
                    $cleanData[$key] = $value;
                }
            }

            $this->projectService->patchProject(
                $id,
                $cleanData,
                $companyId
            );

            return redirect()->back()->with('success', 'Proyek berhasil diperbarui.');
        } catch (\Throwable $th) {
            return redirect()->back()->with('error', 'Terjadi kesalahan: '.$th->getMessage());
        }
    }

    public function getProjectForEdit(int $id)
    {
        $user = Auth::user();
        $data = $this->projectService->getProjectForEdit($id, $user->company_id);

        return response()->json($data);
    }

    public function getProjectEnumerators(int $projectId)
    {
        $user = Auth::user();
        $enumerators = $this->projectService->getProjectEnumerators($projectId, $user->company_id);

        return response()->json($enumerators);
    }

    public function updateStatus(Request $request, int $id)
    {
        $request->validate([
            'status' => ['required', 'string', 'in:active,draft'],
        ]);

        $user = Auth::user();

        $project = Project::where('id', $id)
            ->where('company_id', $user->company_id)
            ->firstOrFail();

        $project->update(['status' => $request->input('status')]);

        return redirect()->back()->with('success', 'Status proyek berhasil diperbarui.');
    }

    public function assignEnumerators(Request $request, int $projectId)
    {
        $request->validate([
            'enumerator_ids' => 'array',
            'enumerator_ids.*' => 'integer|exists:users,id',
        ]);

        $user = Auth::user();
        $companyId = $user->company_id;

        $this->projectService->assignEnumeratorsToProject(
            $projectId,
            $request->input('enumerator_ids', []),
            $companyId
        );

        return redirect()->back()->with('success', 'Enumerator berhasil di-assign.');
    }
}
