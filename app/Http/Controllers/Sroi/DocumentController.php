<?php

namespace App\Http\Controllers\Sroi;

use App\Http\Controllers\Controller;
use App\Http\Requests\Sroi\StoreDocumentRequest;
use App\Models\SroiProgram;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Throwable;

class DocumentController extends Controller
{
    public function store(StoreDocumentRequest $request, SroiProgram $program, string $stage): RedirectResponse
    {
        $this->storeFile($request, $program, $request->file('document'), $stage);

        return back();
    }

    public function storeFile(Request $request, SroiProgram $program, UploadedFile $file, string $stage): string
    {
        $key = 'sroi/documents/'.$program->company_id.'/'.$program->id.'/'.Str::uuid().'.'.$file->extension();
        if (! Storage::disk('local')->putFileAs(dirname($key), $file, basename($key))) {
            throw ValidationException::withMessages(['document' => 'Berkas gagal disimpan.']);
        }

        try {
            DB::transaction(function () use ($request, $program, $stage, $file, $key): void {
                $id = DB::table('sroi_program_documents')->insertGetId([
                    'company_id' => $program->company_id, 'program_id' => $program->id,
                    'stage' => $stage, 'file_name' => Str::limit($file->getClientOriginalName(), 255, ''),
                    'object_key' => $key, 'mime_type' => $file->getMimeType(),
                    'size_bytes' => $file->getSize(), 'uploaded_by' => $request->user()->id,
                    'created_at' => now(), 'updated_at' => now(),
                ]);
                DB::table('sroi_audit_logs')->insert([
                    'company_id' => $program->company_id, 'actor_user_id' => $request->user()->id,
                    'entity_type' => 'document', 'entity_id' => $id, 'action' => 'create',
                    'after_state' => json_encode(['stage' => $stage, 'file_name' => $file->getClientOriginalName()]),
                    'occurred_at' => now(),
                ]);
            });
        } catch (Throwable $exception) {
            Storage::disk('local')->delete($key);
            throw $exception;
        }

        return $key;
    }

    public function download(Request $request, SroiProgram $program, int $document): StreamedResponse
    {
        app(ProgramController::class)->access($request, $program);
        $record = DB::table('sroi_program_documents')->where('company_id', $program->company_id)
            ->where('program_id', $program->id)->where('id', $document)->first();
        abort_unless($record && Storage::disk('local')->exists($record->object_key), 404);

        return Storage::disk('local')->download($record->object_key, $record->file_name);
    }
}
