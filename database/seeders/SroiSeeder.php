<?php

namespace Database\Seeders;

use App\Models\Company;
use App\Models\SroiProgram;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SroiSeeder extends Seeder
{
    public function run(): void
    {
        $company = Company::query()->where('name', 'PT Maju Bersama')->firstOrFail();
        $owner = User::query()->where('company_id', $company->id)->where('role', 'company')->where('is_active', true)->orderBy('id')->firstOrFail();

        DB::transaction(function () use ($company, $owner): void {
            $companyId = $company->id;
            $categoryTemplate = $this->row('sroi_catalog_templates', ['kind' => 'program_category', 'code' => 'DEMO_UMKM'], ['name' => 'Pemberdayaan UMKM']);
            $executorTemplate = $this->row('sroi_catalog_templates', ['kind' => 'stakeholder_category', 'code' => 'DEMO_PELAKSANA'], ['name' => 'Pelaksana', 'parent_template_id' => $categoryTemplate]);
            $beneficiaryTemplate = $this->row('sroi_catalog_templates', ['kind' => 'stakeholder_category', 'code' => 'DEMO_PENERIMA'], ['name' => 'Penerima Manfaat', 'parent_template_id' => $categoryTemplate]);
            $companyTemplate = $this->row('sroi_catalog_templates', ['kind' => 'stakeholder_category_list', 'code' => 'DEMO_PERUSAHAAN'], ['name' => 'PT Maju Bersama', 'parent_template_id' => $executorTemplate]);
            $umkmTemplate = $this->row('sroi_catalog_templates', ['kind' => 'stakeholder_category_list', 'code' => 'DEMO_UMKM_BINAAN'], ['name' => 'UMKM Binaan', 'parent_template_id' => $beneficiaryTemplate]);
            $outcomeTemplate = $this->row('sroi_catalog_templates', ['kind' => 'outcome_category', 'code' => 'DEMO_PENDAPATAN'], ['name' => 'Peningkatan Pendapatan', 'parent_template_id' => $categoryTemplate]);

            $categoryId = $this->row('sroi_program_categories', ['company_id' => $companyId, 'code' => 'DEMO_UMKM'], ['name' => 'Pemberdayaan UMKM', 'source_template_id' => $categoryTemplate]);
            $executorId = $this->row('sroi_stakeholder_categories', ['company_id' => $companyId, 'program_category_id' => $categoryId, 'code' => 'DEMO_PELAKSANA'], ['name' => 'Pelaksana', 'source_template_id' => $executorTemplate]);
            $beneficiaryId = $this->row('sroi_stakeholder_categories', ['company_id' => $companyId, 'program_category_id' => $categoryId, 'code' => 'DEMO_PENERIMA'], ['name' => 'Penerima Manfaat', 'source_template_id' => $beneficiaryTemplate]);
            $executorListId = $this->row('sroi_stakeholder_category_lists', ['company_id' => $companyId, 'program_category_id' => $categoryId, 'code' => 'DEMO_PERUSAHAAN'], ['stakeholder_category_id' => $executorId, 'name' => 'PT Maju Bersama', 'source_template_id' => $companyTemplate]);
            $beneficiaryListId = $this->row('sroi_stakeholder_category_lists', ['company_id' => $companyId, 'program_category_id' => $categoryId, 'code' => 'DEMO_UMKM_BINAAN'], ['stakeholder_category_id' => $beneficiaryId, 'name' => 'UMKM Binaan', 'source_template_id' => $umkmTemplate]);
            $outcomeCategoryId = $this->row('sroi_outcome_categories', ['company_id' => $companyId, 'program_category_id' => $categoryId, 'code' => 'DEMO_PENDAPATAN'], ['name' => 'Peningkatan Pendapatan', 'source_template_id' => $outcomeTemplate]);

            $program = SroiProgram::query()->firstOrCreate(
                ['company_id' => $companyId, 'name' => 'DEMO SROI - Pemberdayaan UMKM'],
                ['category_id' => $categoryId, 'pillar_name' => 'Ekonomi', 'initiator_owner_name' => $company->name,
                    'start_year' => 2025, 'end_year' => 2027,
                    'description' => 'Program simulasi pelatihan dan pendampingan UMKM; seluruh angka adalah data demo.',
                    'boundary_text' => 'Simulasi untuk latihan pengisian SROI, bukan evaluasi program nyata.',
                    'status' => 'draft', 'created_by' => $owner->id]
            );
            $scope = ['company_id' => $companyId, 'program_id' => $program->id];

            $this->row('sroi_program_members', [...$scope, 'user_id' => $owner->id], ['participation' => 'owner']);
            $this->row('sroi_program_locations', [...$scope, 'sort_order' => 1], ['location_name' => 'Lokasi Pelatihan Demo', 'manager_name' => 'Tim CSR PT Maju Bersama']);
            $this->row('sroi_theory_of_change_conditions', [...$scope, 'sort_order' => 1], [
                'initial_condition' => 'UMKM peserta membutuhkan pendampingan usaha (simulasi).',
                'intervention' => 'Pelatihan dan pendampingan usaha (simulasi).',
                'expected_condition' => 'Peserta mampu mengembangkan penjualan (simulasi).',
            ]);
            $this->row('sroi_theory_of_change_flows', [...$scope, 'sort_order' => 1], [
                'input_text' => 'Dana dan fasilitator pelatihan (simulasi).',
                'activity_text' => 'Pelatihan usaha dan pendampingan (simulasi).',
                'output_text' => 'Peserta menyelesaikan pelatihan (simulasi).',
                'outcome_text' => 'Pendapatan usaha peserta meningkat (simulasi).',
                'impact_text' => 'Ketahanan ekonomi peserta meningkat (simulasi).',
            ]);

            $goalId = $this->row('sroi_lfa_nodes', [...$scope, 'sort_order' => 1], ['level' => 'goal', 'code' => 'G1', 'element' => 'Ketahanan ekonomi UMKM meningkat (simulasi).']);
            $purposeId = $this->row('sroi_lfa_nodes', [...$scope, 'sort_order' => 2], ['parent_id' => $goalId, 'level' => 'purpose', 'code' => 'P1', 'element' => 'Pendapatan peserta meningkat (simulasi).']);
            $outputId = $this->row('sroi_lfa_nodes', [...$scope, 'sort_order' => 3], ['parent_id' => $purposeId, 'level' => 'output', 'code' => 'O1', 'element' => 'Peserta menyelesaikan pelatihan (simulasi).']);
            $activityId = $this->row('sroi_lfa_nodes', [...$scope, 'sort_order' => 4], ['parent_id' => $outputId, 'level' => 'activity', 'code' => 'A1', 'element' => 'Pelatihan dan pendampingan UMKM (simulasi).']);
            $roadmapId = $this->row('sroi_roadmap_items', [...$scope, 'sort_order' => 1], ['lfa_activity_id' => $activityId]);
            $this->row('sroi_program_scopes', $scope, [
                'assessment_type' => 'both', 'evaluative_start_year' => 2025, 'evaluative_end_year' => 2025,
                'forecast_start_year' => 2026, 'forecast_end_year' => 2027,
                'scope_text' => 'Evaluasi 2025 dan proyeksi 2026–2027 memakai data simulasi.',
            ]);
            $investmentId = $this->row('sroi_program_investments', [...$scope, 'sort_order' => 1], [
                'investor_name' => $company->name, 'contribution_type' => 'cash', 'form' => 'Pelatihan dan pendampingan (simulasi)', 'currency_code' => 'IDR',
            ]);
            $this->row('sroi_program_stakeholders', [...$scope, 'sort_order' => 1], [
                'program_category_id' => $categoryId, 'stakeholder_category_list_id' => $executorListId,
                'role_in_program' => 'Penyelenggara dan pemberi dana (simulasi).', 'included' => true,
                'inclusion_reason' => 'Menyediakan sumber daya program (simulasi).',
            ]);
            $stakeholderId = $this->row('sroi_program_stakeholders', [...$scope, 'sort_order' => 2], [
                'program_category_id' => $categoryId, 'stakeholder_category_list_id' => $beneficiaryListId,
                'role_in_program' => 'Penerima manfaat (simulasi).', 'included' => true,
                'inclusion_reason' => 'Mengikuti pelatihan dan pendampingan (simulasi).',
            ]);
            $outcomeId = $this->row('sroi_program_outcomes', [...$scope, 'stakeholder_id' => $stakeholderId, 'sort_order' => 1], [
                'program_category_id' => $categoryId, 'outcome_category_id' => $outcomeCategoryId,
                'name' => 'Peningkatan pendapatan UMKM (simulasi)',
                'description' => 'Perubahan pendapatan peserta dalam skenario contoh, bukan hasil survei.',
                'relevant' => true, 'significant' => true, 'material' => true,
                'materiality_reason' => 'Keputusan materialitas simulasi untuk latihan pengisian.',
            ]);
            $indicatorId = $this->row('sroi_outcome_indicators', ['company_id' => $companyId, 'outcome_id' => $outcomeId, 'sort_order' => 1], [
                'name' => 'Jumlah UMKM dengan peningkatan pendapatan (simulasi)', 'unit' => 'UMKM',
                'evidence' => 'Contoh data, bukan bukti lapangan.', 'evidence_source' => 'Simulasi internal seeder.',
            ]);
            $proxyId = $this->row('sroi_financial_proxies', ['company_id' => $companyId, 'outcome_id' => $outcomeId, 'approach' => 'Tambahan pendapatan per UMKM (simulasi)'], [
                'description' => 'Nilai contoh untuk menguji input SROI.', 'source' => 'Asumsi simulasi internal.',
                'unit' => 'UMKM', 'unit_value' => 500000, 'currency_code' => 'IDR',
            ]);

            foreach ([2025 => [30, 100000000, 'evaluative'], 2026 => [40, 120000000, 'forecast'], 2027 => [50, 80000000, 'forecast']] as $year => [$quantity, $investment, $period]) {
                $this->row('sroi_roadmap_targets', [...$scope, 'roadmap_item_id' => $roadmapId, 'year' => $year], ['target_quantity' => $quantity, 'unit' => 'UMKM']);
                $this->row('sroi_program_investment_years', [...$scope, 'investment_id' => $investmentId, 'year' => $year], ['amount' => $investment]);
                $this->row('sroi_outcome_impact_years', [
                    'company_id' => $companyId, 'outcome_id' => $outcomeId, 'period_type' => $period, 'year' => $year,
                ], [
                    'indicator_id' => $indicatorId, 'financial_proxy_id' => $proxyId, 'quantity' => $quantity,
                    'deadweight_pct' => 10, 'displacement_pct' => 0, 'attribution_pct' => 10, 'dropoff_pct' => 5,
                    'deadweight_reason' => 'Asumsi simulasi.', 'displacement_reason' => 'Asumsi simulasi.',
                    'attribution_reason' => 'Asumsi simulasi.', 'dropoff_reason' => 'Asumsi simulasi.',
                    'updated_by' => $owner->id,
                ]);
            }
        });
    }

    private function row(string $table, array $identity, array $values = []): int
    {
        $existingId = DB::table($table)->where($identity)->value('id');

        return $existingId === null
            ? DB::table($table)->insertGetId([...$identity, ...$values, 'created_at' => now(), 'updated_at' => now()])
            : (int) $existingId;
    }
}
