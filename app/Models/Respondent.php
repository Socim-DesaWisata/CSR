<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Respondent extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'company_id',
        'project_id',
        'name',
        'address',
        'phone',
        'age',
        'gender',
        'respondent_status',
        'education_level',
        'main_occupation',
        'monthly_income',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'age' => 'integer',
            'monthly_income' => 'integer',
        ];
    }

    /**
     * Get the company that owns the respondent.
     */
    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    /**
     * Get the project that owns the respondent.
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * Get the user who created the respondent.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the submission for this respondent.
     */
    public function submission(): HasOne
    {
        return $this->hasOne(Submission::class);
    }
}
