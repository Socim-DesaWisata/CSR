<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Company extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'legal_name',
        'email',
        'phone',
        'address',
        'status',
    ];

    /**
     * Get the users for the company.
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    /**
     * Get the projects for the company.
     */
    public function projects(): HasMany
    {
        return $this->hasMany(Project::class);
    }

    public function sroiPrograms(): HasMany
    {
        return $this->hasMany(SroiProgram::class);
    }

    /**
     * Get the respondents for the company.
     */
    public function respondents(): HasMany
    {
        return $this->hasMany(Respondent::class);
    }

    /**
     * Get the submissions for the company.
     */
    public function submissions(): HasMany
    {
        return $this->hasMany(Submission::class);
    }

    /**
     * Get the project locations for the company.
     */
    public function projectLocations(): HasMany
    {
        return $this->hasMany(ProjectLocation::class);
    }

    /**
     * Get the project enumerator assignments for the company.
     */
    public function projectEnumeratorAssignments(): HasMany
    {
        return $this->hasMany(ProjectEnumeratorAssignment::class);
    }

    /**
     * Get the project score snapshots for the company.
     */
    public function projectScoreSnapshots(): HasMany
    {
        return $this->hasMany(ProjectScoreSnapshot::class);
    }
}
