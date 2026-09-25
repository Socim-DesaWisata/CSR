<?php

namespace App\Http\Controllers\Sroi;

use App\Http\Controllers\Controller;
use App\Http\Requests\Sroi\StoreCatalogRequest;
use App\Models\Company;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class CatalogController extends Controller
{
    private const TABLES = [
        'program-categories' => 'sroi_program_categories',
        'stakeholder-categories' => 'sroi_stakeholder_categories',
        'stakeholder-lists' => 'sroi_stakeholder_category_lists',
        'outcome-categories' => 'sroi_outcome_categories',
    ];

    public function index(Request $request, string $view = 'catalog'): Response
    {
        $this->access($request);
        abort_unless(in_array($view, ['catalog', 'companies'], true), 404);

        return Inertia::render($view === 'catalog' ? 'Sroi/Catalog' : 'Sroi/Companies', [
            'companies' => Company::query()->orderBy('name')->get(['id', 'name', 'status', 'email', 'phone']),
            ...($view === 'catalog' ? ['catalogs' => collect(self::TABLES)->mapWithKeys(fn (string $table, string $key): array => [
                $key => DB::table($table)->orderBy('company_id')->orderBy('id')->get(),
            ])] : []),
        ]);
    }

    public function store(StoreCatalogRequest $request, string $kind): RedirectResponse
    {
        $data = $request->validated();
        DB::transaction(function () use ($request, $data, $kind): void {
            $id = DB::table(self::TABLES[$kind])->insertGetId([...$data, 'created_at' => now(), 'updated_at' => now()]);
            $this->audit($request, $data['company_id'], $kind, $id, 'create', null, $data);
        });

        return back();
    }

    public function update(StoreCatalogRequest $request, string $kind, int $entry): RedirectResponse
    {
        $data = $request->validated();
        $query = DB::table(self::TABLES[$kind])->where('id', $entry);
        $before = (array) $query->first();
        abort_if($before === [] || (int) $before['company_id'] !== (int) $data['company_id'], 403);
        DB::transaction(function () use ($request, $query, $data, $kind, $entry, $before): void {
            $query->update([...$data, 'updated_at' => now()]);
            $this->audit($request, $data['company_id'], $kind, $entry, 'update', $before, $data);
        });

        return back();
    }

    private function access(Request $request): void
    {
        abort_unless($request->user()?->is_active && in_array($request->user()->role, ['admin', 'superadmin'], true), 403);
    }

    private function audit(Request $request, int $companyId, string $kind, int $entry, string $action, ?array $before, ?array $after): void
    {
        DB::table('sroi_audit_logs')->insert([
            'company_id' => $companyId, 'actor_user_id' => $request->user()->id,
            'entity_type' => $kind, 'entity_id' => $entry, 'action' => $action,
            'before_state' => $before === null ? null : json_encode($before),
            'after_state' => $after === null ? null : json_encode($after), 'occurred_at' => now(),
        ]);
    }
}
