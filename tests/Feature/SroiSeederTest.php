<?php

use App\Models\Company;
use App\Models\User;
use Database\Seeders\SroiSeeder;
use Illuminate\Support\Facades\DB;

it('seeds a standalone SROI demo across every available input stage', function () {
    $company = Company::create(['name' => 'PT Maju Bersama', 'status' => 'active']);
    $other = Company::create(['name' => 'PT Sentosa Abadi', 'status' => 'active']);
    $owner = User::factory()->create(['company_id' => $company->id, 'role' => 'company', 'is_active' => true]);

    $this->seed(SroiSeeder::class);

    $program = DB::table('sroi_programs')->where('company_id', $company->id)->first();
    expect($program)->not->toBeNull()
        ->and($program->created_by)->toBe($owner->id)
        ->and($program->status)->toBe('draft')
        ->and(DB::table('sroi_programs')->where('company_id', $other->id)->count())->toBe(0)
        ->and(DB::table('projects')->count())->toBe(0);

    foreach (['program_locations', 'program_members', 'theory_of_change_conditions', 'theory_of_change_flows',
        'lfa_nodes', 'roadmap_items', 'roadmap_targets', 'program_scopes', 'program_investments',
        'program_investment_years', 'program_stakeholders', 'program_outcomes'] as $table) {
        expect(DB::table('sroi_'.$table)->where('company_id', $company->id)->where('program_id', $program->id)->exists())->toBeTrue();
    }

    $outcomes = DB::table('sroi_program_outcomes')->where('company_id', $company->id)->where('program_id', $program->id)->pluck('id');
    foreach (['outcome_indicators', 'financial_proxies', 'outcome_impact_years'] as $table) {
        expect(DB::table('sroi_'.$table)->where('company_id', $company->id)->whereIn('outcome_id', $outcomes)->exists())->toBeTrue();
    }

    expect(DB::table('sroi_catalog_templates')->count())->toBeGreaterThanOrEqual(4)
        ->and(DB::table('sroi_program_categories')->where('company_id', $company->id)->exists())->toBeTrue()
        ->and(DB::table('sroi_stakeholder_categories')->where('company_id', $company->id)->exists())->toBeTrue()
        ->and(DB::table('sroi_stakeholder_category_lists')->where('company_id', $company->id)->exists())->toBeTrue()
        ->and(DB::table('sroi_outcome_categories')->where('company_id', $company->id)->exists())->toBeTrue()
        ->and(DB::table('sroi_report_exports')->count())->toBe(0);
});

it('can seed repeatedly without duplicating data or overwriting edited records', function () {
    $company = Company::create(['name' => 'PT Maju Bersama', 'status' => 'active']);
    User::factory()->create(['company_id' => $company->id, 'role' => 'company', 'is_active' => true]);

    $this->seed(SroiSeeder::class);
    $tables = ['sroi_catalog_templates', 'sroi_program_categories', 'sroi_stakeholder_categories',
        'sroi_stakeholder_category_lists', 'sroi_outcome_categories', 'sroi_programs',
        'sroi_program_locations', 'sroi_program_members', 'sroi_theory_of_change_conditions',
        'sroi_theory_of_change_flows', 'sroi_lfa_nodes', 'sroi_roadmap_items', 'sroi_roadmap_targets',
        'sroi_program_scopes', 'sroi_program_investments', 'sroi_program_investment_years',
        'sroi_program_stakeholders', 'sroi_program_outcomes', 'sroi_outcome_indicators',
        'sroi_financial_proxies', 'sroi_outcome_impact_years'];
    $counts = collect($tables)->mapWithKeys(fn (string $table): array => [$table => DB::table($table)->count()]);
    DB::table('sroi_programs')->update(['description' => 'Disunting pengguna']);

    $this->seed(SroiSeeder::class);

    foreach ($counts as $table => $count) {
        expect(DB::table($table)->count())->toBe($count);
    }
    expect(DB::table('sroi_programs')->value('description'))->toBe('Disunting pengguna');
});
