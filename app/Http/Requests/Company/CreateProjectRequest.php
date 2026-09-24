<?php

namespace App\Http\Requests\Company;

use Illuminate\Foundation\Http\FormRequest;

class CreateProjectRequest extends FormRequest
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
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'description' => $this->description ?: null,
            'start_date' => $this->start_date ?: null,
            'end_date' => $this->end_date ?: null,
            'target_ikm_count' => $this->target_ikm_count ?: 0,
            'target_sloi_count' => $this->target_sloi_count ?: 0,
            'ikm_template_id' => $this->ikm_template_id ?: null,
            'sloi_template_id' => $this->sloi_template_id ?: null,
        ]);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:200'],
            'description' => ['nullable', 'string'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'target_ikm_count' => [
                'nullable',
                'integer',
                'min:0',
                function ($attribute, $value, $fail) {
                    $targetIkm = (int) $value;
                    $targetSloi = (int) $this->input('target_sloi_count', 0);

                    // Minimal salah satu target harus > 0
                    if ($targetIkm === 0 && $targetSloi === 0) {
                        $fail('Target responden tidak boleh 0. Harap isi minimal salah satu target (IKM atau SLOI).');
                    }
                },
            ],
            'target_sloi_count' => [
                'nullable',
                'integer',
                'min:0',
                function ($attribute, $value, $fail) {
                    $targetSloi = (int) $value;
                    $targetIkm = (int) $this->input('target_ikm_count', 0);

                    // Minimal salah satu target harus > 0
                    if ($targetSloi === 0 && $targetIkm === 0) {
                        $fail('Target responden tidak boleh 0. Harap isi minimal salah satu target (IKM atau SLOI).');
                    }
                },
            ],
            'enable_ikm' => ['boolean'],
            'enable_sloi' => ['boolean'],
            'district_ids' => ['required', 'array', 'min:1'],
            'district_ids.*' => ['integer', 'exists:districts,id'],
            'descriptive_questions' => ['nullable', 'array'],
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
            'ikm_template_id.required_if' => 'Template IKM wajib dipilih jika IKM diaktifkan.',
            'sloi_template_id.required_if' => 'Template SLOI wajib dipilih jika SLOI diaktifkan.',
            'district_ids.required' => 'Minimal pilih satu lokasi kecamatan.',
            'district_ids.min' => 'Minimal pilih satu lokasi kecamatan.',
            'district_ids.*.exists' => 'Kecamatan yang dipilih tidak valid.',
        ];
    }
}
