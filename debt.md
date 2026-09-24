1. Kebocoran akses project — app/Http/Controllers/ProjectController.php:69-87 memanggil ProjectService::getProjectDetail() tanpa scope company_id. Di app/
     Services/ProjectService.php:378-387 hanya findOrFail($projectId). Company bisa akses detail project company lain kalau tahu ID. Ini high severity.

  2. Endpoint API project terbuka — routes/web.php baris 51-54 menaruh api/projects/{id}/enumerators dan api/projects/{id}/edit-data di luar auth.
     Controller-nya pakai Auth::user() di app/Http/Controllers/ProjectController.php:221-232, jadi guest bisa 500. Kalau nanti dipakai luas, ini juga titik
     exposure data.

  3. Enumerator bisa isi survey tanpa assignment check — app/Http/Controllers/Enumerator/SurveyController.php:24-35 dan :50-59 tidak verifikasi apakah
     enumerator memang di-assign ke project. Ini selaras dengan gap di routes/web.php:29-35 yang hanya auth, tanpa role/assignment guard.

  4. Bug label SLOI — app/Services/ProjectService.php:1222-1238 getSloiValidityLabel() mengembalikan string Reliabilitas ..., padahal konteksnya validitas.
     Ini sudah kebukti gagal di test tests/Feature/ProjectSloiReliabilityTest.php:125.

  5. Drift test vs impl — ada 3 test gagal di run terakhir:
      - tests/Feature/Auth/AuthenticationTest.php vs app/Http/Controllers/Auth/AuthenticatedSessionController.php:36-44 redirect company ke /projects,
        bukan /dashboard.

      - tests/Feature/Auth/RegistrationTest.php vs app/Http/Controllers/Auth/RegisteredUserController.php:35-52 register butuh company_name/company_*.
      - tests/Feature/ProfileTest.php vs app/Http/Controllers/ProfileController.php:66-78 delete user pakai soft delete, test masih expect hard delete.

  6. Repo hygiene / technical debt — git ls-files android/app/build menunjukkan artifact build Android ikut tertrack. Itu noise besar, bikin repo berat, dan
     rawan konflik/merge churn.
