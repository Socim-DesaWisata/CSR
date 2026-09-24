# Feature Specification: Penilaian SROI Mandiri

**Feature Branch**: Tidak dibuat (tidak ada hook branch)
**Created**: 2026-09-24
**Status**: Draft
**Input**: Tambahkan fitur SROI berdasarkan alur situs pembanding dan empat dokumen dalam `sroi/`; pertahankan IKM/SLOI, bagikan akun, perusahaan, dan wilayah, tetapi pisahkan program serta seluruh data penilaian SROI. Rancang database gabungan dalam `csr.md`. Kredensial situs pembanding tidak termasuk spesifikasi.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Kelola program SROI tersendiri (Priority: P1)

Pengguna perusahaan yang berwenang membuat, mencari, memilih, dan mengubah program SROI tanpa membuat atau mengubah proyek IKM/SLOI. Program memiliki nama, pilar/rumpun, perusahaan, inisiator, kolaborator, lokasi, tahun, deskripsi, batasan, dan dokumen pendukung.

**Why this priority**: Program SROI yang terpisah adalah dasar seluruh tahapan penilaian.

**Independent Test**: Buat satu program SROI untuk perusahaan yang sudah ada; buka kembali program melalui daftar tanpa menemukan entri baru di daftar proyek IKM/SLOI.

**Acceptance Scenarios**:

1. **Given** pengguna berwenang dan perusahaan aktif, **When** pengguna menyimpan program dengan data wajib lengkap, **Then** program muncul di daftar SROI dan dapat dipilih untuk setiap tahap.
2. **Given** dua perusahaan berbeda, **When** pengguna perusahaan A membuka program perusahaan B, **Then** akses ditolak dan data B tidak ditampilkan.
3. **Given** program SROI tersimpan, **When** pengguna membuka daftar proyek IKM/SLOI, **Then** program SROI tidak muncul dan tidak mengubah proyek tersebut.

---

### User Story 2 - Susun kerangka program dan materialitas (Priority: P2)

Analis mengisi deskripsi, kondisi awal/intervensi/perubahan, hierarki tujuan-keluaran-aktivitas, target roadmap tahunan, lingkup evaluatif/forecast, investasi, stakeholder, serta outcome dengan uji relevansi, signifikansi, dan materialitas.

**Why this priority**: Perhitungan yang dapat dipertanggungjawabkan membutuhkan asal-usul outcome dan lingkup yang jelas.

**Independent Test**: Pada program baru, lengkapi satu rangkaian perubahan, satu aktivitas beserta target, satu stakeholder, dan satu outcome; buka kembali seluruh tahap dan periksa keterkaitannya.

**Acceptance Scenarios**:

1. **Given** program dipilih, **When** analis menyimpan Theory of Change, LFA, dan roadmap, **Then** tiap aktivitas serta target tahunan tetap terhubung ke program yang sama.
2. **Given** stakeholder dicatat, **When** analis menandai outcome relevan dan signifikan beserta alasan, **Then** status materialitas serta penjelasannya tersimpan dan dapat ditinjau.
3. **Given** stakeholder tidak disertakan atau outcome tidak material, **When** analis meninjau penilaian, **Then** entri tetap tercatat tetapi tidak dihitung sebagai manfaat.

---

### User Story 3 - Kuantifikasi dan hitung manfaat (Priority: P3)

Analis mencatat indikator, bukti, sumber, proksi finansial, kuantitas per tahun, investasi per tahun, serta deadweight, displacement, attribution, dan drop-off berikut alasannya. Pengguna menghitung dan membandingkan nilai kini manfaat, investasi, dan rasio menurut tahun serta total.

**Why this priority**: Nilai SROI hanya bermakna jika input, metode, dan hasilnya dapat ditelusuri.

**Independent Test**: Masukkan dua tahun outcome dan investasi; jalankan perhitungan; periksa rincian per outcome/tahun serta total, lalu ubah input dan pastikan hasil terdahulu tetap tersedia.

**Acceptance Scenarios**:

1. **Given** semua input wajib valid, **When** pengguna menghitung SROI, **Then** hasil tahunan dan total menampilkan metode, asumsi, manfaat, investasi, dan rasio yang konsisten.
2. **Given** investasi total nol, **When** pengguna menghitung, **Then** sistem menampilkan rasio tidak terdefinisi tanpa membagi dengan nol.
3. **Given** hasil terdahulu, **When** input diperbarui dan perhitungan diulang, **Then** hasil baru dibuat tanpa mengubah hasil historis.

---

### User Story 4 - Tinjau, ekspor, dan audit (Priority: P4)

Pengguna berwenang meninjau ringkasan SROI, mengekspor data tahap dan laporan penuh, ringkasan eksekutif, kuantitatif, atau kualitatif, serta mengetahui sumber hasil dan pelaku perubahan.

**Why this priority**: Pengambil keputusan memerlukan laporan yang dapat diverifikasi dan aman dibagikan.

**Independent Test**: Dari hasil yang telah dihitung, minta laporan, buka berkas sebagai pengguna berwenang, lalu pastikan pengguna perusahaan lain tidak dapat mengaksesnya.

**Acceptance Scenarios**:

1. **Given** hasil sah, **When** pengguna memilih jenis laporan, **Then** berkas yang diterima berisi identitas program, jenis laporan, dan versi hasil yang dipakai.
2. **Given** laporan lama, **When** program dihitung ulang, **Then** laporan lama tetap merujuk hasil sebelumnya.
3. **Given** pengguna di luar perusahaan, **When** ia meminta laporan atau berkas pendukung, **Then** akses ditolak.

### Edge Cases

- Program tanpa perusahaan aktif atau tanpa data wajib tidak dapat disimpan.
- Tahun program, evaluatif, forecast, target, dampak, dan investasi harus konsisten; periode evaluatif dan forecast tidak boleh tumpang tindih.
- Persentase penyesuaian di luar 0–100, kuantitas/nominal negatif, sumber bukti yang kosong saat wajib, serta mata uang campuran ditolak.
- Nilai belum diketahui tidak boleh diganti diam-diam dengan nol; pengguna melihat bagian yang belum lengkap.
- Penghapusan/arsip program tidak boleh menghilangkan hasil dan laporan historis yang masih perlu diaudit.
- Perubahan perusahaan/izin pengguna selama proses ekspor tidak boleh membuka akses lintas perusahaan.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Sistem MUST menyediakan daftar dan detail program SROI yang terpisah sepenuhnya dari daftar proyek IKM/SLOI.
- **FR-002**: Sistem MUST memakai akun, perusahaan, dan daftar wilayah yang sama dengan aplikasi CSR, tanpa mengaitkan program, responden, submission, atau skor SROI ke proyek IKM/SLOI.
- **FR-003**: Sistem MUST membatasi baca, tulis, unggah, hitung, dan ekspor menurut perusahaan dan hak pengguna; akses lintas perusahaan MUST ditolak.
- **FR-004**: Pengguna berwenang MUST dapat mengelola uraian program, kategori/rumpun, lokasi, anggota, dan dokumen pendukung.
- **FR-005**: Pengguna berwenang MUST dapat mengelola kondisi awal-intervensi-hasil, alur input-dampak, kerangka tujuan-aktivitas, dan target roadmap per tahun.
- **FR-006**: Pengguna berwenang MUST dapat menentukan lingkup evaluatif, forecast, atau keduanya serta investasi menurut sumber, bentuk, tahun, dan nominal.
- **FR-007**: Sistem MUST menyimpan stakeholder yang masuk/tidak, perannya, alasan keputusan, dan outcome berikut uji relevansi, signifikansi, materialitas, dan alasannya.
- **FR-008**: Sistem MUST menyimpan indikator, bukti dan sumber, proksi finansial dan sumber, kuantitas per periode/tahun, serta empat penyesuaian dampak beserta alasan masing-masing.
- **FR-009**: Sistem MUST mencegah input lintas program/perusahaan, tahun di luar lingkup, nilai negatif yang tidak sah, persentase di luar 0–100, dan mata uang yang tidak konsisten.
- **FR-010**: Sistem MUST menghitung hasil dari outcome material milik stakeholder yang disertakan, memperlihatkan manfaat dan investasi per tahun/total, serta menandai rasio tidak terdefinisi ketika investasi nol.
- **FR-011**: Setiap perhitungan MUST mencatat identitas metode, parameter, sumber input, dan rincian hasil yang tetap dapat ditelusuri setelah input berubah.
- **FR-012**: Sistem MUST menyediakan ekspor data tahap serta laporan penuh, ringkasan eksekutif, kuantitatif, dan kualitatif yang terkait dengan hasil perhitungan tertentu.
- **FR-013**: Sistem MUST mencatat pelaku dan waktu perubahan penting, perhitungan, serta ekspor tanpa menyimpan kredensial dalam jejak audit.
- **FR-014**: Penambahan SROI MUST mempertahankan alur, data, dan hasil IKM/SLOI yang sudah ada.

### Key Entities *(include if feature involves data)*

- **Perusahaan dan pengguna**: Identitas bersama aplikasi CSR; batas kepemilikan dan hak akses SROI.
- **Program SROI**: Penilaian independen dengan lokasi, anggota, berkas, kategori, dan periode.
- **Kerangka program**: Kondisi perubahan, alur dampak, hierarki tujuan, aktivitas, dan target tahunan.
- **Lingkup dan investasi**: Jenis periode serta kontribusi menurut investor dan tahun.
- **Stakeholder dan outcome**: Pihak terdampak, keputusan pelibatan, perubahan, dan materialitasnya.
- **Bukti dampak**: Indikator, bukti, proksi finansial, kuantitas, dan penyesuaian tahunan.
- **Hasil perhitungan**: Versi metode, asumsi, rincian manfaat dan investasi, agregat, serta rasio historis.
- **Laporan dan audit**: Berkas hasil dan jejak aktivitas yang merujuk program dan versi hasil.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Pengguna berwenang dapat membuat program SROI dan membuka tahap pertamanya dalam 5 menit menggunakan data lengkap.
- **SC-002**: Seluruh 8 tahap input program yang diamati dapat diisi dan dibuka kembali untuk satu program uji tanpa kehilangan keterkaitan data; hasil perhitungan, ringkasan, daftar, dan laporan dapat ditinjau terpisah.
- **SC-003**: Untuk 100% kasus uji lintas perusahaan, data program dan berkas tidak dapat dibaca, diubah, atau diekspor pihak lain.
- **SC-004**: Untuk 100% contoh uji dua periode/tahun yang memiliki data lengkap, rincian outcome dan investasi cocok dengan total yang ditampilkan; investasi nol tidak menghasilkan rasio angka.
- **SC-005**: Untuk 100% perubahan input setelah hasil disimpan, hasil dan laporan historis tetap dapat diperiksa tanpa perubahan nilai.
- **SC-006**: Pada uji regresi, seluruh alur IKM/SLOI yang sebelumnya lulus tetap lulus dan tidak menampilkan program SROI sebagai proyeknya.

## Assumptions

- Tahap permintaan ini hanya menghasilkan spesifikasi serta rancangan database `csr.md`; implementasi aplikasi dan migrasi dilakukan terpisah.
- Akun, perusahaan, dan master wilayah dipakai bersama; data program dan penilaian SROI tidak memakai proyek, responden, submission, atau template IKM/SLOI.
- Struktur 18 tabel domain IKM/SLOI yang sudah berjalan dipertahankan; kebutuhan SROI baru dirancang sebagai perluasan tersendiri.
- Situs pembanding menjadi acuan alur tampilan, bukan sumber pasti algoritme internal, hak setiap peran, ataupun skema databasenya.
- Contoh angka dan metode dalam dokumen `sroi/` tidak diperlakukan sebagai hasil situs yang telah terverifikasi; detail perhitungan menjadi keputusan eksplisit pada tahap perencanaan teknis.
