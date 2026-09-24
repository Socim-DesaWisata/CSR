<?php

namespace Database\Seeders;

use App\Models\Company;
use App\Models\District;
use App\Models\InstrumentTemplate;
use App\Models\Project;
use App\Models\ProjectEnumeratorAssignment;
use App\Models\ProjectLocation;
use App\Models\Respondent;
use App\Models\Submission;
use App\Models\SubmissionTemplateAnswer;
use App\Models\SubmissionTimeline;
use App\Models\TemplateQuestion;
use App\Models\User;
use Illuminate\Database\Seeder;

class ProjectDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $company = Company::where('name', 'PT Maju Bersama')->firstOrFail();
        $companyAdmin = User::where('company_id', $company->id)->where('role', 'company')->firstOrFail();
        $enumerators = User::where('company_id', $company->id)->where('role', 'enumerator')->get();
        $district = District::firstOrFail();

        $ikmTemplate = InstrumentTemplate::where('type', 'IKM')->firstOrFail();
        $sloiTemplate = InstrumentTemplate::where('type', 'SLOI')->firstOrFail();

        $ikmKepentinganQuestions = TemplateQuestion::where('template_id', $ikmTemplate->id)
            ->where('category', 'ikm-kepentingan')
            ->orderBy('order_no')
            ->get();
        $ikmKinerjaQuestions = TemplateQuestion::where('template_id', $ikmTemplate->id)
            ->where('category', 'ikm-kinerja')
            ->orderBy('order_no')
            ->get();
        $sloiQuestions = TemplateQuestion::where('template_id', $sloiTemplate->id)
            ->where('category', 'sloi')
            ->orderBy('order_no')
            ->get();

        // ─── 1. Project ────────────────────────────────────
        $project = Project::create([
            'company_id' => $company->id,
            'name' => 'Program CSR Desa Makmur 2026',
            'description' => 'Program pemberdayaan masyarakat desa melalui kegiatan CSR untuk meningkatkan kesejahteraan dan kepuasan masyarakat.',
            'project_code' => 'PROJ-MJB001',
            'status' => 'active',
            'target_ikm_count' => 15,
            'target_sloi_count' => 10,
            'enable_ikm' => true,
            'enable_sloi' => true,
            'ikm_template_id' => $ikmTemplate->id,
            'sloi_template_id' => $sloiTemplate->id,
            'start_date' => '2026-01-01',
            'end_date' => '2026-12-31',
            'created_by' => $companyAdmin->id,
        ]);

        // ─── 2. Project Location ───────────────────────────
        ProjectLocation::create([
            'company_id' => $company->id,
            'project_id' => $project->id,
            'district_id' => $district->id,
        ]);

        // ─── 3. Enumerator Assignments ─────────────────────
        foreach ($enumerators as $enumerator) {
            ProjectEnumeratorAssignment::create([
                'company_id' => $company->id,
                'project_id' => $project->id,
                'enumerator_id' => $enumerator->id,
            ]);
        }

        // ─── 4. IKM Respondents + Submissions ─────────────
        $ikmData = [
            ['name' => 'Siti Aminah',       'address' => 'Jl. Melati No. 12, RT 03/RW 01',   'phone' => '081200000001', 'age' => 35, 'gender' => 'Perempuan', 'respondent_status' => 'Ibu rumah tangga',  'education_level' => 'SMA/SMK',   'main_occupation' => 'Ibu Rumah Tangga',   'monthly_income' => 2000000,  'status' => 'approved'],
            ['name' => 'Budi Santoso',      'address' => 'Jl. Kenanga No. 5, RT 01/RW 02',   'phone' => '081200000002', 'age' => 42, 'gender' => 'Laki-laki', 'respondent_status' => 'Kepala keluarga',   'education_level' => 'S1',        'main_occupation' => 'Petani',             'monthly_income' => 3500000,  'status' => 'approved'],
            ['name' => 'Dewi Lestari',      'address' => 'Jl. Dahlia No. 8, RT 02/RW 01',    'phone' => '081200000003', 'age' => 28, 'gender' => 'Perempuan', 'respondent_status' => 'Ibu rumah tangga',  'education_level' => 'SMP',       'main_occupation' => 'Pedagang',           'monthly_income' => 1800000,  'status' => 'approved'],
            ['name' => 'Ahmad Fauzi',       'address' => 'Jl. Mangga No. 3, RT 04/RW 03',    'phone' => '081200000004', 'age' => 50, 'gender' => 'Laki-laki', 'respondent_status' => 'Kepala keluarga',   'education_level' => 'SD',        'main_occupation' => 'Buruh',              'monthly_income' => 1500000,  'status' => 'approved'],
            ['name' => 'Rina Wulandari',    'address' => 'Jl. Anggrek No. 17, RT 05/RW 02',  'phone' => '081200000005', 'age' => 31, 'gender' => 'Perempuan', 'respondent_status' => 'Ibu rumah tangga',  'education_level' => 'SMA/SMK',   'main_occupation' => 'Wiraswasta',         'monthly_income' => 2500000,  'status' => 'submitted'],
            ['name' => 'Hasan Basri',       'address' => 'Jl. Mawar No. 22, RT 01/RW 04',    'phone' => '081200000006', 'age' => 45, 'gender' => 'Laki-laki', 'respondent_status' => 'Kepala keluarga',   'education_level' => 'SMA/SMK',   'main_occupation' => 'Nelayan',            'monthly_income' => 2200000,  'status' => 'approved'],
            ['name' => 'Nur Hidayah',       'address' => 'Jl. Cempaka No. 10, RT 03/RW 05',  'phone' => '081200000007', 'age' => 38, 'gender' => 'Perempuan', 'respondent_status' => 'Ibu rumah tangga',  'education_level' => 'D3',        'main_occupation' => 'Guru Honorer',       'monthly_income' => 2800000,  'status' => 'approved'],
            ['name' => 'Joko Prasetyo',     'address' => 'Jl. Rambutan No. 6, RT 02/RW 03',  'phone' => '081200000008', 'age' => 55, 'gender' => 'Laki-laki', 'respondent_status' => 'Kepala keluarga',   'education_level' => 'SD',        'main_occupation' => 'Petani',             'monthly_income' => 1200000,  'status' => 'submitted'],
            ['name' => 'Yuni Astuti',       'address' => 'Jl. Jambu No. 14, RT 06/RW 01',    'phone' => '081200000009', 'age' => 26, 'gender' => 'Perempuan', 'respondent_status' => 'Ibu rumah tangga',  'education_level' => 'S1',        'main_occupation' => 'Karyawan Swasta',    'monthly_income' => 4000000,  'status' => 'approved'],
            ['name' => 'Wahyu Hidayat',     'address' => 'Jl. Durian No. 9, RT 04/RW 02',    'phone' => '081200000010', 'age' => 40, 'gender' => 'Laki-laki', 'respondent_status' => 'Kepala keluarga',   'education_level' => 'SMP',       'main_occupation' => 'Supir',              'monthly_income' => 2000000,  'status' => 'rejected'],
            ['name' => 'Endang Supriyati',  'address' => 'Jl. Pepaya No. 20, RT 01/RW 06',   'phone' => '081200000011', 'age' => 48, 'gender' => 'Perempuan', 'respondent_status' => 'Ibu rumah tangga',  'education_level' => 'SMA/SMK',   'main_occupation' => 'Pedagang',           'monthly_income' => 3000000,  'status' => 'approved'],
            ['name' => 'Darmawan Putra',    'address' => 'Jl. Salak No. 11, RT 03/RW 04',    'phone' => '081200000012', 'age' => 33, 'gender' => 'Laki-laki', 'respondent_status' => 'Kepala keluarga',   'education_level' => 'S1',        'main_occupation' => 'PNS',                'monthly_income' => 5000000,  'status' => 'approved'],
            ['name' => 'Sri Mulyani',       'address' => 'Jl. Nangka No. 7, RT 05/RW 03',    'phone' => '081200000013', 'age' => 37, 'gender' => 'Perempuan', 'respondent_status' => 'Ibu rumah tangga',  'education_level' => 'D3',        'main_occupation' => 'Bidan Desa',         'monthly_income' => 3200000,  'status' => 'submitted'],
            ['name' => 'Agus Riyadi',       'address' => 'Jl. Kelapa No. 15, RT 02/RW 05',   'phone' => '081200000014', 'age' => 52, 'gender' => 'Laki-laki', 'respondent_status' => 'Kepala keluarga',   'education_level' => 'SMP',       'main_occupation' => 'Tukang Kayu',        'monthly_income' => 1800000,  'status' => 'approved'],
            ['name' => 'Lilis Suryani',     'address' => 'Jl. Pisang No. 4, RT 06/RW 02',    'phone' => '081200000015', 'age' => 29, 'gender' => 'Perempuan', 'respondent_status' => 'Ibu rumah tangga',  'education_level' => 'SMA/SMK',   'main_occupation' => 'Ibu Rumah Tangga',   'monthly_income' => 1500000,  'status' => 'approved'],
        ];

        $this->createRespondentsWithSubmissions(
            $project,
            $company,
            $enumerators,
            $companyAdmin,
            'IKM',
            $ikmData,
            [
                'ikm-kepentingan' => $ikmKepentinganQuestions,
                'ikm-kinerja' => $ikmKinerjaQuestions,
            ],
        );

        // ─── 5. SLOI Respondents + Submissions ────────────
        $sloiData = [
            ['name' => 'Bambang Widodo',    'address' => 'Jl. Flamboyan No. 1, RT 01/RW 01',  'phone' => '081300000001', 'age' => 44, 'gender' => 'Laki-laki', 'respondent_status' => 'Kepala keluarga',  'education_level' => 'SMA/SMK',  'main_occupation' => 'Petani',             'monthly_income' => 2500000,  'status' => 'approved'],
            ['name' => 'Kartini Rahayu',    'address' => 'Jl. Flamboyan No. 3, RT 01/RW 01',  'phone' => '081300000002', 'age' => 39, 'gender' => 'Perempuan', 'respondent_status' => 'Ibu rumah tangga', 'education_level' => 'S1',       'main_occupation' => 'Guru',               'monthly_income' => 4500000,  'status' => 'approved'],
            ['name' => 'Teguh Prabowo',     'address' => 'Jl. Tanjung No. 8, RT 02/RW 02',    'phone' => '081300000003', 'age' => 51, 'gender' => 'Laki-laki', 'respondent_status' => 'Kepala keluarga',  'education_level' => 'SD',       'main_occupation' => 'Nelayan',            'monthly_income' => 1800000,  'status' => 'submitted'],
            ['name' => 'Megawati Sari',     'address' => 'Jl. Tanjung No. 12, RT 02/RW 02',   'phone' => '081300000004', 'age' => 34, 'gender' => 'Perempuan', 'respondent_status' => 'Ibu rumah tangga', 'education_level' => 'SMA/SMK',  'main_occupation' => 'Pedagang',           'monthly_income' => 2000000,  'status' => 'approved'],
            ['name' => 'Suparman Hadi',     'address' => 'Jl. Cemara No. 5, RT 03/RW 01',     'phone' => '081300000005', 'age' => 47, 'gender' => 'Laki-laki', 'respondent_status' => 'Kepala keluarga',  'education_level' => 'SMP',      'main_occupation' => 'Buruh',              'monthly_income' => 1600000,  'status' => 'approved'],
            ['name' => 'Ratna Dewi',        'address' => 'Jl. Cemara No. 9, RT 03/RW 01',     'phone' => '081300000006', 'age' => 30, 'gender' => 'Perempuan', 'respondent_status' => 'Ibu rumah tangga', 'education_level' => 'D3',       'main_occupation' => 'Perawat',            'monthly_income' => 3500000,  'status' => 'rejected'],
            ['name' => 'Mulyono Adi',       'address' => 'Jl. Akasia No. 2, RT 04/RW 03',     'phone' => '081300000007', 'age' => 56, 'gender' => 'Laki-laki', 'respondent_status' => 'Kepala keluarga',  'education_level' => 'SD',       'main_occupation' => 'Petani',             'monthly_income' => 1300000,  'status' => 'approved'],
            ['name' => 'Fitriani Handayani', 'address' => 'Jl. Akasia No. 6, RT 04/RW 03',     'phone' => '081300000008', 'age' => 27, 'gender' => 'Perempuan', 'respondent_status' => 'Ibu rumah tangga', 'education_level' => 'S1',       'main_occupation' => 'Karyawan Swasta',    'monthly_income' => 4000000,  'status' => 'submitted'],
            ['name' => 'Sugiyanto',         'address' => 'Jl. Pinus No. 10, RT 05/RW 02',     'phone' => '081300000009', 'age' => 60, 'gender' => 'Laki-laki', 'respondent_status' => 'Kepala keluarga',  'education_level' => 'SMP',      'main_occupation' => 'Pensiunan',          'monthly_income' => 2000000,  'status' => 'approved'],
            ['name' => 'Winda Kusuma',      'address' => 'Jl. Pinus No. 14, RT 05/RW 02',     'phone' => '081300000010', 'age' => 32, 'gender' => 'Perempuan', 'respondent_status' => 'Ibu rumah tangga', 'education_level' => 'SMA/SMK',  'main_occupation' => 'Wiraswasta',         'monthly_income' => 2800000,  'status' => 'approved'],
        ];

        $this->createRespondentsWithSubmissions(
            $project,
            $company,
            $enumerators,
            $companyAdmin,
            'SLOI',
            $sloiData,
            [
                'sloi' => $sloiQuestions,
            ],
        );

    }

    private function createRespondentsWithSubmissions(
        Project $project,
        Company $company,
        $enumerators,
        User $companyAdmin,
        string $assessmentType,
        array $respondentData,
        array $questionGroups,
    ): void {
        $baseDate = now()->subMonths(3);

        foreach ($respondentData as $index => $data) {
            $enumerator = $enumerators[$index % $enumerators->count()];
            $submittedAt = $baseDate->copy()->addDays($index * 3)->addHours(rand(8, 17));
            $submissionStatus = $data['status'];

            // Create respondent
            $respondent = Respondent::create([
                'company_id' => $company->id,
                'project_id' => $project->id,
                'name' => $data['name'],
                'address' => $data['address'],
                'phone' => $data['phone'],
                'age' => $data['age'],
                'gender' => $data['gender'],
                'respondent_status' => $data['respondent_status'],
                'education_level' => $data['education_level'],
                'main_occupation' => $data['main_occupation'],
                'monthly_income' => $data['monthly_income'],
                'created_by' => $enumerator->id,
            ]);

            // Create submission
            $submission = Submission::create([
                'company_id' => $company->id,
                'project_id' => $project->id,
                'assessment_type' => $assessmentType,
                'respondent_id' => $respondent->id,
                'enumerator_id' => $enumerator->id,
                'status' => $submissionStatus,
                'photo_path' => 'submissions/'.$assessmentType.'/'.$respondent->id.'.jpg',
                'photo_mime' => 'image/jpeg',
                'photo_size_bytes' => rand(200000, 800000),
                'latitude' => -6.2 + ($index * 0.002),
                'longitude' => 106.8 + ($index * 0.002),
                'submitted_at' => $submittedAt,
            ]);

            // Create template answers
            foreach ($questionGroups as $type => $questions) {
                foreach ($questions as $question) {
                    // IKM: 1-4 points for both kepentingan and kinerja
                    // SLOI: 1-5 points
                    $value = match ($type) {
                        'ikm-kepentingan', 'ikm-kinerja' => rand(1, 4),
                        'sloi' => rand(1, 5),
                        default => rand(1, 4),
                    };

                    SubmissionTemplateAnswer::create([
                        'submission_id' => $submission->id,
                        'type' => $type,
                        'question_id' => $question->id,
                        'value' => $value,
                    ]);
                }
            }

            // Create timeline: always has 'submitted'
            SubmissionTimeline::create([
                'submission_id' => $submission->id,
                'action' => 'submitted',
                'decided_at' => $submittedAt,
                'decided_by' => $enumerator->id,
                'notes' => null,
            ]);

            if ($submissionStatus === 'approved') {
                SubmissionTimeline::create([
                    'submission_id' => $submission->id,
                    'action' => 'approved',
                    'decided_at' => $submittedAt->copy()->addDays(rand(1, 3)),
                    'decided_by' => $companyAdmin->id,
                    'notes' => 'Data valid dan lengkap.',
                ]);
            } elseif ($submissionStatus === 'rejected') {
                SubmissionTimeline::create([
                    'submission_id' => $submission->id,
                    'action' => 'rejected',
                    'decided_at' => $submittedAt->copy()->addDays(rand(1, 3)),
                    'decided_by' => $companyAdmin->id,
                    'notes' => 'Data tidak lengkap, harap perbaiki.',
                ]);
            }
        }
    }
}
