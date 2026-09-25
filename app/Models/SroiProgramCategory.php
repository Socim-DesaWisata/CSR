<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SroiProgramCategory extends Model
{
    protected $fillable = ['company_id', 'code', 'name', 'source_template_id', 'active'];

    protected function casts(): array
    {
        return ['active' => 'boolean'];
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function programs(): HasMany
    {
        return $this->hasMany(SroiProgram::class, 'category_id');
    }
}
