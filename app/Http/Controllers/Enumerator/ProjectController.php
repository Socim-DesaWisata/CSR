<?php

namespace App\Http\Controllers\Enumerator;

use App\Http\Controllers\Controller;
use App\Services\ProjectService;
use Illuminate\Http\Request;
use Inertia\Inertia;

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
}
