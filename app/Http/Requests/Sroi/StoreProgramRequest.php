<?php

namespace App\Http\Requests\Sroi;

use App\Http\Controllers\Sroi\ProgramController;
use App\Models\SroiProgram;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreProgramRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $program = $this->route('program');
        app(ProgramController::class)->access($this, $program instanceof SroiProgram ? $program : null, $program instanceof SroiProgram);

        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $companyId = $this->user()->role === 'company' ? $this->user()->company_id : $this->integer('company_id');
        $program = $this->route('program');

        return [
            'company_id' => $this->user()->role === 'company'
                ? ['prohibited']
                : ['required', 'integer', Rule::exists('companies', 'id')->where('status', 'active')->whereNull('deleted_at'), ...($program instanceof SroiProgram ? [Rule::in([$program->company_id])] : [])],
            'category_id' => ['required', 'integer', Rule::exists('sroi_program_categories', 'id')->where('company_id', $companyId)->when(! $program instanceof SroiProgram, fn ($rule) => $rule->where('active', true)), ...($program instanceof SroiProgram ? [Rule::in([$program->category_id])] : [])],
            'name' => ['required', 'string', 'max:200'],
            'pillar_name' => ['required', 'string', 'max:150'],
            'initiator_owner_name' => ['required', 'string', 'max:200'],
            'start_year' => ['required', 'integer', 'between:1900,2200'],
            'end_year' => ['required', 'integer', 'between:1900,2200', 'gte:start_year'],
            'description' => ['required', 'string'],
            'boundary_text' => ['required', 'string'],
            'status' => ['required', Rule::in(['draft', 'active', 'archived'])],
        ];
    }

    public function messages(): array
    {
        return ['category_id.exists' => 'Kategori harus berasal dari perusahaan program.', 'end_year.gte' => 'Tahun akhir tidak boleh sebelum tahun awal.'];
    }
}
