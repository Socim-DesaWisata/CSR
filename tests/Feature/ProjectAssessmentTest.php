<?php

use App\Models\Company;
use App\Models\Project;
use App\Models\User;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Schema;

it('does not register SROI routes', function () {
    expect(Route::has('enumerator.sroi.index'))->toBeFalse()
        ->and(Route::has('projects.sroi.forms.store'))->toBeFalse();
});

it('omits SROI schema from new installations', function () {
    expect(Schema::hasTable('project_stakeholders'))->toBeFalse()
        ->and(Schema::hasTable('project_sroi_forms'))->toBeFalse()
        ->and(Schema::hasTable('submission_sroi_answers'))->toBeFalse()
        ->and(Schema::hasColumn('projects', 'enable_sroi'))->toBeFalse()
        ->and(Schema::hasColumn('respondents', 'stakeholder_id'))->toBeFalse()
        ->and(Schema::hasColumn('submissions', 'project_sroi_form_id'))->toBeFalse();
});

it('rejects a removed assessment type on the respondent survey', function () {
    $company = Company::create(['name' => 'Perusahaan Survei']);
    $enumerator = User::factory()->create(['company_id' => $company->id, 'role' => 'enumerator']);
    $project = Project::create([
        'company_id' => $company->id,
        'name' => 'Proyek IKM',
        'project_code' => 'IKM-RESET',
        'status' => 'active',
        'enable_ikm' => true,
    ]);

    $this->actingAs($enumerator)
        ->get(route('enumerator.survey.respondent', [
            'projectId' => $project->id,
            'projectCode' => $project->project_code,
            'surveyType' => 'SROI',
        ]))
        ->assertNotFound();
});
