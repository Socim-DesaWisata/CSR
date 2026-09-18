<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schema;
use Throwable;

class SQLSeeder extends Seeder
{
    public function __construct(private readonly ?string $sqlPath = null) {}

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $path = $this->sqlPath ?? database_path('u511349779_test_impact.sql');

        if (! File::exists($path)) {
            $this->command?->warn("SQL dump not found: {$path}");

            return;
        }

        Schema::disableForeignKeyConstraints();

        try {
            $this->importInserts(File::get($path));
        } finally {
            Schema::enableForeignKeyConstraints();
        }
    }

    private function importInserts(string $sql): void
    {
        preg_match_all('/INSERT INTO `([^`]+)` \((.*?)\) VALUES\s*(.*?);/s', $sql, $matches, PREG_SET_ORDER);

        $imported = 0;
        $skipped = 0;

        foreach ($matches as $match) {
            $table = $match[1];
            $columns = $this->parseColumns($match[2]);

            if (! $this->canImport($table, $columns)) {
                $skipped++;

                continue;
            }

            foreach (array_chunk($this->parseRows($match[3], $columns), 500) as $rows) {
                if ($rows === []) {
                    continue;
                }

                try {
                    DB::table($table)->insertOrIgnore($rows);
                    $imported += count($rows);
                } catch (Throwable $exception) {
                    $skipped++;
                    $this->command?->warn("Skipped {$table}: {$exception->getMessage()}");
                }
            }
        }

        $this->command?->info("SQLSeeder imported {$imported} rows, skipped {$skipped} insert blocks.");
    }

    /**
     * @return list<string>
     */
    private function parseColumns(string $columns): array
    {
        preg_match_all('/`([^`]+)`/', $columns, $matches);

        return $matches[1];
    }

    /**
     * @param  list<string>  $columns
     * @return list<array<string, mixed>>
     */
    private function parseRows(string $values, array $columns): array
    {
        $rows = [];

        foreach ($this->parseTuples($values) as $tuple) {
            $values = $this->parseTupleValues($tuple);

            if (count($values) !== count($columns)) {
                continue;
            }

            $rows[] = array_combine($columns, $values);
        }

        return $rows;
    }

    /**
     * @return list<string>
     */
    private function parseTuples(string $values): array
    {
        $tuples = [];
        $buffer = '';
        $depth = 0;
        $inString = false;
        $escaped = false;

        foreach (str_split($values) as $character) {
            if ($inString) {
                $buffer .= $character;

                if ($escaped) {
                    $escaped = false;
                } elseif ($character === '\\') {
                    $escaped = true;
                } elseif ($character === "'") {
                    $inString = false;
                }

                continue;
            }

            if ($character === "'") {
                $inString = true;
                $buffer .= $character;
            } elseif ($character === '(') {
                if ($depth > 0) {
                    $buffer .= $character;
                }

                $depth++;
            } elseif ($character === ')') {
                $depth--;

                if ($depth === 0) {
                    $tuples[] = $buffer;
                    $buffer = '';
                } else {
                    $buffer .= $character;
                }
            } elseif ($depth > 0) {
                $buffer .= $character;
            }
        }

        return $tuples;
    }

    /**
     * @return list<mixed>
     */
    private function parseTupleValues(string $tuple): array
    {
        $values = [];
        $buffer = '';
        $inString = false;
        $escaped = false;

        foreach (str_split($tuple) as $character) {
            if ($inString) {
                $buffer .= $character;

                if ($escaped) {
                    $escaped = false;
                } elseif ($character === '\\') {
                    $escaped = true;
                } elseif ($character === "'") {
                    $inString = false;
                }

                continue;
            }

            if ($character === "'") {
                $inString = true;
                $buffer .= $character;
            } elseif ($character === ',') {
                $values[] = $this->normalizeValue($buffer);
                $buffer = '';
            } else {
                $buffer .= $character;
            }
        }

        $values[] = $this->normalizeValue($buffer);

        return $values;
    }

    private function normalizeValue(string $value): mixed
    {
        $value = trim($value);

        if (strtoupper($value) === 'NULL') {
            return null;
        }

        if (str_starts_with($value, "'") && str_ends_with($value, "'")) {
            return stripcslashes(substr($value, 1, -1));
        }

        if (is_numeric($value)) {
            return str_contains($value, '.') ? (float) $value : (int) $value;
        }

        return $value;
    }

    /**
     * @param  list<string>  $columns
     */
    private function canImport(string $table, array $columns): bool
    {
        if (! Schema::hasTable($table)) {
            $this->command?->warn("Skipped {$table}: table does not exist.");

            return false;
        }

        foreach ($columns as $column) {
            if (! Schema::hasColumn($table, $column)) {
                $this->command?->warn("Skipped {$table}: column {$column} does not exist.");

                return false;
            }
        }

        return true;
    }
}
