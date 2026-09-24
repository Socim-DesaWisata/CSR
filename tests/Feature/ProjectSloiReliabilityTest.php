<?php

use App\Models\Company;
use App\Models\InstrumentTemplate;
use App\Models\Project;
use App\Models\Respondent;
use App\Models\Submission;
use App\Models\SubmissionTemplateAnswer;
use App\Models\TemplateQuestion;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

it('returns simplified sloi reliability data for the project detail page', function () {
    $company = Company::create([
        'name' => 'PT Uji CSR',
    ]);

    $user = User::factory()->create([
        'company_id' => $company->id,
        'role' => 'company',
    ]);

    $template = InstrumentTemplate::create([
        'type' => 'SLOI',
        'name' => 'Template SLOI Uji',
        'version' => 1,
        'is_active' => true,
        'created_by' => $user->id,
    ]);

    $questionOne = TemplateQuestion::create([
        'template_id' => $template->id,
        'category' => 'sloi',
        'code' => 'S1',
        'aspect' => 'Interactional Trust',
        'question_text' => 'Perusahaan mendengarkan masyarakat.',
        'order_no' => 1,
    ]);

    $questionTwo = TemplateQuestion::create([
        'template_id' => $template->id,
        'category' => 'sloi',
        'code' => 'S2',
        'aspect' => 'Interactional Trust',
        'question_text' => 'Perusahaan berbagi informasi.',
        'order_no' => 2,
    ]);

    $project = Project::create([
        'company_id' => $company->id,
        'name' => 'Program SLOI',
        'project_code' => 'PROJ-SLOI-01',
        'status' => 'active',
        'target_ikm_count' => 0,
        'target_sloi_count' => 3,
        'enable_ikm' => false,
        'enable_sloi' => true,
        'sloi_template_id' => $template->id,
        'created_by' => $user->id,
    ]);

    $respondents = collect([
        ['name' => 'Responden 1', 'answers' => [5, 5]],
        ['name' => 'Responden 2', 'answers' => [4, 4]],
        ['name' => 'Responden 3', 'answers' => [3, 3]],
    ])->map(function (array $item) use ($company, $project, $user) {
        return Respondent::create([
            'company_id' => $company->id,
            'project_id' => $project->id,
            'name' => $item['name'],
            'created_by' => $user->id,
        ]);
    });

    $questionIds = [$questionOne->id, $questionTwo->id];
    $answerSets = [
        [5, 5],
        [4, 4],
        [3, 3],
    ];

    foreach ($respondents as $index => $respondent) {
        $submission = Submission::create([
            'company_id' => $company->id,
            'project_id' => $project->id,
            'assessment_type' => 'SLOI',
            'respondent_id' => $respondent->id,
            'enumerator_id' => $user->id,
            'status' => 'approved',
            'photo_path' => 'submissions/test-'.$index.'.jpg',
            'latitude' => -6.2,
            'longitude' => 106.8,
            'submitted_at' => now()->addMinutes($index),
        ]);

        foreach ($questionIds as $questionIndex => $questionId) {
            SubmissionTemplateAnswer::create([
                'submission_id' => $submission->id,
                'question_id' => $questionId,
                'type' => 'sloi',
                'value' => $answerSets[$index][$questionIndex],
            ]);
        }
    }

    $response = $this->actingAs($user)->get(route('projects.show', [
        'id' => $project->id,
        'detailType' => 'sloi',
    ]));

    $response
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Project/DetailProject')
            ->where('detailType', 'sloi')
            ->has('sloiReliability', fn (Assert $reliability) => $reliability
                ->where('n', 3)
                ->where('k', 2)
                ->where('alphaStatus', 'Reliabilitas sangat tinggi')
                ->missing('sumItemVariances')
                ->missing('varTotal')
                ->has('items', 2)
                ->has('items.0', fn (Assert $item) => $item
                    ->where('validityLabel', 'Validitas sangat tinggi')
                    ->where('isValid', true)
                    ->missing('variance')
                    ->etc()
                )
                ->etc()
            ));
});
