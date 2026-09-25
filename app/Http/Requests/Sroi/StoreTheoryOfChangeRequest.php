<?php

namespace App\Http\Requests\Sroi;

use App\Http\Controllers\Sroi\ProgramController;
use Illuminate\Foundation\Http\FormRequest;

class StoreTheoryOfChangeRequest extends FormRequest
{
    public function authorize(): bool
    {
        app(ProgramController::class)->access($this, $this->route('program'), true);

        return true;
    }

    public function rules(): array
    {
        $rules = [];
        foreach ([
            'conditions' => ['initial_condition', 'intervention', 'expected_condition'],
            'flows' => ['input_text', 'activity_text', 'output_text', 'outcome_text', 'impact_text'],
        ] as $section => $fields) {
            $rules[$section] = ['required', 'array:create,update,delete'];
            foreach (['create', 'update', 'delete'] as $operation) {
                $path = $section.'.'.$operation;
                $rules[$path] = ['present', 'array'];
                $rules[$path.'.*'] = ['required', 'array:'.implode(',', match ($operation) {
                    'create' => $fields,
                    'update' => ['id', 'original', 'values'],
                    'delete' => ['id', 'original'],
                })];
                if ($operation !== 'create') {
                    $rules[$path.'.*.id'] = ['required', 'integer', 'min:1'];
                }
                foreach ($operation === 'update' ? ['original', 'values'] : ($operation === 'delete' ? ['original'] : []) as $part) {
                    $rules[$path.'.*.'.$part] = ['required', 'array:'.implode(',', $fields)];
                }
                foreach ($fields as $field) {
                    $prefix = $path.'.*.'.($operation === 'create' ? '' : ($operation === 'delete' ? 'original.' : 'values.'));
                    $rules[$prefix.$field] = ['required', 'string', 'max:10000'];
                    if ($operation === 'update') {
                        $rules[$path.'.*.original.'.$field] = ['required', 'string', 'max:10000'];
                    }
                }
            }
        }

        return $rules;
    }

    public function messages(): array
    {
        return [
            'required' => 'Semua kolom pada baris ini wajib diisi.',
            'string' => 'Isi kolom harus berupa teks.',
            'max' => 'Isi kolom maksimal 10.000 karakter.',
            'array' => 'Format perubahan tidak valid.',
        ];
    }
}
