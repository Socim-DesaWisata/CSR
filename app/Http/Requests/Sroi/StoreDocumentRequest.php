<?php

namespace App\Http\Requests\Sroi;

use App\Http\Controllers\Sroi\ProgramController;
use Illuminate\Foundation\Http\FormRequest;

class StoreDocumentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        app(ProgramController::class)->access($this, $this->route('program'), true);

        return in_array($this->route('stage'), ['description', 'theory-of-change', 'lfa', 'roadmap', 'scope', 'stakeholder', 'outcome', 'table'], true);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'document' => ['required', 'file', 'mimes:pdf,doc,docx,xls,xlsx,jpg,jpeg,png', 'max:10240'],
        ];
    }

    public function messages(): array
    {
        return ['document.mimes' => 'Format berkas tidak didukung.', 'document.max' => 'Ukuran berkas maksimal 10 MB.'];
    }
}
