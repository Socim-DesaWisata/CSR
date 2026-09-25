<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('sroi_catalog_templates', function (Blueprint $table): void {
            $table->id();
            $table->string('kind', 40);
            $table->string('code', 40);
            $table->string('name', 200);
            $table->foreignId('parent_template_id')->nullable()->constrained('sroi_catalog_templates')->restrictOnDelete();
            $table->boolean('active')->default(true);
            $table->timestamps();
            $table->unique(['kind', 'code']);
        });

        $this->owned('sroi_program_categories', function (Blueprint $table): void {
            $table->string('code', 40);
            $table->string('name', 200);
            $table->foreignId('source_template_id')->nullable()->constrained('sroi_catalog_templates')->nullOnDelete();
            $table->boolean('active')->default(true);
            $table->unique(['company_id', 'code']);
        });
        $this->owned('sroi_stakeholder_categories', function (Blueprint $table): void {
            $this->reference($table, 'program_category_id', 'sroi_program_categories');
            $table->string('code', 40);
            $table->string('name', 200);
            $table->foreignId('source_template_id')->nullable()->constrained('sroi_catalog_templates')->nullOnDelete();
            $table->boolean('active')->default(true);
            $table->unique(['company_id', 'program_category_id', 'code'], 'sroi_stakeholder_category_code_unique');
            $table->unique(['company_id', 'program_category_id', 'id'], 'sroi_stakeholder_category_scope_unique');
        });
        $this->owned('sroi_stakeholder_category_lists', function (Blueprint $table): void {
            $this->reference($table, 'program_category_id', 'sroi_program_categories');
            $table->foreignId('stakeholder_category_id');
            $this->reference($table, 'stakeholder_category_id', 'sroi_stakeholder_categories', 'program_category_id', false);
            $table->string('code', 40);
            $table->string('name', 200);
            $table->foreignId('source_template_id')->nullable()->constrained('sroi_catalog_templates')->nullOnDelete();
            $table->boolean('active')->default(true);
            $table->unique(['company_id', 'program_category_id', 'code'], 'sroi_stakeholder_list_code_unique');
            $table->unique(['company_id', 'program_category_id', 'id'], 'sroi_stakeholder_list_scope_unique');
        });
        $this->owned('sroi_outcome_categories', function (Blueprint $table): void {
            $this->reference($table, 'program_category_id', 'sroi_program_categories');
            $table->string('code', 40);
            $table->string('name', 200);
            $table->foreignId('source_template_id')->nullable()->constrained('sroi_catalog_templates')->nullOnDelete();
            $table->boolean('active')->default(true);
            $table->unique(['company_id', 'program_category_id', 'code'], 'sroi_outcome_category_code_unique');
            $table->unique(['company_id', 'program_category_id', 'id'], 'sroi_outcome_category_scope_unique');
        });
        $this->owned('sroi_programs', function (Blueprint $table): void {
            $table->unsignedBigInteger('public_number')->nullable()->unique();
            $this->reference($table, 'category_id', 'sroi_program_categories');
            $table->string('name', 200);
            $table->string('pillar_name', 150);
            $table->string('initiator_owner_name', 200);
            $table->unsignedSmallInteger('start_year');
            $table->unsignedSmallInteger('end_year');
            $table->text('description');
            $table->text('boundary_text');
            $table->string('status', 20)->default('draft');
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->softDeletes();
            $table->unique(['company_id', 'id', 'category_id'], 'sroi_program_category_scope_unique');
            $table->index(['company_id', 'status']);
        });
        $this->owned('sroi_program_locations', function (Blueprint $table): void {
            $this->reference($table, 'program_id', 'sroi_programs');
            foreach (['province' => 'provinces', 'city' => 'cities', 'district' => 'districts', 'village' => 'villages'] as $area => $parent) {
                $table->foreignId($area.'_id')->nullable()->constrained($parent)->restrictOnDelete();
            }
            $table->string('location_name', 200);
            $table->string('manager_name', 200)->nullable();
            $table->string('address', 255)->nullable();
            $table->string('postal_code', 10)->nullable();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->unsignedInteger('sort_order');
            $table->unique(['company_id', 'program_id', 'sort_order'], 'sroi_location_order_unique');
        });
        $this->owned('sroi_program_members', function (Blueprint $table): void {
            $this->reference($table, 'program_id', 'sroi_programs');
            $table->foreignId('user_id')->constrained('users')->restrictOnDelete();
            $table->string('participation', 20);
            $table->unique(['company_id', 'program_id', 'user_id'], 'sroi_member_unique');
        });
        $this->owned('sroi_program_documents', function (Blueprint $table): void {
            $this->reference($table, 'program_id', 'sroi_programs');
            $table->string('stage', 40);
            $table->string('file_name');
            $table->string('object_key', 500);
            $table->string('mime_type', 100);
            $table->unsignedBigInteger('size_bytes');
            $table->foreignId('uploaded_by')->constrained('users')->restrictOnDelete();
            $table->unique(['company_id', 'object_key'], 'sroi_document_key_unique');
        });
        $this->owned('sroi_theory_of_change_conditions', function (Blueprint $table): void {
            $this->reference($table, 'program_id', 'sroi_programs');
            $table->unsignedInteger('sort_order');
            foreach (['initial_condition', 'intervention', 'expected_condition'] as $field) {
                $table->text($field);
            }
            $table->unique(['company_id', 'program_id', 'sort_order'], 'sroi_condition_order_unique');
        });
        $this->owned('sroi_theory_of_change_flows', function (Blueprint $table): void {
            $this->reference($table, 'program_id', 'sroi_programs');
            $table->unsignedInteger('sort_order');
            foreach (['input_text', 'activity_text', 'output_text', 'outcome_text', 'impact_text'] as $field) {
                $table->text($field);
            }
            $table->unique(['company_id', 'program_id', 'sort_order'], 'sroi_flow_order_unique');
        });
        $this->owned('sroi_lfa_nodes', function (Blueprint $table): void {
            $this->reference($table, 'program_id', 'sroi_programs');
            $table->foreignId('parent_id')->nullable();
            $table->string('level', 20);
            $table->string('code', 40)->nullable();
            $table->text('element');
            foreach (['indicator', 'verification_source', 'assumptions'] as $field) {
                $table->text($field)->nullable();
            }
            $table->unsignedInteger('sort_order');
            $table->unique(['company_id', 'program_id', 'id'], 'sroi_lfa_program_scope_unique');
            $table->foreign(['company_id', 'program_id', 'parent_id'], 'sroi_lfa_parent_fk')->references(['company_id', 'program_id', 'id'])->on('sroi_lfa_nodes')->restrictOnDelete();
        });
        $this->owned('sroi_roadmap_items', function (Blueprint $table): void {
            $this->reference($table, 'program_id', 'sroi_programs');
            $this->reference($table, 'lfa_activity_id', 'sroi_lfa_nodes', 'program_id', true);
            $table->unsignedInteger('sort_order');
            $table->unique(['company_id', 'program_id', 'sort_order'], 'sroi_roadmap_order_unique');
            $table->unique(['company_id', 'program_id', 'id'], 'sroi_roadmap_scope_unique');
        });
        $this->owned('sroi_roadmap_targets', function (Blueprint $table): void {
            $this->reference($table, 'program_id', 'sroi_programs');
            $this->reference($table, 'roadmap_item_id', 'sroi_roadmap_items', 'program_id');
            $table->unsignedSmallInteger('year');
            $table->decimal('target_quantity', 20, 6)->nullable();
            $table->string('unit', 100)->nullable();
            $table->unique(['company_id', 'roadmap_item_id', 'year'], 'sroi_roadmap_target_year_unique');
        });
        $this->owned('sroi_program_scopes', function (Blueprint $table): void {
            $this->reference($table, 'program_id', 'sroi_programs');
            $table->string('assessment_type', 20);
            foreach (['evaluative_start_year', 'evaluative_end_year', 'forecast_start_year', 'forecast_end_year'] as $field) {
                $table->unsignedSmallInteger($field)->nullable();
            }
            $table->text('scope_text');
            $table->unique(['company_id', 'program_id']);
        });
        $this->owned('sroi_program_investments', function (Blueprint $table): void {
            $this->reference($table, 'program_id', 'sroi_programs');
            $table->string('investor_name', 200);
            $table->string('contribution_type', 20);
            $table->string('form', 150);
            $table->char('currency_code', 3)->default('IDR');
            $table->unsignedInteger('sort_order');
            $table->unique(['company_id', 'program_id', 'sort_order'], 'sroi_investment_order_unique');
            $table->unique(['company_id', 'program_id', 'id'], 'sroi_investment_scope_unique');
        });
        $this->owned('sroi_program_investment_years', function (Blueprint $table): void {
            $this->reference($table, 'program_id', 'sroi_programs');
            $this->reference($table, 'investment_id', 'sroi_program_investments', 'program_id');
            $table->unsignedSmallInteger('year');
            $table->decimal('amount', 20, 2)->nullable();
            $table->unique(['company_id', 'investment_id', 'year'], 'sroi_investment_year_unique');
        });
        $this->owned('sroi_program_stakeholders', function (Blueprint $table): void {
            $table->foreignId('program_id');
            $table->foreignId('program_category_id');
            $table->foreign(['company_id', 'program_id', 'program_category_id'], 'sroi_stakeholder_program_fk')->references(['company_id', 'id', 'category_id'])->on('sroi_programs')->restrictOnDelete();
            $this->reference($table, 'stakeholder_category_list_id', 'sroi_stakeholder_category_lists', 'program_category_id');
            $table->text('role_in_program');
            $table->boolean('included');
            $table->text('inclusion_reason');
            $table->unsignedInteger('sort_order');
            $table->unique(['company_id', 'program_id', 'sort_order'], 'sroi_stakeholder_order_unique');
            $table->unique(['company_id', 'program_id', 'id'], 'sroi_stakeholder_program_scope_unique');
        });
        $this->owned('sroi_program_outcomes', function (Blueprint $table): void {
            $table->foreignId('program_id');
            $table->foreignId('program_category_id');
            $table->foreign(['company_id', 'program_id', 'program_category_id'], 'sroi_outcome_program_fk')->references(['company_id', 'id', 'category_id'])->on('sroi_programs')->restrictOnDelete();
            $this->reference($table, 'stakeholder_id', 'sroi_program_stakeholders', 'program_id');
            $this->reference($table, 'outcome_category_id', 'sroi_outcome_categories', 'program_category_id');
            $table->string('name');
            $table->text('description');
            foreach (['relevant', 'significant', 'material'] as $field) {
                $table->boolean($field);
            }
            $table->text('materiality_reason');
            $table->text('materiality_explanation')->nullable();
            $table->unsignedInteger('sort_order');
            $table->unique(['company_id', 'program_id', 'id'], 'sroi_outcome_program_scope_unique');
            $table->unique(['company_id', 'stakeholder_id', 'sort_order'], 'sroi_outcome_order_unique');
        });
        $this->owned('sroi_outcome_indicators', function (Blueprint $table): void {
            $this->reference($table, 'outcome_id', 'sroi_program_outcomes');
            $table->string('name');
            $table->string('unit', 100)->nullable();
            $table->text('evidence');
            $table->text('evidence_source');
            $table->unsignedInteger('sort_order');
            $table->unique(['company_id', 'outcome_id', 'id'], 'sroi_indicator_scope_unique');
            $table->unique(['company_id', 'outcome_id', 'sort_order'], 'sroi_indicator_order_unique');
        });
        $this->owned('sroi_financial_proxies', function (Blueprint $table): void {
            $this->reference($table, 'outcome_id', 'sroi_program_outcomes');
            $table->string('approach');
            $table->text('description')->nullable();
            $table->text('source');
            $table->string('unit', 100);
            $table->decimal('unit_value', 20, 4)->nullable();
            $table->char('currency_code', 3)->default('IDR');
            $table->unique(['company_id', 'outcome_id', 'id'], 'sroi_proxy_scope_unique');
        });
        $this->owned('sroi_outcome_impact_years', function (Blueprint $table): void {
            $this->reference($table, 'outcome_id', 'sroi_program_outcomes');
            $this->reference($table, 'indicator_id', 'sroi_outcome_indicators', 'outcome_id');
            $this->reference($table, 'financial_proxy_id', 'sroi_financial_proxies', 'outcome_id');
            $table->string('period_type', 20);
            $table->unsignedSmallInteger('year');
            $table->decimal('quantity', 20, 6)->nullable();
            foreach (['deadweight', 'displacement', 'attribution', 'dropoff'] as $field) {
                $table->decimal($field.'_pct', 7, 4)->nullable();
                $table->text($field.'_reason')->nullable();
            }
            $table->foreignId('updated_by')->constrained('users')->restrictOnDelete();
            $table->unique(['company_id', 'outcome_id', 'period_type', 'year'], 'sroi_impact_year_unique');
        });
        $this->owned('sroi_report_exports', function (Blueprint $table): void {
            $this->reference($table, 'program_id', 'sroi_programs');
            $table->string('report_type', 30);
            $table->string('stage', 40)->nullable();
            $table->string('format', 10);
            $table->string('status', 20);
            $table->string('object_key', 500)->nullable();
            $table->text('error_message')->nullable();
            $table->foreignId('requested_by')->constrained('users')->restrictOnDelete();
            $table->dateTime('completed_at', 6)->nullable();
            $table->unique(['company_id', 'object_key'], 'sroi_export_key_unique');
        });
        Schema::create('sroi_audit_logs', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->restrictOnDelete();
            $table->foreignId('actor_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('entity_type', 60);
            $table->unsignedBigInteger('entity_id');
            $table->string('action', 20);
            $table->json('before_state')->nullable();
            $table->json('after_state')->nullable();
            $table->dateTime('occurred_at', 6);
            $table->unique(['company_id', 'id']);
            $table->index(['company_id', 'entity_type', 'entity_id', 'occurred_at'], 'sroi_audit_entity_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        foreach (['audit_logs', 'report_exports', 'outcome_impact_years', 'financial_proxies', 'outcome_indicators', 'program_outcomes', 'program_stakeholders', 'program_investment_years', 'program_investments', 'program_scopes', 'roadmap_targets', 'roadmap_items', 'lfa_nodes', 'theory_of_change_flows', 'theory_of_change_conditions', 'program_documents', 'program_members', 'program_locations', 'programs', 'outcome_categories', 'stakeholder_category_lists', 'stakeholder_categories', 'program_categories', 'catalog_templates'] as $name) {
            Schema::dropIfExists('sroi_'.$name);
        }
    }

    private function owned(string $name, Closure $columns): void
    {
        Schema::create($name, function (Blueprint $table) use ($columns): void {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->restrictOnDelete();
            $columns($table);
            $table->timestamps();
            $table->unique(['company_id', 'id']);
        });
    }

    private function reference(Blueprint $table, string $column, string $parent, ?string $scope = null, bool $nullable = false): void
    {
        if ($column !== 'stakeholder_category_id') {
            $table->foreignId($column)->nullable($nullable);
        }
        $columns = ['company_id'];
        $targets = ['company_id'];
        if ($scope !== null) {
            $columns[] = $scope;
            $targets[] = $scope;
        }
        $columns[] = $column;
        $targets[] = 'id';
        $name = 'sroi_'.substr(hash('sha256', $table->getTable().':'.$column), 0, 20).'_fk';
        $table->foreign($columns, $name)->references($targets)->on($parent)->restrictOnDelete();
    }
};
