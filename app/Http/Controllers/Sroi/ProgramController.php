<?php

namespace App\Http\Controllers\Sroi;

use App\Http\Controllers\Controller;
use App\Http\Requests\Sroi\StoreProgramRequest;
use App\Models\Company;
use App\Models\SroiProgram;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class ProgramController extends Controller
{
    public function dashboard(Request $request): Response
    {
        $this->access($request);
        $query = SroiProgram::query()->when(! in_array($request->user()->role, ['admin', 'superadmin'], true),
            fn ($query) => $query->where('company_id', $request->user()->company_id)->where(function ($query) use ($request): void {
                $query->whereNotIn('id', DB::table('sroi_program_members')->select('program_id'))
                    ->orWhereIn('id', DB::table('sroi_program_members')->where('user_id', $request->user()->id)->select('program_id'));
            }));

        return Inertia::render('Sroi/Dashboard', [
            'total' => (clone $query)->count(),
            'active' => (clone $query)->where('status', 'active')->count(),
            'draft' => (clone $query)->where('status', 'draft')->count(),
            'recent' => $query->latest()->limit(5)->get(['id', 'name', 'status', 'start_year', 'end_year']),
        ]);
    }

    public function index(Request $request): Response
    {
        $this->access($request);
        $isAdmin = in_array($request->user()->role, ['admin', 'superadmin'], true);
        $programs = SroiProgram::query()
            ->when(! $isAdmin, fn ($query) => $query->where('company_id', $request->user()->company_id)->where(function ($query) use ($request): void {
                $query->whereNotIn('id', DB::table('sroi_program_members')->select('program_id'))
                    ->orWhereIn('id', DB::table('sroi_program_members')->where('user_id', $request->user()->id)->select('program_id'));
            }))
            ->with(['company:id,name', 'category:id,name'])
            ->latest()->get();

        return Inertia::render('Sroi/Programs', [
            'programs' => $programs,
            'companies' => $isAdmin ? Company::query()->where('status', 'active')->orderBy('name')->get(['id', 'name']) : [],
            'categories' => DB::table('sroi_program_categories')->when(! $isAdmin, fn ($query) => $query->where('company_id', $request->user()->company_id))->where('active', true)->get(['id', 'company_id', 'name']),
        ]);
    }

    public function store(StoreProgramRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $data['company_id'] = $request->user()->role === 'company' ? $request->user()->company_id : $data['company_id'];
        $data['created_by'] = $request->user()->id;
        $program = DB::transaction(function () use ($data, $request): SroiProgram {
            $program = SroiProgram::create($data);
            DB::table('sroi_program_members')->insert([
                'company_id' => $program->company_id, 'program_id' => $program->id,
                'user_id' => $request->user()->id, 'participation' => 'owner',
                'created_at' => now(), 'updated_at' => now(),
            ]);
            $this->audit($program, $request, 'create', null);

            return $program;
        });

        return to_route('sroi.programs.stage', [$program, 'description']);
    }

    public function update(StoreProgramRequest $request, SroiProgram $program): RedirectResponse
    {
        $this->access($request, $program, true);
        $before = $program->toArray();
        $data = $request->validated();
        $file = $data['document'] ?? null;
        unset($data['document']);
        $data['company_id'] = $request->user()->role === 'company' ? $request->user()->company_id : $data['company_id'];
        abort_unless((int) $data['company_id'] === (int) $program->company_id, 422);
        $documentKey = null;
        try {
            DB::transaction(function () use ($program, $data, $request, $before, $file, &$documentKey): void {
                $program->update($data);
                $this->audit($program, $request, 'update', $before);
                if ($file) {
                    $documentKey = app(DocumentController::class)->storeFile($request, $program, $file, 'description');
                }
            });
        } catch (Throwable $exception) {
            if ($documentKey) {
                Storage::disk('local')->delete($documentKey);
            }

            throw $exception;
        }

        return back();
    }

    public function access(Request $request, ?SroiProgram $program = null, bool $write = false): void
    {
        $user = $request->user();
        abort_unless($user && $user->is_active && in_array($user->role, ['admin', 'superadmin', 'company'], true), 403);
        if ($user->role === 'company') {
            abort_unless($user->company_id && Company::query()->whereKey($user->company_id)->where('status', 'active')->exists(), 403);
            abort_unless(! $program || $program->company_id === $user->company_id, 403);
            if ($program) {
                $members = DB::table('sroi_program_members')->where('company_id', $program->company_id)->where('program_id', $program->id);
                if ((clone $members)->exists()) {
                    $participation = (clone $members)->where('user_id', $user->id)->value('participation');
                    abort_unless($participation && (! $write || in_array($participation, ['owner', 'editor'], true)), 403);
                }
            }
        }
    }

    public function audit(SroiProgram $program, Request $request, string $action, ?array $before): void
    {
        DB::table('sroi_audit_logs')->insert([
            'company_id' => $program->company_id,
            'actor_user_id' => $request->user()->id,
            'entity_type' => 'program',
            'entity_id' => $program->id,
            'action' => $action,
            'before_state' => $before === null ? null : json_encode($before),
            'after_state' => json_encode($program->toArray()),
            'occurred_at' => now(),
        ]);
    }
}
