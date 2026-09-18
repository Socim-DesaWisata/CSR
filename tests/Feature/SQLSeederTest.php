<?php

use Database\Seeders\SQLSeeder;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schema;

it('imports only insert values from a sql dump', function () {
    Schema::create('sql_seeder_people', function (Blueprint $table) {
        $table->id();
        $table->string('name');
        $table->integer('score')->nullable();
        $table->text('note')->nullable();
    });

    $path = storage_path('framework/testing-sql-seeder.sql');

    File::put($path, <<<'SQL'
CREATE TABLE `sql_seeder_people` (`id` bigint unsigned NOT NULL);
INSERT INTO `sql_seeder_people` (`id`, `name`, `score`, `note`) VALUES
(1, 'Alice', 10, 'hello, world'),
(2, 'Bob O\'Neil', NULL, 'uses (parentheses)');
ALTER TABLE `sql_seeder_people` ADD PRIMARY KEY (`id`);
INSERT INTO `missing_table` (`id`, `name`) VALUES (1, 'Skipped');
INSERT INTO `sql_seeder_people` (`id`, `missing_column`) VALUES (3, 'Skipped');
SQL);

    try {
        (new SQLSeeder($path))->run();

        expect(DB::table('sql_seeder_people')->orderBy('id')->get()->map(fn ($row) => [
            'id' => $row->id,
            'name' => $row->name,
            'score' => $row->score,
            'note' => $row->note,
        ])->all())->toBe([
            ['id' => 1, 'name' => 'Alice', 'score' => 10, 'note' => 'hello, world'],
            ['id' => 2, 'name' => "Bob O'Neil", 'score' => null, 'note' => 'uses (parentheses)'],
        ]);
    } finally {
        File::delete($path);
    }
});
