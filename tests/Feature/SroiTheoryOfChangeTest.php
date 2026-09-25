<?php

use App\Models\Company;
use App\Models\SroiProgram;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use PhpOffice\PhpSpreadsheet\IOFactory;

function theoryFixture(): array
{
    $company = Company::create(['name' => 'Perusahaan Theory', 'status' => 'active']);
    $user = User::factory()->create(['company_id' => $company->id, 'role' => 'company', 'is_active' => true]);
    $category = DB::table('sroi_program_categories')->insertGetId([
        'company_id' => $company->id, 'code' => 'THEORY', 'name' => 'Theory', 'created_at' => now(), 'updated_at' => now(),
    ]);
    $program = SroiProgram::create([
        'company_id' => $company->id, 'category_id' => $category, 'name' => 'Program Theory',
        'pillar_name' => 'Sosial', 'initiator_owner_name' => 'Pemilik', 'start_year' => 2025,
        'end_year' => 2026, 'description' => 'Uraian', 'boundary_text' => 'Batas', 'created_by' => $user->id,
    ]);

    return [$company, $user, $program];
}

function theoryChanges(array $conditions = [], array $flows = []): array
{
    return [
        'conditions' => array_replace(['create' => [], 'update' => [], 'delete' => []], $conditions),
        'flows' => array_replace(['create' => [], 'update' => [], 'delete' => []], $flows),
    ];
}

it('saves creations, edits, and deletions from both tabs in one request', function () {
    [$company, $user, $program] = theoryFixture();
    $condition = ['initial_condition' => 'Awal', 'intervention' => 'Latihan', 'expected_condition' => 'Akhir'];
    $flow = ['input_text' => 'Dana', 'activity_text' => 'Pelatihan', 'output_text' => 'Peserta', 'outcome_text' => 'Usaha', 'impact_text' => 'Sejahtera'];

    $this->actingAs($user)->put(route('sroi.theory-of-change.save', $program), theoryChanges(
        ['create' => [$condition]], ['create' => [$flow]],
    ))->assertRedirect()->assertSessionHasNoErrors();

    $conditionId = DB::table('sroi_theory_of_change_conditions')->value('id');
    $flowId = DB::table('sroi_theory_of_change_flows')->value('id');
    $this->put(route('sroi.theory-of-change.save', $program), theoryChanges(
        ['update' => [['id' => $conditionId, 'original' => $condition, 'values' => [...$condition, 'intervention' => 'Pendampingan']]]],
        ['delete' => [['id' => $flowId, 'original' => $flow]], 'create' => [[...$flow, 'input_text' => 'Sumber Baru']]],
    ))->assertRedirect()->assertSessionHasNoErrors();

    expect(DB::table('sroi_theory_of_change_conditions')->where('id', $conditionId)->value('intervention'))->toBe('Pendampingan')
        ->and(DB::table('sroi_theory_of_change_flows')->where('id', $flowId)->exists())->toBeFalse()
        ->and(DB::table('sroi_theory_of_change_flows')->where('program_id', $program->id)->value('input_text'))->toBe('Sumber Baru')
        ->and(DB::table('sroi_audit_logs')->where('company_id', $company->id)->count())->toBe(5);
});

it('rejects invalid or stale batches without changing either tab', function () {
    [, $user, $program] = theoryFixture();
    $condition = ['initial_condition' => 'Awal', 'intervention' => 'Latihan', 'expected_condition' => 'Akhir'];
    $this->actingAs($user)->put(route('sroi.theory-of-change.save', $program), theoryChanges(
        ['create' => [$condition]], ['create' => [['input_text' => 'Dana']]],
    ))->assertSessionHasErrors('flows.create.0.activity_text');
    expect(DB::table('sroi_theory_of_change_conditions')->count())->toBe(0);

    $this->put(route('sroi.theory-of-change.save', $program), theoryChanges(['create' => [$condition]]))->assertSessionHasNoErrors();
    $conditionId = DB::table('sroi_theory_of_change_conditions')->value('id');
    DB::table('sroi_theory_of_change_conditions')->where('id', $conditionId)->update(['intervention' => 'Diubah orang lain']);

    $this->put(route('sroi.theory-of-change.save', $program), theoryChanges(
        ['update' => [['id' => $conditionId, 'original' => $condition, 'values' => [...$condition, 'expected_condition' => 'Baru']]]],
        ['create' => [['input_text' => 'Dana', 'activity_text' => 'Latihan', 'output_text' => 'Hasil', 'outcome_text' => 'Usaha', 'impact_text' => 'Manfaat']]],
    ))->assertSessionHasErrors('record');
    expect(DB::table('sroi_theory_of_change_conditions')->value('intervention'))->toBe('Diubah orang lain')
        ->and(DB::table('sroi_theory_of_change_flows')->count())->toBe(0);

    $current = [...$condition, 'intervention' => 'Diubah orang lain'];
    $this->put(route('sroi.theory-of-change.save', $program), theoryChanges(
        ['update' => [['id' => $conditionId, 'original' => $current, 'values' => $condition]],
            'delete' => [['id' => $conditionId, 'original' => $current]]],
    ))->assertSessionHasErrors('record');
});

it('rejects other program rows and viewers', function () {
    [$company, $owner, $program] = theoryFixture();
    $other = SroiProgram::create([
        'company_id' => $company->id, 'category_id' => $program->category_id, 'name' => 'Program Lain',
        'pillar_name' => 'Sosial', 'initiator_owner_name' => 'Pemilik', 'start_year' => 2025,
        'end_year' => 2026, 'description' => 'Uraian', 'boundary_text' => 'Batas', 'created_by' => $owner->id,
    ]);
    $condition = ['initial_condition' => 'Awal', 'intervention' => 'Latihan', 'expected_condition' => 'Akhir'];
    $this->actingAs($owner)->put(route('sroi.theory-of-change.save', $other), theoryChanges(['create' => [$condition]]))->assertSessionHasNoErrors();
    $foreignId = DB::table('sroi_theory_of_change_conditions')->value('id');
    $this->put(route('sroi.theory-of-change.save', $program), theoryChanges(
        ['delete' => [['id' => $foreignId, 'original' => $condition]]],
    ))->assertSessionHasErrors('record');
    expect(DB::table('sroi_theory_of_change_conditions')->where('id', $foreignId)->exists())->toBeTrue();

    $viewer = User::factory()->create(['company_id' => $company->id, 'role' => 'company', 'is_active' => true]);
    DB::table('sroi_program_members')->insert([
        ['company_id' => $company->id, 'program_id' => $program->id, 'user_id' => $owner->id, 'participation' => 'owner', 'created_at' => now(), 'updated_at' => now()],
        ['company_id' => $company->id, 'program_id' => $program->id, 'user_id' => $viewer->id, 'participation' => 'viewer', 'created_at' => now(), 'updated_at' => now()],
    ]);
    $this->actingAs($viewer)->put(route('sroi.theory-of-change.save', $program), theoryChanges(['create' => [$condition]]))->assertForbidden();

    $outsideCompany = Company::create(['name' => 'Perusahaan Luar', 'status' => 'active']);
    $outsider = User::factory()->create(['company_id' => $outsideCompany->id, 'role' => 'company', 'is_active' => true]);
    $this->actingAs($outsider)->put(route('sroi.theory-of-change.save', $program), theoryChanges(['create' => [$condition]]))->assertForbidden();
});

it('exports only the selected tab and preserves legacy exports', function () {
    Storage::fake('local');
    [, $user, $program] = theoryFixture();
    $this->actingAs($user)->put(route('sroi.theory-of-change.save', $program), theoryChanges(
        ['create' => [['initial_condition' => 'KondisiKhusus', 'intervention' => 'Langkah', 'expected_condition' => 'Harapan']]],
        ['create' => [['input_text' => 'InputKhusus', 'activity_text' => 'Aktivitas', 'output_text' => 'Output', 'outcome_text' => 'Outcome', 'impact_text' => 'Impact']]],
    ))->assertSessionHasNoErrors();

    foreach (['conditions', 'flows'] as $section) {
        $this->post(route('sroi.exports.store', [$program, 'theory-of-change']), ['section' => $section])->assertRedirect()->assertSessionHasNoErrors();
    }
    $this->post(route('sroi.exports.store', [$program, 'theory-of-change']))->assertRedirect()->assertSessionHasNoErrors();
    $this->post(route('sroi.exports.store', [$program, 'theory-of-change']), ['section' => 'unknown'])->assertSessionHasErrors('section');
    $exports = DB::table('sroi_report_exports')->orderBy('id')->get();
    expect($exports->pluck('stage')->all())->toBe(['theory-of-change:conditions', 'theory-of-change:flows', 'theory-of-change']);

    foreach ($exports as $index => $export) {
        $sheet = IOFactory::load(Storage::disk('local')->path($export->object_key))->getActiveSheet()->toArray();
        $text = json_encode($sheet);
        expect($text)->toContain($index === 1 ? 'InputKhusus' : 'KondisiKhusus');
        if ($index !== 2) {
            expect($text)->not->toContain($index === 0 ? 'InputKhusus' : 'KondisiKhusus');
        }
    }
    $this->get(route('sroi.programs.stage', [$program, 'theory-of-change']))->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('Sroi/TheoryOfChange')->has('exports', 3));
});
