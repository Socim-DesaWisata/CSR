<?php

use App\Models\Company;
use App\Models\SroiProgram;
use App\Models\User;
use Illuminate\Support\Facades\DB;

function lfaBatchProgramForTest(): array
{
    $company = Company::create(['name' => 'Perusahaan LFA', 'status' => 'active']);
    $user = User::factory()->create(['company_id' => $company->id, 'role' => 'company', 'is_active' => true]);
    $category = DB::table('sroi_program_categories')->insertGetId([
        'company_id' => $company->id, 'code' => 'LFA', 'name' => 'LFA', 'created_at' => now(), 'updated_at' => now(),
    ]);
    $program = SroiProgram::create([
        'company_id' => $company->id, 'category_id' => $category, 'name' => 'Program LFA',
        'pillar_name' => 'Sosial', 'initiator_owner_name' => 'Pemilik', 'start_year' => 2025,
        'end_year' => 2026, 'description' => 'Uraian', 'boundary_text' => 'Batas', 'created_by' => $user->id,
    ]);

    return [$user, $program];
}

function lfaNodeValuesForTest(int|string|null $parent, string $level, string $element): array
{
    return [
        'parent_id' => $parent,
        'level' => $level,
        'code' => null,
        'element' => $element,
        'indicator' => null,
        'verification_source' => null,
        'assumptions' => null,
    ];
}

function lfaBatchForTest(array $nodes): array
{
    return ['sections' => ['nodes' => array_replace(['create' => [], 'update' => [], 'delete' => []], $nodes)]];
}

it('saves a complete LFA hierarchy atomically from draft references', function () {
    [$user, $program] = lfaBatchProgramForTest();

    $this->actingAs($user)->put(route('sroi.stages.batch-save', [$program, 'lfa']), lfaBatchForTest([
        'create' => [
            'goal' => ['values' => lfaNodeValuesForTest(null, 'goal', 'Goal utama')],
            'purpose' => ['values' => lfaNodeValuesForTest('@draft:goal', 'purpose', 'Purpose utama')],
            'output' => ['values' => lfaNodeValuesForTest('@draft:purpose', 'output', 'Output utama')],
            'activity' => ['values' => lfaNodeValuesForTest('@draft:output', 'activity', 'Activity utama')],
        ],
    ]))->assertRedirect()->assertSessionHasNoErrors();

    $nodes = DB::table('sroi_lfa_nodes')->where('program_id', $program->id)->orderBy('id')->get();
    expect($nodes)->toHaveCount(4)
        ->and($nodes[1]->parent_id)->toBe($nodes[0]->id)
        ->and($nodes[2]->parent_id)->toBe($nodes[1]->id)
        ->and($nodes[3]->parent_id)->toBe($nodes[2]->id);
});

it('rejects LFA draft parents from the wrong level without writing any rows', function () {
    [$user, $program] = lfaBatchProgramForTest();

    $this->actingAs($user)->put(route('sroi.stages.batch-save', [$program, 'lfa']), lfaBatchForTest([
        'create' => [
            'goal' => ['values' => lfaNodeValuesForTest(null, 'goal', 'Goal utama')],
            'output' => ['values' => lfaNodeValuesForTest('@draft:goal', 'output', 'Output tanpa Purpose')],
        ],
    ]))->assertSessionHasErrors('sections.nodes.create.output.values.parent_id');

    expect(DB::table('sroi_lfa_nodes')->where('program_id', $program->id)->count())->toBe(0);
});

it('rejects persisted LFA parents from another level or program', function () {
    [$user, $program] = lfaBatchProgramForTest();
    $otherProgram = SroiProgram::create([
        'company_id' => $program->company_id, 'category_id' => $program->category_id, 'name' => 'Program lain',
        'pillar_name' => 'Sosial', 'initiator_owner_name' => 'Pemilik', 'start_year' => 2025,
        'end_year' => 2026, 'description' => 'Uraian', 'boundary_text' => 'Batas', 'created_by' => $user->id,
    ]);
    $sameProgramGoal = DB::table('sroi_lfa_nodes')->insertGetId([
        'company_id' => $program->company_id, 'program_id' => $program->id, 'parent_id' => null,
        'level' => 'goal', 'code' => null, 'element' => 'Goal', 'sort_order' => 1,
        'created_at' => now(), 'updated_at' => now(),
    ]);
    $otherProgramGoal = DB::table('sroi_lfa_nodes')->insertGetId([
        'company_id' => $program->company_id, 'program_id' => $otherProgram->id, 'parent_id' => null,
        'level' => 'goal', 'code' => null, 'element' => 'Goal program lain', 'sort_order' => 1,
        'created_at' => now(), 'updated_at' => now(),
    ]);

    $this->actingAs($user)->put(route('sroi.stages.batch-save', [$program, 'lfa']), lfaBatchForTest([
        'create' => [
            'wrong-level' => ['values' => lfaNodeValuesForTest($sameProgramGoal, 'output', 'Output tanpa Purpose')],
        ],
    ]))->assertSessionHasErrors('sections.nodes.create.wrong-level.values.parent_id');

    $this->actingAs($user)->put(route('sroi.stages.batch-save', [$program, 'lfa']), lfaBatchForTest([
        'create' => [
            'wrong-program' => ['values' => lfaNodeValuesForTest($otherProgramGoal, 'purpose', 'Purpose program lain')],
        ],
    ]))->assertSessionHasErrors('sections.nodes.create.wrong-program.values.parent_id');

    expect(DB::table('sroi_lfa_nodes')->where('program_id', $program->id)->count())->toBe(1);
});

it('rolls back a batch that deletes a goal with remaining purposes', function () {
    [$user, $program] = lfaBatchProgramForTest();
    $goal = DB::table('sroi_lfa_nodes')->insertGetId([
        'company_id' => $program->company_id, 'program_id' => $program->id, 'parent_id' => null,
        'level' => 'goal', 'code' => null, 'element' => 'Goal utama', 'indicator' => null,
        'verification_source' => null, 'assumptions' => null, 'sort_order' => 1,
        'created_at' => now(), 'updated_at' => now(),
    ]);
    DB::table('sroi_lfa_nodes')->insert([
        'company_id' => $program->company_id, 'program_id' => $program->id, 'parent_id' => $goal,
        'level' => 'purpose', 'code' => null, 'element' => 'Purpose terkait', 'indicator' => null,
        'verification_source' => null, 'assumptions' => null, 'sort_order' => 2,
        'created_at' => now(), 'updated_at' => now(),
    ]);

    $this->actingAs($user)->put(route('sroi.stages.batch-save', [$program, 'lfa']), lfaBatchForTest([
        'delete' => [[
            'id' => $goal,
            'original' => lfaNodeValuesForTest(null, 'goal', 'Goal utama'),
        ]],
    ]))->assertSessionHasErrors('record');

    expect(DB::table('sroi_lfa_nodes')->where('program_id', $program->id)->count())->toBe(2)
        ->and(DB::table('sroi_audit_logs')->where('company_id', $program->company_id)->count())->toBe(0);
});

it('does not allow an SROI viewer to save the LFA', function () {
    [$user, $program] = lfaBatchProgramForTest();
    $viewer = User::factory()->create(['company_id' => $program->company_id, 'role' => 'company', 'is_active' => true]);
    DB::table('sroi_program_members')->insert([
        'company_id' => $program->company_id, 'program_id' => $program->id,
        'user_id' => $user->id, 'participation' => 'owner',
        'created_at' => now(), 'updated_at' => now(),
    ]);
    DB::table('sroi_program_members')->insert([
        'company_id' => $program->company_id, 'program_id' => $program->id,
        'user_id' => $viewer->id, 'participation' => 'viewer',
        'created_at' => now(), 'updated_at' => now(),
    ]);

    $this->actingAs($viewer)->put(route('sroi.stages.batch-save', [$program, 'lfa']), lfaBatchForTest([
        'create' => ['goal' => ['values' => lfaNodeValuesForTest(null, 'goal', 'Goal')]],
    ]))->assertForbidden();

    expect(DB::table('sroi_lfa_nodes')->where('program_id', $program->id)->count())->toBe(0);
});
