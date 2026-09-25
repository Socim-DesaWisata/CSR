<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (DB::connection()->getDriverName() !== 'mysql') {
            return;
        }

        foreach ($this->checks() as $table => $checks) {
            foreach ($checks as $name => $expression) {
                DB::statement("ALTER TABLE `$table` ADD CONSTRAINT `$name` CHECK ($expression)");
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::connection()->getDriverName() !== 'mysql') {
            return;
        }

        foreach ($this->checks() as $table => $checks) {
            foreach (array_keys($checks) as $name) {
                DB::statement("ALTER TABLE `$table` DROP CHECK `$name`");
            }
        }
    }

    private function checks(): array
    {
        $checks = [
            'sroi_programs' => [
                'sroi_program_year_order' => 'start_year <= end_year',
                'sroi_program_status' => "status IN ('draft','active','archived')",
            ],
            'sroi_program_members' => ['sroi_member_role' => "participation IN ('owner','editor','viewer')"],
            'sroi_program_scopes' => [
                'sroi_scope_type' => "assessment_type IN ('evaluative','forecast','both')",
                'sroi_scope_evaluation_order' => 'evaluative_start_year <= evaluative_end_year',
                'sroi_scope_forecast_order' => 'forecast_start_year <= forecast_end_year',
            ],
            'sroi_program_investments' => ['sroi_investment_type' => "contribution_type IN ('cash','in_kind','time')"],
            'sroi_roadmap_targets' => ['sroi_target_nonnegative' => 'target_quantity >= 0'],
            'sroi_program_investment_years' => ['sroi_investment_nonnegative' => 'amount >= 0'],
            'sroi_financial_proxies' => ['sroi_proxy_nonnegative' => 'unit_value >= 0'],
            'sroi_outcome_impact_years' => [
                'sroi_impact_nonnegative' => 'quantity >= 0',
                'sroi_impact_period' => "period_type IN ('evaluative','forecast')",
            ],
        ];
        foreach (['deadweight', 'displacement', 'attribution', 'dropoff'] as $name) {
            $checks['sroi_outcome_impact_years']['sroi_'.$name.'_percentage'] = $name.'_pct BETWEEN 0 AND 100';
        }

        return $checks;
    }
};
