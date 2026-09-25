<?php

namespace App\Http\Controllers\Sroi;

use App\Http\Controllers\Controller;
use App\Models\SroiProgram;
use App\Services\SroiStages;
use Illuminate\Database\Query\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Excel as ExcelWriter;
use Maatwebsite\Excel\Facades\Excel;
use PhpOffice\PhpWord\IOFactory;
use PhpOffice\PhpWord\PhpWord;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Throwable;

class ExportController extends Controller
{
    public function create(Request $request, SroiProgram $program, string $stage): RedirectResponse
    {
        app(ProgramController::class)->access($request, $program);
        abort_unless($stage === 'narrative' || in_array($stage, ['description', 'theory-of-change', 'lfa', 'roadmap', 'scope', 'stakeholder', 'outcome', 'table'], true), 404);
        $request->validate(['section' => [$stage === 'theory-of-change' ? 'sometimes' : 'prohibited', Rule::in(['conditions', 'flows'])]]);
        $section = $request->input('section');
        $format = $stage === 'narrative' ? 'docx' : 'xlsx';
        $key = 'sroi/exports/'.$program->company_id.'/'.$program->id.'/'.Str::uuid().'.'.$format;
        $id = DB::table('sroi_report_exports')->insertGetId([
            'company_id' => $program->company_id, 'program_id' => $program->id,
            'report_type' => $stage === 'narrative' ? 'qualitative' : 'stage_export',
            'stage' => $stage === 'narrative' ? null : ($section ? $stage.':'.$section : $stage),
            'format' => $format, 'status' => 'queued', 'requested_by' => $request->user()->id,
            'created_at' => now(), 'updated_at' => now(),
        ]);

        try {
            if ($stage === 'narrative') {
                $this->document($program, $key);
            } else {
                $this->spreadsheet($program, $stage, $key, $section);
            }
            DB::transaction(function () use ($request, $program, $id, $key, $stage, $section): void {
                DB::table('sroi_report_exports')->where('id', $id)->update([
                    'status' => 'ready', 'object_key' => $key, 'completed_at' => now(), 'updated_at' => now(),
                ]);
                DB::table('sroi_audit_logs')->insert([
                    'company_id' => $program->company_id, 'actor_user_id' => $request->user()->id,
                    'entity_type' => 'export', 'entity_id' => $id, 'action' => 'export',
                    'after_state' => json_encode(['stage' => $stage, 'section' => $section, 'format' => pathinfo($key, PATHINFO_EXTENSION)]),
                    'occurred_at' => now(),
                ]);
            });
        } catch (Throwable $exception) {
            Storage::disk('local')->delete($key);
            DB::table('sroi_report_exports')->where('id', $id)->update([
                'status' => 'failed', 'error_message' => $exception->getMessage(), 'updated_at' => now(),
            ]);

            return back()->withErrors(['export' => 'Ekspor gagal. Coba lagi atau hubungi administrator.']);
        }

        return back();
    }

    public function download(Request $request, SroiProgram $program, int $export): StreamedResponse
    {
        app(ProgramController::class)->access($request, $program);
        $record = DB::table('sroi_report_exports')->where('company_id', $program->company_id)
            ->where('program_id', $program->id)->where('status', 'ready')->where('id', $export)->first();
        abort_unless($record && $record->object_key && Storage::disk('local')->exists($record->object_key), 404);

        return Storage::disk('local')->download($record->object_key, 'sroi-'.$program->id.'-'.$record->id.'.'.$record->format);
    }

    private function spreadsheet(SroiProgram $program, string $stage, string $key, ?string $section = null): void
    {
        $rows = [['Program', $program->name], ['Perusahaan', $program->company->name], ['Tahap', SroiStages::TITLES[$stage]]];
        if ($stage === 'description') {
            foreach (['pillar_name', 'initiator_owner_name', 'start_year', 'end_year', 'description', 'boundary_text', 'status'] as $field) {
                $rows[] = [$field, (string) $program->{$field}];
            }
        }
        $rows[] = [];
        foreach (SroiStages::forStage($stage) as $name => [$group, $title, $table, $fields]) {
            if ($section !== null && $name !== $section) {
                continue;
            }
            $rows[] = [$title];
            $rows[] = array_keys($fields);
            foreach ($this->records($table, $program)->get() as $record) {
                $rows[] = array_map(fn (string $field): string => (string) ($record->{$field} ?? ''), array_keys($fields));
            }
            $rows[] = [];
        }
        $export = new class($rows) implements FromArray
        {
            public function __construct(private readonly array $rows) {}

            public function array(): array
            {
                return $this->rows;
            }
        };
        if (! Excel::store($export, $key, 'local', ExcelWriter::XLSX)) {
            throw new \RuntimeException('Penyimpanan XLSX gagal.');
        }
    }

    private function document(SroiProgram $program, string $key): void
    {
        $word = new PhpWord;
        $section = $word->addSection();
        $section->addTitle('Laporan Naratif Program SROI', 1);
        $section->addText($program->name);
        $section->addText('Perusahaan: '.$program->company->name);
        $section->addText('Periode: '.$program->start_year.'–'.$program->end_year);
        $section->addTitle('Deskripsi', 2);
        $section->addText($program->description);
        $section->addTitle('Batas Program', 2);
        $section->addText($program->boundary_text);
        foreach (['theory-of-change', 'lfa', 'roadmap', 'scope', 'stakeholder', 'outcome', 'table'] as $stage) {
            $section->addTitle(SroiStages::TITLES[$stage], 2);
            foreach (SroiStages::forStage($stage) as [$group, $title, $table, $fields]) {
                $section->addTitle($title, 3);
                $records = $this->records($table, $program)->get();
                if ($records->isEmpty()) {
                    $section->addText('Belum ada data.');
                }
                foreach ($records as $record) {
                    $section->addText(collect(array_keys($fields))->map(fn (string $field): string => str_replace('_', ' ', $field).': '.($record->{$field} ?? '—'))->implode(' | '));
                }
            }
        }
        Storage::disk('local')->makeDirectory(dirname($key));
        IOFactory::createWriter($word, 'Word2007')->save(Storage::disk('local')->path($key));
    }

    private function records(string $table, SroiProgram $program): Builder
    {
        $query = DB::table($table)->where('company_id', $program->company_id);
        if (in_array($table, ['sroi_outcome_indicators', 'sroi_financial_proxies', 'sroi_outcome_impact_years'], true)) {
            return $query->whereIn('outcome_id', DB::table('sroi_program_outcomes')->where('company_id', $program->company_id)->where('program_id', $program->id)->select('id'));
        }

        return $query->where('program_id', $program->id);
    }
}
