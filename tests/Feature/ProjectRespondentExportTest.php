<?php

use App\Models\Company;
use App\Models\InstrumentTemplate;
use App\Models\Project;
use App\Models\Respondent;
use App\Models\Submission;
use App\Models\SubmissionTemplateAnswer;
use App\Models\TemplateQuestion;
use App\Models\User;
use Illuminate\Testing\TestResponse;
use PhpOffice\PhpSpreadsheet\IOFactory;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

beforeEach(function () {
    $this->company = Company::create(['name' => 'PT Export Excel']);
    $this->user = User::factory()->create([
        'company_id' => $this->company->id,
        'role' => 'company',
    ]);

    $this->ikmTemplate = InstrumentTemplate::create([
        'type' => 'IKM',
        'name' => 'Template IKM Export',
        'version' => 1,
        'is_active' => true,
        'created_by' => $this->user->id,
    ]);
    $this->sloiTemplate = InstrumentTemplate::create([
        'type' => 'SLOI',
        'name' => 'Template SLOI Export',
        'version' => 1,
        'is_active' => true,
        'created_by' => $this->user->id,
    ]);

    $this->ikmQuestion = TemplateQuestion::create([
        'template_id' => $this->ikmTemplate->id,
        'category' => 'ikm',
        'code' => 'IKM1',
        'aspect' => 'Kualitas Layanan',
        'question_text' => 'Bagaimana kualitas layanan?',
        'order_no' => 1,
    ]);
    $this->sloiQuestion = TemplateQuestion::create([
        'template_id' => $this->sloiTemplate->id,
        'category' => 'sloi',
        'code' => 'SLOI1',
        'aspect' => 'Legitimasi',
        'question_text' => 'Apakah perusahaan dipercaya?',
        'order_no' => 1,
    ]);

    $this->project = Project::create([
        'company_id' => $this->company->id,
        'name' => 'Project Export',
        'project_code' => 'EXP-2026',
        'status' => 'active',
        'target_ikm_count' => 1,
        'target_sloi_count' => 1,
        'enable_ikm' => true,
        'enable_sloi' => true,
        'ikm_template_id' => $this->ikmTemplate->id,
        'sloi_template_id' => $this->sloiTemplate->id,
        'created_by' => $this->user->id,
    ]);

    $this->respondent = Respondent::create([
        'company_id' => $this->company->id,
        'project_id' => $this->project->id,
        'name' => 'Responden Export',
        'address' => '=SUM(A1:A2)',
        'phone' => '08123456789',
        'age' => 35,
        'gender' => 'Laki-laki',
        'respondent_status' => 'Masyarakat',
        'education_level' => 'S1',
        'main_occupation' => 'Wiraswasta',
        'monthly_income' => '5000000',
        'created_by' => $this->user->id,
    ]);

    $ikmSubmission = createExportSubmission(
        $this->company->id,
        $this->project->id,
        $this->respondent->id,
        $this->user->id,
        'IKM',
    );
    SubmissionTemplateAnswer::create([
        'submission_id' => $ikmSubmission->id,
        'question_id' => $this->ikmQuestion->id,
        'type' => 'ikm-kepentingan',
        'value' => 4,
    ]);
    SubmissionTemplateAnswer::create([
        'submission_id' => $ikmSubmission->id,
        'question_id' => $this->ikmQuestion->id,
        'type' => 'ikm-kinerja',
        'value' => 3,
    ]);

    $sloiSubmission = createExportSubmission(
        $this->company->id,
        $this->project->id,
        $this->respondent->id,
        $this->user->id,
        'SLOI',
    );
    SubmissionTemplateAnswer::create([
        'submission_id' => $sloiSubmission->id,
        'question_id' => $this->sloiQuestion->id,
        'type' => 'sloi',
        'value' => 5,
    ]);
});

it('downloads IKM respondents as a native xlsx workbook', function () {
    $response = $this->actingAs($this->user)->get(route('projects.export-respondents', [
        'id' => $this->project->id,
        'type' => 'IKM',
    ]));

    $sheet = exportedSheet($response, 'respondent_IKM_EXP-2026_', 'Responden IKM');

    expect($sheet->getCell('Q1')->getValue())->toBe('IKM1 - Kepentingan')
        ->and($sheet->getCell('R1')->getValue())->toBe('IKM1 - Kinerja')
        ->and($sheet->getCell('F2')->getValue())->toBe('Responden Export')
        ->and($sheet->getCell('G2')->getValue())->toBe("'=SUM(A1:A2)")
        ->and($sheet->getCell('Q2')->getValue())->toBe(4)
        ->and($sheet->getCell('R2')->getValue())->toBe(3)
        ->and($sheet->getCell('U2')->getValue())->toBe(3.5);
});

it('downloads SLOI respondents as a native xlsx workbook', function () {
    $response = $this->actingAs($this->user)->get(route('projects.export-respondents', [
        'id' => $this->project->id,
        'type' => 'SLOI',
    ]));

    $sheet = exportedSheet($response, 'respondent_SLOI_EXP-2026_', 'Responden SLOI');

    expect($sheet->getCell('Q1')->getValue())->toBe('SLOI1 - Nilai')
        ->and($sheet->getCell('Q2')->getValue())->toBe(5)
        ->and($sheet->getCell('R1')->getValue())->toBe('Rata-rata Skor')
        ->and($sheet->getCell('R2')->getValue())->toBe(5.0);
});

it('rejects an unsupported respondent export type', function () {
    $this->actingAs($this->user)
        ->getJson(route('projects.export-respondents', [
            'id' => $this->project->id,
            'type' => 'SROI',
        ]))
        ->assertUnprocessable()
        ->assertJsonValidationErrors('type');
});

it('does not export a project owned by another company', function () {
    $otherUser = User::factory()->create([
        'company_id' => Company::create(['name' => 'PT Lain'])->id,
        'role' => 'company',
    ]);

    $this->actingAs($otherUser)
        ->get(route('projects.export-respondents', [
            'id' => $this->project->id,
            'type' => 'IKM',
        ]))
        ->assertNotFound();
});

function createExportSubmission(
    int $companyId,
    int $projectId,
    int $respondentId,
    int $enumeratorId,
    string $type,
): Submission {
    return Submission::create([
        'company_id' => $companyId,
        'project_id' => $projectId,
        'assessment_type' => $type,
        'respondent_id' => $respondentId,
        'enumerator_id' => $enumeratorId,
        'status' => 'approved',
        'photo_path' => 'submissions/export.jpg',
        'latitude' => -6.2,
        'longitude' => 106.8,
        'submitted_at' => '2026-09-18 09:30:00',
    ]);
}

function exportedSheet(TestResponse $response, string $filenamePrefix, string $sheetTitle)
{
    $response->assertSuccessful()->assertDownload();

    expect($response->headers->get('content-type'))
        ->toContain('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        ->and($response->headers->get('content-disposition'))
        ->toContain($filenamePrefix)
        ->toContain('.xlsx')
        ->and($response->baseResponse)
        ->toBeInstanceOf(BinaryFileResponse::class);

    $spreadsheet = IOFactory::load($response->baseResponse->getFile()->getPathname());
    $sheet = $spreadsheet->getActiveSheet();

    expect($sheet->getTitle())->toBe($sheetTitle)
        ->and($sheet->getAutoFilter()->getRange())->not->toBe('')
        ->and($sheet->getFreezePane())->toBe('A2');

    return $sheet;
}
