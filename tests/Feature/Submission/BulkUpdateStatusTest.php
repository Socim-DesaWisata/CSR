<?php

use App\Models\Company;
use App\Models\Project;
use App\Models\Submission;
use App\Models\SubmissionTimeline;
use App\Models\User;

beforeEach(function () {
    $this->company = Company::create([
        'name' => 'Test Company',
        'email' => 'company@test.com',
        'status' => 'active',
    ]);

    $this->user = User::factory()->create([
        'company_id' => $this->company->id,
        'role' => 'admin',
    ]);

    $this->project = Project::create([
        'company_id' => $this->company->id,
        'name' => 'Test Project',
        'project_code' => 'TST-001',
        'status' => 'active',
        'enable_ikm' => true,
        'enable_sloi' => false,
        'target_ikm_count' => 100,
        'target_sloi_count' => 0,
        'created_by' => $this->user->id,
    ]);
});

test('admin can bulk approve submissions', function () {
    $submissions = collect(range(1, 3))->map(fn ($i) => Submission::create([
        'company_id' => $this->company->id,
        'project_id' => $this->project->id,
        'assessment_type' => 'IKM',
        'enumerator_id' => $this->user->id,
        'status' => 'submitted',
        'photo_path' => "submissions/photo{$i}.jpg",
        'latitude' => -6.2,
        'longitude' => 106.8,
    ]));

    $response = $this
        ->actingAs($this->user)
        ->patch(route('submissions.bulk-status'), [
            'submission_ids' => $submissions->pluck('id')->toArray(),
            'status' => 'approved',
            'notes' => 'Data terverifikasi',
        ]);

    $response->assertRedirect();
    $response->assertSessionHas('success');

    foreach ($submissions as $sub) {
        expect($sub->fresh()->status)->toBe('approved');
    }

    expect(SubmissionTimeline::count())->toBe(3);
    expect(SubmissionTimeline::first()->action)->toBe('approved');
    expect(SubmissionTimeline::first()->notes)->toBe('Data terverifikasi');
});

test('admin can bulk reject submissions with notes', function () {
    $submission = Submission::create([
        'company_id' => $this->company->id,
        'project_id' => $this->project->id,
        'assessment_type' => 'IKM',
        'enumerator_id' => $this->user->id,
        'status' => 'submitted',
        'photo_path' => 'submissions/photo.jpg',
        'latitude' => -6.2,
        'longitude' => 106.8,
    ]);

    $response = $this
        ->actingAs($this->user)
        ->patch(route('submissions.bulk-status'), [
            'submission_ids' => [$submission->id],
            'status' => 'rejected',
            'notes' => 'Foto tidak jelas',
        ]);

    $response->assertRedirect();
    expect($submission->fresh()->status)->toBe('rejected');

    $timeline = SubmissionTimeline::first();
    expect($timeline->action)->toBe('rejected');
    expect($timeline->notes)->toBe('Foto tidak jelas');
    expect($timeline->decided_by)->toBe($this->user->id);
});

test('bulk update requires at least one submission id', function () {
    $response = $this
        ->actingAs($this->user)
        ->patch(route('submissions.bulk-status'), [
            'submission_ids' => [],
            'status' => 'approved',
        ]);

    $response->assertSessionHasErrors('submission_ids');
});

test('bulk update requires valid status', function () {
    $submission = Submission::create([
        'company_id' => $this->company->id,
        'project_id' => $this->project->id,
        'assessment_type' => 'IKM',
        'enumerator_id' => $this->user->id,
        'status' => 'submitted',
        'photo_path' => 'submissions/photo.jpg',
        'latitude' => -6.2,
        'longitude' => 106.8,
    ]);

    $response = $this
        ->actingAs($this->user)
        ->patch(route('submissions.bulk-status'), [
            'submission_ids' => [$submission->id],
            'status' => 'invalid_status',
        ]);

    $response->assertSessionHasErrors('status');
});

test('admin cannot update submissions from another company', function () {
    $otherCompany = Company::create([
        'name' => 'Other Company',
        'email' => 'other@test.com',
        'status' => 'active',
    ]);

    $otherUser = User::factory()->create([
        'company_id' => $otherCompany->id,
    ]);

    $submission = Submission::create([
        'company_id' => $otherCompany->id,
        'project_id' => $this->project->id,
        'assessment_type' => 'IKM',
        'enumerator_id' => $otherUser->id,
        'status' => 'submitted',
        'photo_path' => 'submissions/photo.jpg',
        'latitude' => -6.2,
        'longitude' => 106.8,
    ]);

    $response = $this
        ->actingAs($this->user)
        ->patch(route('submissions.bulk-status'), [
            'submission_ids' => [$submission->id],
            'status' => 'approved',
        ]);

    // Should succeed but not actually update since company_id doesn't match
    $response->assertRedirect();
    expect($submission->fresh()->status)->toBe('submitted');
});

test('notes are optional for bulk update', function () {
    $submission = Submission::create([
        'company_id' => $this->company->id,
        'project_id' => $this->project->id,
        'assessment_type' => 'IKM',
        'enumerator_id' => $this->user->id,
        'status' => 'submitted',
        'photo_path' => 'submissions/photo.jpg',
        'latitude' => -6.2,
        'longitude' => 106.8,
    ]);

    $response = $this
        ->actingAs($this->user)
        ->patch(route('submissions.bulk-status'), [
            'submission_ids' => [$submission->id],
            'status' => 'approved',
        ]);

    $response->assertRedirect();
    $response->assertSessionHas('success');
    expect($submission->fresh()->status)->toBe('approved');
    expect(SubmissionTimeline::first()->notes)->toBeNull();
});
