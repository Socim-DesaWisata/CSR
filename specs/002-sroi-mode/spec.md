# Feature Specification: Mode dan Alur SROI

**Feature Branch**: Tidak dibuat (tanpa hook branch)
**Created**: 2026-09-24
**Status**: Draft
**Input**: Implementasikan SROI mandiri menurut `csr.md`, dengan menu SROI di atas Settings; ketika dipilih, sidebar berganti menyerupai situs rujukan sambil mempertahankan identitas visual CSR. Semua tahap input aktif, tetapi perhitungan rasio ditunda sampai rumus disahkan.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Pindah mode dan memilih program (Priority: P1)

Pengguna perusahaan atau admin memilih SROI dari sidebar utama, melihat navigasi khusus SROI, lalu memilih program melalui aksi pensil. Pengguna dapat kembali ke mode IKM/SLOI kapan pun.

**Why this priority**: Pemisahan menu dan program mencegah pengguna mencampur dua alur penilaian.

**Independent Test**: Masuk ke mode SROI, pilih satu program, buka tahap, segarkan halaman, lalu kembali ke mode lama; menu dan konteks program tetap tepat.

**Acceptance Scenarios**:

1. **Given** pengguna berwenang di mode CSR, **When** ia memilih SROI di atas Settings, **Then** sidebar berubah ke menu SROI dan data proyek IKM/SLOI tidak muncul sebagai program SROI.
2. **Given** program SROI dipilih melalui aksi pensil, **When** pengguna membuka tautan tahap atau menyegarkan halaman, **Then** tahap tetap menunjukkan program yang sama.
3. **Given** pengguna enumerator atau tidak berwenang, **When** ia mencoba membuka mode atau alamat tahap secara langsung, **Then** akses ditolak.

---

### User Story 2 - Menyusun seluruh data penilaian (Priority: P2)

Analis mengisi deskripsi, Theory of Change, LFA, roadmap, scope, investasi, stakeholder, outcome, dan tabel dampak per tahun melalui menu yang mengikuti urutan situs rujukan.

**Why this priority**: Seluruh data primer harus tersedia sebelum suatu metode perhitungan dapat disahkan.

**Independent Test**: Buat program baru, isi delapan tahap, keluar dan buka kembali; semua nilai dan keterkaitan tetap benar.

**Acceptance Scenarios**:

1. **Given** program terpilih, **When** pengguna menyimpan tiap tahap, **Then** datanya muncul kembali di tahap terkait dan tidak bocor ke perusahaan lain.
2. **Given** data investasi atau dampak belum diketahui, **When** draft disimpan, **Then** nilai kosong tetap kosong dan tidak berubah diam-diam menjadi nol.
3. **Given** pengguna memilih kategori, indikator, atau proksi dari program lain, **When** penyimpanan diminta, **Then** sistem menolak hubungan yang salah.

---

### User Story 3 - Ekspor tanpa hasil rekaan (Priority: P3)

Pengguna mengekspor lembar data tahap dan laporan naratif tanpa rasio. Menu kalkulasi dan laporan hasil tetap terlihat, tetapi menjelaskan bahwa rumus belum disahkan.

**Why this priority**: Pengguna dapat bekerja dan membagikan bukti tanpa menerbitkan rasio yang belum sah.

**Independent Test**: Ekspor data dan laporan naratif untuk program lengkap; pastikan rasio tidak muncul dan laporan berbasis hasil tidak dapat dibuat.

**Acceptance Scenarios**:

1. **Given** program berisi data, **When** pengguna meminta ekspor tahap atau laporan naratif, **Then** berkas memuat data program yang benar tanpa rasio SROI.
2. **Given** belum ada metode disahkan, **When** pengguna membuka Calculation, Full Report, atau laporan kuantitatif, **Then** status tertunda jelas terlihat dan tidak ada hasil angka rekaan.
3. **Given** pengguna perusahaan lain, **When** ia meminta berkas atau laporan, **Then** akses ditolak.

### Edge Cases

- Menu tahap tanpa program terpilih memberi arahan memilih program, bukan menampilkan data terakhir pengguna lain.
- Perpindahan mode, kembali, dan refresh tidak boleh mempertahankan konteks program yang tidak berhak diakses.
- Perusahaan nonaktif, berkas tak sah, persentase/tahun tak valid, dan data lintas perusahaan ditolak.
- Jika ekspor gagal, pengguna mendapat status kegagalan tanpa berkas parsial atau tautan publik.
- Pada layar sempit, sidebar dapat dibuka dan seluruh kolom tabel tetap dapat diakses dengan gulir.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Sistem MUST menampilkan menu SROI tepat sebelum Settings bagi admin dan pengguna perusahaan berwenang, bukan enumerator.
- **FR-002**: Sistem MUST menampilkan sidebar SROI tersendiri dengan kelompok dan urutan Dashboard, Program List, SROI Report; General Description, Theory of Change, LFA, Roadmap; Program Scope, Stakeholder Identification, Outcome Identification, SROI Table, SROI Calculation.
- **FR-003**: Sistem MUST menyediakan jalan kembali ke sidebar CSR; mode dan program terpilih tetap benar pada navigasi, refresh, dan tautan langsung.
- **FR-004**: Katalog Stakeholder & Outcome serta Company List MUST hanya tampak dan dapat diakses admin; Company List memakai data perusahaan CSR yang ada.
- **FR-005**: Program dan delapan tahap input MUST mengikuti alur situs rujukan, termasuk daftar, aksi pensil, tambah/simpan, data tahunan, dan ekspor tahap, dengan gaya visual CSR.
- **FR-006**: Sistem MUST memisahkan data SROI dari proyek, responden, jawaban, dan skor IKM/SLOI; hanya akun, perusahaan, dan wilayah yang dipakai bersama.
- **FR-007**: Hak pengguna MUST diperiksa saat melihat, mengubah, mengunggah, mengekspor, atau mengunduh data program.
- **FR-008**: Sistem MUST menyimpan draft nilai yang belum diketahui sebagai kosong, memvalidasi tahun/persentase/nominal, dan mencatat perubahan penting.
- **FR-009**: Sistem MUST menyediakan ekspor data tahap dan laporan naratif tanpa rasio dalam berkas privat yang dapat diakses hanya oleh pengguna berwenang.
- **FR-010**: Menu perhitungan dan laporan berbasis rasio MUST terlihat tetapi tidak menghitung atau menerbitkan hasil sebelum rumus resmi disahkan.
- **FR-011**: Alur IKM/SLOI yang sudah ada MUST tetap dapat digunakan tanpa perubahan perilaku.

### Key Entities *(include if feature involves data)*

- **Pengguna dan perusahaan**: Identitas bersama dengan batas hak akses data.
- **Program SROI**: Unit kerja mandiri beserta kategori, lokasi, anggota, dokumen, dan periode.
- **Kerangka, investasi, dan dampak**: Tahap input yang saling terkait dalam satu program.
- **Ekspor dan audit**: Berkas privat serta jejak perubahan menurut pengguna dan perusahaan.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Pengguna berwenang dapat berpindah mode, memilih program, dan membuka tahap pertama dalam kurang dari dua menit.
- **SC-002**: Delapan tahap input dapat diisi dan dibuka kembali pada satu program uji tanpa kehilangan data.
- **SC-003**: Seluruh skenario uji lintas perusahaan dan enumerator menolak akses baca, ubah, dan unduh yang tidak sah.
- **SC-004**: Seluruh ekspor uji memuat data perusahaan/program yang benar; tidak ada rasio atau hasil kalkulasi sebelum metode disahkan.
- **SC-005**: Sidebar tetap operasional pada lebar layar ponsel dan desktop serta setelah refresh dan navigasi langsung.
- **SC-006**: Alur uji IKM/SLOI yang sebelumnya lulus tetap lulus.

## Assumptions

- Acuan fitur dan relasi adalah `csr.md` serta spesifikasi SROI mandiri sebelumnya; rancangan perusahaan tidak ditambah dengan tabel profil, kontak, atau sektor SROI.
- Kemiripan dengan situs rujukan mencakup susunan dan interaksi menu, bukan menyalin merek atau warnanya.
- Laporan naratif dan ekspor tahap aktif; laporan penuh/kuantitatif berbasis rasio menunggu persetujuan rumus.
- Akses admin mencakup data lintas perusahaan dengan otorisasi; pengguna perusahaan hanya datanya sendiri.
