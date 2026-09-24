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
        Schema::create('respondents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();

            $table->string('name', 150);
            $table->text('address')->nullable();
            $table->string('phone', 32)->nullable();
            $table->integer('age')->nullable();
            $table->string('gender', 10)->nullable();
            $table->string('respondent_status', 30)->nullable()->comment('Ibu rumah tangga, Kepala keluarga, dll');
            $table->string('education_level', 50)->nullable();
            $table->string('main_occupation', 80)->nullable();
            $table->bigInteger('monthly_income')->nullable();

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['company_id', 'project_id']);
            // $table->unique(['project_id', 'phone']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('respondents');
    }
};
