<?php

namespace App\Exports;

use App\Models\Submission;
use App\Models\TemplateQuestion;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithColumnFormatting;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\Shared\Date;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\NumberFormat;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class ProjectRespondentsExport implements FromArray, ShouldAutoSize, WithColumnFormatting, WithEvents, WithHeadings, WithStyles, WithTitle
{
    /**
     * @param  Collection<int, Submission>  $submissions
     * @param  Collection<int, TemplateQuestion>  $questions
     */
    public function __construct(
        private readonly Collection $submissions,
        private readonly Collection $questions,
        private readonly string $type,
    ) {}

    /**
     * @return array<int, array<int, mixed>>
     */
    public function array(): array
    {
        return $this->submissions
            ->values()
            ->map(fn (Submission $submission, int $index): array => $this->submissionRow($submission, $index + 1))
            ->all();
    }

    /**
     * @return array<int, string>
     */
    public function headings(): array
    {
        $headings = [
            'No',
            'Submission ID',
            'Tanggal Submit',
            'Status',
            'Enumerator',
            'Nama Responden',
            'Alamat',
            'Telepon',
            'Usia',
            'Jenis Kelamin',
            'Status Responden',
            'Pendidikan',
            'Pekerjaan',
            'Pendapatan Bulanan',
            'Latitude',
            'Longitude',
        ];

        foreach ($this->questions as $question) {
            if ($this->isIkm()) {
                $headings[] = "{$question->code} - Kepentingan";
                $headings[] = "{$question->code} - Kinerja";
            } else {
                $headings[] = "{$question->code} - Nilai";
            }
        }

        if ($this->isIkm()) {
            $headings[] = 'Rata-rata Kepentingan';
            $headings[] = 'Rata-rata Kinerja';
        }

        $headings[] = 'Rata-rata Skor';

        return $headings;
    }

    public function title(): string
    {
        return "Responden {$this->type}";
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function styles(Worksheet $sheet): array
    {
        return [
            1 => [
                'font' => [
                    'bold' => true,
                    'color' => ['argb' => 'FFFFFFFF'],
                ],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['argb' => 'FF166534'],
                ],
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function columnFormats(): array
    {
        return [
            'C' => NumberFormat::FORMAT_DATE_DATETIME,
        ];
    }

    /**
     * @return array<class-string, callable>
     */
    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event): void {
                $lastColumn = Coordinate::stringFromColumnIndex(count($this->headings()));
                $worksheet = $event->sheet->getDelegate();

                $worksheet->freezePane('A2');
                $worksheet->setAutoFilter("A1:{$lastColumn}1");
                $worksheet->getRowDimension(1)->setRowHeight(24);
            },
        ];
    }

    /**
     * @return array<int, mixed>
     */
    private function submissionRow(Submission $submission, int $number): array
    {
        $respondent = $submission->respondent;
        $answers = [];
        $totalScore = 0.0;
        $answerCount = 0;
        $importanceScore = 0.0;
        $importanceCount = 0;
        $performanceScore = 0.0;
        $performanceCount = 0;

        foreach ($submission->templateAnswers as $answer) {
            $code = $answer->question?->code ?? 'Q'.$answer->question_id;
            $answerType = $answer->type ?? 'sloi';

            $answers[$code] ??= ['kepentingan' => null, 'kinerja' => null];

            if ($answerType === 'ikm-kepentingan') {
                $answers[$code]['kepentingan'] = $answer->value;
                $importanceScore += $answer->value ?? 0;
                $importanceCount++;
            } elseif ($answerType === 'ikm-kinerja') {
                $answers[$code]['kinerja'] = $answer->value;
                $performanceScore += $answer->value ?? 0;
                $performanceCount++;
            } else {
                $answers[$code]['kepentingan'] = $answer->value;
                $answers[$code]['kinerja'] = $answer->value;
            }

            $totalScore += $answer->value ?? 0;
            $answerCount++;
        }

        $row = [
            $number,
            $submission->id,
            $submission->submitted_at ? Date::dateTimeToExcel($submission->submitted_at) : '-',
            $this->safeText($submission->status),
            $this->safeText($submission->enumerator?->name),
            $this->safeText($respondent?->name),
            $this->safeText($respondent?->address),
            $this->safeText($respondent?->phone),
            $respondent?->age ?? '-',
            $this->safeText($respondent?->gender),
            $this->safeText($respondent?->respondent_status),
            $this->safeText($respondent?->education_level),
            $this->safeText($respondent?->main_occupation),
            $respondent?->monthly_income ?? '-',
            $submission->latitude,
            $submission->longitude,
        ];

        foreach ($this->questions as $question) {
            $answer = $answers[$question->code] ?? ['kepentingan' => null, 'kinerja' => null];

            if ($this->isIkm()) {
                $row[] = $answer['kepentingan'] ?? '-';
                $row[] = $answer['kinerja'] ?? '-';
            } else {
                $row[] = $answer['kepentingan'] ?? '-';
            }
        }

        if ($this->isIkm()) {
            $row[] = $importanceCount > 0 ? round($importanceScore / $importanceCount, 2) : '-';
            $row[] = $performanceCount > 0 ? round($performanceScore / $performanceCount, 2) : '-';
        }

        $row[] = $answerCount > 0 ? round($totalScore / $answerCount, 2) : '-';

        return $row;
    }

    private function isIkm(): bool
    {
        return $this->type === 'IKM';
    }

    private function safeText(mixed $value): string
    {
        if ($value === null || $value === '') {
            return '-';
        }

        $text = (string) $value;

        return preg_match('/^[=+\-@]/', ltrim($text)) === 1 ? "'{$text}" : $text;
    }
}
