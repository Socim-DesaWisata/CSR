<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Project extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'company_id',
        'name',
        'description',
        'project_code',
        'status',
        'target_ikm_count',
        'target_sloi_count',
        'enable_ikm',
        'enable_sloi',
        'ikm_template_id',
        'sloi_template_id',
        'start_date',
        'end_date',
        'closed_at',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'enable_ikm' => 'boolean',
            'enable_sloi' => 'boolean',
            'start_date' => 'date',
            'end_date' => 'date',
            'closed_at' => 'datetime',
        ];
    }

    /**
     * Get the company that owns the project.
     */
    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    /**
     * Get the user who created the project.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the IKM template for the project.
     */
    public function ikmTemplate(): BelongsTo
    {
        return $this->belongsTo(InstrumentTemplate::class, 'ikm_template_id');
    }

    /**
     * Get the SLOI template for the project.
     */
    public function sloiTemplate(): BelongsTo
    {
        return $this->belongsTo(InstrumentTemplate::class, 'sloi_template_id');
    }

    /**
     * Get the project locations.
     */
    public function locations(): HasMany
    {
        return $this->hasMany(ProjectLocation::class);
    }

    /**
     * Get the districts through project locations.
     */
    public function districts(): BelongsToMany
    {
        return $this->belongsToMany(District::class, 'project_locations')
            ->withTimestamps();
    }

    /**
     * Get the enumerator assignments for the project.
     */
    public function enumeratorAssignments(): HasMany
    {
        return $this->hasMany(ProjectEnumeratorAssignment::class);
    }

    /**
     * Get the enumerators assigned to the project.
     */
    public function enumerators(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'project_enumerator_assignments', 'project_id', 'enumerator_id')
            ->withPivot('created_at');
    }

    /**
     * Get the respondents for the project.
     */
    public function respondents(): HasMany
    {
        return $this->hasMany(Respondent::class);
    }

    /**
     * Get the descriptive questions for the project.
     */
    public function descriptiveQuestions(): HasMany
    {
        return $this->hasMany(ProjectDescriptiveQuestion::class);
    }

    /**
     * Get the submissions for the project.
     */
    public function submissions(): HasMany
    {
        return $this->hasMany(Submission::class);
    }

    /**
     * Get the score snapshots for the project.
     */
    public function scoreSnapshots(): HasMany
    {
        return $this->hasMany(ProjectScoreSnapshot::class);
    }

    /**
     * Scope a query to only include draft projects.
     */
    public function scopeDraft($query)
    {
        return $query->where('status', 'draft');
    }

    /**
     * Scope a query to only include active projects.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Scope a query to only include closed projects.
     */
    public function scopeClosed($query)
    {
        return $query->where('status', 'closed');
    }
}
