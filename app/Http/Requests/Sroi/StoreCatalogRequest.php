<?php

namespace App\Http\Requests\Sroi;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class StoreCatalogRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->is_active && in_array($this->user()->role, ['admin', 'superadmin'], true);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $table = $this->route('kind');
        abort_unless(in_array($table, ['program-categories', 'stakeholder-categories', 'stakeholder-lists', 'outcome-categories'], true), 404);
        $companyId = $this->integer('company_id');
        $categoryId = $this->integer('program_category_id');
        $record = $this->route('entry') ? (int) $this->route('entry') : null;
        $target = match ($table) {
            'program-categories' => 'sroi_program_categories',
            'stakeholder-categories' => 'sroi_stakeholder_categories',
            'stakeholder-lists' => 'sroi_stakeholder_category_lists',
            'outcome-categories' => 'sroi_outcome_categories',
        };
        $existing = $record ? DB::table($target)->where('id', $record)->first() : null;
        $unique = Rule::unique($target, 'code')->where('company_id', $companyId);
        if ($table !== 'program-categories') {
            $unique->where('program_category_id', $categoryId);
        }
        if ($record) {
            $unique->ignore($record);
        }

        return [
            'company_id' => ['required', 'integer', Rule::exists('companies', 'id')->where('status', 'active')->whereNull('deleted_at'), ...($existing ? [Rule::in([$existing->company_id])] : [])],
            'program_category_id' => $table === 'program-categories'
                ? ['prohibited']
                : ['required', 'integer', Rule::exists('sroi_program_categories', 'id')->where('company_id', $companyId), ...($existing ? [Rule::in([$existing->program_category_id])] : [])],
            'stakeholder_category_id' => $table === 'stakeholder-lists'
                ? ['required', 'integer', Rule::exists('sroi_stakeholder_categories', 'id')->where('company_id', $companyId)->where('program_category_id', $categoryId), ...($existing ? [Rule::in([$existing->stakeholder_category_id])] : [])]
                : ['prohibited'],
            'code' => ['required', 'string', 'max:40', $unique],
            'name' => ['required', 'string', 'max:200'],
            'active' => ['required', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return ['code.unique' => 'Kode sudah digunakan dalam kategori ini.', 'stakeholder_category_id.exists' => 'Kategori stakeholder harus berada pada rumpun yang sama.'];
    }
}
