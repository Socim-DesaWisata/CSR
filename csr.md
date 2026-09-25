# Rancangan Database CSR: IKM, SLOI, dan SROI Mandiri

Status: rancangan target dan implementasi fase input, 2026-09-24. Sebanyak 24 tabel operasional SROI sudah dimigrasikan; lima tabel metode/run tetap rancangan tertunda. Target tipe dan constraint: MySQL 8.0.16+; adaptasi ke database lain memerlukan pengujian ulang `CHECK` dan FK gabungan. Rancangan ini menyatukan inventaris aplikasi CSR yang berjalan dengan kebutuhan dari empat dokumen `sroi/` dan alur situs pembanding. `sroi/new-db.md` identik byte-per-byte dengan `sroi/database-sroi.dbml`; keduanya dihitung sebagai satu skema referensi, bukan dua skema yang harus diimplementasikan.

## Status implementasi fase input

- Migrasi `create_sroi_operational_tables` membuat katalog, program, tahap input, dokumen, ekspor, dan audit. Migrasi `add_sroi_input_checks` menambahkan `CHECK` MySQL untuk status, rentang angka, dan persentase; validasi request dan FK gabungan juga membatasi hubungan lintas perusahaan/program.
- `sroi_methods`, `sroi_runs`, `sroi_run_outcome_years`, `sroi_run_investment_years`, dan `sroi_run_yearly_totals` **belum dimigrasikan**. Kolom `sroi_report_exports.run_id` pada rancangan target juga ditunda sampai run tersedia. Tidak ada kalkulasi atau laporan berbasis rasio.
- Ekspor data tahap XLSX, laporan naratif DOCX, serta dokumen bukti disimpan privat dan hanya diunduh melalui route berotorisasi. Katalog admin membuat kategori perusahaan langsung; `sroi_catalog_templates` tersedia dalam skema sebagai sumber template, tetapi alur penyalinan template belum diaktifkan.
- `companies` dan `users` tetap dipakai bersama; tidak ada tabel profil/kontak/sektor perusahaan SROI ataupun FK ke `projects`. Basis MySQL lokal dapat menjalankan migrasi tanpa migrasi ulang tabel IKM/SLOI.

## Temuan dan batas desain

- Situs pembanding menampilkan Dashboard, Program List, General Description, Theory of Change, LFA, Roadmap, Program Scope/Investment Details, Stakeholder Identification, Outcome Identification, SROI Table, SROI Calculation, SROI Report, serta katalog Stakeholder & Outcome dan Company List. Aksi pensil pada program memilih konteks program; navigasi langsung tanpa konteks dapat kembali ke daftar. Inspeksi hanya membaca, tanpa menyimpan perubahan.
- IKM/SLOI saat ini menggunakan `projects`, `respondents`, `submissions`, instrumen, dan snapshot skor; migrasi terbaru menghapus jalur SROI lama yang pernah menempel pada proyek. Jangan menghidupkan kembali kolom `projects.enable_sroi`, `submissions.assessment_type='SROI'`, atau tabel `project_sroi_*`.
- SROI memakai identitas `users`, data perusahaan pada `companies` yang sudah ada, dan master `provinces`, `cities`, `districts`, `villages` yang sama. **Program SROI hanya ada di `sroi_programs`; tidak ada FK ke `projects` atau hubungan ke responden/submission/skor IKM/SLOI.** Hubungan melalui pemilik perusahaan bersama adalah satu-satunya titik temu domain bisnis.
- Skema 43 tabel di `sroi/database-sroi.dbml` dirancang sebagai aplikasi lain dengan `organizations`, akun, dan perusahaan duplikat. Rancangan ini memetakan `organization_id` ke `company_id` milik CSR, memakai master wilayah yang sudah ada (`sub_districts` referensi menjadi `villages`), serta membuang tabel autentikasi/organisasi dan profil/kontak/sektor perusahaan duplikat. Nama tabel SROI baru diberi prefiks `sroi_`.
- Definisi harga, diskonto, penyesuaian, dan rasio di bawah adalah **keputusan calon metode aplikasi baru**, bukan algoritme internal situs pembanding. Contoh PUSRI di `sroi/contoh-penggunaan-tabel-sroi.md` membedakan fakta laporan, pemetaan, contoh teknis, dan input yang belum tersedia; angka laporan eksternal tidak boleh diimpor sebagai hasil run internal tanpa data primer.

## Konvensi skema baru

- Semua tabel baru kecuali `sroi_methods` dan `sroi_catalog_templates` memakai `id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY`, `company_id BIGINT UNSIGNED NOT NULL` FK ke `companies.id`, `created_at DATETIME(6) NOT NULL`, `updated_at DATETIME(6) NOT NULL`, dan `UNIQUE(company_id,id)`. Tabel snapshot run hanya memakai `created_at`; `sroi_audit_logs` hanya `occurred_at`. Pada setiap baris di bawah, kolom standar ini implisit kecuali disebut lain.
- Semua FK antartabel SROI milik perusahaan memakai `(company_id,parent_id) -> parent(company_id,id)`; FK bertingkat menambah `program_id` atau `outcome_id` bila diperlukan untuk menolak pencampuran entitas dalam satu perusahaan. FK ke `users` dan master wilayah bersama memakai ID tunggal; keanggotaan pengguna dan konsistensi hierarki wilayah diperiksa pada batas aplikasi karena skema lama tidak memiliki unique key gabungan yang diperlukan.
- Kolom yang ditandai `?` boleh `NULL`; yang lain `NOT NULL`. Nilai uang `DECIMAL(20,2)`, proksi/unit `DECIMAL(20,4)`, kuantitas `DECIMAL(20,6)`, persentase `DECIMAL(7,4)` dengan `CHECK` 0–100, rasio `DECIMAL(20,6)`, kurs mata uang `CHAR(3)` ISO 4217; jangan gunakan `FLOAT` untuk perhitungan finansial. Persentase/nominal yang belum diverifikasi tetap `NULL` pada draft, **bukan 0**.
- `deleted_at DATETIME(6)?` hanya pada profil/kategori/program induk yang diarsip; penghapusan fisik data yang memiliki histori dibatasi (`RESTRICT`). File disimpan privat sebagai kunci objek, bukan URL publik. Waktu disimpan dalam UTC; tampilan mengikuti zona pengguna.
- Kode status/jenis di bawah adalah domain terbatas yang harus divalidasi: program `draft|active|archived`, scope `evaluative|forecast|both`, tahun `evaluative|forecast`, kontribusi `cash|in_kind|time`, keanggotaan `owner|editor|viewer`, run `complete|invalidated`, ekspor `queued|ready|failed`. Kode katalog dapat ditambah tanpa migrasi; referensi versi metode tidak boleh mengeksekusi ekspresi bebas dari database.

## Inventaris IKM/SLOI yang dipertahankan

Berikut 18 tabel domain menurut `db.md` dan migrasi yang ada. Nama, kolom, dan perilaku lama tetap; tipe disingkat bila tidak menentukan relasi. Tabel infrastruktur Laravel (`password_reset_tokens`, `sessions`, `cache*`, `jobs*`, `failed_jobs`) tetap ada tetapi bukan entitas domain SROI.

| Tabel lama | Kolom domain dan hubungan yang dipertahankan |
| --- | --- |
| `companies` | `id`, `name`, `legal_name?`, `email?`, `phone?`, `address?`, `status`, timestamps, `deleted_at?`; pemilik bersama kedua domain. |
| `users` | `id`, `name`, `email`, `password`, `email_verified_at?`, `company_id? -> companies`, `position?`, `role` (`superadmin|admin|company|enumerator`), `phone?`, `is_active`, `remember_token?`, timestamps, `deleted_at?`; autentikasi bersama. |
| `provinces` | `id`, `code?`, `name`, timestamps; master global. |
| `cities` | `id`, `province_id -> provinces`, `code?`, `name`, `type`, timestamps. |
| `districts` | `id`, `city_id -> cities`, `code?`, `name`, timestamps. |
| `villages` | `id`, `district_id -> districts`, `code?`, `name`, timestamps; padanan `sub_districts` pada referensi SROI. |
| `instrument_templates` | `id`, `type` (`IKM|SLOI`), `name`, `version`, `description?`, `is_active`, `published_at?`, `created_by? -> users`, timestamps, `deleted_at?`. |
| `template_questions` | `id`, `template_id -> instrument_templates`, `category?`, `code`, `aspect`, `question_text`, `order_no`, `created_at`, `deleted_at?`. |
| `projects` | `id`, `company_id -> companies`, `name`, `description?`, `project_code`, `status`, `target_ikm_count`, `target_sloi_count`, `enable_ikm`, `enable_sloi`, `ikm_template_id?`, `sloi_template_id?`, `start_date?`, `end_date?`, `closed_at?`, `created_by? -> users`, timestamps, `deleted_at?`. |
| `project_locations` | `id`, `company_id`, `project_id -> projects`, `district_id -> districts`, timestamps, `deleted_at?`. |
| `project_enumerator_assignments` | `id`, `company_id`, `project_id -> projects`, `enumerator_id -> users`, `created_at`, `deleted_at?`. |
| `respondents` | `id`, `company_id`, `project_id -> projects`, `name`, `address?`, `phone?`, `age?`, `gender?`, `respondent_status?`, `education_level?`, `main_occupation?`, `monthly_income?`, `created_by?`, timestamps, `deleted_at?`. |
| `submissions` | `id`, `company_id`, `project_id -> projects`, `assessment_type` (`IKM|SLOI`), `respondent_id?`, `enumerator_id -> users`, `status`, `photo_path`, `photo_mime?`, `photo_size_bytes?`, `latitude`, `longitude`, `submitted_at`, `created_at`, `deleted_at?`. |
| `submission_template_answers` | `id`, `submission_id -> submissions`, `type` (`ikm-kepentingan|ikm-kinerja|sloi`), `question_id -> template_questions`, `value?`, `created_at`, `deleted_at?`. |
| `project_score_snapshots` | `id`, `company_id`, `project_id -> projects`, `assessment_type` (`IKM|SLOI`), `calculated_at`, `total_score`, `details_json?`, `version`, `deleted_at?`. |
| `submission_timelines` | `id`, `submission_id -> submissions`, `action`, `decided_at`, `decided_by -> users`, `notes?`, `created_at`. |
| `project_descriptive_questions` | `id`, `project_id -> projects`, `title`, timestamps, `deleted_at?`. |
| `submission_descriptive_answers` | `id`, `submission_id -> submissions`, `project_descriptive_question_id -> project_descriptive_questions`, `answer`, timestamps, `deleted_at?`. |

IKM: satu jawaban kepentingan dan satu kinerja per pertanyaan pada instrumen IKM, terikat submission dan responden proyek. SLOI: jawaban instrumen SLOI serta analisis reliabilitas proyek. Kedua jenis memakai penugasan enumerator, status persetujuan beserta timeline, foto/koordinat survei, dan snapshot skor proyek. Tidak ada target, template, pertanyaan, atau submission SROI di tabel lama.

## Katalog SROI

Kolom selain kolom standar tercantum di bawah. FK yang disebut ke tabel SROI secara implisit membawa `company_id`; indeks unik yang berbeda dari `UNIQUE(company_id,id)` ditulis eksplisit.

Rancangan ini memuat 29 tabel SROI baru. Data perusahaan hanya menggunakan `companies` yang sudah ada: nama, nama legal, email, telepon, alamat, dan status. Sektor, rincian wilayah perusahaan terstruktur, dan kontak tambahan dari situs pembanding tidak disimpan; lokasi **program** tetap ada di `sroi_program_locations`.

| Tabel baru | Kolom khusus, relasi, dan aturan |
| --- | --- |
| `sroi_catalog_templates` | Global tanpa `company_id`: `id`, `kind VARCHAR(40)` (`program_category|stakeholder_category|stakeholder_category_list|outcome_category`), `code VARCHAR(40)`, `name VARCHAR(200)`, `parent_template_id? -> sroi_catalog_templates`, `active BOOLEAN`, timestamps; `UNIQUE(kind,code)`. Hanya sumber penyalinan katalog perusahaan, bukan FK program. |
| `sroi_program_categories` | `code VARCHAR(40)`, `name VARCHAR(200)`, `source_template_id? -> sroi_catalog_templates`, `active BOOLEAN`; `UNIQUE(company_id,code)`, rumpun program. Pilar/bidang tetap teks program. |
| `sroi_stakeholder_categories` | `program_category_id -> sroi_program_categories`, `code VARCHAR(40)`, `name VARCHAR(200)`, `source_template_id?`, `active BOOLEAN`; `UNIQUE(company_id,program_category_id,code)` dan key gabungan `(company_id,program_category_id,id)` untuk anak. |
| `sroi_stakeholder_category_lists` | `program_category_id -> sroi_program_categories`, `stakeholder_category_id -> sroi_stakeholder_categories` dalam rumpun sama, `code VARCHAR(40)`, `name VARCHAR(200)`, `source_template_id?`, `active BOOLEAN`; `UNIQUE(company_id,program_category_id,code)` dan `(company_id,program_category_id,id)`. |
| `sroi_outcome_categories` | `program_category_id -> sroi_program_categories`, `code VARCHAR(40)`, `name VARCHAR(200)`, `source_template_id?`, `active BOOLEAN`; `UNIQUE(company_id,program_category_id,code)` dan `(company_id,program_category_id,id)`. |

## Program dan perencanaan SROI

| Tabel baru | Kolom khusus, relasi, dan aturan |
| --- | --- |
| `sroi_programs` | `public_number BIGINT UNSIGNED?`, `category_id -> sroi_program_categories`, `name VARCHAR(200)`, `pillar_name VARCHAR(150)`, `initiator_owner_name VARCHAR(200)`, `start_year SMALLINT UNSIGNED`, `end_year SMALLINT UNSIGNED`, `description TEXT`, `boundary_text TEXT`, `status VARCHAR(20) DEFAULT 'draft'`, `created_by -> users`, `deleted_at?`; `UNIQUE(public_number)` bila diisi, `UNIQUE(company_id,id,category_id)`, `CHECK(start_year<=end_year)`, `INDEX(company_id,status)`. Pemilik adalah `company_id`, bukan `project_id`. |
| `sroi_program_locations` | `program_id -> sroi_programs`, `province_id? -> provinces`, `city_id? -> cities`, `district_id? -> districts`, `village_id? -> villages`, `location_name VARCHAR(200)`, `manager_name? VARCHAR(200)`, `address? VARCHAR(255)`, `postal_code? VARCHAR(10)`, `latitude? DECIMAL(10,7)`, `longitude? DECIMAL(10,7)`, `sort_order INT`; `UNIQUE(company_id,program_id,sort_order)`; hierarki wilayah divalidasi. |
| `sroi_program_members` | `program_id -> sroi_programs`, `user_id -> users`, `participation VARCHAR(20)` (`owner|editor|viewer`); `UNIQUE(company_id,program_id,user_id)`. User biasa harus berafiliasi dengan perusahaan; pengecualian admin platform harus terotorisasi dan diaudit. |
| `sroi_program_documents` | `program_id -> sroi_programs`, `stage VARCHAR(40)`, `file_name VARCHAR(255)`, `object_key VARCHAR(500)`, `mime_type VARCHAR(100)`, `size_bytes BIGINT UNSIGNED`, `uploaded_by -> users`; `UNIQUE(company_id,object_key)`, `INDEX(company_id,program_id,stage)`. Akses unduhan privat. |
| `sroi_theory_of_change_conditions` | `program_id -> sroi_programs`, `sort_order INT`, `initial_condition TEXT`, `intervention TEXT`, `expected_condition TEXT`; `UNIQUE(company_id,program_id,sort_order)`. |
| `sroi_theory_of_change_flows` | `program_id -> sroi_programs`, `sort_order INT`, `input_text TEXT`, `activity_text TEXT`, `output_text TEXT`, `outcome_text TEXT`, `impact_text TEXT`; `UNIQUE(company_id,program_id,sort_order)`. |
| `sroi_lfa_nodes` | `program_id -> sroi_programs`, `parent_id? -> sroi_lfa_nodes` di program sama, `level VARCHAR(20)` (`goal|purpose|output|activity`), `code VARCHAR(40)?`, `element TEXT`, `indicator TEXT?`, `verification_source TEXT?`, `assumptions TEXT?`, `sort_order INT`; `UNIQUE(company_id,program_id,id)`, `INDEX(company_id,program_id,level,sort_order)`. Parent harus satu tingkat di atas anak; goal tidak punya parent. |
| `sroi_roadmap_items` | `program_id -> sroi_programs`, `lfa_activity_id? -> sroi_lfa_nodes` di program sama dengan level activity, `sort_order INT`; `UNIQUE(company_id,program_id,sort_order)`. Aktivitas/output dibaca dari LFA. |
| `sroi_roadmap_targets` | `program_id`, `roadmap_item_id -> sroi_roadmap_items` di program sama, `year SMALLINT UNSIGNED`, `target_quantity? DECIMAL(20,6)`, `unit? VARCHAR(100)`; `UNIQUE(company_id,roadmap_item_id,year)`, target nonnegatif dan tahun dalam rentang program. |
| `sroi_program_scopes` | `program_id -> sroi_programs`, `assessment_type VARCHAR(20)`, `evaluative_start_year?`, `evaluative_end_year?`, `forecast_start_year?`, `forecast_end_year?` (semua `SMALLINT UNSIGNED`), `scope_text TEXT`; `UNIQUE(company_id,program_id)`. Untuk `both`, forecast mulai setelah evaluatif berakhir; tahun konsisten dengan program. |
| `sroi_program_investments` | `program_id -> sroi_programs`, `investor_name VARCHAR(200)`, `contribution_type VARCHAR(20)`, `form VARCHAR(150)`, `currency_code CHAR(3) DEFAULT 'IDR'`, `sort_order INT`; `UNIQUE(company_id,program_id,sort_order)`. |
| `sroi_program_investment_years` | `program_id`, `investment_id -> sroi_program_investments` di program sama, `year SMALLINT UNSIGNED`, `amount? DECIMAL(20,2)`; `UNIQUE(company_id,investment_id,year)`, `CHECK(amount>=0)` saat terisi; tidak mengarang nominal yang belum ada. |

## Stakeholder, outcome, dan tabel dampak

| Tabel baru | Kolom khusus, relasi, dan aturan |
| --- | --- |
| `sroi_program_stakeholders` | `program_id`, `program_category_id`, `stakeholder_category_list_id -> sroi_stakeholder_category_lists` pada rumpun program yang sama, `role_in_program TEXT`, `included BOOLEAN`, `inclusion_reason TEXT`, `sort_order INT`; `UNIQUE(company_id,program_id,sort_order)` dan `(company_id,program_id,id)`. Stakeholder tidak masuk tetap ada sebagai bukti keputusan. |
| `sroi_program_outcomes` | `program_id`, `program_category_id`, `stakeholder_id -> sroi_program_stakeholders` di program sama, `outcome_category_id -> sroi_outcome_categories` dalam rumpun sama, `name VARCHAR(255)`, `description TEXT`, `relevant BOOLEAN`, `significant BOOLEAN`, `material BOOLEAN`, `materiality_reason TEXT`, `materiality_explanation TEXT?`, `sort_order INT`; `UNIQUE(company_id,program_id,id)`, `UNIQUE(company_id,stakeholder_id,sort_order)`. Outcome tidak material tetap disimpan. |
| `sroi_outcome_indicators` | `outcome_id -> sroi_program_outcomes`, `name VARCHAR(255)`, `unit? VARCHAR(100)`, `evidence TEXT`, `evidence_source TEXT`, `sort_order INT`; `UNIQUE(company_id,outcome_id,id)` dan `(company_id,outcome_id,sort_order)`. |
| `sroi_financial_proxies` | `outcome_id -> sroi_program_outcomes`, `approach VARCHAR(255)`, `description? TEXT`, `source TEXT`, `unit VARCHAR(100)`, `unit_value? DECIMAL(20,4)`, `currency_code CHAR(3) DEFAULT 'IDR'`; `UNIQUE(company_id,outcome_id,id)`, `CHECK(unit_value>=0)` saat terisi. |
| `sroi_outcome_impact_years` | `outcome_id -> sroi_program_outcomes`, `indicator_id -> sroi_outcome_indicators`, `financial_proxy_id -> sroi_financial_proxies` **pada outcome yang sama**, `period_type VARCHAR(20)`, `year SMALLINT UNSIGNED`, `quantity? DECIMAL(20,6)`, `deadweight_pct?`, `displacement_pct?`, `attribution_pct?`, `dropoff_pct?` (semua `DECIMAL(7,4)`), empat kolom alasan `*_reason TEXT?`, `updated_by -> users`; `UNIQUE(company_id,outcome_id,period_type,year)`, `CHECK(quantity>=0)` dan persentase 0–100 saat terisi. Baris draft boleh belum lengkap; run menolak kekurangan input. |

## Kalkulasi, laporan, dan audit

| Tabel baru | Kolom khusus, relasi, dan aturan |
| --- | --- |
| `sroi_methods` | Global tanpa `company_id`: `id`, `code VARCHAR(40)`, `version VARCHAR(40)`, `description TEXT`, `active BOOLEAN`, `created_at`; `UNIQUE(code,version)`. Setiap versi merujuk implementasi rumus yang diuji, bukan skrip SQL/formula arbitrer. |
| `sroi_runs` | `program_id -> sroi_programs`, `method_id -> sroi_methods`, `base_year SMALLINT UNSIGNED`, `discount_rate_pct DECIMAL(7,4)`, `currency_code CHAR(3)`, `status VARCHAR(20)`, `total_present_value DECIMAL(20,2)`, `total_investment DECIMAL(20,2)`, `ratio? DECIMAL(20,6)`, `created_by -> users`; `INDEX(company_id,program_id,created_at)`, `UNIQUE(company_id,program_id,id)`. Tidak ada `updated_at`; run lengkap append-only. Rasio `NULL` saat total investasi nol. |
| `sroi_run_outcome_years` | `program_id`, `run_id -> sroi_runs`, `outcome_id -> sroi_program_outcomes` di program sama, `period_type`, `year`; snapshot `stakeholder_name`, `outcome_name`, `indicator_name`, `indicator_unit?`, `evidence?`, `evidence_source?`, `proxy_approach`, `proxy_source`, `proxy_unit`, `currency_code`, `quantity DECIMAL(20,6)`, `proxy_unit_value DECIMAL(20,4)`, empat `*_pct DECIMAL(7,4)`, `adjustment_reasons? JSON`, `gross_value DECIMAL(20,2)`, `adjusted_value DECIMAL(20,2)`, `discount_factor DECIMAL(20,10)`, `present_value DECIMAL(20,2)`; `UNIQUE(company_id,run_id,outcome_id,period_type,year)`. Nama/input yang disalin menjaga histori setelah sumber diedit. |
| `sroi_run_investment_years` | `program_id`, `run_id -> sroi_runs`, `investment_id -> sroi_program_investments` di program sama, `year`, snapshot `investor_name VARCHAR(200)`, `contribution_type VARCHAR(20)`, `form VARCHAR(150)`, `currency_code CHAR(3)`, `amount DECIMAL(20,2)`; `UNIQUE(company_id,run_id,investment_id,year)`. |
| `sroi_run_yearly_totals` | `run_id -> sroi_runs`, `period_type VARCHAR(20)`, `year SMALLINT UNSIGNED`, `total_present_value DECIMAL(20,2)`, `total_investment DECIMAL(20,2)`, `ratio? DECIMAL(20,6)`; `UNIQUE(company_id,run_id,period_type,year)`. Agregat baris tahunan harus cocok dengan header run. |
| `sroi_report_exports` | `program_id -> sroi_programs`, `run_id? -> sroi_runs` pada program sama, `report_type VARCHAR(30)` (`full|executive_summary|quantitative|qualitative|stage_export`), `stage? VARCHAR(40)`, `format VARCHAR(10)` (`docx|xlsx`), `status VARCHAR(20)`, `object_key? VARCHAR(500)`, `error_message? TEXT`, `requested_by -> users`, `completed_at? DATETIME(6)`; `INDEX(company_id,program_id,created_at)`, `UNIQUE(company_id,object_key)` saat berkas ada. Laporan hasil wajib punya `run_id`; ekspor tahap boleh tanpa run. |
| `sroi_audit_logs` | `actor_user_id? -> users`, `entity_type VARCHAR(60)`, `entity_id BIGINT UNSIGNED`, `action VARCHAR(20)` (`create|update|archive|calculate|export`), `before_state? JSON`, `after_state? JSON`, `occurred_at DATETIME(6)`; `INDEX(company_id,entity_type,entity_id,occurred_at)`. Append-only, jangan simpan token/sandi atau muatan berkas sensitif. `entity_type/id` adalah petunjuk audit, bukan FK polymorphic untuk integritas bisnis. |

## Relasi utama dan constraint lintas tabel

```text
companies 1--* projects --* respondents/submissions --* IKM/SLOI answers
         1--* sroi_programs --* sroi_program_stakeholders --* sroi_program_outcomes
                           |                                +--* sroi_outcome_indicators
                           |                                +--* sroi_financial_proxies
                           |                                +--* sroi_outcome_impact_years
                           +--* sroi_lfa_nodes --* sroi_roadmap_items --* sroi_roadmap_targets
                           +--1 sroi_program_scopes
                           +--* sroi_program_investments --* sroi_program_investment_years
                           +--* sroi_runs --* sroi_run_outcome_years
                                          +--* sroi_run_investment_years
                                          +--* sroi_run_yearly_totals
                           +--* sroi_report_exports
```

1. Tidak ada FK dari satu pun tabel `sroi_*` ke `projects`, `project_*`, `respondents`, `submissions`, `submission_*`, `instrument_templates`, atau `template_questions`. `companies` dan `users` adalah identitas bersama; `sroi_programs.id` tidak dipakai sebagai `projects.id`.
2. Semua entitas milik program harus memiliki `company_id` yang sama. Untuk tabel anak dengan `program_id` sekaligus parent khusus, sediakan `UNIQUE(company_id,program_id,id)` pada parent dan FK gabungan `(company_id,program_id,parent_id)`. Contoh: outcome -> stakeholder, roadmap target -> roadmap item, run outcome/investasi -> run dan sumber program.
3. Kategori stakeholder/outcome harus berada dalam rumpun `sroi_programs.category_id`. `sroi_program_stakeholders` dan `sroi_program_outcomes` menyimpan `program_category_id` agar FK `(company_id,program_id,program_category_id)` dan FK kategori gabungan menolak pilihan rumpun yang salah. Saat kategori program sudah dipakai, perubahan rumpun yang merusak referensi ditolak.
4. Indikator dan proksi pada `sroi_outcome_impact_years` dibatasi oleh FK `(company_id,outcome_id,indicator_id)` dan `(company_id,outcome_id,financial_proxy_id)`. Setiap tahun/jenis periode hanya punya satu baris dampak per outcome; jika beberapa indikator diperlukan untuk satu outcome/tahun, desain kunci dan agregasi harus diubah secara eksplisit sebelum DDL.
5. Parent wilayah harus konsisten: `cities.province_id`, `districts.city_id`, `villages.district_id`. Karena key gabungan belum tersedia pada master lama, aplikasi wajib memverifikasi rantai wilayah saat menyimpan profil/lokasi. Rentang roadmap, investasi, dan dampak diverifikasi terhadap program/scope dengan transaksi.
6. Semua query, perubahan, unggahan, dan unduhan wajib memfilter `company_id` dan memeriksa hak pengguna. FK gabungan mencegah salah kait antardata; FK bukan pengganti otorisasi. Akses lintas perusahaan oleh admin platform memerlukan alasan dan jejak audit.
7. Simpan data baru, perubahan multi-baris, snapshot run, total, serta catatan audit dalam satu transaksi. Jangan perbarui run lengkap; hitung ulang membuat run baru. Arsip parent tidak menghapus hasil/laporan lama. Berkas privat memerlukan otorisasi pada setiap unduhan.

## Metode kalkulasi yang diusulkan

Rumus calon `standard_v1` berikut mengikuti `sroi/database-sroi.md` dan **tidak diklaim sama dengan rumus situs pembanding**. Tetapkan versi dan uji dengan data primer sebelum dipakai sebagai keputusan bisnis.

```text
gross = quantity * proxy_unit_value
adjusted = gross * (1 - deadweight/100) * (1 - displacement/100)
                 * (1 - attribution/100) * (1 - dropoff/100)^(year-first_impact_year)
present_value = adjusted / (1 + discount_rate/100)^(year-base_year)
ratio = SUM(present_value outcome material milik stakeholder yang disertakan)
        / SUM(investasi nominal seluruh tahun)
```

`first_impact_year` adalah tahun input pertama outcome pada jenis periode yang sama; drop-off tidak mengurangi tahun pertama. Metode contoh memakai investasi nominal sebagai penyebut, bukan NPV investasi eksternal. Tolak tahun sebelum `base_year`, mata uang campuran, dan input wajib yang belum ada. Hasil dibulatkan dua desimal untuk uang yang ditampilkan, enam untuk rasio tersimpan; rasio `NULL` jika penyebut nol. Jangan mengarang nilai 0 untuk bukti/proksi/penyesuaian yang belum diketahui. Nilai situs yang teramati saat inspeksi (PV Rp1.873.283.459, investasi Rp285.000.000, rasio 6,57) berbeda dari ringkasan lama pada `sroi/database-sroi.md` (PV Rp1.965.375.891, rasio 6,90); keduanya hanya contoh keadaan situs, **bukan oracle perhitungan**.

## Verifikasi rancangan sebelum migrasi

- Dua perusahaan memiliki kategori bernama sama: FK komposit menolak program, stakeholder, outcome, dan hasil silang perusahaan.
- Satu perusahaan memiliki proyek IKM/SLOI serta program SROI: masing-masing daftar, responden, submission, instrumen, dan hasil tetap terpisah.
- Program dua tahun dengan beberapa investor/lokasi/outcome: total per tahun, total run, serta laporan menunjuk sumber dan versi yang sama.
- Stakeholder dikecualikan atau outcome tidak material: data tersimpan, tetapi tidak masuk manfaat; investasi nol menghasilkan `ratio=NULL`.
- Koreksi bukti, proksi, nominal, atau metode setelah run: snapshot lama dan laporan lama tidak berubah; run baru memiliki versi/parameter tersendiri.
- Draft dengan nilai tidak diketahui boleh disimpan, tetapi perhitungan ditolak sampai lengkap; validasi menolak tahun tidak sah, persen di luar batas, nilai negatif, dan mata uang campuran.
- Arsip program, kehilangan hak akses, ekspor tertunda, dan unduhan berkas menguji pembatasan perusahaan dan integritas histori.

Dokumen ini adalah kontrak rancangan, bukan DDL siap jalan. Langkah berikutnya adalah menyepakati metode finansial dan membuat migrasi/FK/check yang diuji pada engine target tanpa mengubah tabel IKM/SLOI yang sudah berisi data.
