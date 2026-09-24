# Contoh Penggunaan 43 Tabel SROI: Rumah BUMN Sumsel

Dokumen ini membaca `database-sroi.dbml` **sesuai urutan pengguna mengoperasikan website**, dari masuk hingga mengunduh laporan. Studi kasusnya adalah **Program Rumah BUMN Sumsel (RBS) binaan PT Pupuk Sriwidjaja Palembang (PUSRI)**, bukan program atau pengguna rekaan. Laporan SROI resmi PUSRI mencakup kegiatan November 2023–November 2024, tiga kelompok stakeholder prioritas, investasi NPV Rp490.006.016, manfaat NPV Rp1.907.135.112, dan rasio SROI **3,89**. [S1, hlm. 53–54, 56, 62] 

## Cara Membaca Contoh

- **Fakta laporan**: nama, aktivitas, kelompok stakeholder, atau angka yang benar-benar muncul di [S1]. Nomor halaman merujuk **nomor cetak** laporan, bukan indeks halaman PDF.
- **Pemetaan**: penempatan fakta itu ke kolom skema aplikasi baru. Nama kategori, teks LFA, klasifikasi materialitas, dan alur peran pengguna belum tentu ada dalam sistem PUSRI.
- **Contoh teknis**: ID seperti `organization_id=1`, `program_id=10`, `user_id=9001`, email domain `.invalid`, serta nama berkas penyimpanan hanya memperlihatkan hubungan antartabel. **Bukan** data akun atau transaksi PUSRI.
- **Belum tersedia**: jangan mengisi angka, target, persentase, diskonto, atau identitas orang yang tidak dinyatakan dalam laporan. Contoh bersyarat di bawah menunjukkan kapan tabel diisi, bukan mengaku barisnya sudah ada.

Alur FK inti: `organizations(1)` → `companies(20)` → `programs(10)` → `stakeholder_category_lists` → `program_stakeholders(50)` → `program_outcomes(60)` → `outcome_impact_years` → `sroi_runs(200)` → `report_exports`. ID dalam kurung hanya contoh teknis. Semua tabel tenant memakai `organization_id=1`; tabel identitas global dan template metode tidak memilikinya.

## 1. Masuk dan Memilih Organisasi

Pengguna mendaftar/masuk, sistem menentukan organisasi aktif serta hak akses. Tidak ada nama, email, sandi, atau akun pengguna aplikasi yang dipublikasikan dalam laporan RBS; seluruh contoh akun pada tahap ini **simulasi teknis**.

| Tabel | Fungsi pada website | Contoh penggunaan |
| --- | --- | --- |
| `organizations` | Memisahkan seluruh program, perusahaan, dan kalkulasi antar pelanggan SaaS. | Jika PUSRI memakai aplikasi, tenant `id=1`, `name='PT Pupuk Sriwidjaja Palembang'` menampung program RBS; **pemetaan**, bukan klaim tentang akun PUSRI. |
| `users` | Menyimpan identitas login, hash sandi, status, dan pemilik aksi. | `id=9001`, `email='analis@contoh.invalid'`, `password_hash=<hash>`; akun **simulasi**, bukan kontak PUSRI. |
| `auth_identities` | Menautkan tombol **Sign in with Google** ke user tanpa menyimpan password Google. | `user_id=9001`, `provider='google'`, `provider_subject=<ID dari Google>`; dibuat hanya sesudah autentikasi nyata. |
| `password_reset_tokens` | Mengelola tautan **Forgot password** yang kedaluwarsa dan sekali pakai. | `user_id=9001`, `token_hash=<hash token>`, `expires_at=<waktu>`; tidak menggunakan token asli dalam dokumentasi. |
| `roles` | Mendefinisikan kemampuan `owner`, `editor`, dan `viewer` di satu tenant. | `id=1`, `organization_id=1`, `code='editor'` untuk analis yang dapat mengisi tabel SROI. |
| `organization_members` | Menghubungkan user global ke organisasi dan role-nya. | `id=500`, `organization_id=1`, `user_id=9001`, `role_id=1`; user itu baru boleh membuka data RBS tenant 1. |

## 2. Menyiapkan Katalog dan Perusahaan

Sebelum membuat program, admin menyiapkan wilayah Kemendagri, sektor, rumpun, kategori stakeholder, daftar pilihan aktor, kategori outcome, dan perusahaan. Kegiatan RBS terkait pembinaan UMKM di Sumatera Selatan; klasifikasi di aplikasi berikut adalah **pemetaan**, bukan label resmi dalam laporan. PUSRI memang menyebut tiga stakeholder prioritas: perusahaan, Rumah BUMN Sumsel, dan UMKM binaan. [S1, hlm. 53–54]

| Tabel | Fungsi pada website | Contoh penggunaan |
| --- | --- | --- |
| `catalog_templates` | Menyediakan pilihan katalog bawaan platform yang kemudian disalin ke tiap tenant. | Template `kind='program_category'`, `code='PE'`, `name='Pemberdayaan Ekonomi'`; kode mengikuti katalog rancangan aplikasi, bukan kode laporan PUSRI. |
| `sectors` | Pilihan bidang usaha perusahaan di form perusahaan. | `organization_id=1`, `name='Industri pupuk'` untuk perusahaan PUSRI; sektor dipetakan dari profil perusahaan [S1, hlm. 6]. |
| `provinces` | Master provinsi global berkode Kemendagri. | Nama `Sumatera Selatan` disebut laporan; kode/ID diisi dari master resmi, bukan ditebak [S1, hlm. 6]. |
| `cities` | Kota/kabupaten di bawah provinsi. | `Palembang` berada di Sumatera Selatan menurut laporan; FK provinsi harus cocok [S1, hlm. 6]. |
| `districts` | Kecamatan di bawah kota/kabupaten. | Kecamatan lokasi RBS **tidak disebut** di laporan; pilih setelah alamat program diverifikasi. |
| `sub_districts` | Kelurahan/desa di bawah kecamatan. | Kelurahan/desa lokasi RBS **tidak disebut** di laporan; gunakan master Kemendagri setelah verifikasi. |
| `locations` | Alamat kantor pusat perusahaan dengan FK ke master provinsi–desa/kelurahan. | `id=21`, `country_code='ID'`, provinsi Sumatera Selatan dan kota Palembang **fakta laporan**; ID wilayah, kecamatan, desa, dan alamat lengkap perlu diverifikasi, bukan dibuat dari nama saja. |
| `companies` | Data perusahaan pemilik/pemberi program. | `id=20`, `organization_id=1`, `name='PT Pupuk Sriwidjaja Palembang'`, `headquarters_location_id=21`; nama perusahaan **fakta laporan**. |
| `company_members` | Kontak/anggota perusahaan untuk menu **Detail Anggota**; opsional ditautkan ke akun. | `company_id=20`, `user_id=NULL` sebelum kontak internal diverifikasi. Laporan tidak memberikan daftar akun yang boleh masuk aplikasi: **jangan menebak nama/email**. |
| `program_categories` | Rumpun yang dipilih saat membuat program. | `id=30`, `code='PE'`, `name='Pemberdayaan Ekonomi'`; klasifikasi RBS sebagai PE adalah **pemetaan** atas kegiatan pembinaan UMKM. |
| `stakeholder_categories` | Kategori payung stakeholder per rumpun program. | `id=40`, `program_category_id=30`, `name='Pelaksana program'` adalah **pemetaan**; item `Rumah BUMN Sumsel` disimpan terpisah di `stakeholder_category_lists`. |
| `stakeholder_category_lists` | Pilihan jenis/nama aktor di bawah kategori payung dan rumpun yang sama. | `organization_id=1`, `program_category_id=30`, `stakeholder_category_id=40`, `name='Rumah BUMN Sumsel'`; nama ada pada laporan, sedangkan kode katalog dan kategorinya **pemetaan** [S1, hlm. 53]. |
| `outcome_categories` | Kategori outcome menurut rumpun `program_categories`. | `id=41`, `program_category_id=30`, `name='Manfaat aset'` adalah **pemetaan** outcome aset RBS, bukan nama kategori resmi PUSRI. |

**Urutan input:** buat tenant → salin template → tambah lokasi/sektor/perusahaan → sediakan rumpun dan kategori. Katalog global tidak dipakai langsung sebagai FK program, sehingga kategori kustom satu organisasi tidak bocor ke organisasi lain.

## 3. Program List → Add Program → General Description

Admin membuat program dan melengkapinya, kemudian pengguna lain memilih **Program List → aksi pensil** untuk masuk ke tahap berikutnya. Laporan menyebut Program Rumah BUMN Sumsel binaan PUSRI dan periode evaluasi November 2023–November 2024. [S1, hlm. 53, 62]

| Tabel | Fungsi pada website | Contoh penggunaan |
| --- | --- | --- |
| `programs` | Inti program: nama, perusahaan, rumpun, pilar teks bebas, inisiator, tahun, deskripsi, status. | `id=10`, `company_id=20`, `category_id=30`, `name='Rumah BUMN Sumsel'`, `start_year=2023`, `end_year=2024`, `initiator_owner_name='PT Pupuk Sriwidjaja Palembang'`. `pillar_name='Pemberdayaan UMKM'` adalah **pemetaan**, bukan kutipan field asli. |
| `program_locations` | Lokasi pelaksanaan, pengelola, alamat, dan FK hierarki wilayah. | `program_id=10`, `location_name='Rumah BUMN Sumsel'` (**pemetaan**), provinsi Sumatera Selatan/kota Palembang (**fakta laporan**); `district_id`, `sub_district_id`, `manager_name`, dan `address` belum cukup bukti untuk baris wajib lengkap. |
| `program_members` | Menautkan kolaborator/reviewer **yang sudah menjadi anggota tenant**. | Bila staf mitra pelaksana diberi akun editor, hubungkan `program_id=10` ke `organization_members.id` miliknya. PT Gofin Cipta Indonesia disebut sebagai pihak ketiga dalam laporan, tetapi **tidak** berarti perusahaan itu telah memiliki akun [S1, hlm. 54]. |
| `program_documents` | Metadata lampiran proposal, bukti, dan laporan; file asli disimpan privat. | Lampirkan `Laporan SROI RBS Tahun 2024.pdf` ke `program_id=10`, `mime_type='application/pdf'`; `object_key`, hash, dan `uploaded_by` baru diisi ketika file benar-benar diunggah. |

## 4. Theory of Change

Di website, pengguna mengisi dua tampilan: **Kondisi Awal–Intervensi–Kondisi yang Diharapkan** dan **Input–Aktivitas–Output–Outcome–Dampak**. Tabel peta anggaran dalam laporan menghubungkan pelatihan dan pendampingan dengan peningkatan keterampilan UMKM serta pameran dengan peningkatan omzet. Rangkaian di bawah **pemetaan dari kegiatan nyata**, bukan ToC literal yang diterbitkan PUSRI. [S1, hlm. 103–104]

| Tabel | Fungsi pada website | Contoh penggunaan |
| --- | --- | --- |
| `theory_of_change_conditions` | Menyimpan satu baris kondisi awal, intervensi, dan kondisi yang diharapkan. | `program_id=10`, `initial_condition='UMKM memerlukan penguatan kemampuan usaha'`, `intervention='Pelatihan dan pendampingan RBS'`, `expected_condition='Keterampilan UMKM meningkat'` (**pemetaan**). |
| `theory_of_change_flows` | Menyimpan rantai input→impact yang bisa diurutkan dan diekspor. | `program_id=10`, `input_text='Dukungan TJSL PUSRI'`, `activity_text='Pelatihan UMKM'`, `output_text='Pelatihan terlaksana'`, `outcome_text='Keterampilan UMKM meningkat'`, `impact_text='UMKM lebih siap mengembangkan usaha'` (**pemetaan**). |

## 5. Logical Framework Approach (LFA) dan Roadmap

LFA menguraikan goal→purpose→output→activity dengan `parent_id`; roadmap memetakan aktivitas/output ke tahun dan target. Laporan memuat pelatihan pengelolaan keuangan dengan **26 peserta** pada 2023. Itu **realisasi peserta**, bukan target yang disetujui. [S1, hlm. 56, 103]

| Tabel | Fungsi pada website | Contoh penggunaan |
| --- | --- | --- |
| `lfa_nodes` | Menyimpan empat tingkat LFA; child menunjuk node parent pada program yang sama. | Contoh **pemetaan**: goal `UMKM binaan berkembang` → purpose `Kemampuan usaha meningkat` → output `Pelatihan keuangan terlaksana` → activity `Pelatihan pengelolaan keuangan dasar`. `indicator`, `verification_source`, dan `assumptions` perlu disahkan tim program; jangan mengisi angka target dari laporan realisasi. |
| `roadmap_items` | Mengurutkan node LFA level activity pada roadmap; teks aktivitas/output dibaca dari LFA. | `program_id=10`, `lfa_activity_id=<node pelatihan keuangan>` hanya sesudah node level `activity` dibuat; jangan menyimpan `activity_text`/`output_text` lagi. |
| `roadmap_targets` | Menyimpan `year`, `target_quantity`, `unit` per aktivitas. | `roadmap_item_id=<pelatihan keuangan>`, `year=2023`, `unit='peserta'`; **jangan masukkan `target_quantity=26`**, sebab 26 adalah peserta yang tercatat hadir, bukan target. Baris dibuat setelah target asli tersedia. |

## 6. Program Scope → Investment Details

Pengguna memilih evaluatif/forecast, periode, batas analisis, lalu memasukkan investor, bentuk kontribusi, dan nominal tiap tahun. Laporan mengukur RBS November 2023–November 2024. Tabel 7/8 menyebut **NPV of Investment** total Rp490.006.016, termasuk total pelatihan 2023 Rp1.860.000 dan pelatihan 2024 Rp39.318.000. Angka itu **NPV yang dilaporkan**, bukan otomatis nominal mentah per transaksi. [S1, hlm. 56–62]

| Tabel | Fungsi pada website | Contoh penggunaan |
| --- | --- | --- |
| `program_scopes` | Satu pilihan metode dan rentang tahun per program; teks batasan analisis. | `program_id=10`, `assessment_type='evaluative'`, `evaluative_start_year=2023`, `evaluative_end_year=2024`, `scope_text='Kegiatan RBS dan UMKM binaan November 2023–November 2024'` (**pemetaan batas laporan**). |
| `program_investments` | Mendefinisikan satu pos kontribusi: investor, bentuk, deskripsi, mata uang. | `program_id=10`, `investor_name='PT Pupuk Sriwidjaja Palembang'`, `form='Pelatihan UMKM'`, `contribution_type='cash'`, `currency_code='IDR'`; bentuk klasifikasi merupakan **pemetaan**. |
| `program_investment_years` | Nominal per pos/tahun sebagai input kalkulasi; satu pos bisa berulang. | Pos pelatihan mempunyai tahun `2023` dan `2024`. **Jumlah nominal transaksi belum boleh diisi dari Rp1.860.000/Rp39.318.000** tanpa memastikan apakah angka NPV laporan sama dengan angka buku kas yang diperlukan metode aplikasi. |

## 7. Stakeholder Identification

Tabel prioritas laporan menyebut **PUSRI (pemberi dana/program), Rumah BUMN Sumsel (pelaksana), UMKM Binaan RBS (penerima manfaat)**. Website menyimpan setiap pihak, peran, keputusan masuk/tidak, dan alasan. [S1, hlm. 53–54]

| Tabel | Fungsi pada website | Contoh penggunaan |
| --- | --- | --- |
| `program_stakeholders` | Menyimpan pilihan aktor dari katalog pada program serta peran dan alasan inklusi. | Untuk RBS: `program_id=10`, `program_category_id=30`, `stakeholder_category_list_id=<Rumah BUMN Sumsel>`, `role_in_program='Pelaksana'`; dua baris terpisah untuk PUSRI (pendana) dan UMKM (penerima manfaat) [S1, hlm. 53]. |

## 8. Outcome Identification dan Uji Materialitas

Outcome ditautkan ke stakeholder, bukan langsung ke perusahaan. Laporan menghubungkan pelatihan dengan peningkatan keterampilan UMKM, pameran dengan omzet, dan pemanfaatan aset RBS dengan manfaat ekonominya. Tetapi laporan yang dibaca tidak menyediakan nilai boolean `relevant`, `significant`, `material` **dalam format aplikasi ini**. [S1, hlm. 103, 137–139]

| Tabel | Fungsi pada website | Contoh penggunaan |
| --- | --- | --- |
| `program_outcomes` | Perubahan per aktor program, kategori outcome, serta hasil uji materialitas. | `program_id=10`, `program_category_id=30`, `stakeholder_id=<baris RBS pada program>`, `outcome_category_id=<Manfaat aset>`, `name='Penghasilan dari Asset Rumah BUMN'`; outcome ini berbeda dari outcome keterampilan milik UMKM. Nilai `material` baru diisi setelah diuji [S1, hlm. 137]. |

## 9. SROI Table: Bukti, Proksi, Kuantitas, Penyesuaian

Setelah outcome material dipilih, pengguna mengisi indikator, sumber evidence, proksi finansial, kuantitas menurut tahun, deadweight, displacement, attribution, dan drop-off. Laporan menyebut biaya sewa galeri **Rp45.000.000 per bulan** untuk **15 bulan** dan nilai Rp675.000.000; ruang pertemuan Rp1.750.000 per bulan untuk 15 bulan. Ini contoh proksi/volume yang benar-benar dilaporkan, tetapi **pembagian 15 bulan ke tahun kalender tidak disediakan di kutipan tabel**, sehingga jangan menebak nilai per tahun. [S1, hlm. 63, 143]

| Tabel | Fungsi pada website | Contoh penggunaan |
| --- | --- | --- |
| `outcome_indicators` | Menamai pengukuran outcome, satuan, kejadian/bukti, dan sumber. | Buat indikator sewa galeri untuk outcome aset Rumah BUMN sebagai baris terpisah dari outcome peningkatan skill UMKM; satu outcome memiliki indikator masing-masing. |
| `financial_proxies` | Menyimpan pendekatan valuasi, sumber, satuan, dan `unit_value`. | `approach='Biaya sewa galeri setara'`, `unit='bulan'`, `unit_value=45000000`, `currency_code='IDR'`; Rp45 juta/bulan **fakta laporan**, sementara pengaitan ke satu outcome aplikasi adalah **pemetaan**. |
| `outcome_impact_years` | Satu baris input per outcome, `period_type`, dan tahun: kuantitas, indikator, proksi, empat penyesuaian dan alasannya. | Total 15 bulan pada laporan tidak cukup untuk mengisi `quantity` **2023** dan **2024** terpisah. Buat baris setelah pembagian periode serta persentase penyesuaian diverifikasi; `0` bukan pengganti data yang belum diketahui. |

## 10. SROI Calculation

Laporan PUSRI mempublikasikan **NPV benefit Rp1.907.135.112 ÷ NPV investment Rp490.006.016 ≈ 3,89**. Itu **hasil metode laporan eksternal**. Metode V1 pada `database-sroi.md` memakai investasi nominal sebagai penyebut; tingkat diskonto dan rincian tahunan laporan tidak lengkap untuk menghitung ulang angka ini persis. **Jangan menyimpan 3,89 sebagai hasil run V1 baru tanpa input tervalidasi.** [S1, hlm. 56]

| Tabel | Fungsi pada website | Contoh penggunaan |
| --- | --- | --- |
| `sroi_methods` | Mengidentifikasi kode dan versi rumus aplikasi untuk setiap run. | `code='standard_v1'`, `version='1.0'` ialah **rancangan perangkat lunak**, bukan metode yang diklaim digunakan PUSRI. |
| `sroi_runs` | Membekukan pilihan metode, tahun dasar, diskonto, PV, investasi, rasio, dan waktu perhitungan. | Jika data input RBS telah dikumpulkan sesuai metode aplikasi, buat `program_id=10`, `method_id=<versi v1>`, `base_year=2023`, `discount_rate_pct=<hasil kebijakan studi>`. **Belum ada contoh baris faktual** karena diskonto/input mentah tidak diketahui. Angka laporan 3,89 dicatat sebagai pembanding eksternal, bukan disisipkan ke run V1. |
| `sroi_run_outcome_years` | Snapshot kuantitas, proksi, penyesuaian, nama stakeholder/outcome, dan PV per tahun; hasil lama tidak berubah saat input diedit. | Setelah run internal `id=200`, akan ada baris `(run_id=200, outcome_id=<pemanfaatan galeri>, year=2024)` dengan hasil hitung yang **baru**; tidak memakai Rp675 juta agregat sebagai PV 2024. |
| `sroi_run_investment_years` | Snapshot rincian penyebut per investor/pos/tahun. | Setelah nominal 2023–2024 diverifikasi, salin pos `Pelatihan UMKM` dari `program_investment_years` ke run `id=200`; jangan menyalin total NPV Rp490.006.016 sebagai satu nominal transaksi. |
| `sroi_run_yearly_totals` | Agregasi PV outcome, investasi, dan rasio menurut tahun/jenis periode. | Baris `2023 evaluative` dan `2024 evaluative` dibuat dari run internal. Laporan sumber hanya memberikan **rasio keseluruhan 3,89**, bukan pembagian tahunan yang dapat diisikan ke tabel ini. |

## 11. SROI Report dan Audit

Setelah run sah, website dapat menghasilkan Full Report, Executive Summary, Kuantitatif, Kualitatif, serta ekspor Excel per tahap. Laporan PDF resmi yang dipakai sebagai sumber adalah **dokumen masukan** (`program_documents`), bukan hasil DOCX/XLSX aplikasi baru.

| Tabel | Fungsi pada website | Contoh penggunaan |
| --- | --- | --- |
| `report_exports` | Menyimpan permintaan ekspor, tipe, format, status, file privat, dan run sumber. | Sesudah run internal `id=200` lengkap, `report_type='full'`, `format='docx'`, `status='ready'`, `run_id=200`; baris **simulasi alur**, bukan berkas PUSRI yang telah dihasilkan aplikasi. |
| `audit_logs` | Jejak siapa mengubah program, menjalankan kalkulasi, atau mengekspor. | Ketika akun contoh `user_id=9001` menghitung ulang `program_id=10`, tulis `action='calculate'`, `entity_type='sroi_runs'`, `entity_id=200`; tidak menyimpan sandi/token dalam JSON audit. |

## Pemeriksaan Alur Sebelum Mengisi Data

1. Pastikan `organization_id` sama pada perusahaan, program, stakeholder, outcome, proxy, dan run; master wilayah bersifat global tetapi urutan provinsi–kota–kecamatan–desa harus cocok. ID contoh tidak boleh dicampur dengan tenant lain.
2. Pastikan pilihan stakeholder berasal dari `stakeholder_category_lists` dengan rumpun sama seperti program; outcome mengacu pada stakeholder program, bukan langsung pada daftar katalog. Kategori outcome juga memakai rumpun program yang sama.
3. Bedakan **realisasi** (26 peserta pelatihan), **target** (tidak tersedia), **nilai NPV laporan** (Rp490.006.016), **nominal tahunan** (belum diverifikasi), serta **hasil run V1** (belum dihitung).
4. Jangan membuat nilai penyesuaian `0%`, proksi tahunan, pembagian investasi, atau rasio tahunan hanya agar formulir terlihat lengkap. Dapatkan data primer, lalu hitung run baru yang bisa diaudit.

## Lampiran — Contoh dan Fungsi Setiap Kolom

Setiap kolom DBML dicatat satu per satu sesuai urutan menu. **FAKTA** bersumber dari laporan PUSRI [S1]; **PEMETAAN** ialah penempatan fakta dalam desain baru; **TEKNIS** ialah ID, pengaturan, atau metadata aplikasi yang tidak ada pada laporan. **BELUM TERSEDIA** berarti sumber tidak cukup untuk mengisi nilai nyata. `NULL` hanya contoh untuk kolom yang mengizinkan kosong. Kolom wajib yang belum terverifikasi **bukan baris siap-simpan**; minta data primer, jangan mengarang.

Laporan RBS menyebut Sumatera Selatan dan Palembang, tetapi tidak merinci kecamatan, desa/kelurahan, kode wilayah, alamat lokasi program, atau nama pengelolanya. Kode Kemendagri serta ID master harus dimuat dari referensi resmi; jangan menebak dari nama kota. `created_at`, `updated_at`, dan ID teknis dibuat aplikasi saat transaksi, bukan fakta laporan. NPV investasi/manfaat eksternal bukan otomatis input nominal/run V1.

### 1. Masuk dan Memilih Organisasi

#### `organizations`

| Kolom (tipe; kewajiban) | Fungsi dan contoh nilai pada kasus |
| --- | --- |
| `id` (bigint; wajib) | Primary key; ID lokal database, bukan nomor dalam laporan. **Contoh:** `ID teknis dibuat database` — TEKNIS. |
| `name` (varchar(200); wajib) | Nama entitas sesuai konteks tabel. **Contoh:** `PT Pupuk Sriwidjaja Palembang` — FAKTA laporan hlm. 6; tenant aplikasi hipotetis. |
| `slug` (varchar(100); wajib) | Slug tenant untuk URL; bukan nama resmi laporan. **Contoh:** `BELUM TERSEDIA dari laporan; wajib dihimpun sebelum simpan` — jangan isi nilai rekaan. |
| `status` (organization_status; wajib) | Status proses/keaktifan sesuai enum DBML. **Contoh:** `active (default DBML)` — TEKNIS; bukan hasil observasi laporan. |
| `timezone` (varchar(64); wajib) | Zona waktu tenant. **Contoh:** `Asia/Jakarta (default DBML)` — TEKNIS; bukan hasil observasi laporan. |
| `created_at` (timestamp; wajib) | Waktu pembuatan oleh aplikasi/database; tidak diterbitkan laporan. **Contoh:** `waktu transaksi dihasilkan aplikasi` — TEKNIS; bukan tanggal laporan. |
| `updated_at` (timestamp; wajib) | Waktu perubahan terakhir oleh aplikasi/database. **Contoh:** `waktu transaksi dihasilkan aplikasi` — TEKNIS; bukan tanggal laporan. |
| `deleted_at` (timestamp; opsional/NULL diizinkan) | Soft delete; NULL berarti belum dihapus. **Contoh:** `NULL bila belum terjadi` — TEKNIS; bukan fakta laporan. |

#### `users`

| Kolom (tipe; kewajiban) | Fungsi dan contoh nilai pada kasus |
| --- | --- |
| `id` (bigint; wajib) | Primary key; ID lokal database, bukan nomor dalam laporan. **Contoh:** `ID teknis dibuat database` — TEKNIS. |
| `full_name` (varchar(200); wajib) | Nama lengkap akun; bukan nama fiktif sebagai fakta kasus. **Contoh:** `Analis Program (akun simulasi)` — TEKNIS; bukan pegawai PUSRI yang teridentifikasi. |
| `email` (varchar(254); wajib) | Alamat email; hanya isi jika kontak sah dan terverifikasi. **Contoh:** `analis@contoh.invalid` — TEKNIS; domain invalid, bukan email PUSRI. |
| `password_hash` (varchar(255); opsional/NULL diizinkan) | Hash password; bukan password asli. **Contoh:** `hash hasil registrasi, bukan sandi asli` — TEKNIS; tidak diterbitkan. |
| `email_verified_at` (timestamp; opsional/NULL diizinkan) | Waktu verifikasi email. **Contoh:** `NULL bila belum terjadi` — TEKNIS; bukan fakta laporan. |
| `is_platform_admin` (boolean; wajib) | Hak admin platform. **Contoh:** `false` — TEKNIS; keputusan admin platform. |
| `status` (user_status; wajib) | Status proses/keaktifan sesuai enum DBML. **Contoh:** `active` — TEKNIS; status akun simulasi. |
| `last_login_at` (timestamp; opsional/NULL diizinkan) | Waktu login terakhir. **Contoh:** `NULL bila belum terjadi` — TEKNIS; bukan fakta laporan. |
| `created_at` (timestamp; wajib) | Waktu pembuatan oleh aplikasi/database; tidak diterbitkan laporan. **Contoh:** `waktu transaksi dihasilkan aplikasi` — TEKNIS; bukan tanggal laporan. |
| `updated_at` (timestamp; wajib) | Waktu perubahan terakhir oleh aplikasi/database. **Contoh:** `waktu transaksi dihasilkan aplikasi` — TEKNIS; bukan tanggal laporan. |
| `deleted_at` (timestamp; opsional/NULL diizinkan) | Soft delete; NULL berarti belum dihapus. **Contoh:** `NULL bila belum terjadi` — TEKNIS; bukan fakta laporan. |

#### `auth_identities`

| Kolom (tipe; kewajiban) | Fungsi dan contoh nilai pada kasus |
| --- | --- |
| `id` (bigint; wajib) | Primary key; ID lokal database, bukan nomor dalam laporan. **Contoh:** `ID teknis dibuat database` — TEKNIS. |
| `user_id` (bigint; wajib) | Relasi ke akun pengguna; bukan stakeholder laporan kecuali dipetakan. **Contoh:** `ID FK teknis dari baris terkait` — TEKNIS; bukan nomor pada laporan. |
| `provider` (varchar(40); wajib) | Penyedia autentikasi eksternal. **Contoh:** `google` — TEKNIS; hanya bila login Google diaktifkan. |
| `provider_subject` (varchar(255); wajib) | ID unik akun pada penyedia login eksternal; rahasia/PII. **Contoh:** `ID yang diberikan Google setelah login` — TEKNIS; jangan mengarang ID aktual. |
| `email_at_provider` (varchar(254); opsional/NULL diizinkan) | Email yang dikembalikan penyedia login. **Contoh:** `BELUM TERSEDIA / isi saat identitas sah tersedia` — bukan data publik laporan. |
| `last_login_at` (timestamp; opsional/NULL diizinkan) | Waktu login terakhir. **Contoh:** `NULL bila belum terjadi` — TEKNIS; bukan fakta laporan. |
| `created_at` (timestamp; wajib) | Waktu pembuatan oleh aplikasi/database; tidak diterbitkan laporan. **Contoh:** `waktu transaksi dihasilkan aplikasi` — TEKNIS; bukan tanggal laporan. |

#### `password_reset_tokens`

| Kolom (tipe; kewajiban) | Fungsi dan contoh nilai pada kasus |
| --- | --- |
| `id` (bigint; wajib) | Primary key; ID lokal database, bukan nomor dalam laporan. **Contoh:** `ID teknis dibuat database` — TEKNIS. |
| `user_id` (bigint; wajib) | Relasi ke akun pengguna; bukan stakeholder laporan kecuali dipetakan. **Contoh:** `ID FK teknis dari baris terkait` — TEKNIS; bukan nomor pada laporan. |
| `token_hash` (char(64); wajib) | Hash token reset; token mentah tidak boleh disimpan. **Contoh:** `SHA-256 token reset yang diterbitkan sistem` — TEKNIS; token mentah tidak disimpan. |
| `expires_at` (timestamp; wajib) | Batas kedaluwarsa token. **Contoh:** `waktu kedaluwarsa sesuai kebijakan aplikasi` — TEKNIS; bukan data laporan. |
| `used_at` (timestamp; opsional/NULL diizinkan) | Waktu token dipakai. **Contoh:** `NULL bila belum terjadi` — TEKNIS; bukan fakta laporan. |
| `created_at` (timestamp; wajib) | Waktu pembuatan oleh aplikasi/database; tidak diterbitkan laporan. **Contoh:** `waktu transaksi dihasilkan aplikasi` — TEKNIS; bukan tanggal laporan. |

#### `roles`

| Kolom (tipe; kewajiban) | Fungsi dan contoh nilai pada kasus |
| --- | --- |
| `id` (bigint; wajib) | Primary key; ID lokal database, bukan nomor dalam laporan. **Contoh:** `ID teknis dibuat database` — TEKNIS. |
| `organization_id` (bigint; wajib) | Tenant yang membatasi akses dan relasi data. **Contoh:** `1` — TEKNIS tenant contoh; bukan identitas akun PUSRI. |
| `code` (varchar(40); wajib) | Kode master wilayah atau katalog aplikasi menurut jenis tabel. **Contoh:** `editor` — TEKNIS; role contoh untuk analis. |
| `name` (varchar(100); wajib) | Nama entitas sesuai konteks tabel. **Contoh:** `Editor` — TEKNIS; label UI. |
| `is_system` (boolean; wajib) | Role bawaan sistem atau role custom. **Contoh:** `true` — TEKNIS; role bawaan aplikasi. |
| `created_at` (timestamp; wajib) | Waktu pembuatan oleh aplikasi/database; tidak diterbitkan laporan. **Contoh:** `waktu transaksi dihasilkan aplikasi` — TEKNIS; bukan tanggal laporan. |
| `updated_at` (timestamp; wajib) | Waktu perubahan terakhir oleh aplikasi/database. **Contoh:** `waktu transaksi dihasilkan aplikasi` — TEKNIS; bukan tanggal laporan. |

#### `organization_members`

| Kolom (tipe; kewajiban) | Fungsi dan contoh nilai pada kasus |
| --- | --- |
| `id` (bigint; wajib) | Primary key; ID lokal database, bukan nomor dalam laporan. **Contoh:** `ID teknis dibuat database` — TEKNIS. |
| `organization_id` (bigint; wajib) | Tenant yang membatasi akses dan relasi data. **Contoh:** `1` — TEKNIS tenant contoh; bukan identitas akun PUSRI. |
| `user_id` (bigint; wajib) | Relasi ke akun pengguna; bukan stakeholder laporan kecuali dipetakan. **Contoh:** `ID FK teknis dari baris terkait` — TEKNIS; bukan nomor pada laporan. |
| `role_id` (bigint; wajib) | Relasi ke role anggota tenant. **Contoh:** `ID FK teknis dari baris terkait` — TEKNIS; bukan nomor pada laporan. |
| `status` (member_status; wajib) | Status proses/keaktifan sesuai enum DBML. **Contoh:** `active` — TEKNIS; hanya setelah undangan diterima. |
| `joined_at` (timestamp; opsional/NULL diizinkan) | Waktu anggota bergabung. **Contoh:** `waktu penerimaan undangan` — TEKNIS; bukan waktu program. |
| `created_at` (timestamp; wajib) | Waktu pembuatan oleh aplikasi/database; tidak diterbitkan laporan. **Contoh:** `waktu transaksi dihasilkan aplikasi` — TEKNIS; bukan tanggal laporan. |
| `updated_at` (timestamp; wajib) | Waktu perubahan terakhir oleh aplikasi/database. **Contoh:** `waktu transaksi dihasilkan aplikasi` — TEKNIS; bukan tanggal laporan. |


### 2. Katalog, Wilayah, dan Perusahaan

#### `catalog_templates`

| Kolom (tipe; kewajiban) | Fungsi dan contoh nilai pada kasus |
| --- | --- |
| `id` (bigint; wajib) | Primary key; ID lokal database, bukan nomor dalam laporan. **Contoh:** `ID teknis dibuat database` — TEKNIS. |
| `kind` (catalog_kind; wajib) | Jenis template katalog. **Contoh:** `program_category` — TEKNIS; jenis katalog pusat. |
| `code` (varchar(40); wajib) | Kode master wilayah atau katalog aplikasi menurut jenis tabel. **Contoh:** `PE` — PEMETAAN katalog aplikasi. |
| `name` (varchar(200); wajib) | Nama entitas sesuai konteks tabel. **Contoh:** `Pemberdayaan Ekonomi` — PEMETAAN kategori dari kegiatan UMKM. |
| `parent_template_id` (bigint; opsional/NULL diizinkan) | Relasi ke template induk. **Contoh:** `ID FK teknis dari baris terkait` — TEKNIS; bukan nomor pada laporan. |
| `active` (boolean; wajib) | Penanda apakah opsi katalog/metode tersedia. **Contoh:** `true` — TEKNIS; template diterbitkan admin platform. |
| `created_at` (timestamp; wajib) | Waktu pembuatan oleh aplikasi/database; tidak diterbitkan laporan. **Contoh:** `waktu transaksi dihasilkan aplikasi` — TEKNIS; bukan tanggal laporan. |
| `updated_at` (timestamp; wajib) | Waktu perubahan terakhir oleh aplikasi/database. **Contoh:** `waktu transaksi dihasilkan aplikasi` — TEKNIS; bukan tanggal laporan. |

#### `sectors`

| Kolom (tipe; kewajiban) | Fungsi dan contoh nilai pada kasus |
| --- | --- |
| `id` (bigint; wajib) | Primary key; ID lokal database, bukan nomor dalam laporan. **Contoh:** `ID teknis dibuat database` — TEKNIS. |
| `organization_id` (bigint; wajib) | Tenant yang membatasi akses dan relasi data. **Contoh:** `1` — TEKNIS tenant contoh; bukan identitas akun PUSRI. |
| `code` (varchar(40); wajib) | Kode master wilayah atau katalog aplikasi menurut jenis tabel. **Contoh:** `PUPUK` — PEMETAAN; kode aplikasi. |
| `name` (varchar(200); wajib) | Nama entitas sesuai konteks tabel. **Contoh:** `Industri pupuk` — PEMETAAN dari profil perusahaan hlm. 6. |
| `source_template_id` (bigint; opsional/NULL diizinkan) | Relasi ke template katalog pusat. **Contoh:** `ID FK teknis dari baris terkait` — TEKNIS; bukan nomor pada laporan. |
| `active` (boolean; wajib) | Penanda apakah opsi katalog/metode tersedia. **Contoh:** `true` — TEKNIS; katalog tenant. |
| `created_at` (timestamp; wajib) | Waktu pembuatan oleh aplikasi/database; tidak diterbitkan laporan. **Contoh:** `waktu transaksi dihasilkan aplikasi` — TEKNIS; bukan tanggal laporan. |
| `updated_at` (timestamp; wajib) | Waktu perubahan terakhir oleh aplikasi/database. **Contoh:** `waktu transaksi dihasilkan aplikasi` — TEKNIS; bukan tanggal laporan. |

#### `provinces`

| Kolom (tipe; kewajiban) | Fungsi dan contoh nilai pada kasus |
| --- | --- |
| `id` (bigint; wajib) | Primary key; ID lokal database, bukan nomor dalam laporan. **Contoh:** `ID teknis dibuat database` — TEKNIS. |
| `code` (varchar(20); wajib) | Kode master wilayah atau katalog aplikasi menurut jenis tabel. **Contoh:** `BELUM DIISI` — ambil kode Kemendagri dari master resmi; jangan tebak. |
| `name` (varchar(150); wajib) | Nama entitas sesuai konteks tabel. **Contoh:** `Sumatera Selatan` — FAKTA laporan hlm. 6. |
| `active` (boolean; wajib) | Penanda apakah opsi katalog/metode tersedia. **Contoh:** `true` — TEKNIS; pilihan katalog yang tersedia. |
| `created_at` (timestamp; wajib) | Waktu pembuatan oleh aplikasi/database; tidak diterbitkan laporan. **Contoh:** `waktu transaksi dihasilkan aplikasi` — TEKNIS; bukan tanggal laporan. |
| `updated_at` (timestamp; wajib) | Waktu perubahan terakhir oleh aplikasi/database. **Contoh:** `waktu transaksi dihasilkan aplikasi` — TEKNIS; bukan tanggal laporan. |

#### `cities`

| Kolom (tipe; kewajiban) | Fungsi dan contoh nilai pada kasus |
| --- | --- |
| `id` (bigint; wajib) | Primary key; ID lokal database, bukan nomor dalam laporan. **Contoh:** `ID teknis dibuat database` — TEKNIS. |
| `province_id` (bigint; wajib) | FK master provinsi; harus cocok dengan kota terkait. **Contoh:** `ID master Sumatera Selatan` — TEKNIS setelah pemuatan master wilayah. |
| `code` (varchar(20); wajib) | Kode master wilayah atau katalog aplikasi menurut jenis tabel. **Contoh:** `BELUM DIISI` — ambil kode Kemendagri resmi. |
| `name` (varchar(150); wajib) | Nama entitas sesuai konteks tabel. **Contoh:** `Palembang` — FAKTA laporan hlm. 6, 53. |
| `active` (boolean; wajib) | Penanda apakah opsi katalog/metode tersedia. **Contoh:** `true` — TEKNIS; pilihan katalog yang tersedia. |
| `created_at` (timestamp; wajib) | Waktu pembuatan oleh aplikasi/database; tidak diterbitkan laporan. **Contoh:** `waktu transaksi dihasilkan aplikasi` — TEKNIS; bukan tanggal laporan. |
| `updated_at` (timestamp; wajib) | Waktu perubahan terakhir oleh aplikasi/database. **Contoh:** `waktu transaksi dihasilkan aplikasi` — TEKNIS; bukan tanggal laporan. |

#### `districts`

| Kolom (tipe; kewajiban) | Fungsi dan contoh nilai pada kasus |
| --- | --- |
| `id` (bigint; wajib) | Primary key; ID lokal database, bukan nomor dalam laporan. **Contoh:** `ID teknis dibuat database` — TEKNIS. |
| `city_id` (bigint; wajib) | FK master kota/kabupaten; harus berada di provinsi terkait. **Contoh:** `ID master Palembang` — TEKNIS setelah pemuatan master wilayah. |
| `code` (varchar(20); wajib) | Kode master wilayah atau katalog aplikasi menurut jenis tabel. **Contoh:** `BELUM TERSEDIA` — kecamatan lokasi RBS tidak tercantum dalam laporan. |
| `name` (varchar(150); wajib) | Nama entitas sesuai konteks tabel. **Contoh:** `BELUM TERSEDIA` — kecamatan lokasi RBS perlu diverifikasi. |
| `active` (boolean; wajib) | Penanda apakah opsi katalog/metode tersedia. **Contoh:** `true` — TEKNIS; pilihan katalog yang tersedia. |
| `created_at` (timestamp; wajib) | Waktu pembuatan oleh aplikasi/database; tidak diterbitkan laporan. **Contoh:** `waktu transaksi dihasilkan aplikasi` — TEKNIS; bukan tanggal laporan. |
| `updated_at` (timestamp; wajib) | Waktu perubahan terakhir oleh aplikasi/database. **Contoh:** `waktu transaksi dihasilkan aplikasi` — TEKNIS; bukan tanggal laporan. |

#### `sub_districts`

| Kolom (tipe; kewajiban) | Fungsi dan contoh nilai pada kasus |
| --- | --- |
| `id` (bigint; wajib) | Primary key; ID lokal database, bukan nomor dalam laporan. **Contoh:** `ID teknis dibuat database` — TEKNIS. |
| `district_id` (bigint; wajib) | FK master kecamatan; harus berada di kota terkait. **Contoh:** `ID master kecamatan terverifikasi` — TEKNIS setelah kecamatan diketahui. |
| `code` (varchar(20); wajib) | Kode master wilayah atau katalog aplikasi menurut jenis tabel. **Contoh:** `BELUM TERSEDIA` — kode desa/kelurahan lokasi RBS tidak tercantum. |
| `name` (varchar(150); wajib) | Nama entitas sesuai konteks tabel. **Contoh:** `BELUM TERSEDIA` — desa/kelurahan lokasi RBS perlu diverifikasi. |
| `active` (boolean; wajib) | Penanda apakah opsi katalog/metode tersedia. **Contoh:** `true` — TEKNIS; pilihan katalog yang tersedia. |
| `created_at` (timestamp; wajib) | Waktu pembuatan oleh aplikasi/database; tidak diterbitkan laporan. **Contoh:** `waktu transaksi dihasilkan aplikasi` — TEKNIS; bukan tanggal laporan. |
| `updated_at` (timestamp; wajib) | Waktu perubahan terakhir oleh aplikasi/database. **Contoh:** `waktu transaksi dihasilkan aplikasi` — TEKNIS; bukan tanggal laporan. |

#### `locations`

| Kolom (tipe; kewajiban) | Fungsi dan contoh nilai pada kasus |
| --- | --- |
| `id` (bigint; wajib) | Primary key; ID lokal database, bukan nomor dalam laporan. **Contoh:** `ID teknis dibuat database` — TEKNIS. |
| `organization_id` (bigint; wajib) | Tenant yang membatasi akses dan relasi data. **Contoh:** `1` — TEKNIS tenant contoh; bukan identitas akun PUSRI. |
| `country_code` (char(2); wajib) | Kode negara ISO dua huruf. **Contoh:** `ID` — PEMETAAN kode ISO. |
| `province_id` (bigint; opsional/NULL diizinkan) | FK master provinsi; harus cocok dengan kota terkait. **Contoh:** `ID master Sumatera Selatan` — TEKNIS; nama provinsi terdapat pada laporan. |
| `city_id` (bigint; opsional/NULL diizinkan) | FK master kota/kabupaten; harus berada di provinsi terkait. **Contoh:** `ID master Palembang` — TEKNIS; nama kota terdapat pada laporan. |
| `district_id` (bigint; opsional/NULL diizinkan) | FK master kecamatan; harus berada di kota terkait. **Contoh:** `NULL` — kecamatan kantor pusat belum diverifikasi. |
| `sub_district_id` (bigint; opsional/NULL diizinkan) | FK master desa/kelurahan; harus berada di kecamatan terkait. **Contoh:** `NULL` — desa/kelurahan kantor pusat belum diverifikasi. |
| `address` (varchar(255); opsional/NULL diizinkan) | Nilai address. **Contoh:** `NULL bila memang tidak diketahui` — kolom opsional; bukan bukti ketiadaan. |
| `postal_code` (varchar(10); opsional/NULL diizinkan) | Kode pos lokasi. **Contoh:** `NULL` — kode pos kantor pusat tidak disebut laporan. |
| `latitude` (decimal(10,7); opsional/NULL diizinkan) | Nilai latitude. **Contoh:** `NULL bila memang tidak diketahui` — kolom opsional; bukan bukti ketiadaan. |
| `longitude` (decimal(10,7); opsional/NULL diizinkan) | Nilai longitude. **Contoh:** `NULL bila memang tidak diketahui` — kolom opsional; bukan bukti ketiadaan. |
| `created_at` (timestamp; wajib) | Waktu pembuatan oleh aplikasi/database; tidak diterbitkan laporan. **Contoh:** `waktu transaksi dihasilkan aplikasi` — TEKNIS; bukan tanggal laporan. |
| `updated_at` (timestamp; wajib) | Waktu perubahan terakhir oleh aplikasi/database. **Contoh:** `waktu transaksi dihasilkan aplikasi` — TEKNIS; bukan tanggal laporan. |

#### `companies`

| Kolom (tipe; kewajiban) | Fungsi dan contoh nilai pada kasus |
| --- | --- |
| `id` (bigint; wajib) | Primary key; ID lokal database, bukan nomor dalam laporan. **Contoh:** `ID teknis dibuat database` — TEKNIS. |
| `organization_id` (bigint; wajib) | Tenant yang membatasi akses dan relasi data. **Contoh:** `1` — TEKNIS tenant contoh; bukan identitas akun PUSRI. |
| `sector_id` (bigint; opsional/NULL diizinkan) | Relasi ke sektor perusahaan. **Contoh:** `ID FK teknis dari baris terkait` — TEKNIS; bukan nomor pada laporan. |
| `headquarters_location_id` (bigint; opsional/NULL diizinkan) | Relasi ke lokasi kantor pusat perusahaan. **Contoh:** `ID FK teknis dari baris terkait` — TEKNIS; bukan nomor pada laporan. |
| `name` (varchar(200); wajib) | Nama entitas sesuai konteks tabel. **Contoh:** `PT Pupuk Sriwidjaja Palembang` — FAKTA laporan hlm. 6. |
| `created_at` (timestamp; wajib) | Waktu pembuatan oleh aplikasi/database; tidak diterbitkan laporan. **Contoh:** `waktu transaksi dihasilkan aplikasi` — TEKNIS; bukan tanggal laporan. |
| `updated_at` (timestamp; wajib) | Waktu perubahan terakhir oleh aplikasi/database. **Contoh:** `waktu transaksi dihasilkan aplikasi` — TEKNIS; bukan tanggal laporan. |
| `deleted_at` (timestamp; opsional/NULL diizinkan) | Soft delete; NULL berarti belum dihapus. **Contoh:** `NULL bila belum terjadi` — TEKNIS; bukan fakta laporan. |

#### `company_members`

| Kolom (tipe; kewajiban) | Fungsi dan contoh nilai pada kasus |
| --- | --- |
| `id` (bigint; wajib) | Primary key; ID lokal database, bukan nomor dalam laporan. **Contoh:** `ID teknis dibuat database` — TEKNIS. |
| `organization_id` (bigint; wajib) | Tenant yang membatasi akses dan relasi data. **Contoh:** `1` — TEKNIS tenant contoh; bukan identitas akun PUSRI. |
| `company_id` (bigint; wajib) | Relasi ke perusahaan program. **Contoh:** `ID FK teknis dari baris terkait` — TEKNIS; bukan nomor pada laporan. |
| `user_id` (bigint; opsional/NULL diizinkan) | Relasi ke akun pengguna; bukan stakeholder laporan kecuali dipetakan. **Contoh:** `ID FK teknis dari baris terkait` — TEKNIS; bukan nomor pada laporan. |
| `name` (varchar(200); wajib) | Nama entitas sesuai konteks tabel. **Contoh:** `BELUM TERSEDIA nama kontak yang disetujui` — Laporan bukan daftar user aplikasi. |
| `email` (varchar(254); opsional/NULL diizinkan) | Alamat email; hanya isi jika kontak sah dan terverifikasi. **Contoh:** `NULL hingga kontak memberikan email sah` — Jangan ambil akun pihak lain. |
| `position` (varchar(150); opsional/NULL diizinkan) | Nilai position. **Contoh:** `NULL hingga diverifikasi` — Tidak tersedia pada laporan. |
| `created_at` (timestamp; wajib) | Waktu pembuatan oleh aplikasi/database; tidak diterbitkan laporan. **Contoh:** `waktu transaksi dihasilkan aplikasi` — TEKNIS; bukan tanggal laporan. |
| `updated_at` (timestamp; wajib) | Waktu perubahan terakhir oleh aplikasi/database. **Contoh:** `waktu transaksi dihasilkan aplikasi` — TEKNIS; bukan tanggal laporan. |

#### `program_categories`

| Kolom (tipe; kewajiban) | Fungsi dan contoh nilai pada kasus |
| --- | --- |
| `id` (bigint; wajib) | Primary key; ID lokal database, bukan nomor dalam laporan. **Contoh:** `ID teknis dibuat database` — TEKNIS. |
| `organization_id` (bigint; wajib) | Tenant yang membatasi akses dan relasi data. **Contoh:** `1` — TEKNIS tenant contoh; bukan identitas akun PUSRI. |
| `code` (varchar(40); wajib) | Kode master wilayah atau katalog aplikasi menurut jenis tabel. **Contoh:** `PE` — PEMETAAN; kode lokal aplikasi. |
| `name` (varchar(200); wajib) | Nama entitas sesuai konteks tabel. **Contoh:** `Pemberdayaan Ekonomi` — PEMETAAN. |
| `source_template_id` (bigint; opsional/NULL diizinkan) | Relasi ke template katalog pusat. **Contoh:** `ID FK teknis dari baris terkait` — TEKNIS; bukan nomor pada laporan. |
| `active` (boolean; wajib) | Penanda apakah opsi katalog/metode tersedia. **Contoh:** `true` — TEKNIS; pilihan katalog yang tersedia. |
| `created_at` (timestamp; wajib) | Waktu pembuatan oleh aplikasi/database; tidak diterbitkan laporan. **Contoh:** `waktu transaksi dihasilkan aplikasi` — TEKNIS; bukan tanggal laporan. |
| `updated_at` (timestamp; wajib) | Waktu perubahan terakhir oleh aplikasi/database. **Contoh:** `waktu transaksi dihasilkan aplikasi` — TEKNIS; bukan tanggal laporan. |

#### `stakeholder_categories`

| Kolom (tipe; kewajiban) | Fungsi dan contoh nilai pada kasus |
| --- | --- |
| `id` (bigint; wajib) | Primary key; ID lokal database, bukan nomor dalam laporan. **Contoh:** `ID teknis dibuat database` — TEKNIS. |
| `organization_id` (bigint; wajib) | Tenant yang membatasi akses dan relasi data. **Contoh:** `1` — TEKNIS tenant contoh; bukan identitas akun PUSRI. |
| `program_category_id` (bigint; wajib) | FK rumpun yang harus sama dengan kategori program. **Contoh:** `ID FK teknis dari baris terkait` — TEKNIS; bukan nomor pada laporan. |
| `code` (varchar(40); wajib) | Kode master wilayah atau katalog aplikasi menurut jenis tabel. **Contoh:** `PELAKSANA` — PEMETAAN kode kategori induk. |
| `name` (varchar(200); wajib) | Nama entitas sesuai konteks tabel. **Contoh:** `Pelaksana program` — PEMETAAN kategori payung dari peran RBS. |
| `source_template_id` (bigint; opsional/NULL diizinkan) | Relasi ke template katalog pusat. **Contoh:** `ID FK teknis dari baris terkait` — TEKNIS; bukan nomor pada laporan. |
| `active` (boolean; wajib) | Penanda apakah opsi katalog/metode tersedia. **Contoh:** `true` — TEKNIS; pilihan katalog yang tersedia. |
| `created_at` (timestamp; wajib) | Waktu pembuatan oleh aplikasi/database; tidak diterbitkan laporan. **Contoh:** `waktu transaksi dihasilkan aplikasi` — TEKNIS; bukan tanggal laporan. |
| `updated_at` (timestamp; wajib) | Waktu perubahan terakhir oleh aplikasi/database. **Contoh:** `waktu transaksi dihasilkan aplikasi` — TEKNIS; bukan tanggal laporan. |

#### `stakeholder_category_lists`

| Kolom (tipe; kewajiban) | Fungsi dan contoh nilai pada kasus |
| --- | --- |
| `id` (bigint; wajib) | Primary key; ID lokal database, bukan nomor dalam laporan. **Contoh:** `ID teknis dibuat database` — TEKNIS. |
| `organization_id` (bigint; wajib) | Tenant yang membatasi akses dan relasi data. **Contoh:** `1` — TEKNIS tenant contoh. |
| `program_category_id` (bigint; wajib) | FK rumpun yang harus sama dengan kategori program. **Contoh:** `30` — TEKNIS rumpun Pemberdayaan Ekonomi. |
| `stakeholder_category_id` (bigint; wajib) | FK ke stakeholder category. **Contoh:** `40` — TEKNIS kategori Pelaksana program. |
| `code` (varchar(40); wajib) | Kode master wilayah atau katalog aplikasi menurut jenis tabel. **Contoh:** `RBS` — PEMETAAN kode katalog lokal. |
| `name` (varchar(200); wajib) | Nama entitas sesuai konteks tabel. **Contoh:** `Rumah BUMN Sumsel` — FAKTA stakeholder pelaksana hlm. 53. |
| `source_template_id` (bigint; opsional/NULL diizinkan) | Relasi ke template katalog pusat. **Contoh:** `NULL` — item katalog lokal; tidak diklaim berasal dari template platform. |
| `active` (boolean; wajib) | Penanda apakah opsi katalog/metode tersedia. **Contoh:** `true` — TEKNIS opsi tersedia untuk program. |
| `created_at` (timestamp; wajib) | Waktu pembuatan oleh aplikasi/database; tidak diterbitkan laporan. **Contoh:** `waktu transaksi dihasilkan aplikasi` — TEKNIS; bukan tanggal laporan. |
| `updated_at` (timestamp; wajib) | Waktu perubahan terakhir oleh aplikasi/database. **Contoh:** `waktu transaksi dihasilkan aplikasi` — TEKNIS; bukan tanggal laporan. |

#### `outcome_categories`

| Kolom (tipe; kewajiban) | Fungsi dan contoh nilai pada kasus |
| --- | --- |
| `id` (bigint; wajib) | Primary key; ID lokal database, bukan nomor dalam laporan. **Contoh:** `ID teknis dibuat database` — TEKNIS. |
| `organization_id` (bigint; wajib) | Tenant yang membatasi akses dan relasi data. **Contoh:** `1` — TEKNIS tenant contoh; bukan identitas akun PUSRI. |
| `program_category_id` (bigint; wajib) | FK rumpun yang harus sama dengan kategori program. **Contoh:** `ID FK teknis dari baris terkait` — TEKNIS; bukan nomor pada laporan. |
| `code` (varchar(40); wajib) | Kode master wilayah atau katalog aplikasi menurut jenis tabel. **Contoh:** `ASET` — PEMETAAN kode kategori outcome. |
| `name` (varchar(200); wajib) | Nama entitas sesuai konteks tabel. **Contoh:** `Manfaat aset` — PEMETAAN outcome nilai sewa aset RBS. |
| `source_template_id` (bigint; opsional/NULL diizinkan) | Relasi ke template katalog pusat. **Contoh:** `ID FK teknis dari baris terkait` — TEKNIS; bukan nomor pada laporan. |
| `active` (boolean; wajib) | Penanda apakah opsi katalog/metode tersedia. **Contoh:** `true` — TEKNIS; pilihan katalog yang tersedia. |
| `created_at` (timestamp; wajib) | Waktu pembuatan oleh aplikasi/database; tidak diterbitkan laporan. **Contoh:** `waktu transaksi dihasilkan aplikasi` — TEKNIS; bukan tanggal laporan. |
| `updated_at` (timestamp; wajib) | Waktu perubahan terakhir oleh aplikasi/database. **Contoh:** `waktu transaksi dihasilkan aplikasi` — TEKNIS; bukan tanggal laporan. |


### 3. Program List dan General Description

#### `programs`

| Kolom (tipe; kewajiban) | Fungsi dan contoh nilai pada kasus |
| --- | --- |
| `id` (bigint; wajib) | Primary key; ID lokal database, bukan nomor dalam laporan. **Contoh:** `ID teknis dibuat database` — TEKNIS. |
| `organization_id` (bigint; wajib) | Tenant yang membatasi akses dan relasi data. **Contoh:** `1` — TEKNIS tenant contoh; bukan identitas akun PUSRI. |
| `public_number` (bigint; opsional/NULL diizinkan) | Nomor program yang ditampilkan ke pengguna. **Contoh:** `NULL bila memang tidak diketahui` — kolom opsional; bukan bukti ketiadaan. |
| `company_id` (bigint; wajib) | Relasi ke perusahaan program. **Contoh:** `ID FK teknis dari baris terkait` — TEKNIS; bukan nomor pada laporan. |
| `category_id` (bigint; wajib) | Relasi ke kategori program. **Contoh:** `ID FK teknis dari baris terkait` — TEKNIS; bukan nomor pada laporan. |
| `name` (varchar(255); wajib) | Nama entitas sesuai konteks tabel. **Contoh:** `Rumah BUMN Sumsel` — FAKTA laporan. |
| `pillar_name` (varchar(200); wajib) | Pilar teks bebas program. **Contoh:** `Pemberdayaan UMKM` — PEMETAAN. |
| `initiator_owner_name` (varchar(200); wajib) | Nama pihak penginisiasi/pemilik program. **Contoh:** `PT Pupuk Sriwidjaja Palembang` — FAKTA laporan. |
| `start_year` (smallint; wajib) | Tahun mulai program. **Contoh:** `2023` — PEMETAAN batas periode November 2023. |
| `end_year` (smallint; wajib) | Tahun akhir program. **Contoh:** `2024` — PEMETAAN batas periode November 2024. |
| `description` (text; wajib) | Uraian entitas/kegiatan sesuai konteks kolom. **Contoh:** `Program pembinaan dan pengembangan UMKM di Sumatera Selatan melalui Rumah BUMN Sumsel.` — RINGKASAN fakta laporan hlm. 53, 145. |
| `boundary_text` (text; opsional/NULL diizinkan) | Batas analisis program. **Contoh:** `Kegiatan Rumah BUMN Sumsel yang dievaluasi November 2023–November 2024.` — PEMETAAN ruang lingkup laporan. |
| `status` (program_status; wajib) | Status proses/keaktifan sesuai enum DBML. **Contoh:** `draft (default DBML)` — TEKNIS; bukan hasil observasi laporan. |
| `created_by` (bigint; wajib) | User pembuat; akun internal tidak dipublikasikan. **Contoh:** `ID FK teknis dari baris terkait` — TEKNIS; bukan nomor pada laporan. |
| `created_at` (timestamp; wajib) | Waktu pembuatan oleh aplikasi/database; tidak diterbitkan laporan. **Contoh:** `waktu transaksi dihasilkan aplikasi` — TEKNIS; bukan tanggal laporan. |
| `updated_at` (timestamp; wajib) | Waktu perubahan terakhir oleh aplikasi/database. **Contoh:** `waktu transaksi dihasilkan aplikasi` — TEKNIS; bukan tanggal laporan. |
| `deleted_at` (timestamp; opsional/NULL diizinkan) | Soft delete; NULL berarti belum dihapus. **Contoh:** `NULL bila belum terjadi` — TEKNIS; bukan fakta laporan. |

#### `program_locations`

| Kolom (tipe; kewajiban) | Fungsi dan contoh nilai pada kasus |
| --- | --- |
| `id` (bigint; wajib) | Primary key; ID lokal database, bukan nomor dalam laporan. **Contoh:** `ID teknis dibuat database` — TEKNIS. |
| `organization_id` (bigint; wajib) | Tenant yang membatasi akses dan relasi data. **Contoh:** `1` — TEKNIS tenant contoh; bukan identitas akun PUSRI. |
| `program_id` (bigint; wajib) | Relasi ke program pada tenant yang sama. **Contoh:** `ID FK teknis dari baris terkait` — TEKNIS; bukan nomor pada laporan. |
| `province_id` (bigint; wajib) | FK master provinsi; harus cocok dengan kota terkait. **Contoh:** `ID master Sumatera Selatan` — TEKNIS; perlu master wilayah resmi. |
| `city_id` (bigint; wajib) | FK master kota/kabupaten; harus berada di provinsi terkait. **Contoh:** `ID master Palembang` — TEKNIS; perlu master wilayah resmi. |
| `district_id` (bigint; wajib) | FK master kecamatan; harus berada di kota terkait. **Contoh:** `BELUM TERSEDIA` — laporan belum menyebut kecamatan; wajib sebelum simpan. |
| `sub_district_id` (bigint; wajib) | FK master desa/kelurahan; harus berada di kecamatan terkait. **Contoh:** `BELUM TERSEDIA` — laporan belum menyebut desa/kelurahan; wajib sebelum simpan. |
| `location_name` (varchar(200); wajib) | Nama tempat penyelenggaraan program. **Contoh:** `Rumah BUMN Sumsel` — PEMETAAN nama site dari program. |
| `manager_name` (varchar(200); wajib) | Nama pengelola fisik lokasi; bukan akun login. **Contoh:** `BELUM TERSEDIA` — nama pengelola lokasi tidak dipublikasikan; wajib sebelum simpan. |
| `address` (varchar(255); wajib) | Nilai address. **Contoh:** `BELUM TERSEDIA` — alamat jalan lokasi belum terverifikasi; wajib sebelum simpan. |
| `postal_code` (varchar(10); opsional/NULL diizinkan) | Kode pos lokasi. **Contoh:** `NULL` — kode pos tidak dinyatakan. |
| `latitude` (decimal(10,7); opsional/NULL diizinkan) | Nilai latitude. **Contoh:** `NULL` — koordinat belum diverifikasi. |
| `longitude` (decimal(10,7); opsional/NULL diizinkan) | Nilai longitude. **Contoh:** `NULL` — koordinat belum diverifikasi. |
| `sort_order` (int; wajib) | Urutan tampil, bukan peringkat faktual. **Contoh:** `0` — TEKNIS urutan tampilan lokasi. |
| `created_at` (timestamp; wajib) | Waktu pembuatan oleh aplikasi/database; tidak diterbitkan laporan. **Contoh:** `waktu transaksi dihasilkan aplikasi` — TEKNIS; bukan tanggal laporan. |
| `updated_at` (timestamp; wajib) | Waktu perubahan terakhir oleh aplikasi/database. **Contoh:** `waktu transaksi dihasilkan aplikasi` — TEKNIS; bukan tanggal laporan. |

#### `program_members`

| Kolom (tipe; kewajiban) | Fungsi dan contoh nilai pada kasus |
| --- | --- |
| `id` (bigint; wajib) | Primary key; ID lokal database, bukan nomor dalam laporan. **Contoh:** `ID teknis dibuat database` — TEKNIS. |
| `organization_id` (bigint; wajib) | Tenant yang membatasi akses dan relasi data. **Contoh:** `1` — TEKNIS tenant contoh; bukan identitas akun PUSRI. |
| `program_id` (bigint; wajib) | Relasi ke program pada tenant yang sama. **Contoh:** `ID FK teknis dari baris terkait` — TEKNIS; bukan nomor pada laporan. |
| `member_id` (bigint; wajib) | Relasi ke anggota organisasi yang ditugaskan. **Contoh:** `ID FK teknis dari baris terkait` — TEKNIS; bukan nomor pada laporan. |
| `participation` (participation_type; wajib) | Peran anggota pada program. **Contoh:** `collaborator` — TEKNIS; baru disimpan sesudah anggota diundang. |
| `created_at` (timestamp; wajib) | Waktu pembuatan oleh aplikasi/database; tidak diterbitkan laporan. **Contoh:** `waktu transaksi dihasilkan aplikasi` — TEKNIS; bukan tanggal laporan. |
| `updated_at` (timestamp; wajib) | Waktu perubahan terakhir oleh aplikasi/database. **Contoh:** `waktu transaksi dihasilkan aplikasi` — TEKNIS; bukan tanggal laporan. |

#### `program_documents`

| Kolom (tipe; kewajiban) | Fungsi dan contoh nilai pada kasus |
| --- | --- |
| `id` (bigint; wajib) | Primary key; ID lokal database, bukan nomor dalam laporan. **Contoh:** `ID teknis dibuat database` — TEKNIS. |
| `organization_id` (bigint; wajib) | Tenant yang membatasi akses dan relasi data. **Contoh:** `1` — TEKNIS tenant contoh; bukan identitas akun PUSRI. |
| `program_id` (bigint; wajib) | Relasi ke program pada tenant yang sama. **Contoh:** `ID FK teknis dari baris terkait` — TEKNIS; bukan nomor pada laporan. |
| `stage` (varchar(40); wajib) | Tahap program/laporan tempat berkas dilampirkan. **Contoh:** `source` — TEKNIS; label tahap lampiran input. |
| `file_name` (varchar(255); wajib) | Nama file yang diunggah. **Contoh:** `sroi_program_rbs.pdf` — FAKTA nama berkas primer yang diunduh. |
| `object_key` (varchar(500); wajib) | Key objek privat di penyimpanan aplikasi. **Contoh:** `BELUM ADA sampai file diunggah secara privat` — TEKNIS; tidak boleh mengarang key. |
| `mime_type` (varchar(100); wajib) | Tipe MIME berkas. **Contoh:** `application/pdf` — FAKTA format berkas primer. |
| `size_bytes` (bigint; wajib) | Ukuran berkas dalam byte. **Contoh:** `3355488` — FAKTA byte file yang diunduh pada 24 September 2026; ukur ulang saat upload. |
| `sha256` (char(64); wajib) | Checksum SHA-256 berkas sumber setelah upload. **Contoh:** `c61f97560d2eea6315718eda60be7e085b241424187108548fc11bfb3ff9b561` — FAKTA checksum unduhan saat verifikasi; ukur ulang saat upload. |
| `uploaded_by` (bigint; wajib) | User pengunggah; akun internal tidak dipublikasikan. **Contoh:** `ID FK teknis dari baris terkait` — TEKNIS; bukan nomor pada laporan. |
| `created_at` (timestamp; wajib) | Waktu pembuatan oleh aplikasi/database; tidak diterbitkan laporan. **Contoh:** `waktu transaksi dihasilkan aplikasi` — TEKNIS; bukan tanggal laporan. |
| `updated_at` (timestamp; wajib) | Waktu perubahan terakhir oleh aplikasi/database. **Contoh:** `waktu transaksi dihasilkan aplikasi` — TEKNIS; bukan tanggal laporan. |


### 4. Theory of Change

#### `theory_of_change_conditions`

| Kolom (tipe; kewajiban) | Fungsi dan contoh nilai pada kasus |
| --- | --- |
| `id` (bigint; wajib) | Primary key; ID lokal database, bukan nomor dalam laporan. **Contoh:** `ID teknis dibuat database` — TEKNIS. |
| `organization_id` (bigint; wajib) | Tenant yang membatasi akses dan relasi data. **Contoh:** `1` — TEKNIS tenant contoh; bukan identitas akun PUSRI. |
| `program_id` (bigint; wajib) | Relasi ke program pada tenant yang sama. **Contoh:** `ID FK teknis dari baris terkait` — TEKNIS; bukan nomor pada laporan. |
| `sort_order` (int; wajib) | Urutan tampil, bukan peringkat faktual. **Contoh:** `0` — TEKNIS; urutan tampilan. |
| `initial_condition` (text; wajib) | Kondisi sebelum intervensi. **Contoh:** `UMKM binaan memerlukan penguatan kemampuan usaha.` — PEMETAAN dari konteks kegiatan. |
| `intervention` (text; wajib) | Intervensi/kegiatan program. **Contoh:** `Pelatihan dan pendampingan UMKM melalui RBS.` — FAKTA kegiatan; susunan kalimat pemetaan. |
| `expected_condition` (text; wajib) | Kondisi yang diharapkan sesudah intervensi. **Contoh:** `Peningkatan keterampilan UMKM anggota RBS.` — FAKTA outcome peta anggaran hlm. 103. |
| `created_at` (timestamp; wajib) | Waktu pembuatan oleh aplikasi/database; tidak diterbitkan laporan. **Contoh:** `waktu transaksi dihasilkan aplikasi` — TEKNIS; bukan tanggal laporan. |
| `updated_at` (timestamp; wajib) | Waktu perubahan terakhir oleh aplikasi/database. **Contoh:** `waktu transaksi dihasilkan aplikasi` — TEKNIS; bukan tanggal laporan. |

#### `theory_of_change_flows`

| Kolom (tipe; kewajiban) | Fungsi dan contoh nilai pada kasus |
| --- | --- |
| `id` (bigint; wajib) | Primary key; ID lokal database, bukan nomor dalam laporan. **Contoh:** `ID teknis dibuat database` — TEKNIS. |
| `organization_id` (bigint; wajib) | Tenant yang membatasi akses dan relasi data. **Contoh:** `1` — TEKNIS tenant contoh; bukan identitas akun PUSRI. |
| `program_id` (bigint; wajib) | Relasi ke program pada tenant yang sama. **Contoh:** `ID FK teknis dari baris terkait` — TEKNIS; bukan nomor pada laporan. |
| `sort_order` (int; wajib) | Urutan tampil, bukan peringkat faktual. **Contoh:** `0` — TEKNIS; urutan tampilan. |
| `input_text` (text; wajib) | Sumber daya yang masuk ke rantai perubahan. **Contoh:** `Total investasi RBS yang dialokasikan dalam laporan: NPV Rp490.006.016.` — FAKTA agregat hlm. 56; bukan nominal input tahunan. |
| `activity_text` (text; wajib) | Aktivitas program. **Contoh:** `Pelatihan UMKM.` — FAKTA laporan hlm. 103. |
| `output_text` (text; wajib) | Produk langsung aktivitas. **Contoh:** `Pelatihan terlaksana.` — PEMETAAN; volume per kegiatan perlu bukti. |
| `outcome_text` (text; wajib) | Perubahan pada stakeholder. **Contoh:** `Peningkatan skill UMKM anggota RBS.` — FAKTA laporan hlm. 103. |
| `impact_text` (text; wajib) | Dampak jangka panjang. **Contoh:** `Peningkatan kapasitas UMKM.` — PEMETAAN ringkasan outcome. |
| `created_at` (timestamp; wajib) | Waktu pembuatan oleh aplikasi/database; tidak diterbitkan laporan. **Contoh:** `waktu transaksi dihasilkan aplikasi` — TEKNIS; bukan tanggal laporan. |
| `updated_at` (timestamp; wajib) | Waktu perubahan terakhir oleh aplikasi/database. **Contoh:** `waktu transaksi dihasilkan aplikasi` — TEKNIS; bukan tanggal laporan. |


### 5. LFA dan Roadmap

#### `lfa_nodes`

| Kolom (tipe; kewajiban) | Fungsi dan contoh nilai pada kasus |
| --- | --- |
| `id` (bigint; wajib) | Primary key; ID lokal database, bukan nomor dalam laporan. **Contoh:** `ID teknis dibuat database` — TEKNIS. |
| `organization_id` (bigint; wajib) | Tenant yang membatasi akses dan relasi data. **Contoh:** `1` — TEKNIS tenant contoh; bukan identitas akun PUSRI. |
| `program_id` (bigint; wajib) | Relasi ke program pada tenant yang sama. **Contoh:** `ID FK teknis dari baris terkait` — TEKNIS; bukan nomor pada laporan. |
| `parent_id` (bigint; opsional/NULL diizinkan) | Relasi ke entitas induk pada hierarki yang sama. **Contoh:** `ID FK teknis dari baris terkait` — TEKNIS; bukan nomor pada laporan. |
| `level` (lfa_level; wajib) | Nilai level. **Contoh:** `activity` — PEMETAAN ke salah satu level skema. |
| `code` (varchar(40); opsional/NULL diizinkan) | Kode master wilayah atau katalog aplikasi menurut jenis tabel. **Contoh:** `NULL bila memang tidak diketahui` — kolom opsional; bukan bukti ketiadaan. |
| `element` (text; wajib) | Nilai element. **Contoh:** `Pelatihan pengelolaan keuangan dasar.` — PEMETAAN kegiatan nyata. |
| `indicator` (text; opsional/NULL diizinkan) | Indikator pencapaian LFA. **Contoh:** `Laporan mencatat 26 peserta pelatihan pengelolaan keuangan pada 2023.` — FAKTA hlm. 56; target tidak tersedia. |
| `verification_source` (text; opsional/NULL diizinkan) | Cara/dokumen verifikasi indikator LFA. **Contoh:** `Laporan SROI RBS Tahun 2024, hlm. 56.` — FAKTA rujukan. |
| `assumptions` (text; opsional/NULL diizinkan) | Asumsi pelaksanaan LFA. **Contoh:** `Belum dipublikasikan untuk struktur LFA aplikasi.` — JANGAN direka. |
| `sort_order` (int; wajib) | Urutan tampil, bukan peringkat faktual. **Contoh:** `0` — TEKNIS urutan simpul. |
| `created_at` (timestamp; wajib) | Waktu pembuatan oleh aplikasi/database; tidak diterbitkan laporan. **Contoh:** `waktu transaksi dihasilkan aplikasi` — TEKNIS; bukan tanggal laporan. |
| `updated_at` (timestamp; wajib) | Waktu perubahan terakhir oleh aplikasi/database. **Contoh:** `waktu transaksi dihasilkan aplikasi` — TEKNIS; bukan tanggal laporan. |

#### `roadmap_items`

| Kolom (tipe; kewajiban) | Fungsi dan contoh nilai pada kasus |
| --- | --- |
| `id` (bigint; wajib) | Primary key; ID lokal database, bukan nomor dalam laporan. **Contoh:** `ID teknis dibuat database` — TEKNIS. |
| `organization_id` (bigint; wajib) | Tenant yang membatasi akses dan relasi data. **Contoh:** `1` — TEKNIS tenant contoh; bukan identitas akun PUSRI. |
| `program_id` (bigint; wajib) | Relasi ke program pada tenant yang sama. **Contoh:** `ID FK teknis dari baris terkait` — TEKNIS; bukan nomor pada laporan. |
| `lfa_activity_id` (bigint; wajib) | FK wajib ke simpul LFA tingkat activity pada program yang sama. **Contoh:** `ID FK teknis dari baris terkait` — TEKNIS; bukan nomor pada laporan. |
| `sort_order` (int; wajib) | Urutan tampil, bukan peringkat faktual. **Contoh:** `0` — TEKNIS; urutan tampilan. |
| `created_at` (timestamp; wajib) | Waktu pembuatan oleh aplikasi/database; tidak diterbitkan laporan. **Contoh:** `waktu transaksi dihasilkan aplikasi` — TEKNIS; bukan tanggal laporan. |
| `updated_at` (timestamp; wajib) | Waktu perubahan terakhir oleh aplikasi/database. **Contoh:** `waktu transaksi dihasilkan aplikasi` — TEKNIS; bukan tanggal laporan. |

#### `roadmap_targets`

| Kolom (tipe; kewajiban) | Fungsi dan contoh nilai pada kasus |
| --- | --- |
| `id` (bigint; wajib) | Primary key; ID lokal database, bukan nomor dalam laporan. **Contoh:** `ID teknis dibuat database` — TEKNIS. |
| `organization_id` (bigint; wajib) | Tenant yang membatasi akses dan relasi data. **Contoh:** `1` — TEKNIS tenant contoh; bukan identitas akun PUSRI. |
| `program_id` (bigint; wajib) | Relasi ke program pada tenant yang sama. **Contoh:** `ID FK teknis dari baris terkait` — TEKNIS; bukan nomor pada laporan. |
| `roadmap_item_id` (bigint; wajib) | Relasi ke item roadmap. **Contoh:** `ID FK teknis dari baris terkait` — TEKNIS; bukan nomor pada laporan. |
| `year` (smallint; wajib) | Tahun/periode evaluasi atau forecast. **Contoh:** `2023` — FAKTA periode realisasi. |
| `target_quantity` (decimal(20,6); wajib) | Target roadmap; bukan realisasi peserta. **Contoh:** `BELUM TERSEDIA` — 26 pada laporan adalah realisasi peserta, bukan target. |
| `unit` (varchar(100); wajib) | Satuan pengukuran indikator/proksi. **Contoh:** `peserta` — FAKTA satuan laporan. |
| `created_at` (timestamp; wajib) | Waktu pembuatan oleh aplikasi/database; tidak diterbitkan laporan. **Contoh:** `waktu transaksi dihasilkan aplikasi` — TEKNIS; bukan tanggal laporan. |
| `updated_at` (timestamp; wajib) | Waktu perubahan terakhir oleh aplikasi/database. **Contoh:** `waktu transaksi dihasilkan aplikasi` — TEKNIS; bukan tanggal laporan. |


### 6. Program Scope dan Investment Details

#### `program_scopes`

| Kolom (tipe; kewajiban) | Fungsi dan contoh nilai pada kasus |
| --- | --- |
| `id` (bigint; wajib) | Primary key; ID lokal database, bukan nomor dalam laporan. **Contoh:** `ID teknis dibuat database` — TEKNIS. |
| `organization_id` (bigint; wajib) | Tenant yang membatasi akses dan relasi data. **Contoh:** `1` — TEKNIS tenant contoh; bukan identitas akun PUSRI. |
| `program_id` (bigint; wajib) | Relasi ke program pada tenant yang sama. **Contoh:** `ID FK teknis dari baris terkait` — TEKNIS; bukan nomor pada laporan. |
| `assessment_type` (assessment_type; wajib) | Jenis analisis evaluative, forecast, atau both. **Contoh:** `evaluative` — PEMETAAN; laporan mengukur program berjalan. |
| `evaluative_start_year` (smallint; opsional/NULL diizinkan) | Nilai evaluative start year. **Contoh:** `2023` — PEMETAAN dari Nov 2023. |
| `evaluative_end_year` (smallint; opsional/NULL diizinkan) | Nilai evaluative end year. **Contoh:** `2024` — PEMETAAN sampai Nov 2024. |
| `forecast_start_year` (smallint; opsional/NULL diizinkan) | Nilai forecast start year. **Contoh:** `NULL bila memang tidak diketahui` — kolom opsional; bukan bukti ketiadaan. |
| `forecast_end_year` (smallint; opsional/NULL diizinkan) | Nilai forecast end year. **Contoh:** `NULL bila memang tidak diketahui` — kolom opsional; bukan bukti ketiadaan. |
| `scope_text` (text; wajib) | Batas dan cakupan studi. **Contoh:** `Program RBS periode November 2023–November 2024.` — FAKTA laporan hlm. 62. |
| `created_at` (timestamp; wajib) | Waktu pembuatan oleh aplikasi/database; tidak diterbitkan laporan. **Contoh:** `waktu transaksi dihasilkan aplikasi` — TEKNIS; bukan tanggal laporan. |
| `updated_at` (timestamp; wajib) | Waktu perubahan terakhir oleh aplikasi/database. **Contoh:** `waktu transaksi dihasilkan aplikasi` — TEKNIS; bukan tanggal laporan. |

#### `program_investments`

| Kolom (tipe; kewajiban) | Fungsi dan contoh nilai pada kasus |
| --- | --- |
| `id` (bigint; wajib) | Primary key; ID lokal database, bukan nomor dalam laporan. **Contoh:** `ID teknis dibuat database` — TEKNIS. |
| `organization_id` (bigint; wajib) | Tenant yang membatasi akses dan relasi data. **Contoh:** `1` — TEKNIS tenant contoh; bukan identitas akun PUSRI. |
| `program_id` (bigint; wajib) | Relasi ke program pada tenant yang sama. **Contoh:** `ID FK teknis dari baris terkait` — TEKNIS; bukan nomor pada laporan. |
| `investor_name` (varchar(200); wajib) | Nama pemberi investasi/kontribusi. **Contoh:** `PT Pupuk Sriwidjaja Palembang` — FAKTA stakeholder hlm. 53. |
| `contribution_type` (investment_type; wajib) | Jenis kontribusi cash, in_kind, atau time. **Contoh:** `BELUM DIPETAKAN ke cash/in_kind/time` — Laporan hanya menyebut investasi dan NPV agregat. |
| `form` (varchar(150); wajib) | Bentuk kontribusi/investasi. **Contoh:** `Biaya tetap dan variabel RBS` — FAKTA kategori investasi hlm. 62; bukan transaksi tunggal. |
| `currency_code` (char(3); wajib) | Kode mata uang ISO tiga huruf. **Contoh:** `IDR` — PEMETAAN mata uang laporan rupiah. |
| `sort_order` (int; wajib) | Urutan tampil, bukan peringkat faktual. **Contoh:** `0` — TEKNIS; urutan tampilan. |
| `created_at` (timestamp; wajib) | Waktu pembuatan oleh aplikasi/database; tidak diterbitkan laporan. **Contoh:** `waktu transaksi dihasilkan aplikasi` — TEKNIS; bukan tanggal laporan. |
| `updated_at` (timestamp; wajib) | Waktu perubahan terakhir oleh aplikasi/database. **Contoh:** `waktu transaksi dihasilkan aplikasi` — TEKNIS; bukan tanggal laporan. |

#### `program_investment_years`

| Kolom (tipe; kewajiban) | Fungsi dan contoh nilai pada kasus |
| --- | --- |
| `id` (bigint; wajib) | Primary key; ID lokal database, bukan nomor dalam laporan. **Contoh:** `ID teknis dibuat database` — TEKNIS. |
| `organization_id` (bigint; wajib) | Tenant yang membatasi akses dan relasi data. **Contoh:** `1` — TEKNIS tenant contoh; bukan identitas akun PUSRI. |
| `program_id` (bigint; wajib) | Relasi ke program pada tenant yang sama. **Contoh:** `ID FK teknis dari baris terkait` — TEKNIS; bukan nomor pada laporan. |
| `investment_id` (bigint; wajib) | Relasi ke pos investasi. **Contoh:** `ID FK teknis dari baris terkait` — TEKNIS; bukan nomor pada laporan. |
| `year` (smallint; wajib) | Tahun/periode evaluasi atau forecast. **Contoh:** `2023 atau 2024 hanya jika nominal transaksi tiap tahun diverifikasi.` — JANGAN menyimpulkan dari total NPV. |
| `amount` (decimal(20,2); wajib) | Nominal kontribusi investasi pada periode tertentu. **Contoh:** `BELUM TERSEDIA sebagai nominal kas tahunan tervalidasi.` — Laporan memberi NPV/agregat, bukan input mentah aplikasi. |
| `created_at` (timestamp; wajib) | Waktu pembuatan oleh aplikasi/database; tidak diterbitkan laporan. **Contoh:** `waktu transaksi dihasilkan aplikasi` — TEKNIS; bukan tanggal laporan. |
| `updated_at` (timestamp; wajib) | Waktu perubahan terakhir oleh aplikasi/database. **Contoh:** `waktu transaksi dihasilkan aplikasi` — TEKNIS; bukan tanggal laporan. |


### 7. Stakeholder Identification

#### `program_stakeholders`

| Kolom (tipe; kewajiban) | Fungsi dan contoh nilai pada kasus |
| --- | --- |
| `id` (bigint; wajib) | Primary key; ID lokal database, bukan nomor dalam laporan. **Contoh:** `ID teknis dibuat database` — TEKNIS. |
| `organization_id` (bigint; wajib) | Tenant yang membatasi akses dan relasi data. **Contoh:** `1` — TEKNIS tenant contoh; bukan identitas akun PUSRI. |
| `program_id` (bigint; wajib) | Relasi ke program pada tenant yang sama. **Contoh:** `ID FK teknis dari baris terkait` — TEKNIS; bukan nomor pada laporan. |
| `program_category_id` (bigint; wajib) | FK rumpun yang harus sama dengan kategori program. **Contoh:** `30` — TEKNIS harus sama dengan rumpun program. |
| `stakeholder_category_list_id` (bigint; wajib) | FK daftar pilihan aktor pada kategori/rumpun program yang sama. **Contoh:** `ID item Rumah BUMN Sumsel` — TEKNIS harus dari kategori/rumpun yang sama. |
| `role_in_program` (text; wajib) | Peran stakeholder dalam program. **Contoh:** `Lembaga pelaksana program Rumah BUMN Sumsel.` — FAKTA hlm. 53. |
| `included` (boolean; wajib) | Keputusan memasukkan stakeholder ke analisis. **Contoh:** `true untuk daftar prioritas laporan.` — PEMETAAN keputusan inklusi ke skema. |
| `inclusion_reason` (text; wajib) | Alasan inklusi stakeholder. **Contoh:** `Lembaga binaan TJSL PUSRI yang melaksanakan program.` — FAKTA hlm. 53. |
| `sort_order` (int; wajib) | Urutan tampil, bukan peringkat faktual. **Contoh:** `0` — TEKNIS; urutan tampilan. |
| `created_at` (timestamp; wajib) | Waktu pembuatan oleh aplikasi/database; tidak diterbitkan laporan. **Contoh:** `waktu transaksi dihasilkan aplikasi` — TEKNIS; bukan tanggal laporan. |
| `updated_at` (timestamp; wajib) | Waktu perubahan terakhir oleh aplikasi/database. **Contoh:** `waktu transaksi dihasilkan aplikasi` — TEKNIS; bukan tanggal laporan. |


### 8. Outcome Identification

#### `program_outcomes`

| Kolom (tipe; kewajiban) | Fungsi dan contoh nilai pada kasus |
| --- | --- |
| `id` (bigint; wajib) | Primary key; ID lokal database, bukan nomor dalam laporan. **Contoh:** `ID teknis dibuat database` — TEKNIS. |
| `organization_id` (bigint; wajib) | Tenant yang membatasi akses dan relasi data. **Contoh:** `1` — TEKNIS tenant contoh; bukan identitas akun PUSRI. |
| `program_id` (bigint; wajib) | Relasi ke program pada tenant yang sama. **Contoh:** `ID FK teknis dari baris terkait` — TEKNIS; bukan nomor pada laporan. |
| `program_category_id` (bigint; wajib) | FK rumpun yang harus sama dengan kategori program. **Contoh:** `30` — TEKNIS harus sama dengan rumpun program. |
| `stakeholder_id` (bigint; wajib) | Relasi ke stakeholder program. **Contoh:** `ID stakeholder Rumah BUMN Sumsel pada program` — TEKNIS bukan ID item katalog. |
| `outcome_category_id` (bigint; opsional/NULL diizinkan) | Relasi ke kategori outcome. **Contoh:** `ID kategori Manfaat aset` — TEKNIS kategori outcome di rumpun yang sama. |
| `name` (varchar(255); wajib) | Nama entitas sesuai konteks tabel. **Contoh:** `Penghasilan dari Asset Rumah BUMN` — FAKTA outcome hlm. 137. |
| `description` (text; wajib) | Uraian entitas/kegiatan sesuai konteks kolom. **Contoh:** `Nilai sewa bangunan, galeri, dan ruang pertemuan RBS.` — FAKTA tabel valuasi hlm. 137; penempatan pada outcome RBS adalah pemetaan. |
| `relevant` (boolean; wajib) | Hasil penilaian relevansi outcome. **Contoh:** `BELUM DINILAI dalam format boolean skema.` — Laporan tidak memberi keputusan tersebut. |
| `significant` (boolean; wajib) | Hasil penilaian signifikansi outcome. **Contoh:** `BELUM DINILAI dalam format boolean skema.` — Laporan tidak memberi keputusan tersebut. |
| `material` (boolean; wajib) | Hasil uji materialitas outcome. **Contoh:** `BELUM DINILAI dalam format boolean skema.` — Laporan tidak memberi keputusan tersebut. |
| `materiality_reason` (text; opsional/NULL diizinkan) | Kategori/alasan hasil uji materialitas. **Contoh:** `BELUM TERSEDIA.` — Jangan infer dari tercantum di laporan. |
| `materiality_explanation` (text; opsional/NULL diizinkan) | Penjelasan keputusan materialitas. **Contoh:** `BELUM TERSEDIA.` — Butuh catatan uji materialitas. |
| `sort_order` (int; wajib) | Urutan tampil, bukan peringkat faktual. **Contoh:** `0` — TEKNIS; urutan tampilan. |
| `created_at` (timestamp; wajib) | Waktu pembuatan oleh aplikasi/database; tidak diterbitkan laporan. **Contoh:** `waktu transaksi dihasilkan aplikasi` — TEKNIS; bukan tanggal laporan. |
| `updated_at` (timestamp; wajib) | Waktu perubahan terakhir oleh aplikasi/database. **Contoh:** `waktu transaksi dihasilkan aplikasi` — TEKNIS; bukan tanggal laporan. |


### 9. SROI Table

#### `outcome_indicators`

| Kolom (tipe; kewajiban) | Fungsi dan contoh nilai pada kasus |
| --- | --- |
| `id` (bigint; wajib) | Primary key; ID lokal database, bukan nomor dalam laporan. **Contoh:** `ID teknis dibuat database` — TEKNIS. |
| `organization_id` (bigint; wajib) | Tenant yang membatasi akses dan relasi data. **Contoh:** `1` — TEKNIS tenant contoh; bukan identitas akun PUSRI. |
| `outcome_id` (bigint; wajib) | Relasi ke outcome program. **Contoh:** `ID FK teknis dari baris terkait` — TEKNIS; bukan nomor pada laporan. |
| `name` (varchar(255); wajib) | Nama entitas sesuai konteks tabel. **Contoh:** `Nilai sewa galeri Rumah BUMN Sumsel per bulan.` — PEMETAAN dari tabel valuasi. |
| `unit` (varchar(100); opsional/NULL diizinkan) | Satuan pengukuran indikator/proksi. **Contoh:** `bulan` — FAKTA tabel benefit hlm. 143. |
| `evidence` (text; opsional/NULL diizinkan) | Bukti perubahan/outcome. **Contoh:** `Laporan mencatat 15 bulan galeri, Rp45.000.000/bulan, total Rp675.000.000.` — FAKTA hlm. 143. |
| `evidence_source` (text; opsional/NULL diizinkan) | Rujukan bukti outcome. **Contoh:** `Laporan SROI RBS Tahun 2024, tabel 18, hlm. 143.` — FAKTA rujukan. |
| `sort_order` (int; wajib) | Urutan tampil, bukan peringkat faktual. **Contoh:** `0` — TEKNIS; urutan tampilan. |
| `created_at` (timestamp; wajib) | Waktu pembuatan oleh aplikasi/database; tidak diterbitkan laporan. **Contoh:** `waktu transaksi dihasilkan aplikasi` — TEKNIS; bukan tanggal laporan. |
| `updated_at` (timestamp; wajib) | Waktu perubahan terakhir oleh aplikasi/database. **Contoh:** `waktu transaksi dihasilkan aplikasi` — TEKNIS; bukan tanggal laporan. |

#### `financial_proxies`

| Kolom (tipe; kewajiban) | Fungsi dan contoh nilai pada kasus |
| --- | --- |
| `id` (bigint; wajib) | Primary key; ID lokal database, bukan nomor dalam laporan. **Contoh:** `ID teknis dibuat database` — TEKNIS. |
| `organization_id` (bigint; wajib) | Tenant yang membatasi akses dan relasi data. **Contoh:** `1` — TEKNIS tenant contoh; bukan identitas akun PUSRI. |
| `outcome_id` (bigint; wajib) | Relasi ke outcome program. **Contoh:** `ID FK teknis dari baris terkait` — TEKNIS; bukan nomor pada laporan. |
| `approach` (varchar(255); wajib) | Pendekatan valuasi proksi finansial. **Contoh:** `Biaya sewa setara galeri Rumah BUMN Sumsel.` — PEMETAAN metode proxy. |
| `description` (text; opsional/NULL diizinkan) | Uraian entitas/kegiatan sesuai konteks kolom. **Contoh:** `Nilai sewa galeri yang dilaporkan Rp45.000.000 per bulan.` — FAKTA hlm. 143. |
| `source` (text; wajib) | Referensi asal nilai atau data. **Contoh:** `propertykku.com, sebagaimana dicantumkan dalam laporan PUSRI.` — FAKTA sitasi laporan hlm. 143. |
| `unit` (varchar(100); wajib) | Satuan pengukuran indikator/proksi. **Contoh:** `bulan` — FAKTA satuan laporan. |
| `unit_value` (decimal(20,4); wajib) | Nilai per unit proksi finansial. **Contoh:** `45000000` — FAKTA Rupiah per bulan. |
| `currency_code` (char(3); wajib) | Kode mata uang ISO tiga huruf. **Contoh:** `IDR` — PEMETAAN mata uang rupiah. |
| `created_at` (timestamp; wajib) | Waktu pembuatan oleh aplikasi/database; tidak diterbitkan laporan. **Contoh:** `waktu transaksi dihasilkan aplikasi` — TEKNIS; bukan tanggal laporan. |
| `updated_at` (timestamp; wajib) | Waktu perubahan terakhir oleh aplikasi/database. **Contoh:** `waktu transaksi dihasilkan aplikasi` — TEKNIS; bukan tanggal laporan. |

#### `outcome_impact_years`

| Kolom (tipe; kewajiban) | Fungsi dan contoh nilai pada kasus |
| --- | --- |
| `id` (bigint; wajib) | Primary key; ID lokal database, bukan nomor dalam laporan. **Contoh:** `ID teknis dibuat database` — TEKNIS. |
| `organization_id` (bigint; wajib) | Tenant yang membatasi akses dan relasi data. **Contoh:** `1` — TEKNIS tenant contoh; bukan identitas akun PUSRI. |
| `outcome_id` (bigint; wajib) | Relasi ke outcome program. **Contoh:** `ID FK teknis dari baris terkait` — TEKNIS; bukan nomor pada laporan. |
| `indicator_id` (bigint; wajib) | Relasi ke indikator outcome. **Contoh:** `ID indikator galeri setelah outcome aset dibuat` — TEKNIS; konsisten dengan proxy/outcome. |
| `financial_proxy_id` (bigint; wajib) | Relasi ke proksi finansial outcome. **Contoh:** `ID proksi sewa galeri setelah outcome aset dibuat` — TEKNIS; bukan untuk outcome skill UMKM. |
| `period_type` (period_type; wajib) | Jenis periode evaluative atau forecast. **Contoh:** `evaluative` — PEMETAAN; input evaluasi historis. |
| `year` (smallint; wajib) | Tahun/periode evaluasi atau forecast. **Contoh:** `BELUM TERPETAKAN` — 15 bulan total tidak memuat pembagian tahun kalender. |
| `quantity` (decimal(20,6); wajib) | Kuantitas outcome untuk satu periode. **Contoh:** `BELUM TERPETAKAN per tahun` — Sumber menyebut total 15 bulan; jangan masukkan 15 ke satu tahun. |
| `deadweight_pct` (decimal(7,4); wajib) | Persentase perubahan yang mungkin terjadi tanpa program. **Contoh:** `BELUM TERSEDIA per outcome/tahun` — Gunakan angka laporan hanya sesudah pemetaan terverifikasi. |
| `displacement_pct` (decimal(7,4); wajib) | Persentase dampak yang menggeser dampak/tempat lain. **Contoh:** `BELUM TERSEDIA per outcome/tahun` — Jangan default 0 sebagai data. |
| `attribution_pct` (decimal(7,4); wajib) | Persentase kontribusi pihak lain. **Contoh:** `BELUM TERSEDIA per outcome/tahun` — Jangan default 0 sebagai data. |
| `dropoff_pct` (decimal(7,4); wajib) | Penurunan outcome per periode. **Contoh:** `BELUM TERSEDIA per outcome/tahun` — Jangan default 0 sebagai data. |
| `deadweight_reason` (text; opsional/NULL diizinkan) | Alasan deadweight. **Contoh:** `Perlu catatan faktor pada laporan dan pemetaan outcome.` — JANGAN mengarang. |
| `displacement_reason` (text; opsional/NULL diizinkan) | Alasan displacement. **Contoh:** `Perlu catatan faktor pada laporan dan pemetaan outcome.` — JANGAN mengarang. |
| `attribution_reason` (text; opsional/NULL diizinkan) | Alasan attribution. **Contoh:** `Perlu catatan faktor pada laporan dan pemetaan outcome.` — JANGAN mengarang. |
| `dropoff_reason` (text; opsional/NULL diizinkan) | Alasan dropoff. **Contoh:** `Perlu catatan faktor pada laporan dan pemetaan outcome.` — JANGAN mengarang. |
| `updated_by` (bigint; wajib) | User pengubah; akun internal tidak dipublikasikan. **Contoh:** `ID FK teknis dari baris terkait` — TEKNIS; bukan nomor pada laporan. |
| `created_at` (timestamp; wajib) | Waktu pembuatan oleh aplikasi/database; tidak diterbitkan laporan. **Contoh:** `waktu transaksi dihasilkan aplikasi` — TEKNIS; bukan tanggal laporan. |
| `updated_at` (timestamp; wajib) | Waktu perubahan terakhir oleh aplikasi/database. **Contoh:** `waktu transaksi dihasilkan aplikasi` — TEKNIS; bukan tanggal laporan. |


### 10. SROI Calculation

#### `sroi_methods`

| Kolom (tipe; kewajiban) | Fungsi dan contoh nilai pada kasus |
| --- | --- |
| `id` (bigint; wajib) | Primary key; ID lokal database, bukan nomor dalam laporan. **Contoh:** `ID teknis dibuat database` — TEKNIS. |
| `code` (varchar(40); wajib) | Kode master wilayah atau katalog aplikasi menurut jenis tabel. **Contoh:** `standard_v1` — TEKNIS; kode metode rancangan aplikasi. |
| `version` (varchar(40); wajib) | Versi formula/metode kalkulasi. **Contoh:** `1.0` — TEKNIS; bukan versi metode yang diklaim PUSRI. |
| `description` (text; wajib) | Uraian entitas/kegiatan sesuai konteks kolom. **Contoh:** `Rumus SROI versi aplikasi; simpan aturan dan versi kalkulasi yang konsisten.` — TEKNIS rancangan. |
| `active` (boolean; wajib) | Penanda apakah opsi katalog/metode tersedia. **Contoh:** `true` — TEKNIS setelah metode disetujui. |
| `created_at` (timestamp; wajib) | Waktu pembuatan oleh aplikasi/database; tidak diterbitkan laporan. **Contoh:** `waktu transaksi dihasilkan aplikasi` — TEKNIS; bukan tanggal laporan. |

#### `sroi_runs`

| Kolom (tipe; kewajiban) | Fungsi dan contoh nilai pada kasus |
| --- | --- |
| `id` (bigint; wajib) | Primary key; ID lokal database, bukan nomor dalam laporan. **Contoh:** `ID teknis dibuat database` — TEKNIS. |
| `organization_id` (bigint; wajib) | Tenant yang membatasi akses dan relasi data. **Contoh:** `1` — TEKNIS tenant contoh; bukan identitas akun PUSRI. |
| `program_id` (bigint; wajib) | Relasi ke program pada tenant yang sama. **Contoh:** `ID FK teknis dari baris terkait` — TEKNIS; bukan nomor pada laporan. |
| `method_id` (bigint; wajib) | Relasi ke versi metode SROI. **Contoh:** `ID FK teknis dari baris terkait` — TEKNIS; bukan nomor pada laporan. |
| `base_year` (smallint; wajib) | Tahun dasar perhitungan diskonto. **Contoh:** `BELUM DITETAPKAN untuk kalkulasi aplikasi.` — Laporan kasus mencakup dua tahun. |
| `discount_rate_pct` (decimal(7,4); wajib) | Tingkat diskonto yang disetujui untuk metode studi. **Contoh:** `BELUM TERSEDIA/terverifikasi.` — Jangan mengarang tingkat diskonto. |
| `currency_code` (char(3); wajib) | Kode mata uang ISO tiga huruf. **Contoh:** `IDR` — PEMETAAN mata uang laporan. |
| `status` (run_status; wajib) | Status proses/keaktifan sesuai enum DBML. **Contoh:** `complete (default DBML)` — TEKNIS; bukan hasil observasi laporan. |
| `total_present_value` (decimal(20,2); wajib) | Total nilai kini manfaat dalam run/periode. **Contoh:** `BELUM DAPAT DIISI sebagai run aplikasi.` — NPV benefit laporan Rp1.907.135.112 adalah hasil eksternal. |
| `total_investment` (decimal(20,2); wajib) | Total investasi sesuai metode kalkulasi. **Contoh:** `BELUM DAPAT DIISI sebagai run aplikasi.` — NPV investment laporan Rp490.006.016; formula V1 memakai input aplikasi tervalidasi. |
| `ratio` (decimal(20,6); opsional/NULL diizinkan) | Rasio benefit/investment sesuai definisi metode. **Contoh:** `BELUM DIHITUNG untuk metode aplikasi; pembanding laporan 3,89.` — Jangan menyalin hasil eksternal ke run baru. |
| `created_by` (bigint; wajib) | User pembuat; akun internal tidak dipublikasikan. **Contoh:** `ID FK teknis dari baris terkait` — TEKNIS; bukan nomor pada laporan. |
| `created_at` (timestamp; wajib) | Waktu pembuatan oleh aplikasi/database; tidak diterbitkan laporan. **Contoh:** `waktu transaksi dihasilkan aplikasi` — TEKNIS; bukan tanggal laporan. |

#### `sroi_run_outcome_years`

| Kolom (tipe; kewajiban) | Fungsi dan contoh nilai pada kasus |
| --- | --- |
| `id` (bigint; wajib) | Primary key; ID lokal database, bukan nomor dalam laporan. **Contoh:** `ID teknis dibuat database` — TEKNIS. |
| `organization_id` (bigint; wajib) | Tenant yang membatasi akses dan relasi data. **Contoh:** `1` — TEKNIS tenant contoh; bukan identitas akun PUSRI. |
| `program_id` (bigint; wajib) | Relasi ke program pada tenant yang sama. **Contoh:** `ID FK teknis dari baris terkait` — TEKNIS; bukan nomor pada laporan. |
| `run_id` (bigint; wajib) | Relasi ke snapshot kalkulasi SROI. **Contoh:** `ID FK teknis dari baris terkait` — TEKNIS; bukan nomor pada laporan. |
| `outcome_id` (bigint; wajib) | Relasi ke outcome program. **Contoh:** `ID outcome aset milik stakeholder RBS setelah divalidasi` — PEMETAAN; bukan outcome skill UMKM. |
| `period_type` (period_type; wajib) | Jenis periode evaluative atau forecast. **Contoh:** `evaluative` — PEMETAAN untuk kajian historis. |
| `year` (smallint; wajib) | Tahun/periode evaluasi atau forecast. **Contoh:** `BELUM DIHITUNG` — Perlu pembagian tahun dan perhitungan aplikasi. |
| `stakeholder_name` (varchar(200); wajib) | Nama stakeholder. **Contoh:** `Rumah BUMN Sumsel` — FAKTA stakeholder pelaksana hlm. 53; snapshot setelah validasi. |
| `outcome_name` (varchar(255); wajib) | Nama outcome. **Contoh:** `Penghasilan dari Asset Rumah BUMN` — FAKTA hlm. 137; snapshot setelah pemetaan. |
| `indicator_name` (varchar(255); wajib) | Nama indikator yang dibekukan ke kalkulasi. **Contoh:** `Nilai sewa galeri per bulan` — PEMETAAN. |
| `indicator_unit` (varchar(100); opsional/NULL diizinkan) | Satuan indikator. **Contoh:** `bulan` — FAKTA satuan proxy. |
| `evidence` (text; opsional/NULL diizinkan) | Bukti perubahan/outcome. **Contoh:** `15 bulan; Rp45.000.000/bulan; total galeri Rp675.000.000.` — FAKTA hlm. 143. |
| `evidence_source` (text; opsional/NULL diizinkan) | Rujukan bukti outcome. **Contoh:** `Laporan SROI RBS Tahun 2024, tabel 18, hlm. 143.` — FAKTA rujukan. |
| `proxy_approach` (varchar(255); wajib) | Pendekatan proksi yang dibekukan ke run. **Contoh:** `Biaya sewa setara galeri` — PEMETAAN. |
| `proxy_source` (text; wajib) | Sumber nilai proksi. **Contoh:** `propertykku.com, sesuai sitasi laporan.` — FAKTA sitasi. |
| `proxy_unit` (varchar(100); wajib) | Satuan proksi yang dibekukan ke run. **Contoh:** `bulan` — FAKTA. |
| `quantity` (decimal(20,6); wajib) | Kuantitas outcome untuk satu periode. **Contoh:** `BELUM TERPETAKAN per tahun` — 15 bulan total tidak memisah tahun kalender. |
| `proxy_unit_value` (decimal(20,4); wajib) | Nilai per unit yang dibekukan ke snapshot kalkulasi. **Contoh:** `45000000` — FAKTA laporan. |
| `deadweight_pct` (decimal(7,4); wajib) | Persentase perubahan yang mungkin terjadi tanpa program. **Contoh:** `BELUM TERSEDIA sebagai input tahunan terpetakan.` — Jangan mengisi 0 tanpa bukti. |
| `displacement_pct` (decimal(7,4); wajib) | Persentase dampak yang menggeser dampak/tempat lain. **Contoh:** `BELUM TERSEDIA sebagai input tahunan terpetakan.` — Jangan mengisi 0 tanpa bukti. |
| `attribution_pct` (decimal(7,4); wajib) | Persentase kontribusi pihak lain. **Contoh:** `BELUM TERSEDIA sebagai input tahunan terpetakan.` — Jangan mengisi 0 tanpa bukti. |
| `dropoff_pct` (decimal(7,4); wajib) | Penurunan outcome per periode. **Contoh:** `BELUM TERSEDIA sebagai input tahunan terpetakan.` — Jangan mengisi 0 tanpa bukti. |
| `adjustment_reasons` (json; opsional/NULL diizinkan) | Alasan penyesuaian dampak dalam format JSON. **Contoh:** `BELUM TERSEDIA sebagai JSON sumber per tahun` — Bukan isi rekaan. |
| `gross_value` (decimal(20,2); wajib) | Nilai kotor outcome sebelum penyesuaian. **Contoh:** `BELUM DIHITUNG per tahun` — Jangan samakan otomatis dengan NPV laporan. |
| `adjusted_value` (decimal(20,2); wajib) | Nilai outcome sesudah penyesuaian. **Contoh:** `BELUM DIHITUNG` — Perlu penyesuaian tervalidasi. |
| `discount_factor` (decimal(20,10); wajib) | Faktor diskonto hasil kalkulasi. **Contoh:** `BELUM DIHITUNG` — Perlu base year dan discount rate. |
| `present_value` (decimal(20,2); wajib) | Nilai kini hasil kalkulasi; bukan input mentah. **Contoh:** `BELUM DIHITUNG` — Snapshot hanya dibuat setelah kalkulasi internal. |
| `created_at` (timestamp; wajib) | Waktu pembuatan oleh aplikasi/database; tidak diterbitkan laporan. **Contoh:** `waktu transaksi dihasilkan aplikasi` — TEKNIS; bukan tanggal laporan. |

#### `sroi_run_investment_years`

| Kolom (tipe; kewajiban) | Fungsi dan contoh nilai pada kasus |
| --- | --- |
| `id` (bigint; wajib) | Primary key; ID lokal database, bukan nomor dalam laporan. **Contoh:** `ID teknis dibuat database` — TEKNIS. |
| `organization_id` (bigint; wajib) | Tenant yang membatasi akses dan relasi data. **Contoh:** `1` — TEKNIS tenant contoh; bukan identitas akun PUSRI. |
| `program_id` (bigint; wajib) | Relasi ke program pada tenant yang sama. **Contoh:** `ID FK teknis dari baris terkait` — TEKNIS; bukan nomor pada laporan. |
| `run_id` (bigint; wajib) | Relasi ke snapshot kalkulasi SROI. **Contoh:** `ID FK teknis dari baris terkait` — TEKNIS; bukan nomor pada laporan. |
| `investment_id` (bigint; wajib) | Relasi ke pos investasi. **Contoh:** `ID FK teknis dari baris terkait` — TEKNIS; bukan nomor pada laporan. |
| `year` (smallint; wajib) | Tahun/periode evaluasi atau forecast. **Contoh:** `BELUM DIVERIFIKASI per input investasi` — Jangan membagi NPV total ke tahun. |
| `investor_name` (varchar(200); wajib) | Nama pemberi investasi/kontribusi. **Contoh:** `PT Pupuk Sriwidjaja Palembang` — FAKTA hlm. 53; snapshot setelah verifikasi. |
| `contribution_type` (investment_type; wajib) | Jenis kontribusi cash, in_kind, atau time. **Contoh:** `BELUM DIPETAKAN ke cash/in_kind/time` — Perlu rincian kontribusi. |
| `form` (varchar(150); wajib) | Bentuk kontribusi/investasi. **Contoh:** `Biaya tetap/variabel dan kegiatan tercantum sebagai agregat NPV.` — FAKTA kategori hlm. 62; bukan transaksi kas. |
| `amount` (decimal(20,2); wajib) | Nominal kontribusi investasi pada periode tertentu. **Contoh:** `BELUM TERSEDIA sebagai nominal input per tahun.` — Rp490.006.016 merupakan total NPV eksternal. |
| `created_at` (timestamp; wajib) | Waktu pembuatan oleh aplikasi/database; tidak diterbitkan laporan. **Contoh:** `waktu transaksi dihasilkan aplikasi` — TEKNIS; bukan tanggal laporan. |

#### `sroi_run_yearly_totals`

| Kolom (tipe; kewajiban) | Fungsi dan contoh nilai pada kasus |
| --- | --- |
| `id` (bigint; wajib) | Primary key; ID lokal database, bukan nomor dalam laporan. **Contoh:** `ID teknis dibuat database` — TEKNIS. |
| `organization_id` (bigint; wajib) | Tenant yang membatasi akses dan relasi data. **Contoh:** `1` — TEKNIS tenant contoh; bukan identitas akun PUSRI. |
| `run_id` (bigint; wajib) | Relasi ke snapshot kalkulasi SROI. **Contoh:** `ID FK teknis dari baris terkait` — TEKNIS; bukan nomor pada laporan. |
| `period_type` (period_type; wajib) | Jenis periode evaluative atau forecast. **Contoh:** `evaluative` — PEMETAAN berdasarkan lingkup laporan. |
| `year` (smallint; wajib) | Tahun/periode evaluasi atau forecast. **Contoh:** `BELUM TERSEDIA sebagai rincian hasil run tahunan.` — Laporan mempublikasikan total rasio keseluruhan. |
| `total_present_value` (decimal(20,2); wajib) | Total nilai kini manfaat dalam run/periode. **Contoh:** `BELUM DIHITUNG per tahun` — Tidak menyalin agregat eksternal. |
| `total_investment` (decimal(20,2); wajib) | Total investasi sesuai metode kalkulasi. **Contoh:** `BELUM DIHITUNG per tahun` — Tidak menyalin agregat eksternal. |
| `ratio` (decimal(20,6); opsional/NULL diizinkan) | Rasio benefit/investment sesuai definisi metode. **Contoh:** `BELUM DIHITUNG per tahun` — 3.89 hanya rasio laporan keseluruhan. |
| `created_at` (timestamp; wajib) | Waktu pembuatan oleh aplikasi/database; tidak diterbitkan laporan. **Contoh:** `waktu transaksi dihasilkan aplikasi` — TEKNIS; bukan tanggal laporan. |


### 11. Report dan Audit

#### `report_exports`

| Kolom (tipe; kewajiban) | Fungsi dan contoh nilai pada kasus |
| --- | --- |
| `id` (bigint; wajib) | Primary key; ID lokal database, bukan nomor dalam laporan. **Contoh:** `ID teknis dibuat database` — TEKNIS. |
| `organization_id` (bigint; wajib) | Tenant yang membatasi akses dan relasi data. **Contoh:** `1` — TEKNIS tenant contoh; bukan identitas akun PUSRI. |
| `program_id` (bigint; wajib) | Relasi ke program pada tenant yang sama. **Contoh:** `ID FK teknis dari baris terkait` — TEKNIS; bukan nomor pada laporan. |
| `run_id` (bigint; opsional/NULL diizinkan) | Relasi ke snapshot kalkulasi SROI. **Contoh:** `BELUM ADA sampai kalkulasi internal lengkap` — Jangan kaitkan PDF primer ke run baru. |
| `report_type` (export_type; wajib) | Jenis laporan yang diminta. **Contoh:** `full` — TEKNIS; jenis ekspor setelah run internal ada. |
| `stage` (varchar(40); opsional/NULL diizinkan) | Tahap program/laporan tempat berkas dilampirkan. **Contoh:** `NULL untuk full report; tahap spesifik untuk stage_export` — TEKNIS. |
| `format` (export_format; wajib) | Format keluaran aplikasi. **Contoh:** `docx` — TEKNIS; format yang diizinkan DBML, bukan format PDF sumber. |
| `status` (export_status; wajib) | Status proses/keaktifan sesuai enum DBML. **Contoh:** `queued` — TEKNIS; saat permintaan baru dibuat. |
| `object_key` (varchar(500); opsional/NULL diizinkan) | Key objek privat di penyimpanan aplikasi. **Contoh:** `BELUM ADA; dibuat oleh storage setelah ekspor.` — Jangan reka lokasi berkas. |
| `error_message` (text; opsional/NULL diizinkan) | Pesan kegagalan proses ekspor. **Contoh:** `NULL sebelum kegagalan terjadi.` — Operasional aplikasi. |
| `requested_by` (bigint; wajib) | User yang meminta ekspor. **Contoh:** `ID FK teknis dari baris terkait` — TEKNIS; bukan nomor pada laporan. |
| `created_at` (timestamp; wajib) | Waktu pembuatan oleh aplikasi/database; tidak diterbitkan laporan. **Contoh:** `waktu transaksi dihasilkan aplikasi` — TEKNIS; bukan tanggal laporan. |
| `updated_at` (timestamp; wajib) | Waktu perubahan terakhir oleh aplikasi/database. **Contoh:** `waktu transaksi dihasilkan aplikasi` — TEKNIS; bukan tanggal laporan. |
| `completed_at` (timestamp; opsional/NULL diizinkan) | Waktu ekspor selesai. **Contoh:** `BELUM ADA sebelum ekspor berhasil.` — Dibuat sistem. |

#### `audit_logs`

| Kolom (tipe; kewajiban) | Fungsi dan contoh nilai pada kasus |
| --- | --- |
| `id` (bigint; wajib) | Primary key; ID lokal database, bukan nomor dalam laporan. **Contoh:** `ID teknis dibuat database` — TEKNIS. |
| `organization_id` (bigint; wajib) | Tenant yang membatasi akses dan relasi data. **Contoh:** `1` — TEKNIS tenant contoh; bukan identitas akun PUSRI. |
| `actor_user_id` (bigint; opsional/NULL diizinkan) | Akun pelaku aksi audit; akun tidak dipublikasikan. **Contoh:** `ID FK teknis dari baris terkait` — TEKNIS; bukan nomor pada laporan. |
| `entity_type` (varchar(60); wajib) | Tipe entitas yang berubah. **Contoh:** `programs` — TEKNIS; bila program dibuat dalam aplikasi. |
| `entity_id` (bigint; wajib) | ID entitas yang berubah. **Contoh:** `ID FK teknis dari baris terkait` — TEKNIS; bukan nomor pada laporan. |
| `action` (audit_action; wajib) | Jenis aksi audit. **Contoh:** `create` — TEKNIS; belum ada audit faktual. |
| `before_state` (json; opsional/NULL diizinkan) | Snapshot JSON sebelum perubahan audit. **Contoh:** `NULL` — TEKNIS; sebelum INSERT. |
| `after_state` (json; opsional/NULL diizinkan) | Snapshot JSON sesudah perubahan audit. **Contoh:** `JSON program sesudah disimpan, tanpa password/token` — TEKNIS; jangan isi laporan sebagai log. |
| `occurred_at` (timestamp; wajib) | Waktu kejadian audit. **Contoh:** `waktu transaksi dihasilkan aplikasi` — TEKNIS; bukan tanggal laporan. |


## Sumber
- **[S1]** PT Pupuk Sriwidjaja Palembang, *Laporan SROI Program Rumah BUMN Sumsel Tahun 2024*, khususnya hlm. 53–54 (stakeholder), 56–62 (rasio dan investasi), 63 (proksi sewa), 103–104 (peta anggaran/perubahan), 137–139 (outcome dan valuasi), 143 (aset galeri). Dokumen primer: `https://esg.pusri.co.id/assets/document/landing/social/sroi_program_rbs.pdf`. Diakses 24 September 2026.
- **Skema aplikasi:** `database-sroi.dbml`; aturan kalkulasi rancangan: `database-sroi.md`. Keduanya adalah desain untuk website baru, bukan dokumentasi internal PUSRI.
