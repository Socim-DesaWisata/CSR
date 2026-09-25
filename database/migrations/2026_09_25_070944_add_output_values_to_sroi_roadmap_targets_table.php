<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sroi_roadmap_targets', function (Blueprint $table) {
            $table->decimal('output_quantity', 20, 6)->nullable()->after('target_quantity');
            $table->string('output_unit', 100)->nullable()->after('unit');
        });
    }

    public function down(): void
    {
        Schema::table('sroi_roadmap_targets', function (Blueprint $table) {
            $table->dropColumn(['output_quantity', 'output_unit']);
        });
    }
};
