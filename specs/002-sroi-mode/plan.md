# Rencana Implementasi Mode SROI

**Spesifikasi**: `spec.md` | **Skema**: `../../csr.md` | **Stack**: Laravel 12, MySQL, Inertia v2, React 18, Pest 4

## Arsitektur

1. Migrasikan 24 tabel operasional SROI. Gunakan `companies`, `users`, serta master wilayah yang ada; jangan kaitkan `sroi_programs` dengan `projects` atau submission IKM/SLOI.
2. Otorisasi tiap route menurut peran, perusahaan, dan keanggotaan program. Owner/editor mengubah data; viewer membaca/mengekspor; admin mengelola katalog lintas perusahaan. Jangan bergantung pada middleware `role` lama yang belum menegakkan akses.
3. Bedakan mode lewat prefiks `/sroi`, tampilkan sidebar khusus, dan bawa ID program pada URL tahap. Program List memakai aksi pensil. Delapan tahap input menggunakan tabel sesuai `csr.md`.
4. Simpan bukti dan ekspor di disk `local` privat. Gunakan spreadsheet yang sudah terpasang untuk XLSX dan PHPWord yang disetujui untuk DOCX naratif. Tampilkan status tertunda untuk rasio dan laporan kuantitatif.
5. Uji lintas perusahaan, data draft null, referensi lintas program, unggahan/unduhan, serta regresi IKM/SLOI. Jalankan Pint dan build frontend.

## Batas fase

Lima tabel metode/run serta `sroi_report_exports.run_id` tidak dibuat sampai rumus resmi disahkan. Tidak ada rasio contoh. Migrasi dijalankan secara bertambah (`php artisan migrate`), bukan `migrate:fresh`.

## Konstitusi

Seluruh mutasi tervalidasi pada request, diotorisasi per program, dan diaudit. Perubahan tidak boleh mengubah perilaku domain IKM/SLOI atau menambah perusahaan SROI duplikat.
