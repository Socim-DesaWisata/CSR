<?php

namespace App\Http\Requests\Sroi;

use App\Http\Controllers\Sroi\ProgramController;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AreaRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        app(ProgramController::class)->access($this, $this->route('program'));

        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $parent = match ($this->route('level')) {
            'cities' => 'provinces', 'districts' => 'cities', 'villages' => 'districts',
            'provinces' => null, default => abort(404),
        };

        return [
            'parent' => $parent ? ['required', 'integer', Rule::exists($parent, 'id')] : ['prohibited'],
        ];
    }
}
