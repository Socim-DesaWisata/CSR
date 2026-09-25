<?php

use App\Models\Company;
use App\Models\SroiProgram;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

function sroiCategory(Company $company): int
{
    $existing = DB::table('sroi_program_categories')->where('company_id', $company->id)->value('id');
    if ($existing) {
        return $existing;
    }

    return DB::table('sroi_program_categories')->insertGetId([
        'company_id' => $company->id, 'code' => 'CSR', 'name' => 'CSR', 'active' => true,
        'created_at' => now(), 'updated_at' => now(),
    ]);
}

function sroiProgram(Company $company, User $user): SroiProgram
{
    return SroiProgram::create([
        'company_id' => $company->id, 'category_id' => sroiCategory($company), 'name' => 'Program Mandiri',
        'pillar_name' => 'Sosial', 'initiator_owner_name' => 'Pemilik', 'start_year' => 2025,
        'end_year' => 2026, 'description' => 'Uraian', 'boundary_text' => 'Batas',
        'created_by' => $user->id,
    ]);
}

it('denies enumerators and inactive users', function () {
    $company = Company::create(['name' => 'A']);
    foreach (['enumerator', 'company'] as $role) {
        $user = User::factory()->create(['company_id' => $company->id, 'role' => $role, 'is_active' => $role !== 'company']);
        $this->actingAs($user)->get(route('sroi.programs.index'))->assertForbidden();
    }
});

it('isolates program lists from other companies', function () {
    $first = Company::create(['name' => 'A']);
    $second = Company::create(['name' => 'B']);
    $firstUser = User::factory()->create(['company_id' => $first->id, 'role' => 'company', 'is_active' => true]);
    $secondUser = User::factory()->create(['company_id' => $second->id, 'role' => 'company', 'is_active' => true]);
    sroiProgram($first, $firstUser);
    sroiProgram($second, $secondUser);

    $this->actingAs($firstUser)->get(route('sroi.programs.index'))->assertOk()->assertInertia(fn (Assert $page) => $page
        ->component('Sroi/Programs')->has('programs', 1)->where('programs.0.company_id', $first->id));
});

it('rejects a category belonging to another company', function () {
    $first = Company::create(['name' => 'A']);
    $second = Company::create(['name' => 'B']);
    $user = User::factory()->create(['company_id' => $first->id, 'role' => 'company', 'is_active' => true]);
    $this->actingAs($user)->post(route('sroi.programs.store'), [
        'category_id' => sroiCategory($second), 'name' => 'Program', 'pillar_name' => 'Sosial',
        'initiator_owner_name' => 'Pemilik', 'start_year' => 2025, 'end_year' => 2026,
        'description' => 'Uraian', 'boundary_text' => 'Batas', 'status' => 'draft',
    ])->assertSessionHasErrors('category_id');
    expect(SroiProgram::count())->toBe(0);
});

it('creates a standalone program with its creator as owner', function () {
    $company = Company::create(['name' => 'A']);
    $user = User::factory()->create(['company_id' => $company->id, 'role' => 'company', 'is_active' => true]);
    $category = sroiCategory($company);
    $this->actingAs($user)->post(route('sroi.programs.store'), [
        'category_id' => $category, 'name' => 'Program Air', 'pillar_name' => 'Lingkungan',
        'initiator_owner_name' => 'CSR', 'start_year' => 2025, 'end_year' => 2026,
        'description' => 'Air bersih', 'boundary_text' => 'Desa A', 'status' => 'draft',
    ])->assertRedirect()->assertSessionHasNoErrors();

    $program = SroiProgram::firstOrFail();
    expect($program->company_id)->toBe($company->id)
        ->and(DB::table('sroi_program_members')->where('program_id', $program->id)->where('user_id', $user->id)->value('participation'))->toBe('owner')
        ->and(DB::table('sroi_audit_logs')->where('entity_type', 'program')->count())->toBe(1);
    $this->get(route('sroi.programs.stage', [$program, 'description']))->assertOk();
    $this->get(route('sroi.dashboard'))->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('Sroi/Dashboard')->where('total', 1)->where('draft', 1));
});

it('allows editing an existing program after its category is deactivated', function () {
    $company = Company::create(['name' => 'A']);
    $user = User::factory()->create(['company_id' => $company->id, 'role' => 'company', 'is_active' => true]);
    $program = sroiProgram($company, $user);
    DB::table('sroi_program_categories')->where('id', $program->category_id)->update(['active' => false]);

    $this->actingAs($user)->put(route('sroi.programs.update', $program), [
        'category_id' => $program->category_id, 'name' => 'Nama Baru',
        'pillar_name' => $program->pillar_name, 'initiator_owner_name' => $program->initiator_owner_name,
        'start_year' => $program->start_year, 'end_year' => $program->end_year,
        'description' => $program->description, 'boundary_text' => $program->boundary_text, 'status' => 'draft',
    ])->assertRedirect()->assertSessionHasNoErrors();
    expect($program->fresh()->name)->toBe('Nama Baru');
});

it('saves program details with a document in one request', function () {
    Storage::fake('local');
    $company = Company::create(['name' => 'A']);
    $user = User::factory()->create(['company_id' => $company->id, 'role' => 'company', 'is_active' => true]);
    $program = sroiProgram($company, $user);

    $this->actingAs($user)->post(route('sroi.programs.update', $program), [
        '_method' => 'PUT', 'category_id' => $program->category_id, 'name' => 'Program Terbaru',
        'pillar_name' => $program->pillar_name, 'initiator_owner_name' => $program->initiator_owner_name,
        'start_year' => $program->start_year, 'end_year' => $program->end_year,
        'description' => 'Deskripsi terbaru', 'boundary_text' => $program->boundary_text, 'status' => 'draft',
        'document' => UploadedFile::fake()->image('proposal.jpg'),
    ])->assertRedirect()->assertSessionHasNoErrors();

    $document = DB::table('sroi_program_documents')->first();
    expect($program->fresh()->description)->toBe('Deskripsi terbaru')
        ->and($document->stage)->toBe('description');
    Storage::disk('local')->assertExists($document->object_key);
});

it('rejects invalid program documents without changing the description', function () {
    Storage::fake('local');
    $company = Company::create(['name' => 'A']);
    $user = User::factory()->create(['company_id' => $company->id, 'role' => 'company', 'is_active' => true]);
    $program = sroiProgram($company, $user);

    $this->actingAs($user)->post(route('sroi.programs.update', $program), [
        '_method' => 'PUT', 'category_id' => $program->category_id, 'name' => $program->name,
        'pillar_name' => $program->pillar_name, 'initiator_owner_name' => $program->initiator_owner_name,
        'start_year' => $program->start_year, 'end_year' => $program->end_year,
        'description' => 'Tidak boleh tersimpan', 'boundary_text' => $program->boundary_text, 'status' => 'draft',
        'document' => UploadedFile::fake()->create('script.txt'),
    ])->assertSessionHasErrors('document');

    expect($program->fresh()->description)->toBe('Uraian')
        ->and(DB::table('sroi_program_documents')->count())->toBe(0);
});

it('shows documents from every stage in General Description', function () {
    Storage::fake('local');
    $company = Company::create(['name' => 'A']);
    $user = User::factory()->create(['company_id' => $company->id, 'role' => 'company', 'is_active' => true]);
    $program = sroiProgram($company, $user);

    $this->actingAs($user)->post(route('sroi.documents.store', [$program, 'theory-of-change']), [
        'document' => UploadedFile::fake()->image('theory.jpg'),
    ])->assertRedirect();

    $this->get(route('sroi.programs.stage', [$program, 'description']))->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('Sroi/GeneralDescription')
            ->where('documents.0.file_name', 'theory.jpg'));
});

it('saves a stage and prevents cross-company reads and writes', function () {
    $first = Company::create(['name' => 'A']);
    $second = Company::create(['name' => 'B']);
    $owner = User::factory()->create(['company_id' => $first->id, 'role' => 'company', 'is_active' => true]);
    $outsider = User::factory()->create(['company_id' => $second->id, 'role' => 'company', 'is_active' => true]);
    $program = sroiProgram($first, $owner);

    $this->actingAs($owner)->post(route('sroi.entries.store', [$program, 'conditions']), [
        'initial_condition' => 'Sebelum', 'intervention' => 'Intervensi', 'expected_condition' => 'Sesudah',
    ])->assertRedirect();
    expect(DB::table('sroi_theory_of_change_conditions')->where('program_id', $program->id)->count())->toBe(1)
        ->and(DB::table('sroi_audit_logs')->where('entity_type', 'conditions')->count())->toBe(1);
    $this->get(route('sroi.programs.stage', [$program, 'theory-of-change']))->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('Sroi/TheoryOfChange')->where('sections.0.rows.0.initial_condition', 'Sebelum'));

    $this->actingAs($outsider)->get(route('sroi.programs.stage', [$program, 'theory-of-change']))->assertForbidden();
    $this->post(route('sroi.entries.store', [$program, 'conditions']), [
        'initial_condition' => 'Bocor', 'intervention' => 'Salah', 'expected_condition' => 'Salah',
    ])->assertForbidden();
});

it('rejects a parent from another program', function () {
    $company = Company::create(['name' => 'A']);
    $user = User::factory()->create(['company_id' => $company->id, 'role' => 'company', 'is_active' => true]);
    $first = sroiProgram($company, $user);
    $second = sroiProgram($company, $user);
    $parent = DB::table('sroi_lfa_nodes')->insertGetId([
        'company_id' => $company->id, 'program_id' => $second->id,
        'level' => 'goal', 'element' => 'Goal', 'sort_order' => 1,
        'created_at' => now(), 'updated_at' => now(),
    ]);

    $this->actingAs($user)->post(route('sroi.entries.store', [$first, 'nodes']), [
        'parent_id' => $parent, 'level' => 'purpose', 'element' => 'Tujuan',
    ])->assertSessionHasErrors('parent_id');
    expect(DB::table('sroi_lfa_nodes')->count())->toBe(1);
});

it('keeps unknown investment values null and rejects years outside the program', function () {
    $company = Company::create(['name' => 'A']);
    $user = User::factory()->create(['company_id' => $company->id, 'role' => 'company', 'is_active' => true]);
    $program = sroiProgram($company, $user);
    $this->actingAs($user)->post(route('sroi.entries.store', [$program, 'investments']), [
        'investor_name' => 'CSR', 'contribution_type' => 'cash', 'form' => 'Dana', 'currency_code' => 'IDR',
    ])->assertRedirect();
    $investment = DB::table('sroi_program_investments')->value('id');
    $this->post(route('sroi.entries.store', [$program, 'investment-years']), [
        'investment_id' => $investment, 'year' => 2025, 'amount' => '',
    ])->assertRedirect();
    expect(DB::table('sroi_program_investment_years')->value('amount'))->toBeNull();
    $this->post(route('sroi.entries.store', [$program, 'investment-years']), [
        'investment_id' => $investment, 'year' => 2030, 'amount' => -1,
    ])->assertSessionHasErrors(['year', 'amount']);
});

it('reserves the catalog and company list for administrators', function () {
    $company = Company::create(['name' => 'A']);
    $member = User::factory()->create(['company_id' => $company->id, 'role' => 'company', 'is_active' => true]);
    $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
    $this->actingAs($member)->get(route('sroi.catalog.index'))->assertForbidden();
    $this->get(route('sroi.companies.index'))->assertForbidden();
    $this->actingAs($admin)->post(route('sroi.catalog.store', 'program-categories'), [
        'company_id' => $company->id, 'code' => 'CSR', 'name' => 'Program CSR', 'active' => true,
    ])->assertRedirect();
    expect(DB::table('sroi_program_categories')->where('company_id', $company->id)->value('name'))->toBe('Program CSR');
    $this->get(route('sroi.catalog.index'))->assertOk()->assertInertia(fn (Assert $page) => $page->component('Sroi/Catalog'));
    $this->get(route('sroi.companies.index'))->assertOk()->assertInertia(fn (Assert $page) => $page->component('Sroi/Companies'));
});

it('stores private evidence and denies another company its download', function () {
    Storage::fake('local');
    $first = Company::create(['name' => 'A']);
    $second = Company::create(['name' => 'B']);
    $owner = User::factory()->create(['company_id' => $first->id, 'role' => 'company', 'is_active' => true]);
    $outsider = User::factory()->create(['company_id' => $second->id, 'role' => 'company', 'is_active' => true]);
    $program = sroiProgram($first, $owner);
    $this->actingAs($owner)->post(route('sroi.documents.store', [$program, 'description']), [
        'document' => UploadedFile::fake()->image('bukti.jpg'),
    ])->assertRedirect();
    $document = DB::table('sroi_program_documents')->first();
    expect($document)->not->toBeNull();
    Storage::disk('local')->assertExists($document->object_key);
    $this->get(route('sroi.documents.download', [$program, $document->id]))->assertOk();
    $this->actingAs($outsider)->get(route('sroi.documents.download', [$program, $document->id]))->assertForbidden();
});

it('exports stage data and a narrative without calculated ratios', function () {
    Storage::fake('local');
    $company = Company::create(['name' => 'A']);
    $user = User::factory()->create(['company_id' => $company->id, 'role' => 'company', 'is_active' => true]);
    $program = sroiProgram($company, $user);
    $this->actingAs($user)->post(route('sroi.entries.store', [$program, 'conditions']), [
        'initial_condition' => 'Awal', 'intervention' => 'Pelatihan', 'expected_condition' => 'Akhir',
    ])->assertRedirect();

    $this->post(route('sroi.exports.store', [$program, 'theory-of-change']))->assertRedirect()->assertSessionHasNoErrors();
    $this->post(route('sroi.exports.store', [$program, 'narrative']))->assertRedirect()->assertSessionHasNoErrors();
    $exports = DB::table('sroi_report_exports')->orderBy('id')->get();
    expect($exports)->toHaveCount(2)->and($exports->pluck('status')->all())->toBe(['ready', 'ready']);
    foreach ($exports as $export) {
        Storage::disk('local')->assertExists($export->object_key);
        $this->get(route('sroi.exports.download', [$program, $export->id]))->assertOk();
    }
    $zip = new ZipArchive;
    expect($zip->open(Storage::disk('local')->path($exports[1]->object_key)))->toBeTrue();
    $text = $zip->getFromName('word/document.xml');
    $zip->close();
    expect($text)->toContain('Pelatihan')->not->toContain('Rasio SROI');
});

it('restricts viewer edits and hides programs from unassigned company users', function () {
    $company = Company::create(['name' => 'A']);
    $owner = User::factory()->create(['company_id' => $company->id, 'role' => 'company', 'is_active' => true]);
    $viewer = User::factory()->create(['company_id' => $company->id, 'role' => 'company', 'is_active' => true]);
    $unassigned = User::factory()->create(['company_id' => $company->id, 'role' => 'company', 'is_active' => true]);
    $program = sroiProgram($company, $owner);
    DB::table('sroi_program_members')->insert([
        ['company_id' => $company->id, 'program_id' => $program->id, 'user_id' => $owner->id, 'participation' => 'owner', 'created_at' => now(), 'updated_at' => now()],
        ['company_id' => $company->id, 'program_id' => $program->id, 'user_id' => $viewer->id, 'participation' => 'viewer', 'created_at' => now(), 'updated_at' => now()],
    ]);

    $this->actingAs($viewer)->get(route('sroi.programs.stage', [$program, 'theory-of-change']))->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('Sroi/TheoryOfChange')->where('canEdit', false));
    $this->post(route('sroi.entries.store', [$program, 'conditions']), [
        'initial_condition' => 'A', 'intervention' => 'B', 'expected_condition' => 'C',
    ])->assertForbidden();
    $this->actingAs($unassigned)->get(route('sroi.programs.stage', [$program, 'description']))->assertForbidden();
    $this->get(route('sroi.programs.index'))->assertInertia(fn (Assert $page) => $page->component('Sroi/Programs')->has('programs', 0));
});

it('loads only child areas for an authorized program', function () {
    $company = Company::create(['name' => 'A']);
    $other = Company::create(['name' => 'B']);
    $owner = User::factory()->create(['company_id' => $company->id, 'role' => 'company', 'is_active' => true]);
    $outsider = User::factory()->create(['company_id' => $other->id, 'role' => 'company', 'is_active' => true]);
    $program = sroiProgram($company, $owner);
    $province = DB::table('provinces')->insertGetId(['name' => 'Provinsi A', 'created_at' => now(), 'updated_at' => now()]);
    $another = DB::table('provinces')->insertGetId(['name' => 'Provinsi B', 'created_at' => now(), 'updated_at' => now()]);
    DB::table('cities')->insert([
        ['province_id' => $province, 'name' => 'Kota A', 'type' => 'kota', 'created_at' => now(), 'updated_at' => now()],
        ['province_id' => $another, 'name' => 'Kota B', 'type' => 'kota', 'created_at' => now(), 'updated_at' => now()],
    ]);

    $this->actingAs($owner)->getJson(route('sroi.areas.index', [$program, 'cities']).'?parent='.$province)
        ->assertOk()->assertJsonCount(1)->assertJsonPath('0.name', 'Kota A');
    $this->actingAs($outsider)->getJson(route('sroi.areas.index', [$program, 'cities']).'?parent='.$province)->assertForbidden();
});

it('keeps indicators and proxies within one outcome and accepts unknown impact inputs', function () {
    $company = Company::create(['name' => 'A']);
    $user = User::factory()->create(['company_id' => $company->id, 'role' => 'company', 'is_active' => true]);
    $first = sroiProgram($company, $user);
    $second = sroiProgram($company, $user);
    $category = DB::table('sroi_outcome_categories')->insertGetId([
        'company_id' => $company->id, 'program_category_id' => $first->category_id,
        'code' => 'OUT', 'name' => 'Outcome', 'active' => true, 'created_at' => now(), 'updated_at' => now(),
    ]);
    $stakeholderCategory = DB::table('sroi_stakeholder_categories')->insertGetId([
        'company_id' => $company->id, 'program_category_id' => $first->category_id,
        'code' => 'ST', 'name' => 'Stakeholder', 'active' => true, 'created_at' => now(), 'updated_at' => now(),
    ]);
    $list = DB::table('sroi_stakeholder_category_lists')->insertGetId([
        'company_id' => $company->id, 'program_category_id' => $first->category_id,
        'stakeholder_category_id' => $stakeholderCategory, 'code' => 'LIST', 'name' => 'Peserta',
        'active' => true, 'created_at' => now(), 'updated_at' => now(),
    ]);
    $outcomes = [];
    foreach ([$first, $second] as $program) {
        $stakeholder = DB::table('sroi_program_stakeholders')->insertGetId([
            'company_id' => $company->id, 'program_id' => $program->id,
            'program_category_id' => $program->category_id, 'stakeholder_category_list_id' => $list,
            'role_in_program' => 'Penerima manfaat', 'included' => true, 'inclusion_reason' => 'Terlibat',
            'sort_order' => 1, 'created_at' => now(), 'updated_at' => now(),
        ]);
        $outcomes[] = DB::table('sroi_program_outcomes')->insertGetId([
            'company_id' => $company->id, 'program_id' => $program->id,
            'program_category_id' => $program->category_id, 'stakeholder_id' => $stakeholder,
            'outcome_category_id' => $category, 'name' => 'Peningkatan', 'description' => 'Uraian',
            'relevant' => true, 'significant' => true, 'material' => true,
            'materiality_reason' => 'Berdampak', 'sort_order' => 1,
            'created_at' => now(), 'updated_at' => now(),
        ]);
    }
    $indicator = DB::table('sroi_outcome_indicators')->insertGetId([
        'company_id' => $company->id, 'outcome_id' => $outcomes[0], 'name' => 'Jumlah',
        'evidence' => 'Dokumen', 'evidence_source' => 'Survei', 'sort_order' => 1,
        'created_at' => now(), 'updated_at' => now(),
    ]);
    $foreignProxy = DB::table('sroi_financial_proxies')->insertGetId([
        'company_id' => $company->id, 'outcome_id' => $outcomes[1],
        'approach' => 'Harga', 'source' => 'Survei', 'unit' => 'orang',
        'created_at' => now(), 'updated_at' => now(),
    ]);
    $this->actingAs($user)->post(route('sroi.entries.store', [$first, 'impact-years']), [
        'outcome_id' => $outcomes[0], 'indicator_id' => $indicator, 'financial_proxy_id' => $foreignProxy,
        'period_type' => 'evaluative', 'year' => 2025, 'quantity' => '', 'deadweight_pct' => 101,
    ])->assertSessionHasErrors(['financial_proxy_id', 'deadweight_pct']);

    $ownProxy = DB::table('sroi_financial_proxies')->insertGetId([
        'company_id' => $company->id, 'outcome_id' => $outcomes[0],
        'approach' => 'Harga', 'source' => 'Survei', 'unit' => 'orang',
        'created_at' => now(), 'updated_at' => now(),
    ]);
    $this->post(route('sroi.entries.store', [$first, 'impact-years']), [
        'outcome_id' => $outcomes[0], 'indicator_id' => $indicator, 'financial_proxy_id' => $ownProxy,
        'period_type' => 'evaluative', 'year' => 2025, 'quantity' => '', 'deadweight_pct' => '',
    ])->assertRedirect()->assertSessionHasNoErrors();
    $impact = DB::table('sroi_outcome_impact_years')->first();
    expect($impact->quantity)->toBeNull()->and($impact->deadweight_pct)->toBeNull();
});

it('renders a dedicated Inertia page for every SROI program menu', function () {
    $company = Company::create(['name' => 'A']);
    $user = User::factory()->create(['company_id' => $company->id, 'role' => 'company', 'is_active' => true]);
    $program = sroiProgram($company, $user);

    $pages = [
        'description' => 'GeneralDescription',
        'theory-of-change' => 'TheoryOfChange',
        'lfa' => 'Lfa',
        'roadmap' => 'Roadmap',
        'scope' => 'ProgramScope',
        'stakeholder' => 'StakeholderIdentification',
        'outcome' => 'OutcomeIdentification',
        'table' => 'SroiTable',
        'calculation' => 'SroiCalculation',
        'report' => 'SroiReport',
    ];

    foreach ($pages as $stage => $page) {
        $this->actingAs($user)->get(route('sroi.programs.stage', [$program, $stage]))->assertOk()
            ->assertInertia(fn (Assert $response) => $response->component('Sroi/'.$page)
                ->where('program.id', $program->id)->where('stage', $stage));
    }

    $this->get(route('sroi.programs.stage', [$program, 'missing']))->assertNotFound();
});
