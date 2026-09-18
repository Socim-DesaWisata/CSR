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
use App\Http\Controllers\ProjectSroiFormController;
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

Route::prefix('enumerator')->middleware('auth')->name('enumerator.')->group(function () {
    Route::get('/list', [EnumeratorProjectController::class, 'listProjectPage'])->name('list-survey');
    Route::get('/sroi', [EnumeratorProjectController::class, 'listSroiPage'])->name('sroi.index');
    Route::get('/sroi/{project}/data', [EnumeratorProjectController::class, 'dataSroiPage'])->name('sroi.data');
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
    Route::post('/projects/{id}/stakeholders', [ProjectController::class, 'storeStakeholder'])->name('projects.stakeholders.store');
    Route::patch('/projects/{id}/stakeholders/{stakeholder}', [ProjectController::class, 'updateStakeholder'])->name('projects.stakeholders.update');
    Route::delete('/projects/{id}/stakeholders/{stakeholder}', [ProjectController::class, 'destroyStakeholder'])->name('projects.stakeholders.destroy');
    Route::post('/projects/{id}/stakeholder-outcomes', [ProjectController::class, 'storeStakeholderOutcome'])->name('projects.stakeholder-outcomes.store');
    Route::patch('/projects/{id}/stakeholder-outcomes/{outcome}', [ProjectController::class, 'updateStakeholderOutcome'])->name('projects.stakeholder-outcomes.update');
    Route::delete('/projects/{id}/stakeholder-outcomes/{outcome}', [ProjectController::class, 'destroyStakeholderOutcome'])->name('projects.stakeholder-outcomes.destroy');
    Route::patch('/submissions/bulk-status', [SubmissionController::class, 'bulkUpdateStatus'])->name('submissions.bulk-status');
    Route::get('/projects/{id}/export-respondents', [ExcelController::class, 'exportRespondents'])->name('projects.export-respondents');
    Route::get('/projects/{project}/sroi/forms/{form}/preview', [ProjectSroiFormController::class, 'preview'])->name('projects.sroi.forms.preview');
    Route::get('/projects/{project}/sroi/submissions/{submission}/answers', [ProjectSroiFormController::class, 'answers'])->name('projects.sroi.answers.show');
    Route::post('/projects/{project}/sroi/forms', [ProjectSroiFormController::class, 'store'])->name('projects.sroi.forms.store');
    Route::patch('/projects/{project}/sroi/forms/{form}', [ProjectSroiFormController::class, 'update'])->name('projects.sroi.forms.update');
    Route::post('/projects/{project}/sroi/forms/{form}/sections', [ProjectSroiFormController::class, 'storeSection'])->name('projects.sroi.sections.store');
    Route::patch('/projects/{project}/sroi/forms/{form}/sections/{section}', [ProjectSroiFormController::class, 'updateSection'])->name('projects.sroi.sections.update');
    Route::delete('/projects/{project}/sroi/forms/{form}/sections/{section}', [ProjectSroiFormController::class, 'destroySection'])->name('projects.sroi.sections.destroy');
    Route::post('/projects/{project}/sroi/forms/{form}/questions', [ProjectSroiFormController::class, 'storeQuestion'])->name('projects.sroi.questions.store');
    Route::patch('/projects/{project}/sroi/forms/{form}/questions/{question}', [ProjectSroiFormController::class, 'updateQuestion'])->name('projects.sroi.questions.update');
    Route::delete('/projects/{project}/sroi/forms/{form}/questions/{question}', [ProjectSroiFormController::class, 'destroyQuestion'])->name('projects.sroi.questions.destroy');
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
