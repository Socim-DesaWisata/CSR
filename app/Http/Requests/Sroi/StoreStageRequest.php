<?php

namespace App\Http\Requests\Sroi;

use App\Http\Controllers\Sroi\ProgramController;
use App\Services\SroiStages;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreStageRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        abort_unless(isset(SroiStages::definitions()[$this->route('section')]), 404);
        app(ProgramController::class)->access($this, $this->route('program'), true);

        if ($this->route('section') === 'members' && $this->user()->role === 'company') {
            $participation = DB::table('sroi_program_members')->where('program_id', $this->route('program')->id)->where('user_id', $this->user()->id)->value('participation');
            abort_unless($participation === 'owner' || $this->route('program')->created_by === $this->user()->id, 403);
        }

        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $program = $this->route('program');
        $fields = SroiStages::definitions()[$this->route('section')][3];
        $rules = [];

        foreach ($fields as $field => $descriptor) {
            $optional = str_ends_with($descriptor, '?');
            [$kind, $argument] = array_pad(explode(':', rtrim($descriptor, '?'), 2), 2, null);
            $rules[$field] = [$optional ? 'nullable' : 'required'];

            if ($kind === 'reference') {
                $rules[$field][] = 'integer';
                $rules[$field][] = Rule::exists($argument, 'id')->where(function ($query) use ($argument, $program, $field): void {
                    if (str_starts_with($argument, 'sroi_')) {
                        $query->where('company_id', $program->company_id);
                        if (in_array($argument, ['sroi_stakeholder_category_lists', 'sroi_outcome_categories'], true)) {
                            $query->where('program_category_id', $program->category_id)->where('active', true);
                        } elseif (in_array($argument, ['sroi_outcome_indicators', 'sroi_financial_proxies'], true)) {
                            $query->where('outcome_id', $this->input('outcome_id'));
                        } else {
                            $query->where('program_id', $program->id);
                        }
                        if ($field === 'lfa_activity_id') {
                            $query->where('level', 'activity');
                        }
                    } elseif ($argument === 'users') {
                        $query->where('company_id', $program->company_id)->where('is_active', true)->where('role', 'company');
                    }
                });
            } elseif ($kind === 'enum') {
                $rules[$field][] = Rule::in(explode(',', $argument));
            } elseif ($kind === 'year') {
                $rules[$field] = [...$rules[$field], 'integer', 'between:'.$program->start_year.','.$program->end_year];
            } elseif ($kind === 'boolean') {
                $rules[$field][] = 'boolean';
            } elseif (in_array($kind, ['number', 'money', 'percent', 'decimal'], true)) {
                $rules[$field] = [...$rules[$field], 'numeric', $kind === 'percent' ? 'between:0,100' : ($kind === 'decimal' ? 'between:-180,180' : 'min:0')];
            } elseif ($kind === 'currency') {
                $rules[$field] = [...$rules[$field], 'string', 'size:3', 'regex:/^[A-Z]{3}$/'];
            } else {
                $rules[$field] = [...$rules[$field], 'string', $kind === 'text' ? 'max:10000' : 'max:255'];
            }
        }

        $section = $this->route('section');
        $entry = $this->route('entry') ? (int) $this->route('entry') : null;
        $uniqueField = match ($section) {
            'members' => 'user_id',
            'targets', 'investment-years', 'impact-years' => 'year', default => null,
        };
        if ($uniqueField) {
            $rule = Rule::unique(SroiStages::definitions()[$section][2], $uniqueField)->where('company_id', $program->company_id);
            if ($section === 'members') {
                $rule->where('program_id', $program->id);
            } elseif ($section === 'targets') {
                $rule->where('roadmap_item_id', $this->input('roadmap_item_id'));
            } elseif ($section === 'investment-years') {
                $rule->where('investment_id', $this->input('investment_id'));
            } else {
                $rule->where('outcome_id', $this->input('outcome_id'))->where('period_type', $this->input('period_type'));
            }
            if ($entry) {
                $rule->ignore($entry);
            }
            $rules[$uniqueField][] = $rule;
        }

        return $rules;
    }

    public function after(): array
    {
        return [function (Validator $validator): void {
            $section = $this->route('section');
            $program = $this->route('program');
            if ($section === 'nodes') {
                $parent = $this->input('parent_id')
                    ? DB::table('sroi_lfa_nodes')->where('company_id', $program->company_id)->where('program_id', $program->id)->find($this->input('parent_id'))
                    : null;
                $expected = ['goal' => null, 'purpose' => 'goal', 'output' => 'purpose', 'activity' => 'output'];
                if (isset($expected[$this->input('level')]) && $parent?->level !== $expected[$this->input('level')]) {
                    $validator->errors()->add('parent_id', 'Induk LFA harus berada satu tingkat di atas.');
                }
                if ($this->input('level') === 'goal' && $this->filled('parent_id')) {
                    $validator->errors()->add('parent_id', 'Goal tidak memiliki induk.');
                }
            }
            if ($section === 'scopes') {
                if (! $this->route('entry') && DB::table('sroi_program_scopes')->where('company_id', $program->company_id)->where('program_id', $program->id)->exists()) {
                    $validator->errors()->add('assessment_type', 'Cakupan program sudah ada; gunakan Ubah.');
                }
                foreach (['evaluative', 'forecast'] as $period) {
                    if ($this->filled($period.'_start_year') && $this->filled($period.'_end_year') && $this->integer($period.'_start_year') > $this->integer($period.'_end_year')) {
                        $validator->errors()->add($period.'_end_year', 'Tahun akhir harus setelah tahun awal.');
                    }
                }
                if ($this->input('assessment_type') === 'both' && $this->filled('forecast_start_year') && $this->filled('evaluative_end_year') && $this->integer('forecast_start_year') <= $this->integer('evaluative_end_year')) {
                    $validator->errors()->add('forecast_start_year', 'Forecast dimulai setelah periode evaluasi.');
                }
            }
            if ($section === 'locations') {
                foreach (['city_id' => ['province_id', 'cities'], 'district_id' => ['city_id', 'districts'], 'village_id' => ['district_id', 'villages']] as $field => [$parent, $table]) {
                    if ($this->filled($field) && (! $this->filled($parent) || ! DB::table($table)->where('id', $this->input($field))->where($parent, $this->input($parent))->exists())) {
                        $validator->errors()->add($field, 'Wilayah harus sesuai dengan induknya.');
                    }
                }
            }
            if ($section === 'members' && $this->route('entry')) {
                $old = DB::table('sroi_program_members')->where('company_id', $program->company_id)->where('program_id', $program->id)->find((int) $this->route('entry'));
                if ($old?->participation === 'owner' && $this->input('participation') !== 'owner'
                    && ! DB::table('sroi_program_members')->where('program_id', $program->id)->where('participation', 'owner')->where('id', '!=', $old->id)->exists()) {
                    $validator->errors()->add('participation', 'Program harus memiliki minimal satu owner.');
                }
            }
        }];
    }

    public function messages(): array
    {
        return ['*.exists' => 'Pilihan harus berasal dari program atau perusahaan yang sama.', '*.between' => 'Nilai berada di luar rentang yang diizinkan.'];
    }
}
