<?php

use App\Http\Controllers\AreaController;
use App\Http\Controllers\CompanyController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Enumerator\ProjectController as EnumeratorProjectController;
use App\Http\Controllers\Enumerator\SurveyController as EnumeratorSurveyController;
use App\Http\Controllers\EnumeratorController;
use App\Http\Controllers\ExcelController;
use App\Http\Controllers\InstrumentTemplateController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\Sroi\CatalogController as SroiCatalogController;
use App\Http\Controllers\Sroi\DocumentController as SroiDocumentController;
use App\Http\Controllers\Sroi\ExportController as SroiExportController;
use App\Http\Controllers\Sroi\ProgramController as SroiProgramController;
use App\Http\Controllers\Sroi\StageController as SroiStageController;
use App\Http\Controllers\SubmissionController;
use App\Http\Controllers\UserController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::prefix('sroi')->middleware('auth')->name('sroi.')->group(function () {
    Route::get('/', [SroiProgramController::class, 'dashboard'])->name('dashboard');
    Route::get('/program', [SroiProgramController::class, 'index'])->name('programs.index');
    Route::post('/program', [SroiProgramController::class, 'store'])->name('programs.store');
    Route::put('/program/{program}', [SroiProgramController::class, 'update'])->name('programs.update');
    Route::get('/program/{program}/{stage}', [SroiStageController::class, 'show'])->name('programs.stage');
    Route::put('/program/{program}/theory-of-change', [SroiStageController::class, 'saveTheory'])->name('theory-of-change.save');
    Route::put('/program/{program}/{stage}/entries/batch', [SroiStageController::class, 'saveBatch'])->name('stages.batch-save');
    Route::post('/program/{program}/entry/{section}', [SroiStageController::class, 'store'])->name('entries.store');
    Route::put('/program/{program}/entry/{section}/{entry}', [SroiStageController::class, 'update'])->name('entries.update');
    Route::delete('/program/{program}/entry/{section}/{entry}', [SroiStageController::class, 'destroy'])->name('entries.destroy');
    Route::get('/catalog', [SroiCatalogController::class, 'index'])->name('catalog.index');
    Route::get('/companies', fn (\Illuminate\Http\Request $request) => app(SroiCatalogController::class)->index($request, 'companies'))->name('companies.index');
    Route::post('/catalog/{kind}', [SroiCatalogController::class, 'store'])->name('catalog.store');
    Route::put('/catalog/{kind}/{entry}', [SroiCatalogController::class, 'update'])->name('catalog.update');
    Route::post('/program/{program}/export/{stage}', [SroiExportController::class, 'create'])->name('exports.store');
    Route::get('/program/{program}/export/{export}', [SroiExportController::class, 'download'])->whereNumber('export')->name('exports.download');
    Route::post('/program/{program}/document/{stage}', [SroiDocumentController::class, 'store'])->name('documents.store');
    Route::get('/program/{program}/document/{document}', [SroiDocumentController::class, 'download'])->whereNumber('document')->name('documents.download');
    Route::get('/program/{program}/areas/{level}', [SroiStageController::class, 'areas'])->name('areas.index');
});

Route::prefix('enumerator')->middleware('auth')->name('enumerator.')->group(function () {
    Route::get('/list', [EnumeratorProjectController::class, 'listProjectPage'])->name('list-survey');
    Route::get('/survey/respondent/{projectId}', [EnumeratorSurveyController::class, 'surveyRespondentPage'])->name('survey.respondent');
    Route::post('/survey/respondent/{projectId}/store', [EnumeratorSurveyController::class, 'storeDataSurvey'])->name('survey.store');
    Route::get('/survey/history', [EnumeratorSurveyController::class, 'historyPage'])->name('survey.history');
    Route::get('/survey/{submissionId}/edit', [EnumeratorSurveyController::class, 'editPage'])->name('survey.edit');
    Route::put('/survey/{submissionId}', [EnumeratorSurveyController::class, 'updateDataSurvey'])->name('survey.update');

    // Route::get('/survey/questions', function () {
    //     return Inertia::render('Enumerator/Survey/QuestionSurvey');
    // })->name('survey.questions');

    // Route::get('/survey/review', function () {
    //     return Inertia::render('Enumerator/Survey/ReviewSurvey');
    // })->name('survey.review');
});

Route::prefix('api/area')->name('api.area.')->group(function () {
    Route::get('/provinces', [AreaController::class, 'getProvinces'])->name('provinces');
    Route::get('/cities', [AreaController::class, 'getCities'])->name('cities');
    Route::get('/districts', [AreaController::class, 'getDistricts'])->name('districts');
});
Route::prefix('api/projects')->name('api.projects.')->group(function () {
    Route::get('/{id}/enumerators', [ProjectController::class, 'getProjectEnumerators'])->name('enumerators');
    Route::get('/{id}/edit-data', [ProjectController::class, 'getProjectForEdit'])->name('edit-data');
});

// Company Routes
Route::middleware('auth')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'dashboard'])->name('dashboard');
    // Projects
    Route::get('/projects', [ProjectController::class, 'listProjectPage'])->name('projects');
    Route::get('/projects/create', [ProjectController::class, 'createProjectPage'])->name('projects.create');
    Route::post('/projects', [ProjectController::class, 'storeProject'])->name('projects.store');
    Route::post('/projects/{id}/assign-enumerators', [ProjectController::class, 'assignEnumerators'])->name('projects.assign-enumerators');
    Route::put('/projects/{id}', [ProjectController::class, 'updateProject'])->name('projects.update');
    Route::patch('/projects/{id}', [ProjectController::class, 'patchProject'])->name('projects.patch');
    Route::patch('/projects/{id}/status', [ProjectController::class, 'updateStatus'])->name('projects.update-status');
    Route::patch('/submissions/bulk-status', [SubmissionController::class, 'bulkUpdateStatus'])->name('submissions.bulk-status');
    Route::get('/projects/{id}/export-respondents', [ExcelController::class, 'exportRespondents'])->name('projects.export-respondents');
    Route::get('/projects/{id}', [ProjectController::class, 'detailProject'])->name('projects.show');
    // Enumerators
    Route::get('/enumerators', [EnumeratorController::class, 'index'])->name('enumerators.index');
    Route::post('/enumerators', [EnumeratorController::class, 'store'])->name('enumerators.store');
    Route::put('/enumerators/{id}', [EnumeratorController::class, 'update'])->name('enumerators.update');
    Route::delete('/enumerators/{id}', [EnumeratorController::class, 'destroy'])->name('enumerators.destroy');
    Route::get('/enumerators/{id}', [EnumeratorController::class, 'show'])->name('enumerators.show');
    // Companies
    Route::get('/companies', [CompanyController::class, 'index'])->name('companies.index');
    Route::post('/companies', [CompanyController::class, 'store'])->name('companies.store');
    // Users

    // Templates
    Route::get('/templates', [InstrumentTemplateController::class, 'index'])->name('templates.index');
    Route::post('/templates', [InstrumentTemplateController::class, 'store'])->name('templates.store');
    Route::get('/templates/{id}', [InstrumentTemplateController::class, 'show'])->name('templates.show');
    Route::put('/templates/{id}', [InstrumentTemplateController::class, 'update'])->name('templates.update');
    Route::delete('/templates/{id}', [InstrumentTemplateController::class, 'destroy'])->name('templates.destroy');
    Route::post('/templates/{templateId}/questions', [InstrumentTemplateController::class, 'storeQuestion'])->name('templates.questions.store');
    Route::put('/templates/{templateId}/questions/{questionId}', [InstrumentTemplateController::class, 'updateQuestion'])->name('templates.questions.update');
    Route::delete('/templates/{templateId}/questions/{questionId}', [InstrumentTemplateController::class, 'destroyQuestion'])->name('templates.questions.destroy');

    Route::group(['middleware' => 'role:admin,superadmin,company'], function () {
        Route::get('/users', [UserController::class, 'index'])->middleware('role:admin,superadmin')->name('users.index');
        Route::post('/users', [UserController::class, 'store'])->middleware('role:admin,superadmin')->name('users.store');
        Route::patch('/users/{id}', [UserController::class, 'update'])->middleware('role:admin,superadmin')->name('users.update');
    });

});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::patch('/profile/company', [ProfileController::class, 'updateCompany'])->name('profile.update-company');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
