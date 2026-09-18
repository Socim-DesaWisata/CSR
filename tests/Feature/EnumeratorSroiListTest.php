<?php

use App\Models\Company;
use App\Models\Project;
use App\Models\ProjectEnumeratorAssignment;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

function createEnumeratorSroiListFixture(): array
{
    $company = Company::create(['name' => 'PT SROI List']);
    $enumerator = User::factory()->create([
        'company_id' => $company->id,
        'role' => 'enumerator',
    ]);
    $otherEnumerator = User::factory()->create([
        'company_id' => $company->id,
        'role' => 'enumerator',
    ]);

    $assignedSroi = Project::create([
        'company_id' => $company->id,
        'name' => 'Program SROI Terlihat',
        'project_code' => 'SROI-LIST-01',
        'status' => 'active',
        'enable_sroi' => true,
    ]);
    ProjectEnumeratorAssignment::create([
        'company_id' => $company->id,
        'project_id' => $assignedSroi->id,
        'enumerator_id' => $enumerator->id,
    ]);

    $assignedIkm = Project::create([
        'company_id' => $company->id,
        'name' => 'Program IKM Jangan Tampil',
        'project_code' => 'IKM-LIST-01',
        'status' => 'active',
        'enable_ikm' => true,
    ]);
    ProjectEnumeratorAssignment::create([
        'company_id' => $company->id,
        'project_id' => $assignedIkm->id,
        'enumerator_id' => $enumerator->id,
    ]);

    $unassignedSroi = Project::create([
        'company_id' => $company->id,
        'name' => 'Program SROI Tidak Ditugaskan',
        'project_code' => 'SROI-LIST-02',
        'status' => 'active',
        'enable_sroi' => true,
    ]);
    ProjectEnumeratorAssignment::create([
        'company_id' => $company->id,
        'project_id' => $unassignedSroi->id,
        'enumerator_id' => $otherEnumerator->id,
    ]);

    $draftSroi = Project::create([
        'company_id' => $company->id,
        'name' => 'Program SROI Draft',
        'project_code' => 'SROI-LIST-03',
        'status' => 'draft',
        'enable_sroi' => true,
    ]);
    ProjectEnumeratorAssignment::create([
        'company_id' => $company->id,
        'project_id' => $draftSroi->id,
        'enumerator_id' => $enumerator->id,
    ]);

    return compact('enumerator', 'assignedSroi', 'assignedIkm', 'unassignedSroi', 'draftSroi');
}

it('shows only assigned non-draft SROI projects', function () {
    $fixture = createEnumeratorSroiListFixture();

    $this->actingAs($fixture['enumerator'])
        ->get(route('enumerator.sroi.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Enumerator/SROI/ListSroi')
            ->has('projects.data', 1)
            ->where('projects.data.0.id', $fixture['assignedSroi']->id)
            ->where('projects.data.0.enable_sroi', true));
});

it('filters assigned SROI projects by search', function () {
    $fixture = createEnumeratorSroiListFixture();

    $this->actingAs($fixture['enumerator'])
        ->get(route('enumerator.sroi.index', ['search' => 'Terlihat']))
        ->assertInertia(fn (Assert $page) => $page
            ->has('projects.data', 1)
            ->where('projects.data.0.id', $fixture['assignedSroi']->id));
});

it('forbids non-enumerator users from the SROI project list', function () {
    $user = User::factory()->create(['role' => 'company']);

    $this->actingAs($user)
        ->get(route('enumerator.sroi.index'))
        ->assertForbidden();
});

it('shows the read-only SROI data page for an assigned project', function () {
    $fixture = createEnumeratorSroiListFixture();

    $this->actingAs($fixture['enumerator'])
        ->get(route('enumerator.sroi.data', $fixture['assignedSroi']))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Enumerator/SROI/DataSroi')
            ->where('project.id', $fixture['assignedSroi']->id)
            ->where('project.enable_sroi', true));
});

it('hides SROI data from enumerators without a project assignment', function () {
    $fixture = createEnumeratorSroiListFixture();

    $this->actingAs($fixture['enumerator'])
        ->get(route('enumerator.sroi.data', $fixture['unassignedSroi']))
        ->assertNotFound();
});
