<?php

use App\Models\Company;
use App\Models\SroiProgram;
use App\Models\User;
use App\Services\SroiStages;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;

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

it('saves a new outcome independently of its indicators and proxies', function () {
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
        ],
    ])->assertRedirect()->assertSessionHasNoErrors();

    expect(DB::table('sroi_program_outcomes')->where('name', 'Pendapatan meningkat')->value('outcome_category_id'))->toBe($outcomeCategory)
        ->and(DB::table('sroi_outcome_indicators')->count())->toBe(0)
        ->and(DB::table('sroi_financial_proxies')->count())->toBe(0);
});

it('shows only outcomes on Outcome Identification and moves indicator editors to SROI Table', function () {
    [, $user, $program] = batchProgram();
    $this->withoutVite();

    $this->actingAs($user)->get(route('sroi.programs.stage', [$program, 'outcome']))
        ->assertOk()->assertInertia(fn (Assert $page) => $page
        ->component('Sroi/OutcomeIdentification')
        ->has('sections', 1)
        ->where('sections.0.key', 'outcomes'));

    $this->get(route('sroi.programs.stage', [$program, 'table']))
        ->assertOk()->assertInertia(fn (Assert $page) => $page
        ->component('Sroi/SroiTable')
        ->has('sections', 3)
        ->where('sections.0.key', 'indicators')
        ->where('sections.1.key', 'proxies')
        ->where('sections.2.key', 'impact-years'));
});

it('creates indicators, proxies, and impact rows from draft references in the SROI Table batch', function () {
    [, $user, $program] = batchProgram();
    [$outcome] = batchImpactReferences($program);
    $values = [
        'outcome_id' => $outcome, 'indicator_id' => '@draft:new-indicator',
        'financial_proxy_id' => '@draft:new-proxy', 'period_type' => 'evaluative',
        'year' => 2025, 'quantity' => 10, 'deadweight_pct' => null,
        'displacement_pct' => null, 'attribution_pct' => null, 'dropoff_pct' => null,
        'deadweight_reason' => null, 'displacement_reason' => null,
        'attribution_reason' => null, 'dropoff_reason' => null,
    ];

    $this->actingAs($user)->put(route('sroi.stages.batch-save', [$program, 'table']), [
        'sections' => [
            'indicators' => batchSection(['create' => ['new-indicator' => ['values' => [
                'outcome_id' => $outcome, 'name' => 'Pendapatan bulanan', 'unit' => 'rupiah',
                'evidence' => 'Catatan usaha', 'evidence_source' => 'Survei',
            ]]]]),
            'proxies' => batchSection(['create' => ['new-proxy' => ['values' => [
                'outcome_id' => $outcome, 'approach' => 'Nilai tambahan', 'description' => null,
                'source' => 'Data pasar', 'unit' => 'rupiah', 'unit_value' => 100000, 'currency_code' => 'IDR',
            ]]]]),
            'impact-years' => batchSection(['create' => ['impact' => ['values' => $values]]]),
        ],
    ])->assertRedirect()->assertSessionHasNoErrors();

    $impact = DB::table('sroi_outcome_impact_years')->where('outcome_id', $outcome)->first();
    expect($impact)->not->toBeNull()
        ->and(DB::table('sroi_outcome_indicators')->where('id', $impact->indicator_id)->value('name'))->toBe('Pendapatan bulanan')
        ->and(DB::table('sroi_financial_proxies')->where('id', $impact->financial_proxy_id)->value('approach'))->toBe('Nilai tambahan');
});

it('rejects draft indicators and proxies linked to a different outcome', function () {
    [, $user, $program] = batchProgram();
    [$outcome] = batchImpactReferences($program);
    $otherOutcomeValues = (array) DB::table('sroi_program_outcomes')->find($outcome);
    unset($otherOutcomeValues['id']);
    $otherOutcomeValues['name'] = 'Outcome lain';
    $otherOutcomeValues['sort_order'] = 2;
    $otherOutcome = DB::table('sroi_program_outcomes')->insertGetId($otherOutcomeValues);
    $indicatorCount = DB::table('sroi_outcome_indicators')->count();
    $proxyCount = DB::table('sroi_financial_proxies')->count();

    $this->actingAs($user)->put(route('sroi.stages.batch-save', [$program, 'table']), [
        'sections' => [
            'indicators' => batchSection(['create' => ['draft-indicator' => ['values' => [
                'outcome_id' => $outcome, 'name' => 'Indikator', 'unit' => 'orang',
                'evidence' => 'Catatan', 'evidence_source' => 'Survei',
            ]]]]),
            'proxies' => batchSection(['create' => ['draft-proxy' => ['values' => [
                'outcome_id' => $outcome, 'approach' => 'Harga pasar', 'description' => null,
                'source' => 'Pasar', 'unit' => 'rupiah', 'unit_value' => 1000, 'currency_code' => 'IDR',
            ]]]]),
            'impact-years' => batchSection(['create' => ['mismatched' => ['values' => [
                'outcome_id' => $otherOutcome, 'indicator_id' => '@draft:draft-indicator',
                'financial_proxy_id' => '@draft:draft-proxy', 'period_type' => 'evaluative',
                'year' => 2025, 'quantity' => 1, 'deadweight_pct' => null,
                'displacement_pct' => null, 'attribution_pct' => null, 'dropoff_pct' => null,
                'deadweight_reason' => null, 'displacement_reason' => null,
                'attribution_reason' => null, 'dropoff_reason' => null,
            ]]]]),
        ],
    ])->assertSessionHasErrors('sections.impact-years.create.mismatched.values.indicator_id');

    expect(DB::table('sroi_outcome_indicators')->count())->toBe($indicatorCount)
        ->and(DB::table('sroi_financial_proxies')->count())->toBe($proxyCount)
        ->and(DB::table('sroi_outcome_impact_years')->count())->toBe(0);
});

it('prevents deleting an outcome that still has indicators or proxies', function () {
    [, $user, $program] = batchProgram();
    [$outcome] = batchImpactReferences($program);
    $original = array_intersect_key((array) DB::table('sroi_program_outcomes')->find($outcome), SroiStages::definitions()['outcomes'][3]);

    $this->actingAs($user)->put(route('sroi.stages.batch-save', [$program, 'outcome']), [
        'sections' => ['outcomes' => batchSection(['delete' => [(string) $outcome => ['id' => $outcome, 'original' => $original]]])],
    ])->assertSessionHasErrors('record');

    expect(DB::table('sroi_program_outcomes')->where('id', $outcome)->exists())->toBeTrue();
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
        'output_quantity' => '',
        'output_unit' => '',
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
        ->and(DB::table('sroi_roadmap_targets')->where('id', $first->id)->value('output_quantity'))->toBeNull()
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
    $original = ['roadmap_item_id' => (string) $item, 'year' => '2025', 'target_quantity' => '4', 'unit' => 'orang', 'output_quantity' => '', 'output_unit' => ''];

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
    $original = ['roadmap_item_id' => (string) $item, 'year' => '2025', 'target_quantity' => '', 'unit' => '', 'output_quantity' => '', 'output_unit' => ''];
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

it('lists LFA activities automatically and saves annual target and output values', function () {
    [, $user, $program] = batchProgram();
    $program->update(['start_year' => 2023, 'end_year' => 2024]);
    $purpose = DB::table('sroi_lfa_nodes')->insertGetId([
        'company_id' => $program->company_id, 'program_id' => $program->id, 'parent_id' => null,
        'level' => 'purpose', 'code' => null, 'element' => 'Tujuan khusus', 'indicator' => null,
        'verification_source' => null, 'assumptions' => null, 'sort_order' => 1,
    ]);
    $output = DB::table('sroi_lfa_nodes')->insertGetId([
        'company_id' => $program->company_id, 'program_id' => $program->id, 'parent_id' => $purpose,
        'level' => 'output', 'code' => null, 'element' => 'Output air bersih', 'indicator' => null,
        'verification_source' => null, 'assumptions' => null, 'sort_order' => 2,
    ]);
    $activity = DB::table('sroi_lfa_nodes')->insertGetId([
        'company_id' => $program->company_id, 'program_id' => $program->id, 'parent_id' => $output,
        'level' => 'activity', 'code' => null, 'element' => 'Pembangunan sumur', 'indicator' => null,
        'verification_source' => null, 'assumptions' => null, 'sort_order' => 3,
    ]);

    $this->actingAs($user)->get(route('sroi.programs.stage', [$program, 'roadmap']))
        ->assertOk()->assertInertia(fn (Assert $page) => $page
        ->component('Sroi/Roadmap')
        ->where('roadmapActivities.0.activity_id', $activity)
        ->where('roadmapActivities.0.activity', 'Pembangunan sumur')
        ->where('roadmapActivities.0.output', 'Output air bersih')
        ->where('roadmapActivities.0.roadmap_item_id', null));

    $this->actingAs($user)->put(route('sroi.stages.batch-save', [$program, 'roadmap']), roadmapBatch(
        ['create' => ['activity-'.$activity => ['values' => ['lfa_activity_id' => $activity]]]],
        ['create' => [
            'activity-'.$activity.'-2023' => ['values' => [
                'roadmap_item_id' => '@draft:activity-'.$activity, 'year' => 2023,
                'target_quantity' => 10, 'unit' => 'unit', 'output_quantity' => 8, 'output_unit' => 'sumur',
            ]],
            'activity-'.$activity.'-2024' => ['values' => [
                'roadmap_item_id' => '@draft:activity-'.$activity, 'year' => 2024,
                'target_quantity' => 15, 'unit' => 'unit', 'output_quantity' => 12, 'output_unit' => 'sumur',
            ]],
        ]],
    ))->assertRedirect()->assertSessionHasNoErrors();

    expect(DB::table('sroi_roadmap_items')->where('lfa_activity_id', $activity)->count())->toBe(1)
        ->and((float) DB::table('sroi_roadmap_targets')->where('year', 2023)->value('output_quantity'))->toBe(8.0)
        ->and(DB::table('sroi_roadmap_targets')->where('year', 2024)->value('output_unit'))->toBe('sumur');

    $this->get(route('sroi.programs.stage', [$program, 'roadmap']))->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Sroi/Roadmap')
            ->where('roadmapActivities.0.roadmap_item_id', DB::table('sroi_roadmap_items')->value('id'))
            ->where('sections.1.rows.0.output_unit', 'sumur'));
});

it('rejects annual roadmap output quantities below zero', function () {
    [, $user, $program] = batchProgram();
    $item = DB::table('sroi_roadmap_items')->insertGetId([
        'company_id' => $program->company_id, 'program_id' => $program->id,
        'sort_order' => 1, 'created_at' => now(), 'updated_at' => now(),
    ]);

    $this->actingAs($user)->put(route('sroi.stages.batch-save', [$program, 'roadmap']), roadmapBatch(
        [], ['create' => ['negative-output' => ['values' => [
            'roadmap_item_id' => $item, 'year' => 2025, 'target_quantity' => null, 'unit' => null,
            'output_quantity' => -1, 'output_unit' => 'unit',
        ]]]],
    ))->assertSessionHasErrors('sections.targets.create.negative-output.values.output_quantity');

    expect(DB::table('sroi_roadmap_targets')->count())->toBe(0);
});

it('rejects roadmap years outside the program and activities from other programs', function () {
    [, $user, $program] = batchProgram();
    $otherProgram = SroiProgram::create([
        'company_id' => $program->company_id, 'category_id' => $program->category_id,
        'name' => 'Program Lain', 'pillar_name' => 'Sosial', 'initiator_owner_name' => 'Pemilik',
        'start_year' => 2025, 'end_year' => 2026, 'description' => 'Uraian',
        'boundary_text' => 'Batas', 'created_by' => $user->id,
    ]);
    $foreignActivity = DB::table('sroi_lfa_nodes')->insertGetId([
        'company_id' => $program->company_id, 'program_id' => $otherProgram->id,
        'parent_id' => null, 'level' => 'activity', 'element' => 'Aktivitas lain', 'sort_order' => 1,
    ]);

    $this->actingAs($user)->put(route('sroi.stages.batch-save', [$program, 'roadmap']), roadmapBatch(
        ['create' => ['foreign' => ['values' => ['lfa_activity_id' => $foreignActivity]]]],
    ))->assertSessionHasErrors('sections.items.create.foreign.values.lfa_activity_id');

    $item = DB::table('sroi_roadmap_items')->insertGetId([
        'company_id' => $program->company_id, 'program_id' => $program->id,
        'sort_order' => 1, 'created_at' => now(), 'updated_at' => now(),
    ]);
    $this->put(route('sroi.stages.batch-save', [$program, 'roadmap']), roadmapBatch(
        [], ['create' => ['late' => ['values' => [
            'roadmap_item_id' => $item, 'year' => 2027, 'target_quantity' => 1,
            'unit' => 'unit', 'output_quantity' => 1, 'output_unit' => 'unit',
        ]]]],
    ))->assertSessionHasErrors('sections.targets.create.late.values.year');

    expect(DB::table('sroi_roadmap_targets')->count())->toBe(0);
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
        'sections' => [
            'indicators' => batchSection(), 'proxies' => batchSection(),
            'impact-years' => batchSection(['create' => ['impact-row' => ['values' => $values]]]),
        ],
    ])->assertRedirect()->assertSessionHasNoErrors();

    expect(DB::table('sroi_outcome_impact_years')->where('outcome_id', $outcome)->value('updated_by'))->toBe($user->id);

    $impact = DB::table('sroi_outcome_impact_years')->where('outcome_id', $outcome)->first();
    $indicatorOriginal = array_intersect_key((array) DB::table('sroi_outcome_indicators')->find($indicator), SroiStages::definitions()['indicators'][3]);
    $proxyOriginal = array_intersect_key((array) DB::table('sroi_financial_proxies')->find($proxy), SroiStages::definitions()['proxies'][3]);
    $impactOriginal = array_intersect_key((array) $impact, SroiStages::definitions()['impact-years'][3]);

    $this->put(route('sroi.stages.batch-save', [$program, 'table']), [
        'sections' => [
            'indicators' => batchSection(['delete' => [(string) $indicator => ['id' => $indicator, 'original' => $indicatorOriginal]]]),
            'proxies' => batchSection(['delete' => [(string) $proxy => ['id' => $proxy, 'original' => $proxyOriginal]]]),
            'impact-years' => batchSection(['delete' => [(string) $impact->id => ['id' => $impact->id, 'original' => $impactOriginal]]]),
        ],
    ])->assertRedirect()->assertSessionHasNoErrors();

    expect(DB::table('sroi_outcome_impact_years')->count())->toBe(0)
        ->and(DB::table('sroi_outcome_indicators')->count())->toBe(0)
        ->and(DB::table('sroi_financial_proxies')->count())->toBe(0);
});

it('saves scope and investments with annual amounts atomically', function () {
    [, $user, $program] = batchProgram();
    $this->actingAs($user)->put(route('sroi.stages.batch-save', [$program, 'scope']), [
        'sections' => [
            'scopes' => batchSection(['create' => ['scope' => ['values' => [
                'assessment_type' => 'evaluative', 'evaluative_start_year' => 2025,
                'evaluative_end_year' => 2026, 'forecast_start_year' => null,
                'forecast_end_year' => null, 'scope_text' => 'Bantuan keluarga',
            ]]]]),
            'investments' => batchSection(['create' => ['investor' => ['values' => [
                'investor_name' => 'Farhan', 'contribution_type' => 'cash',
                'form' => 'Sumbangan', 'currency_code' => 'IDR',
            ]]]]),
            'investment-years' => batchSection(['create' => ['annual' => ['values' => [
                'investment_id' => '@draft:investor', 'year' => 2025, 'amount' => 10000000,
            ]]]]),
        ],
    ])->assertRedirect()->assertSessionHasNoErrors();

    $investment = DB::table('sroi_program_investments')->where('program_id', $program->id)->first();
    expect($investment->investor_name)->toBe('Farhan');
    expect((int) DB::table('sroi_program_investment_years')->where('investment_id', $investment->id)->value('amount'))->toBe(10000000);
});

it('rejects reversed scope periods and duplicate annual investment years', function () {
    [, $user, $program] = batchProgram();
    $scope = [
        'assessment_type' => 'evaluative', 'evaluative_start_year' => 2026,
        'evaluative_end_year' => 2025, 'forecast_start_year' => null,
        'forecast_end_year' => null, 'scope_text' => 'Bantuan keluarga',
    ];
    $this->actingAs($user)->put(route('sroi.stages.batch-save', [$program, 'scope']), [
        'sections' => [
            'scopes' => batchSection(['create' => ['scope' => ['values' => $scope]]]),
            'investments' => batchSection(), 'investment-years' => batchSection(),
        ],
    ])->assertSessionHasErrors('sections.scopes.create.scope.values.evaluative_end_year');
    expect(DB::table('sroi_program_scopes')->where('program_id', $program->id)->exists())->toBeFalse();

    $scope['evaluative_start_year'] = 2025;
    $this->put(route('sroi.stages.batch-save', [$program, 'scope']), [
        'sections' => [
            'scopes' => batchSection(['create' => ['scope' => ['values' => $scope]]]),
            'investments' => batchSection(['create' => ['investor' => ['values' => [
                'investor_name' => 'Farhan', 'contribution_type' => 'cash',
                'form' => 'Sumbangan', 'currency_code' => 'IDR',
            ]]]]),
            'investment-years' => batchSection(['create' => [
                'first' => ['values' => ['investment_id' => '@draft:investor', 'year' => 2025, 'amount' => 100]],
                'second' => ['values' => ['investment_id' => '@draft:investor', 'year' => 2025, 'amount' => 200]],
            ]]),
        ],
    ])->assertSessionHasErrors('sections.investment-years.create.second.values.year');
    expect(DB::table('sroi_program_investments')->where('program_id', $program->id)->exists())->toBeFalse();
});

it('validates scope periods on the single-row endpoint', function () {
    [, $user, $program] = batchProgram();
    $this->actingAs($user)->post(route('sroi.entries.store', [$program, 'scopes']), [
        'assessment_type' => 'evaluative', 'evaluative_start_year' => 2026,
        'evaluative_end_year' => 2025, 'forecast_start_year' => null,
        'forecast_end_year' => null, 'scope_text' => 'Bantuan keluarga',
    ])->assertSessionHasErrors('evaluative_end_year');
    expect(DB::table('sroi_program_scopes')->where('program_id', $program->id)->exists())->toBeFalse();
});
