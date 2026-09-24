<?php

namespace App\Http\Requests\Project;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProjectRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Prepare the data for validation.
     * Convert empty strings to null for nullable fields.
     */
    protected function prepareForValidation(): void
    {
        $data = [];

        // Only process fields that are present in the request
        if ($this->has('description')) {
            $data['description'] = $this->description ?: null;
        }
        if ($this->has('start_date')) {
            $data['start_date'] = $this->start_date ?: null;
        }
        if ($this->has('end_date')) {
            $data['end_date'] = $this->end_date ?: null;
        }
        if ($this->has('target_ikm_count')) {
            $data['target_ikm_count'] = $this->target_ikm_count ?: 0;
        }
        if ($this->has('target_sloi_count')) {
            $data['target_sloi_count'] = $this->target_sloi_count ?: 0;
        }
        if ($this->has('ikm_template_id')) {
            $data['ikm_template_id'] = $this->ikm_template_id ?: null;
        }
        if ($this->has('sloi_template_id')) {
            $data['sloi_template_id'] = $this->sloi_template_id ?: null;
        }

        if (! empty($data)) {
            $this->merge($data);
        }
    }

    /**
     * Get the validation rules that apply to the request.
     * Uses 'sometimes' for partial updates (PATCH method).
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:200'],
            'description' => ['sometimes', 'nullable', 'string'],
            'status' => ['sometimes', 'string', 'in:draft,active,closed'],
            'start_date' => ['sometimes', 'nullable', 'date'],
            'end_date' => ['sometimes', 'nullable', 'date', 'after_or_equal:start_date'],
            'target_ikm_count' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'target_sloi_count' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'enable_ikm' => ['sometimes', 'boolean'],
            'enable_sloi' => ['sometimes', 'boolean'],
            'ikm_template_id' => ['sometimes', 'nullable', 'integer', 'exists:instrument_templates,id'],
            'sloi_template_id' => ['sometimes', 'nullable', 'integer', 'exists:instrument_templates,id'],
            'district_ids' => ['sometimes', 'array'],
            'district_ids.*' => ['integer', 'exists:districts,id'],
            'descriptive_questions' => ['sometimes', 'nullable', 'array'],
            'descriptive_questions.*.id' => ['nullable', 'integer'],
            'descriptive_questions.*.title' => ['required', 'string', 'max:500'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Nama proyek wajib diisi.',
            'name.max' => 'Nama proyek maksimal 200 karakter.',
            'end_date.after_or_equal' => 'Tanggal selesai harus setelah atau sama dengan tanggal mulai.',
            'district_ids.*.exists' => 'Kecamatan yang dipilih tidak valid.',
            'ikm_template_id.exists' => 'Template IKM tidak valid.',
            'sloi_template_id.exists' => 'Template SLOI tidak valid.',
        ];
    }
}
