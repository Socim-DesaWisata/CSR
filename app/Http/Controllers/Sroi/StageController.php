<?php

namespace App\Http\Controllers\Sroi;

use App\Http\Controllers\Controller;
use App\Http\Requests\Sroi\AreaRequest;
use App\Http\Requests\Sroi\SaveStageBatchRequest;
use App\Http\Requests\Sroi\StoreStageRequest;
use App\Http\Requests\Sroi\StoreTheoryOfChangeRequest;
use App\Models\SroiProgram;
use App\Services\SroiStages;
use Illuminate\Database\Query\Builder;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class StageController extends Controller
{
    public function areas(AreaRequest $request, SroiProgram $program, string $level): JsonResponse
    {
        $parent = ['cities' => 'province_id', 'districts' => 'city_id', 'villages' => 'district_id'][$level] ?? null;
        $query = DB::table($level);
        if ($parent) {
            $query->where($parent, $request->validated('parent'));
        }

        return response()->json($query->orderBy('name')->get(['id', 'name']));
    }

    public function show(Request $request, SroiProgram $program, string $stage): Response
    {
        app(ProgramController::class)->access($request, $program);
        abort_unless(isset(SroiStages::PAGES[$stage]), 404);

        $sections = [];
        foreach (SroiStages::forStage($stage) as $key => [$group, $title, $table, $fields]) {
            $choices = [];
            foreach ($fields as $field => $descriptor) {
                if (str_starts_with($descriptor, 'reference:')) {
                    $parent = rtrim(substr($descriptor, 10), '?');
                    $choices[$field] = $this->choices($parent, $program, $field);
                }
            }
            $sections[] = [
                'key' => $key, 'title' => $title, 'fields' => $fields,
                'rows' => $this->records($table, $program)->orderBy('id')->get(),
                'choices' => $choices,
            ];
        }

        return Inertia::render('Sroi/'.SroiStages::PAGES[$stage], [
            'program' => $program,
            'stage' => $stage,
            'title' => SroiStages::TITLES[$stage],
            'canEdit' => $request->user()->role !== 'company' || ! DB::table('sroi_program_members')->where('program_id', $program->id)->exists()
                || DB::table('sroi_program_members')->where('program_id', $program->id)->where('user_id', $request->user()->id)->whereIn('participation', ['owner', 'editor'])->exists(),
            'canManageMembers' => $request->user()->role !== 'company' || $program->created_by === $request->user()->id
                || DB::table('sroi_program_members')->where('program_id', $program->id)->where('user_id', $request->user()->id)->where('participation', 'owner')->exists(),
            'sections' => $sections,
            'documents' => DB::table('sroi_program_documents')->where('company_id', $program->company_id)->where('program_id', $program->id)->where('stage', $stage)->get(['id', 'file_name', 'size_bytes']),
            'exports' => DB::table('sroi_report_exports')->where('company_id', $program->company_id)->where('program_id', $program->id)
                ->when($stage === 'theory-of-change', fn (Builder $query) => $query->whereIn('stage', [$stage, $stage.':conditions', $stage.':flows']),
                    fn (Builder $query) => $query->where($stage === 'report' ? 'report_type' : 'stage', $stage === 'report' ? 'qualitative' : $stage))
                ->latest()->get(['id', 'stage', 'format', 'status', 'created_at']),
        ]);
    }

    public function store(StoreStageRequest $request, SroiProgram $program, string $section): RedirectResponse
    {
        $table = SroiStages::definitions()[$section][2];
        try {
            $this->save($request, $program, $section, $table);
        } catch (QueryException $exception) {
            if (($exception->errorInfo[0] ?? null) !== '23000') {
                throw $exception;
            }

            return back()->withErrors(['record' => 'Data bertentangan dengan relasi atau entri yang sudah ada.']);
        }

        return back();
    }

    public function saveTheory(StoreTheoryOfChangeRequest $request, SroiProgram $program): RedirectResponse
    {
        $changes = $request->validated();

        DB::transaction(function () use ($request, $program, $changes): void {
            SroiProgram::query()->whereKey($program->id)->lockForUpdate()->firstOrFail();

            foreach ([
                'conditions' => 'sroi_theory_of_change_conditions',
                'flows' => 'sroi_theory_of_change_flows',
            ] as $section => $table) {
                $entries = $changes[$section];
                $ids = array_merge(array_column($entries['update'], 'id'), array_column($entries['delete'], 'id'));
                if (count($ids) !== count(array_unique($ids))) {
                    throw ValidationException::withMessages(['record' => 'Baris yang sama tidak boleh diubah dua kali.']);
                }

                $fields = array_keys(SroiStages::definitions()[$section][3]);
                foreach (['update', 'delete'] as $operation) {
                    foreach ($entries[$operation] as $entry) {
                        $record = $this->records($table, $program)->where('id', $entry['id'])->lockForUpdate()->first();
                        if (! $record) {
                            throw ValidationException::withMessages(['record' => 'Baris tidak ditemukan pada program ini.']);
                        }
                        foreach ($fields as $field) {
                            if ($record->{$field} !== $entry['original'][$field]) {
                                throw ValidationException::withMessages(['record' => 'Data berubah sejak halaman dibuka. Muat ulang sebelum menyimpan.']);
                            }
                        }

                        $before = (array) $record;
                        if ($operation === 'delete') {
                            $this->records($table, $program)->where('id', $entry['id'])->delete();
                            $this->audit($request, $program, $section, $entry['id'], 'archive', $before, null);
                        } else {
                            $this->records($table, $program)->where('id', $entry['id'])->update([...$entry['values'], 'updated_at' => now()]);
                            $this->audit($request, $program, $section, $entry['id'], 'update', $before, $entry['values']);
                        }
                    }
                }

                $order = (int) $this->records($table, $program)->max('sort_order');
                foreach ($entries['create'] as $values) {
                    $row = [
                        'company_id' => $program->company_id, 'program_id' => $program->id,
                        'sort_order' => ++$order, ...$values, 'created_at' => now(), 'updated_at' => now(),
                    ];
                    $id = DB::table($table)->insertGetId($row);
                    $this->audit($request, $program, $section, $id, 'create', null, $row);
                }
            }
        }, 3);

        return back();
    }

    public function saveBatch(SaveStageBatchRequest $request, SroiProgram $program, string $stage): RedirectResponse
    {
        $sections = $request->validated()['sections'];
        $definitions = SroiStages::forStage($stage);

        try {
            DB::transaction(function () use ($request, $program, $stage, $sections, $definitions): void {
                SroiProgram::query()->whereKey($program->id)->lockForUpdate()->firstOrFail();
                $entriesBySection = [];
                $snapshots = [];
                foreach ($definitions as $section => [, , $table]) {
                    $entries = $sections[$section];
                    $ids = array_merge(array_column($entries['update'], 'id'), array_column($entries['delete'], 'id'));
                    if (count($ids) !== count(array_unique($ids))) {
                        throw ValidationException::withMessages(['record' => 'Baris yang sama tidak boleh diubah dua kali.']);
                    }
                    $entriesBySection[$section] = $entries;
                    foreach (['update', 'delete'] as $operation) {
                        foreach ($entries[$operation] as $key => $entry) {
                            $record = $this->records($table, $program)->where('id', $entry['id'])->lockForUpdate()->first();
                            if (! $record) {
                                throw ValidationException::withMessages(['record' => 'Baris tidak ditemukan pada program ini.']);
                            }
                            foreach (array_keys(SroiStages::definitions()[$section][3]) as $field) {
                                if ($this->normalizeSnapshot($record->{$field}) !== $this->normalizeSnapshot($entry['original'][$field])) {
                                    throw ValidationException::withMessages(['record' => 'Data berubah sejak halaman dibuka. Muat ulang sebelum menyimpan.']);
                                }
                            }
                            $snapshots[$section][$entry['id']] = (array) $record;
                        }
                    }
                }

                $createdIds = [];
                $parentSections = ['items', 'outcomes', 'stakeholders'];
                foreach ($this->batchSectionOrder($stage) as $section) {
                    if (! isset($entriesBySection[$section]) || in_array($section, $parentSections, true)) {
                        continue;
                    }
                    $this->deleteBatchSection($request, $program, $section, $entriesBySection[$section], $snapshots);
                }

                foreach ($this->batchSectionOrder($stage) as $section) {
                    if (isset($entriesBySection[$section]) && in_array($section, $parentSections, true)) {
                        $this->createBatchSection($request, $program, $section, $entriesBySection[$section], $definitions, $createdIds);
                    }
                }

                foreach ($entriesBySection as $section => $entries) {
                    [, , $table] = SroiStages::definitions()[$section];
                    foreach ($entries['update'] as $entry) {
                        $values = $this->resolveDraftReferences($entry['values'], $section, $createdIds, $definitions);
                        $values['updated_at'] = now();
                        $this->records($table, $program)->where('id', $entry['id'])->update($values);
                        $this->audit($request, $program, $section, $entry['id'], 'update', $snapshots[$section][$entry['id']], $values);
                    }
                }

                foreach ($this->batchSectionOrder($stage) as $section) {
                    if (isset($entriesBySection[$section]) && ! in_array($section, $parentSections, true)) {
                        $this->createBatchSection($request, $program, $section, $entriesBySection[$section], $definitions, $createdIds);
                    }
                }

                foreach (array_reverse($this->batchSectionOrder($stage)) as $section) {
                    if (isset($entriesBySection[$section]) && in_array($section, $parentSections, true)) {
                        $this->deleteBatchSection($request, $program, $section, $entriesBySection[$section], $snapshots);
                    }
                }
            }, 3);
        } catch (QueryException $exception) {
            if (($exception->errorInfo[0] ?? null) !== '23000') {
                throw $exception;
            }

            return back()->withErrors(['record' => 'Batch gagal karena data masih digunakan atau melanggar batasan unik. Tidak ada perubahan yang disimpan.']);
        }

        return back();
    }

    private function createBatchSection(Request $request, SroiProgram $program, string $section, array $entries, array $definitions, array &$createdIds): void
    {
        [, , $table] = SroiStages::definitions()[$section];
        $hasOrder = in_array($section, ['items', 'stakeholders', 'outcomes', 'indicators'], true);
        $order = $hasOrder ? (int) $this->records($table, $program)->max('sort_order') : 0;
        foreach ($entries['create'] as $clientKey => $entry) {
            $values = $this->resolveDraftReferences($entry['values'], $section, $createdIds, $definitions);
            $row = [
                'company_id' => $program->company_id,
                ...(! in_array($section, ['indicators', 'proxies', 'impact-years'], true) ? ['program_id' => $program->id] : []),
                ...(in_array($section, ['stakeholders', 'outcomes'], true) ? ['program_category_id' => $program->category_id] : []),
                ...($hasOrder ? ['sort_order' => ++$order] : []),
                ...($section === 'impact-years' ? ['updated_by' => $request->user()->id] : []),
                ...$values,
                'created_at' => now(),
                'updated_at' => now(),
            ];
            $id = DB::table($table)->insertGetId($row);
            $createdIds[$section][$clientKey] = $id;
            $this->audit($request, $program, $section, $id, 'create', null, $row);
        }
    }

    private function deleteBatchSection(Request $request, SroiProgram $program, string $section, array $entries, array $snapshots): void
    {
        [, , $table] = SroiStages::definitions()[$section];
        foreach ($entries['delete'] as $entry) {
            $this->records($table, $program)->where('id', $entry['id'])->delete();
            $this->audit($request, $program, $section, $entry['id'], 'archive', $snapshots[$section][$entry['id']], null);
        }
    }

    private function batchSectionOrder(string $stage): array
    {
        return match ($stage) {
            'roadmap' => ['items', 'targets'],
            'stakeholder' => ['stakeholders'],
            'outcome' => ['outcomes', 'indicators', 'proxies'],
            'table' => ['impact-years'],
        };
    }

    private function normalizeSnapshot(mixed $value): string
    {
        return is_bool($value) ? ($value ? '1' : '0') : (string) ($value ?? '');
    }

    private function resolveDraftReferences(array $values, string $section, array $createdIds, array $definitions): array
    {
        $fields = SroiStages::definitions()[$section][3];
        foreach ($values as $field => $value) {
            if (! is_string($value) || ! str_starts_with($value, '@draft:')) {
                continue;
            }
            $table = rtrim(substr($fields[$field], 10), '?');
            $targetSection = array_search($table, array_column($definitions, 2), true);
            $targetSection = $targetSection === false ? null : array_keys($definitions)[$targetSection];
            $clientKey = substr($value, 7);
            if (! $targetSection || ! isset($createdIds[$targetSection][$clientKey])) {
                throw ValidationException::withMessages(['record' => 'Referensi draft tidak ditemukan. Muat ulang dan coba lagi.']);
            }
            $values[$field] = $createdIds[$targetSection][$clientKey];
        }

        return $values;
    }

    public function update(StoreStageRequest $request, SroiProgram $program, string $section, int $entry): RedirectResponse
    {
        $table = SroiStages::definitions()[$section][2];
        try {
            $this->save($request, $program, $section, $table, $entry);
        } catch (QueryException $exception) {
            if (($exception->errorInfo[0] ?? null) !== '23000') {
                throw $exception;
            }

            return back()->withErrors(['record' => 'Data bertentangan dengan relasi atau entri yang sudah ada.']);
        }

        return back();
    }

    public function destroy(Request $request, SroiProgram $program, string $section, int $entry): RedirectResponse
    {
        app(ProgramController::class)->access($request, $program, true);
        if ($section === 'members' && $request->user()->role === 'company') {
            abort_unless(DB::table('sroi_program_members')->where('program_id', $program->id)->where('user_id', $request->user()->id)->where('participation', 'owner')->exists() || $program->created_by === $request->user()->id, 403);
        }
        abort_unless(isset(SroiStages::definitions()[$section]), 404);
        $table = SroiStages::definitions()[$section][2];
        $before = (array) $this->records($table, $program)->where('id', $entry)->first();
        abort_if($before === [], 404);
        if ($section === 'members' && $before['participation'] === 'owner'
            && ! DB::table('sroi_program_members')->where('program_id', $program->id)->where('participation', 'owner')->where('id', '!=', $entry)->exists()) {
            return back()->withErrors(['record' => 'Program harus memiliki minimal satu owner.']);
        }

        try {
            DB::transaction(function () use ($request, $program, $table, $section, $entry, $before): void {
                $this->records($table, $program)->where('id', $entry)->delete();
                $this->audit($request, $program, $section, $entry, 'archive', $before, null);
            });
        } catch (QueryException) {
            return back()->withErrors(['record' => 'Data ini masih digunakan oleh tahap lain.']);
        }

        return back();
    }

    private function save(StoreStageRequest $request, SroiProgram $program, string $section, string $table, ?int $entry = null): void
    {
        DB::transaction(function () use ($request, $program, $section, $table, $entry): void {
            $data = $request->validated();
            $data['updated_at'] = now();
            if ($entry !== null) {
                $before = (array) $this->records($table, $program)->where('id', $entry)->first();
                abort_if($before === [], 404);
                $this->records($table, $program)->where('id', $entry)->update($data);
                $this->audit($request, $program, $section, $entry, 'update', $before, $data);

                return;
            }
            $data['company_id'] = $program->company_id;
            if (! in_array($section, ['indicators', 'proxies', 'impact-years'], true)) {
                $data['program_id'] = $program->id;
            }
            if (in_array($section, ['stakeholders', 'outcomes'], true)) {
                $data['program_category_id'] = $program->category_id;
            }
            if ($section === 'impact-years') {
                $data['updated_by'] = $request->user()->id;
            }
            if (in_array($section, ['locations', 'conditions', 'flows', 'nodes', 'items', 'investments', 'stakeholders', 'outcomes', 'indicators'], true)) {
                $data['sort_order'] = $this->records($table, $program)->max('sort_order') + 1;
            }
            $data['created_at'] = now();
            $id = DB::table($table)->insertGetId($data);
            $this->audit($request, $program, $section, $id, 'create', null, $data);
        });
    }

    private function records(string $table, SroiProgram $program): Builder
    {
        $query = DB::table($table)->where('company_id', $program->company_id);
        if (in_array($table, ['sroi_outcome_indicators', 'sroi_financial_proxies', 'sroi_outcome_impact_years'], true)) {
            return $query->whereIn('outcome_id', DB::table('sroi_program_outcomes')->where('company_id', $program->company_id)->where('program_id', $program->id)->select('id'));
        }

        return $query->where('program_id', $program->id);
    }

    private function choices(string $table, SroiProgram $program, string $field): array
    {
        if (in_array($table, ['cities', 'districts', 'villages'], true)) {
            return [];
        }

        $labels = ['users' => 'name', 'sroi_lfa_nodes' => 'element', 'sroi_program_stakeholders' => 'role_in_program', 'sroi_financial_proxies' => 'approach', 'sroi_roadmap_items' => 'id', 'sroi_program_investments' => 'investor_name'];
        $label = $labels[$table] ?? 'name';
        $query = DB::table($table);
        if (str_starts_with($table, 'sroi_')) {
            $query->where('company_id', $program->company_id);
            if (in_array($table, ['sroi_stakeholder_category_lists', 'sroi_outcome_categories'], true)) {
                $query->where('program_category_id', $program->category_id)->where('active', true);
            } elseif (in_array($table, ['sroi_outcome_indicators', 'sroi_financial_proxies'], true)) {
                $query->whereIn('outcome_id', DB::table('sroi_program_outcomes')->where('company_id', $program->company_id)->where('program_id', $program->id)->select('id'));
            } else {
                $query->where('program_id', $program->id);
            }
            if ($field === 'lfa_activity_id') {
                $query->where('level', 'activity');
            }
        } elseif ($table === 'users') {
            $query->where('company_id', $program->company_id)->where('is_active', true)->where('role', 'company');
        }

        return $query->orderBy('id')->get(['id', DB::raw($label.' as name'), ...in_array($table, ['sroi_outcome_indicators', 'sroi_financial_proxies'], true) ? ['outcome_id'] : []])->toArray();
    }

    private function audit(Request $request, SroiProgram $program, string $section, int $entry, string $action, ?array $before, ?array $after): void
    {
        DB::table('sroi_audit_logs')->insert([
            'company_id' => $program->company_id, 'actor_user_id' => $request->user()->id,
            'entity_type' => $section, 'entity_id' => $entry, 'action' => $action,
            'before_state' => $before === null ? null : json_encode($before),
            'after_state' => $after === null ? null : json_encode($after), 'occurred_at' => now(),
        ]);
    }
}
