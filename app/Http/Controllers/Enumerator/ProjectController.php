<?php

namespace App\Http\Controllers\Enumerator;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\ProjectEnumeratorAssignment;
use App\Services\ProjectService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProjectController extends Controller
{
    protected $projectService;

    public function __construct(ProjectService $projectService)
    {
        $this->projectService = $projectService;
    }

    public function listProjectPage(Request $request)
    {
        $user = $request->user();

        $projects = $this->projectService->getProjectsByEnumerator(
            $user->id,
            $request->all()
        );

        return Inertia::render('Enumerator/Project/ListProject', [
            'projects' => $projects,
            'filters' => $request->only(['search', 'status', 'sort_by', 'sort_order']),
        ]);
    }

    public function listSroiPage(Request $request): Response
    {
        abort_unless($request->user()?->role === 'enumerator', 403);

        $projects = $this->projectService->getSroiProjectsByEnumerator(
            $request->user()->id,
            $request->only(['search', 'status', 'sort_by', 'sort_order', 'per_page']),
        );

        return Inertia::render('Enumerator/SROI/ListSroi', [
            'projects' => $projects,
            'filters' => $request->only(['search', 'status', 'sort_by', 'sort_order']),
        ]);
    }

    public function dataSroiPage(Request $request, Project $project): Response
    {
        abort_unless($request->user()?->role === 'enumerator', 403);

        $isAssigned = ProjectEnumeratorAssignment::query()
            ->where('project_id', $project->id)
            ->where('enumerator_id', $request->user()->id)
            ->exists();

        abort_unless($project->enable_sroi && $isAssigned, 404);

        return Inertia::render('Enumerator/SROI/DataSroi', [
            'project' => [
                'id' => $project->id,
                'name' => $project->name,
                'projectCode' => $project->project_code,
                'enable_sroi' => $project->enable_sroi,
            ],
        ]);
    }
}
