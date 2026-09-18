<?php

namespace App\Http\Controllers;

use App\Exports\ProjectRespondentsExport;
use App\Http\Requests\ExportProjectRespondentsRequest;
use App\Models\Project;
use App\Models\Submission;
use App\Models\TemplateQuestion;
use Illuminate\Support\Facades\Auth;
use Maatwebsite\Excel\Excel as ExcelWriter;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ExcelController extends Controller
{
    public function exportRespondents(ExportProjectRespondentsRequest $request, int $id): BinaryFileResponse
    {
        $user = Auth::user();
        $type = $request->string('type')->toString();

        $project = Project::query()
            ->whereKey($id)
            ->where('company_id', $user->company_id)
            ->firstOrFail();

        $templateId = $type === 'IKM'
            ? $project->ikm_template_id
            : $project->sloi_template_id;

        $questions = $templateId
            ? TemplateQuestion::query()
                ->where('template_id', $templateId)
                ->orderBy('order_no')
                ->get()
            : collect();

        $submissions = Submission::query()
            ->where('project_id', $id)
            ->where('assessment_type', $type)
            ->with(['respondent', 'enumerator', 'templateAnswers.question'])
            ->orderByDesc('submitted_at')
            ->get();

        $filename = "respondent_{$type}_{$project->project_code}_".now()->format('Ymd_His').'.xlsx';

        return Excel::download(
            new ProjectRespondentsExport($submissions, $questions, $type),
            $filename,
            ExcelWriter::XLSX,
        );
    }
}
