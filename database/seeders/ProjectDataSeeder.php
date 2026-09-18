<?php

namespace Database\Seeders;

use App\Models\Company;
use App\Models\District;
use App\Models\InstrumentTemplate;
use App\Models\Project;
use App\Models\ProjectEnumeratorAssignment;
use App\Models\ProjectLocation;
use App\Models\ProjectSroiForm;
use App\Models\ProjectSroiQuestion;
use App\Models\ProjectSroiSection;
use App\Models\ProjectStakeholder;
use App\Models\Respondent;
use App\Models\SroiTemplate;
use App\Models\StakeholderOutcome;
use App\Models\Submission;
use App\Models\SubmissionSroiAnswer;
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
            'enable_sroi' => false,
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

        // ─── 6. SROI Template Copy + Respondents ─────────
        // $projectSroiForm = $this->createProjectSroiFormFromTemplate($project, $companyAdmin);
        // $stakeholders = $this->createSroiStakeholdersAndOutcomes($project);
        // $this->createSroiRespondentsWithSubmissions($project, $company, $enumerators, $companyAdmin, $projectSroiForm, $stakeholders);
    }

    private function createProjectSroiFormFromTemplate(Project $project, User $companyAdmin): ProjectSroiForm
    {
        $template = SroiTemplate::active()
            ->with([
                'sections' => fn ($query) => $query->orderBy('order_no')->orderBy('id'),
                'sections.questions' => fn ($query) => $query->orderBy('order_no')->orderBy('id'),
            ])
            ->latest('published_at')
            ->latest('id')
            ->firstOrFail();

        $form = ProjectSroiForm::create([
            'company_id' => $project->company_id,
            'project_id' => $project->id,
            'source_template_id' => $template->id,
            'name' => $template->name,
            'description' => $template->description,
            'version' => 1,
            'status' => 'active',
            'created_by' => $companyAdmin->id,
            'activated_at' => now(),
        ]);

        $sectionMap = [];
        foreach ($template->sections as $templateSection) {
            $section = ProjectSroiSection::create([
                'form_id' => $form->id,
                'source_template_section_id' => $templateSection->id,
                'title' => $templateSection->title,
                'description' => $templateSection->description,
                'order_no' => $templateSection->order_no,
            ]);

            $sectionMap[$templateSection->id] = $section->id;
        }

        $questionMap = [];
        foreach ($template->sections as $templateSection) {
            foreach ($templateSection->questions as $templateQuestion) {
                $question = ProjectSroiQuestion::create([
                    'form_id' => $form->id,
                    'section_id' => $sectionMap[$templateQuestion->section_id],
                    'parent_question_id' => $templateQuestion->parent_question_id
                        ? ($questionMap[$templateQuestion->parent_question_id] ?? null)
                        : null,
                    'source_template_question_id' => $templateQuestion->id,
                    'question_text' => $templateQuestion->question_text,
                    'help_text' => $templateQuestion->help_text,
                    'answer_type' => $templateQuestion->answer_type,
                    'unit' => $templateQuestion->unit,
                    'is_group' => $templateQuestion->is_group,
                    'is_active' => true,
                    'order_no' => $templateQuestion->order_no,
                ]);

                $questionMap[$templateQuestion->id] = $question->id;
            }
        }

        return $form;
    }

    /**
     * @return array<int, ProjectStakeholder>
     */
    private function createSroiStakeholdersAndOutcomes(Project $project): array
    {
        $stakeholderData = [
            'Penerima Manfaat UMKM' => [
                'Peningkatan pendapatan usaha setelah program.',
                'Penghematan biaya alat dan pelatihan usaha.',
            ],
            'Kader Kesehatan' => [
                'Peningkatan kapasitas layanan kesehatan masyarakat.',
                'Penghematan biaya kegiatan posyandu dan edukasi kesehatan.',
            ],
            'Pengelola Lingkungan' => [
                'Peningkatan pengelolaan sampah dan lingkungan desa.',
                'Penghematan biaya sarana prasarana lingkungan.',
            ],
            'Kelompok Pendidikan' => [
                'Peningkatan akses dukungan belajar masyarakat.',
                'Penghematan biaya sarana pendidikan dan pelatihan.',
            ],
        ];

        $stakeholders = [];
        foreach ($stakeholderData as $name => $outcomes) {
            $stakeholder = ProjectStakeholder::create([
                'project_id' => $project->id,
                'name' => $name,
            ]);

            foreach ($outcomes as $outcome) {
                StakeholderOutcome::create([
                    'stakeholder_id' => $stakeholder->id,
                    'outcome' => $outcome,
                ]);
            }

            $stakeholders[] = $stakeholder;
        }

        return $stakeholders;
    }

    /**
     * @param  \Illuminate\Database\Eloquent\Collection<int, User>  $enumerators
     * @param  array<int, ProjectStakeholder>  $stakeholders
     */
    private function createSroiRespondentsWithSubmissions(
        Project $project,
        Company $company,
        $enumerators,
        User $companyAdmin,
        ProjectSroiForm $form,
        array $stakeholders,
    ): void {
        $questions = ProjectSroiQuestion::where('form_id', $form->id)
            ->where('is_group', false)
            ->whereNotNull('answer_type')
            ->orderBy('section_id')
            ->orderBy('order_no')
            ->orderBy('id')
            ->get();

        $sroiData = [
            ['name' => 'Maya Safitri', 'phone' => '081400000001', 'age' => 36, 'gender' => 'Perempuan', 'stakeholder' => 0, 'status' => 'approved'],
            ['name' => 'Rizal Maulana', 'phone' => '081400000002', 'age' => 41, 'gender' => 'Laki-laki', 'stakeholder' => 0, 'status' => 'submitted'],
            ['name' => 'Nurlaila Hasan', 'phone' => '081400000003', 'age' => 33, 'gender' => 'Perempuan', 'stakeholder' => 1, 'status' => 'approved'],
            ['name' => 'Dedi Kurniawan', 'phone' => '081400000004', 'age' => 46, 'gender' => 'Laki-laki', 'stakeholder' => 2, 'status' => 'approved'],
            ['name' => 'Sulastri Wibowo', 'phone' => '081400000005', 'age' => 39, 'gender' => 'Perempuan', 'stakeholder' => 3, 'status' => 'rejected'],
            ['name' => 'Fajar Nugroho', 'phone' => '081400000006', 'age' => 29, 'gender' => 'Laki-laki', 'stakeholder' => 2, 'status' => 'submitted'],
        ];

        $baseDate = now()->subMonths(2);

        foreach ($sroiData as $index => $data) {
            $enumerator = $enumerators[$index % $enumerators->count()];
            $submittedAt = $baseDate->copy()->addDays($index * 4)->addHours(9 + $index);
            $stakeholder = $stakeholders[$data['stakeholder']];

            $respondent = Respondent::create([
                'company_id' => $company->id,
                'project_id' => $project->id,
                'stakeholder_id' => $stakeholder->id,
                'name' => $data['name'],
                'address' => 'Dusun SROI No. '.($index + 1).', Desa Makmur',
                'phone' => $data['phone'],
                'age' => $data['age'],
                'gender' => $data['gender'],
                'respondent_status' => $index % 2 === 0 ? 'Anggota kelompok' : 'Pengurus kelompok',
                'education_level' => $index % 2 === 0 ? 'SMA/SMK' : 'S1',
                'main_occupation' => $index % 2 === 0 ? 'Wiraswasta' : 'Kader masyarakat',
                'monthly_income' => 1800000 + ($index * 350000),
                'created_by' => $enumerator->id,
            ]);

            $submission = Submission::create([
                'company_id' => $company->id,
                'project_id' => $project->id,
                'assessment_type' => 'SROI',
                'respondent_id' => $respondent->id,
                'enumerator_id' => $enumerator->id,
                'project_sroi_form_id' => $form->id,
                'status' => $data['status'],
                'photo_path' => 'submissions/SROI/'.$respondent->id.'.jpg',
                'photo_mime' => 'image/jpeg',
                'photo_size_bytes' => 350000 + ($index * 25000),
                'latitude' => -6.18 + ($index * 0.002),
                'longitude' => 106.82 + ($index * 0.002),
                'submitted_at' => $submittedAt,
            ]);

            foreach ($questions as $questionIndex => $question) {
                $answer = [
                    'submission_id' => $submission->id,
                    'project_sroi_question_id' => $question->id,
                ];

                if ($question->answer_type === 'number') {
                    $answer['value_number'] = $question->unit === 'skala_1_10'
                        ? 7 + (($index + $questionIndex) % 4)
                        : 100000 + ($index * 25000) + ($questionIndex * 1500);
                } else {
                    $answer['value_text'] = "Jawaban SROI {$data['name']} untuk {$question->question_text}";
                }

                SubmissionSroiAnswer::create($answer);
            }

            SubmissionTimeline::create([
                'submission_id' => $submission->id,
                'action' => 'submitted',
                'decided_at' => $submittedAt,
                'decided_by' => $enumerator->id,
                'notes' => null,
            ]);

            if ($data['status'] === 'approved') {
                SubmissionTimeline::create([
                    'submission_id' => $submission->id,
                    'action' => 'approved',
                    'decided_at' => $submittedAt->copy()->addDays(2),
                    'decided_by' => $companyAdmin->id,
                    'notes' => 'Data SROI valid dan lengkap.',
                ]);
            } elseif ($data['status'] === 'rejected') {
                SubmissionTimeline::create([
                    'submission_id' => $submission->id,
                    'action' => 'rejected',
                    'decided_at' => $submittedAt->copy()->addDays(2),
                    'decided_by' => $companyAdmin->id,
                    'notes' => 'Data SROI perlu dilengkapi kembali.',
                ]);
            }
        }
    }

    /**
     * @param  \Illuminate\Database\Eloquent\Collection<int, User>  $enumerators
     * @param  array<string, \Illuminate\Database\Eloquent\Collection<int, TemplateQuestion>>  $questionGroups
     */
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
