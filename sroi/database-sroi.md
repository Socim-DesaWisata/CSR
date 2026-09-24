# Rancangan Database SROI

Status: rancangan implementasi, 24 September 2026. Target MySQL 8.0.16+ (`InnoDB`, `utf8mb4`). Ini rancangan aplikasi baru, bukan hasil ekstraksi skema internal situs pembanding. Format siap impor dbdiagram tersedia di `docs/database-sroi.dbml`.

## Analisis Situs

Alur yang berhasil ditelusuri: **Program List → aksi pensil → program terpilih → menu tahap**. URL tahap yang dibuka langsung dapat mengembalikan pengguna ke daftar program. Pesan kelengkapan profil perusahaan sempat muncul. Tidak ada data situs yang diubah.

| Layar | Fungsi dan data yang terlihat |
| --- | --- |
| Dashboard / Program List | Program, perusahaan, lokasi, pilar/rumpun, kategori, inisiator, kolaborator, berkas, rentang tahun, tipe evaluatif/forecast, deskripsi, batasan; ringkasan PV, investasi, stakeholder, outcome, rasio. |
| General Description | Nama, bidang/pilar, satu kategori, perusahaan, inisiator/pemilik, lokasi, tahun mulai/akhir, uraian, dokumen. |
| Theory of Change | Kondisi awal–intervensi–kondisi yang diharapkan; input–aktivitas–output–outcome–dampak. Ada tambah, simpan, ekspor Excel. |
| LFA | Hirarki goal → purpose → output → activity; elemen, indikator, sumber verifikasi, asumsi, kode aktivitas, relasi parent, ekspor Excel. |
| Roadmap | Aktivitas/output dengan target kuantitas dan jenis satuan per tahun. |
| Program Scope / Investment Details | Evaluatif, forecast, atau keduanya; periode dan batas penilaian. Investor, bentuk investasi, deskripsi, nominal per tahun, total. |
| Stakeholder Identification | Stakeholder, peran, keputusan masuk/tidak, alasan. |
| Outcome Identification | Outcome per stakeholder; relevansi, signifikansi, materialitas, alasan dan penjelasan. |
| SROI Table | Indikator, evidence/sumber, kuantitas per tahun, pendekatan/sumber proksi finansial, deadweight, displacement, attribution, drop-off beserta alasan; pilihan formula dan ekspor Excel. |
| SROI Calculation | PV per stakeholder/outcome/tahun; total investasi dan rasio per tahun maupun total. Contoh UI: 2023–2024, 2 stakeholder, 4 outcome, PV Rp1.965.375.891, investasi Rp285.000.000, rasio 6,90. |
| Referensi dan laporan | Rumpun program, kategori stakeholder dan kategori outcome per rumpun (termasuk kategori kustom), perusahaan/anggota; laporan Word full, executive summary, kuantitatif, kualitatif. |

**Batas pengamatan:** makna setiap pilihan formula, algoritme diskonto, detail ekspor, dan izin per peran tidak terkonfirmasi dari UI. Field/aturan berlabel *rancangan* adalah keputusan aplikasi baru, bukan klaim mengenai implementasi situs pembanding.

## Konvensi dan ERD

- Tabel ber-ID memakai `id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY`. Semua tabel tenant memiliki `organization_id BIGINT UNSIGNED NOT NULL`, `created_at DATETIME(6)`, `updated_at DATETIME(6)` UTC, kecuali tabel snapshot (`sroi_run_*`) yang hanya memiliki `created_at` dan `audit_logs` yang hanya memiliki `occurred_at`.
- Setiap tabel tenant menyediakan `UNIQUE (organization_id,id)`. FK antar-tabel tenant menggunakan pasangan `(organization_id,parent_id) → parent(organization_id,id)` agar baris lintas tenant tidak dapat direlasikan. Pengecualian: FK ke `users` dan template katalog global.
- Uang `DECIMAL(20,2)`, nilai proksi per unit `DECIMAL(20,4)`, kuantitas `DECIMAL(20,6)`, persentase `DECIMAL(7,4)` berskala 0–100, rasio `DECIMAL(20,6)`, mata uang `CHAR(3)` ISO 4217 (awal `IDR`). Hindari `FLOAT` untuk data finansial.
- `deleted_at DATETIME(6) NULL` pada organisasi, perusahaan, program. Hapus fisik parent berisi data memakai `RESTRICT`; gunakan arsip/nonaktif. Semua input yang dapat ditelusuri memiliki `created_by`/`updated_by` saat ditentukan di kamus.

```text
organizations ──< organization_members >── users ──< auth_identities / password_reset_tokens
     ├──< companies ──< company_members
     │             └──< locations >── provinces ──< cities ──< districts ──< sub_districts
     ├──< katalog tenant (rumpun/kategori stakeholder/kategori outcome)
     │                         └── stakeholder_categories ──< stakeholder_category_lists
     └──< programs ──< program_locations >── master wilayah bersama
                  ├──< program_members / program_documents
                  ├──< theory_of_change_conditions / theory_of_change_flows
                  ├──< lfa_nodes (parent → child)
                  ├──< roadmap_items ──< roadmap_targets
                  ├──1 program_scopes
                  ├──< program_investments ──< program_investment_years
                  ├──< program_stakeholders >── stakeholder_category_lists
                  │                    └──< program_outcomes
                  │                               ├──< outcome_indicators
                  │                               ├──< financial_proxies
                  │                               └──< outcome_impact_years
                  ├──< sroi_runs ──< sroi_run_outcome_years
                  │             ├──< sroi_run_investment_years
                  │             └──< sroi_run_yearly_totals
                  └──< report_exports
```

## Kamus Data

`?` berarti nullable; selain itu `NOT NULL`. `UQ` berarti unique index; `IX` index biasa. Kolom standar/ID mengikuti konvensi di atas, kecuali dinyatakan lain. Panjang teks dari UI perlu dibatasi dan divalidasi.

### Identitas, perusahaan, referensi

| Tabel | Kolom selain standar | FK, indeks, aturan |
| --- | --- | --- |
| `organizations` | `name VARCHAR(200)`, `slug VARCHAR(100)`, `status ENUM('active','suspended')`, `timezone VARCHAR(64)`, `deleted_at DATETIME(6)?` | `UQ(slug)`; tanpa `organization_id`. |
| `users` | `full_name VARCHAR(200)`, `email VARCHAR(254)`, `password_hash VARCHAR(255)?`, `email_verified_at DATETIME(6)?`, `is_platform_admin BOOLEAN DEFAULT FALSE`, `status ENUM('active','disabled')`, `last_login_at DATETIME(6)?`, `deleted_at DATETIME(6)?` | `UQ(email)` setelah normalisasi; tanpa `organization_id`. Simpan hash password, bukan password asli; flag admin hanya dapat diubah oleh proses admin tepercaya. |
| `auth_identities` | `user_id BIGINT UNSIGNED`, `provider VARCHAR(40)`, `provider_subject VARCHAR(255)`, `email_at_provider VARCHAR(254)?`, `last_login_at DATETIME(6)?`, `created_at DATETIME(6)` | Global; FK `user_id → users`, `UQ(provider,provider_subject)`, `IX(user_id)`. Mendukung Sign in with Google tanpa menyimpan token/rahasia provider. |
| `password_reset_tokens` | `user_id BIGINT UNSIGNED`, `token_hash CHAR(64)`, `expires_at DATETIME(6)`, `used_at DATETIME(6)?`, `created_at DATETIME(6)` | Global; FK `user_id → users`, `UQ(token_hash)`, `IX(user_id,expires_at)`. Token mentah hanya dikirim kepada pengguna; satu kali pakai. Akun OAuth-only perlu alur set-password eksplisit bila diizinkan. |
| `roles` | `code VARCHAR(40)`, `name VARCHAR(100)`, `is_system BOOLEAN` | `UQ(organization_id,code)`; seed role tenant: owner/editor/viewer. Otorisasi superadmin platform terpisah. |
| `organization_members` | `user_id BIGINT UNSIGNED`, `role_id BIGINT UNSIGNED`, `status ENUM('invited','active','disabled')`, `joined_at DATETIME(6)?` | `user_id → users`; FK tenant `role_id → roles`; `UQ(organization_id,user_id)`. |
| `catalog_templates` | `kind ENUM('sector','program_category','stakeholder_category','stakeholder_category_list','outcome_category')`, `code VARCHAR(40)`, `name VARCHAR(200)`, `parent_template_id BIGINT UNSIGNED?`, `active BOOLEAN`, `created_at DATETIME(6)`, `updated_at DATETIME(6)` | Global, tanpa tenant; `UQ(kind,code)`; self-FK `parent_template_id`. Disalin menjadi data katalog tenant saat organisasi dibuat. |
| `sectors` | `code VARCHAR(40)`, `name VARCHAR(200)`, `source_template_id BIGINT UNSIGNED?`, `active BOOLEAN` | `UQ(organization_id,code)`; template FK opsional. |
| `provinces` | `code VARCHAR(20)`, `name VARCHAR(150)`, `active BOOLEAN` | Master global kode wilayah Kemendagri; `UQ(code)`. |
| `cities` | `province_id BIGINT UNSIGNED`, `code VARCHAR(20)`, `name VARCHAR(150)`, `active BOOLEAN` | FK `province_id`; `UQ(code)`, `UQ(province_id,id)`. |
| `districts` | `city_id BIGINT UNSIGNED`, `code VARCHAR(20)`, `name VARCHAR(150)`, `active BOOLEAN` | FK `city_id`; `UQ(code)`, `UQ(city_id,id)`. |
| `sub_districts` | `district_id BIGINT UNSIGNED`, `code VARCHAR(20)`, `name VARCHAR(150)`, `active BOOLEAN` | FK `district_id`; `UQ(code)`, `UQ(district_id,id)`. |
| `locations` | `country_code CHAR(2)`, `province_id BIGINT UNSIGNED?`, `city_id BIGINT UNSIGNED?`, `district_id BIGINT UNSIGNED?`, `sub_district_id BIGINT UNSIGNED?`, `address VARCHAR(255)?`, `postal_code VARCHAR(10)?`, `latitude DECIMAL(10,7)?`, `longitude DECIMAL(10,7)?` | FK gabungan menjaga urutan hierarki; `IX(organization_id,country_code,province_id,city_id)`; `CHECK` mewajibkan parent jika anak wilayah diisi. Dipakai sebagai alamat kantor pusat perusahaan. |
| `companies` | `name VARCHAR(200)`, `sector_id BIGINT UNSIGNED?`, `headquarters_location_id BIGINT UNSIGNED?`, `deleted_at DATETIME(6)?` | FK tenant ke sektor/lokasi; `IX(organization_id,name)`. |
| `company_members` | `company_id BIGINT UNSIGNED`, `user_id BIGINT UNSIGNED?`, `name VARCHAR(200)`, `email VARCHAR(254)?`, `position VARCHAR(150)?` | FK tenant perusahaan; FK `(organization_id,user_id) → organization_members` (nullable); `IX(organization_id,company_id)`. Kontak bukan otomatis pemilik akun. |
| `program_categories` | `code VARCHAR(40)`, `name VARCHAR(200)`, `source_template_id BIGINT UNSIGNED?`, `active BOOLEAN` | Rumpun program seperti ID/PE; `UQ(organization_id,code)`; template FK opsional. Pilar/bidang pada form adalah teks bebas, bukan katalog ini. |
| `stakeholder_categories` | `program_category_id BIGINT UNSIGNED`, `code VARCHAR(40)`, `name VARCHAR(200)`, `source_template_id BIGINT UNSIGNED?`, `active BOOLEAN` | FK tenant rumpun; `UQ(organization_id,program_category_id,id)` untuk item anak dan `UQ(organization_id,program_category_id,code)`. |
| `stakeholder_category_lists` | `program_category_id BIGINT UNSIGNED`, `stakeholder_category_id BIGINT UNSIGNED`, `code VARCHAR(40)`, `name VARCHAR(200)`, `source_template_id BIGINT UNSIGNED?`, `active BOOLEAN` | FK gabungan tenant dan rumpun ke `stakeholder_categories`; `UQ(organization_id,stakeholder_category_id,code)`. Daftar opsi aktor per kategori, misalnya daftar jenis aktor yang tersedia pada kategori induk. |
| `outcome_categories` | `program_category_id BIGINT UNSIGNED`, `code VARCHAR(40)`, `name VARCHAR(200)`, `source_template_id BIGINT UNSIGNED?`, `active BOOLEAN` | FK tenant rumpun; `UQ(organization_id,program_category_id,code)`; kategori default dan kustom pada tab Outcome; `UQ(organization_id,program_category_id,id)` menopang FK outcome. |

### Program dan perencanaan

| Tabel | Kolom selain standar | FK, indeks, aturan |
| --- | --- | --- |
| `programs` | `public_number BIGINT UNSIGNED?`, `name VARCHAR(255)`, `company_id BIGINT UNSIGNED`, `pillar_name VARCHAR(200)`, `category_id BIGINT UNSIGNED`, `initiator_owner_name VARCHAR(200)`, `start_year SMALLINT UNSIGNED`, `end_year SMALLINT UNSIGNED`, `description TEXT`, `boundary_text TEXT?`, `status ENUM('draft','active','archived')`, `created_by BIGINT UNSIGNED`, `deleted_at DATETIME(6)?` | FK tenant perusahaan/rumpun; `created_by → users`; `CHECK(start_year <= end_year)`; `UQ(organization_id,public_number)` bila terisi; `UQ(organization_id,id,category_id)` untuk FK kategori anak; `IX(organization_id,status,created_at)`. Jenis penilaian disimpan pada `program_scopes`. |
| `program_locations` | `program_id BIGINT UNSIGNED`, `province_id BIGINT UNSIGNED`, `city_id BIGINT UNSIGNED`, `district_id BIGINT UNSIGNED`, `sub_district_id BIGINT UNSIGNED`, `location_name VARCHAR(200)`, `manager_name VARCHAR(200)`, `address VARCHAR(255)`, `postal_code VARCHAR(10)?`, `latitude DECIMAL(10,7)?`, `longitude DECIMAL(10,7)?`, `sort_order INT UNSIGNED` | FK tenant program; FK hierarki wilayah bersama mencegah kombinasi kabupaten/kecamatan/kelurahan yang tidak selaras. Nama pengelola adalah teks lokasi, bukan akun login. |
| `program_members` | `program_id BIGINT UNSIGNED`, `member_id BIGINT UNSIGNED`, `participation ENUM('collaborator','reviewer')` | FK tenant program/`organization_members`; `UQ(organization_id,program_id,member_id,participation)`. Hak efektif tetap dibatasi role organisasi. |
| `program_documents` | `program_id BIGINT UNSIGNED`, `stage VARCHAR(40)`, `file_name VARCHAR(255)`, `object_key VARCHAR(500)`, `mime_type VARCHAR(100)`, `size_bytes BIGINT UNSIGNED`, `sha256 CHAR(64)`, `uploaded_by BIGINT UNSIGNED` | FK tenant program; `uploaded_by → users`; `UQ(organization_id,object_key)`. Simpan file privat di object storage, bukan BLOB. |
| `theory_of_change_conditions` | `program_id BIGINT UNSIGNED`, `sort_order INT UNSIGNED`, `initial_condition TEXT`, `intervention TEXT`, `expected_condition TEXT` | FK tenant program; `UQ(organization_id,program_id,sort_order)`. Baris kondisi awal–intervensi–kondisi harapan. |
| `theory_of_change_flows` | `program_id BIGINT UNSIGNED`, `sort_order INT UNSIGNED`, `input_text TEXT`, `activity_text TEXT`, `output_text TEXT`, `outcome_text TEXT`, `impact_text TEXT` | FK tenant program; `UQ(organization_id,program_id,sort_order)`. Baris input–impact; pisah dari tampilan kondisi. |
| `lfa_nodes` | `program_id BIGINT UNSIGNED`, `parent_id BIGINT UNSIGNED?`, `level ENUM('goal','purpose','output','activity')`, `code VARCHAR(40)?`, `element TEXT`, `indicator TEXT?`, `verification_source TEXT?`, `assumptions TEXT?`, `sort_order INT UNSIGNED` | FK tenant program dan self-FK parent; `IX(organization_id,program_id,level,sort_order)`. Goal tanpa parent; level parent harus satu tingkat di atas. Validasi hirarki dalam transaksi aplikasi. |
| `roadmap_items` | `program_id BIGINT UNSIGNED`, `lfa_activity_id BIGINT UNSIGNED`, `sort_order INT UNSIGNED` | FK tenant program dan node LFA wajib; `IX(organization_id,program_id,sort_order)`; node harus level activity pada program yang sama. Teks aktivitas/output bersumber dari `lfa_nodes`, tidak diduplikasi. |
| `roadmap_targets` | `program_id BIGINT UNSIGNED`, `roadmap_item_id BIGINT UNSIGNED`, `year SMALLINT UNSIGNED`, `target_quantity DECIMAL(20,6)`, `unit VARCHAR(100)` | FK gabungan tenant/program/item roadmap; `UQ(organization_id,roadmap_item_id,year)`, `CHECK(target_quantity >= 0)`; tahun wajib dalam periode program. |
| `program_scopes` | `program_id BIGINT UNSIGNED`, `assessment_type ENUM('evaluative','forecast','both')`, `evaluative_start_year SMALLINT UNSIGNED?`, `evaluative_end_year SMALLINT UNSIGNED?`, `forecast_start_year SMALLINT UNSIGNED?`, `forecast_end_year SMALLINT UNSIGNED?`, `scope_text TEXT` | FK tenant program; `UQ(organization_id,program_id)`. Tiap rentang berurutan; rentang hanya diwajibkan untuk jenis yang dipilih. |
| `program_investments` | `program_id BIGINT UNSIGNED`, `investor_name VARCHAR(200)`, `contribution_type ENUM('cash','in_kind','time')`, `form VARCHAR(150)`, `currency_code CHAR(3)`, `sort_order INT UNSIGNED` | FK tenant program; `IX(organization_id,program_id)`. Investor boleh berupa nama bebas; detail tambahan tidak disimpan pada kolom deskripsi terpisah. |
| `program_investment_years` | `program_id BIGINT UNSIGNED`, `investment_id BIGINT UNSIGNED`, `year SMALLINT UNSIGNED`, `amount DECIMAL(20,2)` | FK gabungan tenant/program/investasi; `UQ(organization_id,investment_id,year)`, `CHECK(amount >= 0)`. Nilai in-kind/waktu harus dimonetisasi; total dihitung dari rincian, bukan diedit terpisah. |

### Stakeholder, outcome, dan masukan SROI

| Tabel | Kolom selain standar | FK, indeks, aturan |
| --- | --- | --- |
| `program_stakeholders` | `program_id BIGINT UNSIGNED`, `program_category_id BIGINT UNSIGNED`, `stakeholder_category_list_id BIGINT UNSIGNED`, `role_in_program TEXT`, `included BOOLEAN`, `inclusion_reason TEXT`, `sort_order INT UNSIGNED` | FK gabungan tenant/program/rumpun dan ke daftar katalog aktor pada rumpun yang sama; `UQ(organization_id,program_id,stakeholder_category_list_id)`. Nama aktor berasal dari item katalog; stakeholder yang dikecualikan tetap dicatat beserta alasan. |
| `program_outcomes` | `program_id BIGINT UNSIGNED`, `program_category_id BIGINT UNSIGNED`, `stakeholder_id BIGINT UNSIGNED`, `outcome_category_id BIGINT UNSIGNED?`, `name VARCHAR(255)`, `description TEXT`, `relevant BOOLEAN`, `significant BOOLEAN`, `material BOOLEAN`, `materiality_reason TEXT?`, `materiality_explanation TEXT?`, `sort_order INT UNSIGNED` | FK gabungan tenant/program/rumpun, stakeholder program, dan kategori outcome; `IX(organization_id,program_id,stakeholder_id,material)`. `outcome_categories` tetap berada di bawah `program_categories`; outcome melekat pada stakeholder nyata di program. Hanya stakeholder masuk dan outcome material dihitung. |
| `outcome_indicators` | `outcome_id BIGINT UNSIGNED`, `name VARCHAR(255)`, `unit VARCHAR(100)?`, `evidence TEXT?`, `evidence_source TEXT?`, `sort_order INT UNSIGNED` | FK tenant outcome; `UQ(organization_id,outcome_id,id)` untuk memastikan indikator anak outcome yang sama. |
| `financial_proxies` | `outcome_id BIGINT UNSIGNED`, `approach VARCHAR(255)`, `description TEXT?`, `source TEXT`, `unit VARCHAR(100)`, `unit_value DECIMAL(20,4)`, `currency_code CHAR(3)` | FK tenant outcome; `CHECK(unit_value >= 0)`; `UQ(organization_id,outcome_id,id)` agar FK gabungan memastikan proksi milik outcome terkait. |
| `outcome_impact_years` | `outcome_id BIGINT UNSIGNED`, `indicator_id BIGINT UNSIGNED`, `financial_proxy_id BIGINT UNSIGNED`, `period_type ENUM('evaluative','forecast')`, `year SMALLINT UNSIGNED`, `quantity DECIMAL(20,6)`, `deadweight_pct DECIMAL(7,4)`, `displacement_pct DECIMAL(7,4)`, `attribution_pct DECIMAL(7,4)`, `dropoff_pct DECIMAL(7,4)`, `deadweight_reason TEXT?`, `displacement_reason TEXT?`, `attribution_reason TEXT?`, `dropoff_reason TEXT?`, `updated_by BIGINT UNSIGNED` | FK tenant ke outcome; FK gabungan `(organization_id,outcome_id,indicator_id)` dan `(organization_id,outcome_id,financial_proxy_id)`; `UQ(organization_id,outcome_id,period_type,year)`; kuantitas ≥ 0, persentase 0–100; tahun sesuai scope. Ini masukan editable, bukan hasil kalkulasi. |

### Run kalkulasi, laporan, dan audit

| Tabel | Kolom selain standar | FK, indeks, aturan |
| --- | --- | --- |
| `sroi_methods` | `code VARCHAR(40)`, `version VARCHAR(40)`, `description TEXT`, `active BOOLEAN`, `created_at DATETIME(6)` | Tabel global, `UQ(code,version)`; identitas versi kode kalkulasi teruji, bukan ekspresi arbitrer yang dieksekusi dari DB. |
| `sroi_runs` | `program_id BIGINT UNSIGNED`, `method_id BIGINT UNSIGNED`, `base_year SMALLINT UNSIGNED`, `discount_rate_pct DECIMAL(7,4)`, `currency_code CHAR(3)`, `status ENUM('complete','invalidated')`, `total_present_value DECIMAL(20,2)`, `total_investment DECIMAL(20,2)`, `ratio DECIMAL(20,6)?`, `created_by BIGINT UNSIGNED`, `created_at DATETIME(6)` | FK tenant program; FK global metode dan `users`; tingkat diskonto ≥ 0; total investasi ≥ 0; `ratio NULL` bila investasi nol; `IX(organization_id,program_id,created_at)`. Run selesai immutable. |
| `sroi_run_outcome_years` | `program_id BIGINT UNSIGNED`, `run_id BIGINT UNSIGNED`, `outcome_id BIGINT UNSIGNED`, `period_type ENUM('evaluative','forecast')`, `year SMALLINT UNSIGNED`, `stakeholder_name VARCHAR(200)`, `outcome_name VARCHAR(255)`, `indicator_name VARCHAR(255)`, `indicator_unit VARCHAR(100)?`, `evidence TEXT?`, `evidence_source TEXT?`, `proxy_approach VARCHAR(255)`, `proxy_source TEXT`, `proxy_unit VARCHAR(100)`, `quantity DECIMAL(20,6)`, `proxy_unit_value DECIMAL(20,4)`, `deadweight_pct DECIMAL(7,4)`, `displacement_pct DECIMAL(7,4)`, `attribution_pct DECIMAL(7,4)`, `dropoff_pct DECIMAL(7,4)`, `adjustment_reasons JSON?`, `gross_value DECIMAL(20,2)`, `adjusted_value DECIMAL(20,2)`, `discount_factor DECIMAL(20,10)`, `present_value DECIMAL(20,2)`, `created_at DATETIME(6)` | FK tenant `(organization_id,program_id,run_id)` dan `(organization_id,program_id,outcome_id)`; `UQ(organization_id,run_id,outcome_id,period_type,year)`. Snapshot nama dan input menjaga run lama stabil setelah sumber diedit. `adjustment_reasons` hanya snapshot penjelasan terstruktur. |
| `sroi_run_investment_years` | `program_id BIGINT UNSIGNED`, `run_id BIGINT UNSIGNED`, `investment_id BIGINT UNSIGNED`, `year SMALLINT UNSIGNED`, `investor_name VARCHAR(200)`, `contribution_type ENUM('cash','in_kind','time')`, `form VARCHAR(150)`, `amount DECIMAL(20,2)`, `created_at DATETIME(6)` | FK tenant `(organization_id,program_id,run_id)` dan `(organization_id,program_id,investment_id)`; `UQ(organization_id,run_id,investment_id,year)`; snapshot komponen penyebut. |
| `sroi_run_yearly_totals` | `run_id BIGINT UNSIGNED`, `period_type ENUM('evaluative','forecast')`, `year SMALLINT UNSIGNED`, `total_present_value DECIMAL(20,2)`, `total_investment DECIMAL(20,2)`, `ratio DECIMAL(20,6)?`, `created_at DATETIME(6)` | FK tenant run; `UQ(organization_id,run_id,period_type,year)`; rasio `NULL` bila investasi tahun itu nol. Total run sama dengan agregat baris tahunan. |
| `report_exports` | `program_id BIGINT UNSIGNED`, `run_id BIGINT UNSIGNED?`, `report_type ENUM('full','executive_summary','quantitative','qualitative','stage_export')`, `stage VARCHAR(40)?`, `format ENUM('docx','xlsx')`, `status ENUM('queued','ready','failed')`, `object_key VARCHAR(500)?`, `error_message TEXT?`, `requested_by BIGINT UNSIGNED`, `created_at DATETIME(6)`, `completed_at DATETIME(6)?` | FK tenant program/run dan pengguna; run harus dari program sama; `IX(organization_id,program_id,created_at)`, `UQ(organization_id,object_key)` saat berkas ada. Berkas privat, ekspor laporan historis menunjuk run immutable. |
| `audit_logs` | `actor_user_id BIGINT UNSIGNED?`, `entity_type VARCHAR(60)`, `entity_id BIGINT UNSIGNED`, `action ENUM('create','update','archive','calculate','export')`, `before_state JSON?`, `after_state JSON?`, `occurred_at DATETIME(6)` | FK tenant organisasi; FK pengguna opsional; `IX(organization_id,entity_type,entity_id,occurred_at)`; append-only dan jangan catat kredensial/rahasia. JSON hanya untuk audit, bukan input utama. |

### Constraint lintas entitas

1. Item `stakeholder_category_lists` harus memakai kategori stakeholder dan rumpun program yang sama. FK gabungan menolak item katalog yang tertaut ke kategori/rumpun berbeda.
2. Kategori outcome harus berada pada rumpun (`programs.category_id`) yang sama; outcome dan stakeholder harus milik program yang sama. Pilar/bidang program tetap teks bebas sebagaimana form yang terlihat.
3. FK gabungan mengikat stakeholder program dan outcome ke rumpun program yang sama, serta memastikan outcome merujuk ke stakeholder aktual yang telah dicatat untuk program tersebut.
4. Indikator/proksi harus berasal dari outcome yang sama seperti `outcome_impact_years`; gunakan unique key `(organization_id,outcome_id,id)` serta FK gabungan.
5. Tahun roadmap/investasi/dampak harus dalam rentang program atau forecast. Untuk assessment `both`, `forecast_start_year` wajib lebih besar dari `evaluative_end_year`; periode tidak tumpang tindih atau terhitung ganda.
6. Setiap query, unggahan, dan ekspor memeriksa tenant dan hak akses. FK tenant adalah perlindungan integritas tambahan, bukan pengganti otorisasi. Admin platform tidak otomatis mengambil peran tenant; akses lintas tenant harus melalui operasi admin yang terotorisasi dan tercatat.
7. Admin platform mengubah template global; salinan kategori yang telah dipakai tenant tidak berubah otomatis.

## Metode Kalkulasi V1

Rumus berikut adalah keputusan eksplisit aplikasi baru, bukan klaim rumus persis situs pembanding. Identitas versi disimpan di `sroi_methods`; semua masukan dan hasil disalin ke run immutable.

```text
gross_value = quantity × proxy_unit_value
adjusted_value = gross_value × (1 − deadweight/100)
                             × (1 − displacement/100)
                             × (1 − attribution/100)
                             × (1 − dropoff/100)^(year − first_impact_year)
present_value = adjusted_value / (1 + discount_rate/100)^(year − base_year)
ratio = SUM(PV outcome material dari stakeholder masuk)
        / SUM(nominal investasi seluruh tahun)
```

`first_impact_year` adalah tahun input pertama untuk outcome dan jenis periode sama; drop-off tidak mengurangi tahun pertama. Kuantitas tiap tahun adalah input terpisah, tidak disalin otomatis dari tahun sebelumnya. Metode v1 menerapkan faktor drop-off di atas pada evaluatif maupun forecast; persentasenya tetap wajib memiliki alasan. `attribution_pct` berarti bagian perubahan yang disebabkan pihak lain. Tolak mata uang campuran dan tahun sebelum `base_year`; konversi kurs serta investasi terdiskonto di luar v1. Hitung dengan presisi penuh, bulatkan rupiah ke dua desimal pada output, rasio ke dua desimal saat ditampilkan dan enam saat disimpan.

Pemeriksaan angka agregat contoh: Rp1.965.375.891 / Rp285.000.000 ≈ 6,90. Itu hanya memeriksa penyebut dan pembulatan; angka ini tidak membuktikan rumus outcome, diskonto, atau urutan penyesuaian pada situs pembanding.

## Verifikasi Sebelum DDL

- Dua tenant dengan nama katalog sama: FK gabungan menolak hubungan silang pada program, lokasi, role, stakeholder, outcome, proxy.
- Program evaluatif dua tahun dengan banyak lokasi, dua stakeholder, empat outcome, tiga jenis investasi dan target roadmap tahunan: total run cocok dengan baris snapshot.
- Stakeholder tidak masuk dan outcome tidak material tetap tersimpan, tetapi tidak masuk kalkulasi. Investasi nol menghasilkan rasio `NULL`, bukan pembagian nol.
- Edit masukan/proksi/investasi setelah run pertama: run lama dan laporan tetap; kalkulasi ulang membuat run baru dengan versi metode/parameter.
- Tolak persentase di luar 0–100, jumlah negatif, rentang terbalik, tahun di luar scope, mata uang campuran, duplikasi outcome/periode/tahun.
- Query dan ekspor tenant serta akses object storage tidak membocorkan data organisasi lain.

Belum ada kode aplikasi atau migrasi dalam folder kerja ini. Dokumen ini menjadi kontrak skema untuk implementasi berikutnya; DDL MySQL perlu menuliskan FK gabungan dan aturan validasi transaksi di atas.
