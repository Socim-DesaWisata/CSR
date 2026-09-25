<?php

namespace App\Http\Requests\Sroi;

use App\Http\Controllers\Sroi\ProgramController;
use App\Models\SroiProgram;
use App\Services\SroiStages;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class SaveStageBatchRequest extends FormRequest
{
    public function authorize(): bool
    {
        abort_unless(in_array($this->route('stage'), ['roadmap', 'stakeholder', 'outcome', 'table', 'lfa', 'scope'], true), 404);
        app(ProgramController::class)->access($this, $this->route('program'), true);

        return true;
    }

    public function rules(): array
    {
        $stage = (string) $this->route('stage');
        $definitions = SroiStages::forStage($stage);
        $rules = ['sections' => ['required', 'array:'.implode(',', array_keys($definitions))]];

        foreach ($definitions as $section => [, , , $fields]) {
            $base = 'sections.'.$section;
            $fieldNames = implode(',', array_keys($fields));
            $rules[$base] = ['required', 'array:create,update,delete'];
            foreach (['create', 'update', 'delete'] as $operation) {
                $path = $base.'.'.$operation;
                $rules[$path] = ['present', 'array'];
                $rules[$path.'.*'] = ['required', 'array:'.implode(',', match ($operation) {
                    'create' => ['values'],
                    'update' => ['id', 'original', 'values'],
                    'delete' => ['id', 'original'],
                })];

                if ($operation !== 'create') {
                    $rules[$path.'.*.id'] = ['required', 'integer', 'min:1'];
                }

                foreach ($operation === 'create' ? ['values'] : ($operation === 'update' ? ['original', 'values'] : ['original']) as $part) {
                    $partPath = $path.'.*.'.$part;
                    $rules[$partPath] = ['required', 'array:'.$fieldNames];
                    foreach ($fields as $field => $descriptor) {
                        $fieldPath = $partPath.'.'.$field;
                        $rules[$fieldPath] = $part === 'original'
                            ? ['present', function (string $attribute, mixed $value, \Closure $fail): void {
                                if (! is_scalar($value) && $value !== null) {
                                    $fail('Snapshot baris tidak valid.');
                                }
                            }]
                            : $this->valueRules($descriptor, $this->route('program'), $field);
                    }
                }
            }
        }

        return $rules;
    }

    public function after(): array
    {
        return [function (Validator $validator): void {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $program = $this->route('program');
            $definitions = SroiStages::forStage((string) $this->route('stage'));
            $draftSections = [];
            foreach ($definitions as $section => [, , $table]) {
                $draftSections[$table] = $section;
            }

            foreach ($definitions as $section => [, , , $fields]) {
                $entries = $this->input('sections.'.$section);
                foreach (['create', 'update'] as $operation) {
                    foreach ($entries[$operation] as $key => $entry) {
                        if ($operation === 'create' && ! preg_match('/^[A-Za-z0-9_-]{1,80}$/', (string) $key)) {
                            $validator->errors()->add("sections.$section.create.$key", 'Kunci baris baru tidak valid.');
                        }
                        if ($operation === 'update' && (string) $entry['id'] !== (string) $key) {
                            $validator->errors()->add("sections.$section.update.$key.id", 'ID baris tidak sesuai.');
                        }
                        $values = $entry['values'];
                        foreach ($fields as $field => $descriptor) {
                            if (! str_starts_with($descriptor, 'reference:')) {
                                continue;
                            }
                            $value = $values[$field] ?? null;
                            if (! is_string($value) || ! str_starts_with($value, '@draft:')) {
                                continue;
                            }

                            $table = rtrim(substr($descriptor, 10), '?');
                            $targetSection = $draftSections[$table] ?? null;
                            $clientKey = substr($value, 7);
                            if (! $targetSection || ! array_key_exists($clientKey, $this->input("sections.$targetSection.create", []))) {
                                $validator->errors()->add("sections.$section.$operation.$key.values.$field", 'Referensi baris baru tidak valid.');
                            }
                        }
                    }
                }
            }

            $this->validateUniqueRows($validator, $program, $definitions);
            $this->validateScopePeriods($validator);
            $this->validateImpactReferences($validator, $program);
            $this->validateLfaNodes($validator, $program);
        }];
    }

    private function validateLfaNodes(Validator $validator, SroiProgram $program): void
    {
        if ($this->route('stage') !== 'lfa') {
            return;
        }

        $entries = $this->input('sections.nodes');
        $expectedParents = ['goal' => null, 'purpose' => 'goal', 'output' => 'purpose', 'activity' => 'output'];
        $draftLevels = [];
        $updatedLevels = [];
        $deletedIds = array_map('intval', array_column($entries['delete'], 'id'));

        foreach ($entries['create'] as $key => $entry) {
            $draftLevels[$key] = $entry['values']['level'];
        }
        foreach ($entries['update'] as $entry) {
            $updatedLevels[(int) $entry['id']] = $entry['values']['level'];
        }

        foreach (['create', 'update'] as $operation) {
            foreach ($entries[$operation] as $key => $entry) {
                $values = $entry['values'];
                $level = $values['level'];
                $parent = $values['parent_id'] ?? null;
                $expected = $expectedParents[$level] ?? null;
                $path = "sections.nodes.$operation.$key.values.parent_id";

                if ($level === 'goal') {
                    if ($parent !== null && $parent !== '') {
                        $validator->errors()->add($path, 'Goal tidak memiliki induk.');
                    }

                    continue;
                }

                if ($parent === null || $parent === '') {
                    $validator->errors()->add($path, 'Pilih induk satu tingkat di atas.');

                    continue;
                }

                if (is_string($parent) && str_starts_with($parent, '@draft:')) {
                    $draftKey = substr($parent, 7);
                    if (($draftLevels[$draftKey] ?? null) !== $expected) {
                        $validator->errors()->add($path, 'Induk LFA harus berada satu tingkat di atas.');
                    }

                    continue;
                }

                $parentId = (int) $parent;
                $parentLevel = $updatedLevels[$parentId] ?? DB::table('sroi_lfa_nodes')
                    ->where('company_id', $program->company_id)
                    ->where('program_id', $program->id)
                    ->where('id', $parentId)
                    ->value('level');

                if (in_array($parentId, $deletedIds, true) || $parentLevel !== $expected) {
                    $validator->errors()->add($path, 'Induk LFA harus berada satu tingkat di atas.');
                }
            }
        }
    }

    private function valueRules(string $descriptor, SroiProgram $program, string $field): array
    {
        $optional = str_ends_with($descriptor, '?');
        [$kind, $argument] = array_pad(explode(':', rtrim($descriptor, '?'), 2), 2, null);
        $rules = [$optional ? 'nullable' : 'required'];

        if ($kind === 'reference') {
            $table = $argument;
            $rules[] = function (string $attribute, mixed $value, \Closure $fail) use ($table, $program, $field): void {
                if ($value === null || $value === '') {
                    return;
                }
                if (is_string($value) && preg_match('/^@draft:[A-Za-z0-9_-]{1,80}$/', $value)) {
                    return;
                }
                if (! (is_int($value) || (is_string($value) && ctype_digit($value))) || ! $this->referenceExists($table, (int) $value, $program, $field)) {
                    $fail('Pilihan harus berasal dari program atau perusahaan yang sama.');
                }
            };
        } elseif ($kind === 'enum') {
            $rules[] = Rule::in(explode(',', (string) $argument));
        } elseif ($kind === 'year') {
            $rules = [...$rules, 'integer', 'between:'.$program->start_year.','.$program->end_year];
        } elseif ($kind === 'boolean') {
            $rules[] = 'boolean';
        } elseif (in_array($kind, ['number', 'money', 'percent', 'decimal'], true)) {
            $rules = [...$rules, 'numeric', $kind === 'percent' ? 'between:0,100' : ($kind === 'decimal' ? 'between:-180,180' : 'min:0')];
        } elseif ($kind === 'currency') {
            $rules = [...$rules, 'string', 'size:3', 'regex:/^[A-Z]{3}$/'];
        } else {
            $rules = [...$rules, 'string', $kind === 'text' ? 'max:10000' : 'max:255'];
        }

        return $rules;
    }

    private function referenceExists(string $table, int $id, SroiProgram $program, string $field): bool
    {
        $query = DB::table($table)->where('id', $id);
        if (str_starts_with($table, 'sroi_')) {
            $query->where('company_id', $program->company_id);
            if (in_array($table, ['sroi_stakeholder_category_lists', 'sroi_outcome_categories'], true)) {
                $query->where('program_category_id', $program->category_id)->where('active', true);
            } elseif (in_array($table, ['sroi_outcome_indicators', 'sroi_financial_proxies'], true)) {
                $query->whereIn('outcome_id', DB::table('sroi_program_outcomes')->where('company_id', $program->company_id)->where('program_id', $program->id)->select('id'));
            } else {
                $query->where('program_id', $program->id);
            }
            if ($field === 'lfa_activity_id') {
                $query->where('level', 'activity');
            }
        }

        return $query->exists();
    }

    private function validateUniqueRows(Validator $validator, SroiProgram $program, array $definitions): void
    {
        $uniqueRules = [
            'targets' => ['sroi_roadmap_targets', ['roadmap_item_id', 'year']],
            'investment-years' => ['sroi_program_investment_years', ['investment_id', 'year']],
            'impact-years' => ['sroi_outcome_impact_years', ['outcome_id', 'period_type', 'year']],
        ];

        foreach ($uniqueRules as $section => [$table, $uniqueFields]) {
            if (! isset($definitions[$section])) {
                continue;
            }
            $entries = $this->input('sections.'.$section);
            $removedIds = array_map('intval', array_column($entries['delete'], 'id'));
            $updated = [];
            foreach ($entries['update'] as $key => $entry) {
                $updated[(int) $entry['id']] = $entry['values'];
            }
            $query = DB::table($table)->where('company_id', $program->company_id);
            if (in_array($section, ['targets', 'investment-years'], true)) {
                $query->where('program_id', $program->id);
            } else {
                $query->whereIn('outcome_id', DB::table('sroi_program_outcomes')->where('company_id', $program->company_id)->where('program_id', $program->id)->select('id'));
            }
            $existing = $query->get();
            $seen = [];
            foreach ($existing as $row) {
                if (in_array((int) $row->id, $removedIds, true) || isset($updated[(int) $row->id])) {
                    continue;
                }
                $signature = implode('|', array_map(fn (string $field): string => (string) $row->{$field}, $uniqueFields));
                $seen[$signature] = true;
            }
            foreach ($updated as $id => $values) {
                $this->recordUniqueSignature($validator, $seen, $section, 'update', (string) $id, $values, $uniqueFields);
            }
            foreach ($entries['create'] as $key => $entry) {
                $this->recordUniqueSignature($validator, $seen, $section, 'create', (string) $key, $entry['values'], $uniqueFields);
            }
        }
    }

    private function validateScopePeriods(Validator $validator): void
    {
        if ($this->route('stage') !== 'scope') {
            return;
        }

        foreach (['create', 'update'] as $operation) {
            foreach ($this->input("sections.scopes.$operation", []) as $key => $entry) {
                $values = $entry['values'];
                foreach (['evaluative', 'forecast'] as $period) {
                    $start = $values[$period.'_start_year'] ?? null;
                    $end = $values[$period.'_end_year'] ?? null;
                    $active = $values['assessment_type'] === $period || $values['assessment_type'] === 'both';
                    if ($active && ($start === null || $end === null || $start > $end)) {
                        $validator->errors()->add("sections.scopes.$operation.$key.values.".$period.'_end_year', 'Periode aktif harus memiliki awal dan akhir yang berurutan.');
                    }
                    if (! $active && ($start !== null || $end !== null)) {
                        $validator->errors()->add("sections.scopes.$operation.$key.values.".$period.'_start_year', 'Tahun periode tidak aktif harus kosong.');
                    }
                }
                if ($values['assessment_type'] === 'both'
                    && ($values['forecast_start_year'] ?? null) !== null
                    && ($values['evaluative_end_year'] ?? null) !== null
                    && $values['forecast_start_year'] <= $values['evaluative_end_year']) {
                    $validator->errors()->add("sections.scopes.$operation.$key.values.forecast_start_year", 'Forecast harus dimulai setelah periode evaluasi.');
                }
            }
        }
    }

    private function recordUniqueSignature(Validator $validator, array &$seen, string $section, string $operation, string $key, array $values, array $fields): void
    {
        $signature = implode('|', array_map(fn (string $field): string => (string) ($values[$field] ?? ''), $fields));
        if (isset($seen[$signature])) {
            $validator->errors()->add("sections.$section.$operation.$key.values.".end($fields), 'Nilai unik sudah digunakan pada baris lain.');
        }
        $seen[$signature] = true;
    }

    private function validateImpactReferences(Validator $validator, SroiProgram $program): void
    {
        if ($this->route('stage') !== 'table') {
            return;
        }

        foreach (['create', 'update'] as $operation) {
            foreach ($this->input('sections.impact-years.'.$operation) as $key => $entry) {
                $values = $entry['values'];
                foreach (['indicator_id' => 'sroi_outcome_indicators', 'financial_proxy_id' => 'sroi_financial_proxies'] as $field => $table) {
                    $section = $field === 'indicator_id' ? 'indicators' : 'proxies';
                    $reference = $values[$field];
                    if (is_string($reference) && str_starts_with($reference, '@draft:')) {
                        $draft = $this->input('sections.'.$section.'.create.'.substr($reference, 7).'.values');
                        $valid = is_array($draft) && (string) ($draft['outcome_id'] ?? '') === (string) $values['outcome_id'];
                    } else {
                        $updated = $this->input('sections.'.$section.'.update.'.$reference.'.values');
                        $valid = $updated
                            ? (string) $updated['outcome_id'] === (string) $values['outcome_id']
                            : DB::table($table)
                                ->where('company_id', $program->company_id)
                                ->where('outcome_id', $values['outcome_id'])
                                ->where('id', $reference)
                                ->exists();
                    }
                    if (! $valid) {
                        $validator->errors()->add("sections.impact-years.$operation.$key.values.$field", 'Pilihan harus sesuai dengan outcome.');
                    }
                }
            }
        }
    }
}
