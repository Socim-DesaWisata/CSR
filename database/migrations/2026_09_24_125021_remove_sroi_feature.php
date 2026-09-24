<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('submissions')) {
            $respondentIds = DB::table('submissions')
                ->where('assessment_type', 'SROI')
                ->whereNotNull('respondent_id')
                ->pluck('respondent_id');

            DB::table('submissions')->where('assessment_type', 'SROI')->delete();

            if (Schema::hasTable('respondents') && $respondentIds->isNotEmpty()) {
                DB::table('respondents')
                    ->whereIn('id', $respondentIds)
                    ->whereNotIn('id', DB::table('submissions')->select('respondent_id')->whereNotNull('respondent_id'))
                    ->delete();
            }

            if (Schema::hasColumn('submissions', 'project_sroi_form_id')) {
                Schema::table('submissions', function (Blueprint $table) {
                    $table->dropConstrainedForeignId('project_sroi_form_id');
                });
            }
        }

        if (Schema::hasTable('project_score_snapshots')) {
            DB::table('project_score_snapshots')->where('assessment_type', 'SROI')->delete();
        }

        if (Schema::hasTable('respondents') && Schema::hasColumn('respondents', 'stakeholder_id')) {
            Schema::table('respondents', function (Blueprint $table) {
                $table->dropConstrainedForeignId('stakeholder_id');
            });
        }

        foreach ([
            'submission_sroi_answers',
            'project_sroi_questions',
            'project_sroi_sections',
            'project_sroi_forms',
            'sroi_template_questions',
            'sroi_template_sections',
            'sroi_templates',
            'sroi_questions',
            'stakeholder_outcomes',
            'project_stakeholders',
        ] as $table) {
            Schema::dropIfExists($table);
        }

        if (Schema::hasTable('projects') && Schema::hasColumn('projects', 'enable_sroi')) {
            Schema::table('projects', function (Blueprint $table) {
                $table->dropColumn('enable_sroi');
            });
        }
    }

    public function down(): void {}
};
