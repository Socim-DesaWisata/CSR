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
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
            $table->string('name', 200);
            $table->text('description')->nullable();
            $table->string('project_code', 30)->comment('contoh PROJ-ABC123');
            $table->string('status', 20)->default('draft')->comment('draft|active|closed|archived');

            $table->integer('target_ikm_count')->default(0);
            $table->integer('target_sloi_count')->default(0);

            $table->boolean('enable_ikm')->default(false);
            $table->boolean('enable_sloi')->default(false);

            $table->foreignId('ikm_template_id')->nullable()->constrained('instrument_templates')->nullOnDelete();
            $table->foreignId('sloi_template_id')->nullable()->constrained('instrument_templates')->nullOnDelete();

            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();

            $table->timestamp('closed_at')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['company_id', 'project_code', 'deleted_at'], 'proj_comp_code_del_unique');
            $table->index(['company_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};
