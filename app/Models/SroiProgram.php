<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class SroiProgram extends Model
{
    use SoftDeletes;

    protected $fillable = ['company_id', 'category_id', 'name', 'pillar_name', 'initiator_owner_name', 'start_year', 'end_year', 'description', 'boundary_text', 'status', 'created_by'];

    protected function casts(): array
    {
        return ['start_year' => 'integer', 'end_year' => 'integer'];
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(SroiProgramCategory::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
