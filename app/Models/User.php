<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'phone',
        'position',
        'email_verified_at',
        'company_id',
        'is_active',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Get the company that the user belongs to.
     */
    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    /**
     * Get the projects created by this user.
     */
    public function createdProjects(): HasMany
    {
        return $this->hasMany(Project::class, 'created_by');
    }

    /**
     * Get the instrument templates created by this user.
     */
    public function createdTemplates(): HasMany
    {
        return $this->hasMany(InstrumentTemplate::class, 'created_by');
    }

    /**
     * Get the respondents created by this user.
     */
    public function createdRespondents(): HasMany
    {
        return $this->hasMany(Respondent::class, 'created_by');
    }

    /**
     * Get the project assignments for the enumerator.
     */
    public function enumeratorAssignments(): HasMany
    {
        return $this->hasMany(ProjectEnumeratorAssignment::class, 'enumerator_id');
    }

    /**
     * Get the projects assigned to this enumerator.
     */
    public function assignedProjects(): BelongsToMany
    {
        return $this->belongsToMany(Project::class, 'project_enumerator_assignments', 'enumerator_id', 'project_id')
            ->withPivot('created_at');
    }

    /**
     * Get the submissions made by this user as enumerator.
     */
    public function submissions(): HasMany
    {
        return $this->hasMany(Submission::class, 'enumerator_id');
    }

    /**
     * Get the submissions reviewed by this user.
     * Note: 'reviewed_by' column currently not in submissions table migration
     * TODO: Add migration if needed: $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
     */
    // public function reviewedSubmissions(): HasMany
    // {
    //     return $this->hasMany(Submission::class, 'reviewed_by');
    // }

    /**
     * Check if user is superadmin.
     */
    public function isSuperAdmin(): bool
    {
        return $this->role === 'superadmin';
    }

    /**
     * Check if user is admin.
     */
    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    /**
     * Check if user is company admin.
     */
    public function isCompanyAdmin(): bool
    {
        return $this->role === 'company_admin';
    }

    /**
     * Check if user is company staff.
     */
    public function isCompanyStaff(): bool
    {
        return $this->role === 'company_staff';
    }

    /**
     * Check if user is enumerator.
     */
    public function isEnumerator(): bool
    {
        return $this->role === 'enumerator';
    }

    /**
     * Scope a query to only include active users.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope a query to only include users with a specific role.
     */
    public function scopeRole($query, string $role)
    {
        return $query->where('role', $role);
    }

    /**
     * Scope a query to only include enumerators.
     */
    public function scopeEnumerators($query)
    {
        return $query->where('role', 'enumerator');
    }
}
