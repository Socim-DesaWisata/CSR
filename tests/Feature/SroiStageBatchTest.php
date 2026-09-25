<?php

use App\Models\Company;
use App\Models\SroiProgram;
use App\Models\User;
use Illuminate\Support\Facades\DB;

function batchProgram(): array
{
    $company = Company::create(['name' => 'Perusahaan Batch', 'status' => 'active']);
    $user = User::factory()->create(['company_id' => $company->id, 'role' => 'company', 'is_active' => true]);
    $category = DB::table('sroi_program_categories')->insertGetId([
        'company_id' => $company->id, 'code' => 'BATCH', 'name' => 'Batch', 'created_at' => now(), 'updated_at' => now(),
    ]);
    $program = SroiProgram::create([
        'company_id' => $company->id, 'category_id' => $category, 'name' => 'Program Batch',
        'pillar_name' => 'Sosial', 'initiator_owner_name' => 'Pemilik', 'start_year' => 2025,
        'end_year' => 2026, 'description' => 'Uraian', 'boundary_text' => 'Batas', 'created_by' => $user->id,
    ]);

    return [$company, $user, $program];
}

function roadmapBatch(array $items = [], array $targets = []): array
{
    return ['sections' => [
        'items' => array_replace(['create' => [], 'update' => [], 'delete' => []], $items),
        'targets' => array_replace(['create' => [], 'update' => [], 'delete' => []], $targets),
    ]];
}

function batchSection(array $entries = []): array
{
    return array_replace(['create' => [], 'update' => [], 'delete' => []], $entries);
}

function batchImpactReferences(SroiProgram $program): array
{
    $stakeholderCategory = DB::table('sroi_stakeholder_categories')->insertGetId([
        'company_id' => $program->company_id, 'program_category_id' => $program->category_id,
        'code' => 'IMPACT', 'name' => 'Impact', 'active' => true,
    ]);
    $stakeholderList = DB::table('sroi_stakeholder_category_lists')->insertGetId([
        'company_id' => $program->company_id, 'program_category_id' => $program->category_id,
        'stakeholder_category_id' => $stakeholderCategory, 'code' => 'IMPACT', 'name' => 'Impact', 'active' => true,
    ]);
    $stakeholder = DB::table('sroi_program_stakeholders')->insertGetId([
        'company_id' => $program->company_id, 'program_id' => $program->id,
        'program_category_id' => $program->category_id, 'stakeholder_category_list_id' => $stakeholderList,
        'role_in_program' => 'Warga', 'included' => true, 'inclusion_reason' => 'Terdampak', 'sort_order' => 1,
    ]);
    $outcomeCategory = DB::table('sroi_outcome_categories')->insertGetId([
        'company_id' => $program->company_id, 'program_category_id' => $program->category_id,
        'code' => 'IMPACT', 'name' => 'Impact', 'active' => true,
    ]);
    $outcome = DB::table('sroi_program_outcomes')->insertGetId([
        'company_id' => $program->company_id, 'program_id' => $program->id,
        'program_category_id' => $program->category_id, 'stakeholder_id' => $stakeholder,
        'outcome_category_id' => $outcomeCategory, 'name' => 'Pendapatan', 'description' => 'Uraian',
        'relevant' => true, 'significant' => true, 'material' => true,
        'materiality_reason' => 'Penting', 'materiality_explanation' => null, 'sort_order' => 1,
    ]);
    $indicator = DB::table('sroi_outcome_indicators')->insertGetId([
        'company_id' => $program->company_id, 'outcome_id' => $outcome, 'name' => 'Pendapatan',
        'unit' => 'rupiah', 'evidence' => 'Catatan', 'evidence_source' => 'Survei', 'sort_order' => 1,
    ]);
    $proxy = DB::table('sroi_financial_proxies')->insertGetId([
        'company_id' => $program->company_id, 'outcome_id' => $outcome, 'approach' => 'Harga pasar',
        'description' => null, 'source' => 'Data pasar', 'unit' => 'rupiah', 'unit_value' => 1000, 'currency_code' => 'IDR',
    ]);

    return [$outcome, $indicator, $proxy];
}

it('creates related roadmap rows from draft keys in one audited transaction', function () {
    [$company, $user, $program] = batchProgram();

    $this->actingAs($user)->put(route('sroi.stages.batch-save', [$program, 'roadmap']), roadmapBatch(
        ['create' => ['new-item' => ['values' => ['lfa_activity_id' => null]]]],
        ['create' => ['new-target' => ['values' => [
            'roadmap_item_id' => '@draft:new-item', 'year' => 2025, 'target_quantity' => 12, 'unit' => 'orang',
        ]]]],
    ))->assertRedirect()->assertSessionHasNoErrors();

    $item = DB::table('sroi_roadmap_items')->first();
    expect($item)->not->toBeNull()
        ->and(DB::table('sroi_roadmap_targets')->value('roadmap_item_id'))->toBe($item->id)
        ->and(DB::table('sroi_audit_logs')->where('company_id', $company->id)->count())->toBe(2);
});

it('rolls back a whole batch when target years conflict', function () {
    [, $user, $program] = batchProgram();
    $values = ['roadmap_item_id' => '@draft:new-item', 'year' => 2025, 'target_quantity' => 12, 'unit' => 'orang'];

    $this->actingAs($user)->put(route('sroi.stages.batch-save', [$program, 'roadmap']), roadmapBatch(
        ['create' => ['new-item' => ['values' => ['lfa_activity_id' => null]]]],
        ['create' => ['first' => ['values' => $values], 'second' => ['values' => $values]]],
    ))->assertSessionHasErrors();

    expect(DB::table('sroi_roadmap_items')->count())->toBe(0)
        ->and(DB::table('sroi_roadmap_targets')->count())->toBe(0);
});

it('rolls back inserts when a staged parent deletion violates a relationship', function () {
    [, $user, $program] = batchProgram();
    $item = DB::table('sroi_roadmap_items')->insertGetId([
        'company_id' => $program->company_id, 'program_id' => $program->id,
        'sort_order' => 1, 'created_at' => now(), 'updated_at' => now(),
    ]);
    DB::table('sroi_roadmap_targets')->insert([
        'company_id' => $program->company_id, 'program_id' => $program->id,
        'roadmap_item_id' => $item, 'year' => 2025, 'target_quantity' => null, 'unit' => null,
        'created_at' => now(), 'updated_at' => now(),
    ]);
    $original = ['lfa_activity_id' => ''];

    $this->actingAs($user)->put(route('sroi.stages.batch-save', [$program, 'roadmap']), roadmapBatch(
        [
            'create' => ['new-item' => ['values' => ['lfa_activity_id' => null]]],
            'delete' => [$item => ['id' => $item, 'original' => $original]],
        ],
        ['create' => ['new-target' => ['values' => [
            'roadmap_item_id' => '@draft:new-item', 'year' => 2026, 'target_quantity' => null, 'unit' => null,
        ]]]],
    ))->assertSessionHasErrors('record');

    expect(DB::table('sroi_roadmap_items')->count())->toBe(1)
        ->and(DB::table('sroi_roadmap_targets')->count())->toBe(1);
});

it('saves new outcomes and their indicators and proxies together', function () {
    [, $user, $program] = batchProgram();
    $stakeholderCategory = DB::table('sroi_stakeholder_categories')->insertGetId([
        'company_id' => $program->company_id, 'program_category_id' => $program->category_id,
        'code' => 'COMMUNITY', 'name' => 'Komunitas', 'active' => true,
    ]);
    $stakeholderList = DB::table('sroi_stakeholder_category_lists')->insertGetId([
        'company_id' => $program->company_id, 'program_category_id' => $program->category_id,
        'stakeholder_category_id' => $stakeholderCategory, 'code' => 'RESIDENT', 'name' => 'Warga', 'active' => true,
    ]);
    $stakeholder = DB::table('sroi_program_stakeholders')->insertGetId([
        'company_id' => $program->company_id, 'program_id' => $program->id,
        'program_category_id' => $program->category_id, 'stakeholder_category_list_id' => $stakeholderList,
        'role_in_program' => 'Warga', 'included' => true, 'inclusion_reason' => 'Terdampak', 'sort_order' => 1,
    ]);
    $outcomeCategory = DB::table('sroi_outcome_categories')->insertGetId([
        'company_id' => $program->company_id, 'program_category_id' => $program->category_id,
        'code' => 'INCOME', 'name' => 'Pendapatan', 'active' => true,
    ]);

    $this->actingAs($user)->put(route('sroi.stages.batch-save', [$program, 'outcome']), [
        'sections' => [
            'outcomes' => batchSection(['create' => ['new-outcome' => ['values' => [
                'stakeholder_id' => $stakeholder, 'outcome_category_id' => $outcomeCategory,
                'name' => 'Pendapatan meningkat', 'description' => 'Uraian outcome',
                'relevant' => true, 'significant' => true, 'material' => true,
                'materiality_reason' => 'Penting', 'materiality_explanation' => null,
            ]]]]),
            'indicators' => batchSection(['create' => ['new-indicator' => ['values' => [
                'outcome_id' => '@draft:new-outcome', 'name' => 'Pendapatan bulanan', 'unit' => 'rupiah',
                'evidence' => 'Catatan usaha', 'evidence_source' => 'Survei',
            ]]]]),
            'proxies' => batchSection(['create' => ['new-proxy' => ['values' => [
                'outcome_id' => '@draft:new-outcome', 'approach' => 'Nilai tambahan', 'description' => null,
                'source' => 'Data pasar', 'unit' => 'rupiah', 'unit_value' => 100000, 'currency_code' => 'IDR',
            ]]]]),
        ],
    ])->assertRedirect()->assertSessionHasNoErrors();

    $outcomeId = DB::table('sroi_program_outcomes')->value('id');
    expect(DB::table('sroi_outcome_indicators')->value('outcome_id'))->toBe($outcomeId)
        ->and(DB::table('sroi_financial_proxies')->value('outcome_id'))->toBe($outcomeId);
});

it('updates and deletes roadmap rows as one batch', function () {
    [, $user, $program] = batchProgram();
    $itemIds = [];
    foreach ([1, 2] as $order) {
        $itemIds[] = DB::table('sroi_roadmap_items')->insertGetId([
            'company_id' => $program->company_id, 'program_id' => $program->id,
            'sort_order' => $order, 'created_at' => now(), 'updated_at' => now(),
        ]);
    }
    $targets = [];
    foreach ($itemIds as $index => $itemId) {
        $targets[] = DB::table('sroi_roadmap_targets')->insertGetId([
            'company_id' => $program->company_id, 'program_id' => $program->id,
            'roadmap_item_id' => $itemId, 'year' => 2025 + $index, 'target_quantity' => 4,
            'unit' => 'orang', 'created_at' => now(), 'updated_at' => now(),
        ]);
    }
    $first = DB::table('sroi_roadmap_targets')->where('id', $targets[0])->first();
    $second = DB::table('sroi_roadmap_targets')->where('id', $targets[1])->first();
    $values = fn ($row): array => [
        'roadmap_item_id' => (string) $row->roadmap_item_id,
        'year' => (string) $row->year,
        'target_quantity' => (string) $row->target_quantity,
        'unit' => $row->unit,
    ];
    $firstOriginal = $values($first);
    $secondOriginal = $values($second);

    $this->actingAs($user)->put(route('sroi.stages.batch-save', [$program, 'roadmap']), roadmapBatch(
        [],
        [
            'update' => [$first->id => ['id' => $first->id, 'original' => $firstOriginal, 'values' => [...$firstOriginal, 'year' => '2026']]],
            'delete' => [$second->id => ['id' => $second->id, 'original' => $secondOriginal]],
        ],
    ))->assertRedirect()->assertSessionHasNoErrors();

    expect(DB::table('sroi_roadmap_targets')->where('id', $first->id)->value('year'))->toBe(2026)
        ->and(DB::table('sroi_roadmap_targets')->where('id', $second->id)->exists())->toBeFalse();
});

it('replaces a deleted target with a new target for the same year', function () {
    [, $user, $program] = batchProgram();
    $item = DB::table('sroi_roadmap_items')->insertGetId([
        'company_id' => $program->company_id, 'program_id' => $program->id,
        'sort_order' => 1, 'created_at' => now(), 'updated_at' => now(),
    ]);
    $oldTarget = DB::table('sroi_roadmap_targets')->insertGetId([
        'company_id' => $program->company_id, 'program_id' => $program->id,
        'roadmap_item_id' => $item, 'year' => 2025, 'target_quantity' => 4,
        'unit' => 'orang', 'created_at' => now(), 'updated_at' => now(),
    ]);
    $original = ['roadmap_item_id' => (string) $item, 'year' => '2025', 'target_quantity' => '4', 'unit' => 'orang'];

    $this->actingAs($user)->put(route('sroi.stages.batch-save', [$program, 'roadmap']), roadmapBatch(
        [], [
            'delete' => [$oldTarget => ['id' => $oldTarget, 'original' => $original]],
            'create' => ['replacement' => ['values' => [
                'roadmap_item_id' => $item, 'year' => 2025, 'target_quantity' => 8, 'unit' => 'orang',
            ]]],
        ],
    ))->assertRedirect()->assertSessionHasNoErrors();

    expect(DB::table('sroi_roadmap_targets')->where('id', $oldTarget)->exists())->toBeFalse()
        ->and(DB::table('sroi_roadmap_targets')->where('roadmap_item_id', $item)->value('target_quantity'))->toBe(8);
});

it('rejects foreign roadmap references and stale snapshots', function () {
    [, $user, $program] = batchProgram();
    $otherProgram = SroiProgram::create([
        'company_id' => $program->company_id, 'category_id' => $program->category_id, 'name' => 'Program Lain',
        'pillar_name' => 'Sosial', 'initiator_owner_name' => 'Pemilik', 'start_year' => 2025,
        'end_year' => 2026, 'description' => 'Uraian', 'boundary_text' => 'Batas', 'created_by' => $user->id,
    ]);
    $foreignItem = DB::table('sroi_roadmap_items')->insertGetId([
        'company_id' => $program->company_id, 'program_id' => $otherProgram->id,
        'sort_order' => 1, 'created_at' => now(), 'updated_at' => now(),
    ]);

    $this->actingAs($user)->put(route('sroi.stages.batch-save', [$program, 'roadmap']), roadmapBatch(
        [], ['create' => ['foreign' => ['values' => [
            'roadmap_item_id' => $foreignItem, 'year' => 2025, 'target_quantity' => null, 'unit' => null,
        ]]]],
    ))->assertSessionHasErrors('sections.targets.create.foreign.values.roadmap_item_id');

    $item = DB::table('sroi_roadmap_items')->insertGetId([
        'company_id' => $program->company_id, 'program_id' => $program->id,
        'sort_order' => 1, 'created_at' => now(), 'updated_at' => now(),
    ]);
    $target = DB::table('sroi_roadmap_targets')->insertGetId([
        'company_id' => $program->company_id, 'program_id' => $program->id,
        'roadmap_item_id' => $item, 'year' => 2025, 'target_quantity' => null, 'unit' => null,
        'created_at' => now(), 'updated_at' => now(),
    ]);
    $original = ['roadmap_item_id' => (string) $item, 'year' => '2025', 'target_quantity' => '', 'unit' => ''];
    DB::table('sroi_roadmap_targets')->where('id', $target)->update(['year' => 2026]);

    $this->put(route('sroi.stages.batch-save', [$program, 'roadmap']), roadmapBatch(
        [], ['update' => [$target => ['id' => $target, 'original' => $original, 'values' => [...$original, 'year' => '2025']]]],
    ))->assertSessionHasErrors('record');

    expect(DB::table('sroi_roadmap_targets')->where('id', $target)->value('year'))->toBe(2026);
});

it('denies batch writes to users outside the program company', function () {
    [, , $program] = batchProgram();
    $otherCompany = Company::create(['name' => 'Perusahaan Lain', 'status' => 'active']);
    $outsider = User::factory()->create(['company_id' => $otherCompany->id, 'role' => 'company', 'is_active' => true]);

    $this->actingAs($outsider)->put(route('sroi.stages.batch-save', [$program, 'roadmap']), roadmapBatch())
        ->assertForbidden();
});

it('creates annual impact rows using validated outcome references', function () {
    [, $user, $program] = batchProgram();
    [$outcome, $indicator, $proxy] = batchImpactReferences($program);
    $values = [
        'outcome_id' => $outcome, 'indicator_id' => $indicator, 'financial_proxy_id' => $proxy,
        'period_type' => 'evaluative', 'year' => 2025, 'quantity' => 10,
        'deadweight_pct' => null, 'displacement_pct' => null, 'attribution_pct' => null, 'dropoff_pct' => null,
        'deadweight_reason' => null, 'displacement_reason' => null, 'attribution_reason' => null, 'dropoff_reason' => null,
    ];

    $this->actingAs($user)->put(route('sroi.stages.batch-save', [$program, 'table']), [
        'sections' => ['impact-years' => batchSection(['create' => ['impact-row' => ['values' => $values]]])],
    ])->assertRedirect()->assertSessionHasNoErrors();

    expect(DB::table('sroi_outcome_impact_years')->where('outcome_id', $outcome)->value('updated_by'))->toBe($user->id);
});
