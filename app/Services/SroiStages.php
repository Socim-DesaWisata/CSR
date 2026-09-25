<?php

namespace App\Services;

class SroiStages
{
    public const PAGES = [
        'description' => 'GeneralDescription', 'theory-of-change' => 'TheoryOfChange',
        'lfa' => 'Lfa', 'roadmap' => 'Roadmap', 'scope' => 'ProgramScope',
        'stakeholder' => 'StakeholderIdentification', 'outcome' => 'OutcomeIdentification',
        'table' => 'SroiTable', 'calculation' => 'SroiCalculation', 'report' => 'SroiReport',
    ];

    public const TITLES = [
        'description' => 'General Description', 'theory-of-change' => 'Theory of Change',
        'lfa' => 'LFA', 'roadmap' => 'Roadmap', 'scope' => 'Program Scope',
        'stakeholder' => 'Stakeholder Identification', 'outcome' => 'Outcome Identification',
        'table' => 'SROI Table', 'calculation' => 'SROI Calculation', 'report' => 'SROI Report',
    ];

    public static function definitions(): array
    {
        return [
            'locations' => ['description', 'Lokasi Program', 'sroi_program_locations', [
                'location_name' => 'string', 'manager_name' => 'string?', 'address' => 'string?',
                'postal_code' => 'string?', 'province_id' => 'reference:provinces?',
                'city_id' => 'reference:cities?', 'district_id' => 'reference:districts?',
                'village_id' => 'reference:villages?', 'latitude' => 'decimal?', 'longitude' => 'decimal?',
            ]],
            'members' => ['description', 'Anggota Program', 'sroi_program_members', [
                'user_id' => 'reference:users', 'participation' => 'enum:owner,editor,viewer',
            ]],
            'conditions' => ['theory-of-change', 'Kondisi Perubahan', 'sroi_theory_of_change_conditions', [
                'initial_condition' => 'text', 'intervention' => 'text', 'expected_condition' => 'text',
            ]],
            'flows' => ['theory-of-change', 'Alur Perubahan', 'sroi_theory_of_change_flows', [
                'input_text' => 'text', 'activity_text' => 'text', 'output_text' => 'text',
                'outcome_text' => 'text', 'impact_text' => 'text',
            ]],
            'nodes' => ['lfa', 'Logframe', 'sroi_lfa_nodes', [
                'parent_id' => 'reference:sroi_lfa_nodes?', 'level' => 'enum:goal,purpose,output,activity',
                'code' => 'string?', 'element' => 'text', 'indicator' => 'text?',
                'verification_source' => 'text?', 'assumptions' => 'text?',
            ]],
            'items' => ['roadmap', 'Aktivitas Roadmap', 'sroi_roadmap_items', [
                'lfa_activity_id' => 'reference:sroi_lfa_nodes?',
            ]],
            'targets' => ['roadmap', 'Target Tahunan', 'sroi_roadmap_targets', [
                'roadmap_item_id' => 'reference:sroi_roadmap_items', 'year' => 'year',
                'target_quantity' => 'number?', 'unit' => 'string?',
                'output_quantity' => 'number?', 'output_unit' => 'string?',
            ]],
            'scopes' => ['scope', 'Cakupan Penilaian', 'sroi_program_scopes', [
                'assessment_type' => 'enum:evaluative,forecast,both',
                'evaluative_start_year' => 'year?', 'evaluative_end_year' => 'year?',
                'forecast_start_year' => 'year?', 'forecast_end_year' => 'year?', 'scope_text' => 'text',
            ]],
            'investments' => ['scope', 'Investasi', 'sroi_program_investments', [
                'investor_name' => 'string', 'contribution_type' => 'enum:cash,in_kind,time',
                'form' => 'string', 'currency_code' => 'currency',
            ]],
            'investment-years' => ['scope', 'Nilai Investasi Tahunan', 'sroi_program_investment_years', [
                'investment_id' => 'reference:sroi_program_investments', 'year' => 'year', 'amount' => 'money?',
            ]],
            'stakeholders' => ['stakeholder', 'Stakeholder Program', 'sroi_program_stakeholders', [
                'stakeholder_category_list_id' => 'reference:sroi_stakeholder_category_lists',
                'role_in_program' => 'text', 'included' => 'boolean', 'inclusion_reason' => 'text',
            ]],
            'outcomes' => ['outcome', 'Outcome Program', 'sroi_program_outcomes', [
                'stakeholder_id' => 'reference:sroi_program_stakeholders',
                'outcome_category_id' => 'reference:sroi_outcome_categories',
                'name' => 'string', 'description' => 'text', 'relevant' => 'boolean',
                'significant' => 'boolean', 'material' => 'boolean',
                'materiality_reason' => 'text', 'materiality_explanation' => 'text?',
            ]],
            'indicators' => ['table', 'Indikator Outcome', 'sroi_outcome_indicators', [
                'outcome_id' => 'reference:sroi_program_outcomes', 'name' => 'string',
                'unit' => 'string?', 'evidence' => 'text', 'evidence_source' => 'text',
            ]],
            'proxies' => ['table', 'Proksi Finansial', 'sroi_financial_proxies', [
                'outcome_id' => 'reference:sroi_program_outcomes', 'approach' => 'string',
                'description' => 'text?', 'source' => 'text', 'unit' => 'string',
                'unit_value' => 'money?', 'currency_code' => 'currency',
            ]],
            'impact-years' => ['table', 'Tabel Dampak Tahunan', 'sroi_outcome_impact_years', [
                'outcome_id' => 'reference:sroi_program_outcomes',
                'indicator_id' => 'reference:sroi_outcome_indicators',
                'financial_proxy_id' => 'reference:sroi_financial_proxies',
                'period_type' => 'enum:evaluative,forecast', 'year' => 'year',
                'quantity' => 'number?', 'deadweight_pct' => 'percent?',
                'displacement_pct' => 'percent?', 'attribution_pct' => 'percent?',
                'dropoff_pct' => 'percent?', 'deadweight_reason' => 'text?',
                'displacement_reason' => 'text?', 'attribution_reason' => 'text?',
                'dropoff_reason' => 'text?',
            ]],
        ];
    }

    public static function forStage(string $stage): array
    {
        return array_filter(self::definitions(), fn (array $definition): bool => $definition[0] === $stage);
    }
}
