<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Submission extends Model
{
    use SoftDeletes;

    public $timestamps = false;

    protected $fillable = [
        'company_id',
        'project_id',
        'assessment_type',
        'respondent_id',
        'enumerator_id',
        'status',
        'photo_path',
        'photo_mime',
        'photo_size_bytes',
        'latitude',
        'longitude',
        'submitted_at',
    ];

    protected function casts(): array
    {
        return [
            'submitted_at' => 'datetime',
            'created_at' => 'datetime',
            'latitude' => 'decimal:10',
            'longitude' => 'decimal:10',
            'photo_size_bytes' => 'integer',
        ];
    }

    /**
     * Get the company that owns the submission.
     */
    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    /**
     * Get the project that owns the submission.
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * Get the respondent for the submission.
     */
    public function respondent(): BelongsTo
    {
        return $this->belongsTo(Respondent::class);
    }

    /**
     * Get the enumerator (user) who made the submission.
     */
    public function enumerator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'enumerator_id');
    }

    /**
     * Get the timeline entries for this submission.
     */
    public function timelines(): HasMany
    {
        return $this->hasMany(SubmissionTimeline::class);
    }

    /**
     * Get the template answers for IKM/SLOI submissions.
     */
    public function templateAnswers(): HasMany
    {
        return $this->hasMany(SubmissionTemplateAnswer::class);
    }

    /**
     * Get the descriptive answers for the submission.
     */
    public function descriptiveAnswers(): HasMany
    {
        return $this->hasMany(SubmissionDescriptiveAnswer::class);
    }

    /**
     * Scope a query to only include IKM submissions.
     */
    public function scopeIkm($query)
    {
        return $query->where('assessment_type', 'IKM');
    }

    /**
     * Scope a query to only include SLOI submissions.
     */
    public function scopeSloi($query)
    {
        return $query->where('assessment_type', 'SLOI');
    }

    /**
     * Scope a query to only include submitted submissions.
     */
    public function scopeSubmitted($query)
    {
        return $query->where('status', 'submitted');
    }

    /**
     * Scope a query to only include approved submissions.
     */
    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    /**
     * Scope a query to only include rejected submissions.
     */
    public function scopeRejected($query)
    {
        return $query->where('status', 'rejected');
    }
}
