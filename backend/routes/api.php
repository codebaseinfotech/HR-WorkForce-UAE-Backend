<?php

use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BlockController;
use App\Http\Controllers\Api\CompanyController;
use App\Http\Controllers\Api\FaqController;
use App\Http\Controllers\Api\HolidayCalendarController;
use App\Http\Controllers\Api\LeaveAdminController;
use App\Http\Controllers\Api\LeaveController;
use App\Http\Controllers\Api\LeavePolicyController;
use App\Http\Controllers\Api\LeaveTypeController;
use App\Http\Controllers\Api\MessageController;
use App\Http\Controllers\Api\MyCalendarController;
use App\Http\Controllers\Api\MyLeaveController;
use App\Http\Controllers\Api\MyTaskController;
use App\Http\Controllers\Api\OvertimeController;
use App\Http\Controllers\Api\PermissionController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\RolePermissionController;
use App\Http\Controllers\Api\TaskAssignmentController;
use App\Http\Controllers\Api\TaskController;
use App\Http\Controllers\Api\ThreadAdminController;
use App\Http\Controllers\Api\TeamController;
use App\Http\Controllers\Api\ThreadController;
use App\Http\Controllers\Api\UsersController;
use App\Http\Controllers\Api\WorkScheduleController;
use Illuminate\Support\Facades\Route;

Route::get('/test', function () {
    return response()->json([
        'status' => true,
        'message' => 'API working',
    ]);
});

Route::post('user-add', [AuthController::class, 'signup']);
Route::get('user-fetch', [AuthController::class, 'userFetch']);
Route::get('/company/{company_id}/my-created-users', [AuthController::class, 'myCreatedUsers']);
Route::post('/users/update-created-by', [AuthController::class, 'updateCreatedBy']);

Route::post('sign-in', [AuthController::class, 'signin'])->name('login');
Route::post('forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('verify-otp', [AuthController::class, 'verifyOtp']);
Route::post('reset-password', [AuthController::class, 'resetPassword']);

Route::prefix('v1')->middleware('jwt.auth')->group(function () {
    Route::get('my-permissions', [PermissionController::class, 'myPermissions']);
    Route::post('logout', [AuthController::class, 'logout']);
    Route::get('profile', [AuthController::class, 'profile']);
    Route::get('dashboard/summary', [AuthController::class, 'summary']);

    Route::get('roles/{id?}',
        [RoleController::class, 'index']
    )->middleware('permission:role.manage,can_view');

    Route::post('roles',
        [RoleController::class, 'store']
    )->middleware('permission:role.manage,can_add');

    Route::put('roles/update/{role}',
        [RoleController::class, 'update']
    )->middleware('permission:role.manage,can_edit');

    Route::delete('roles/delete/{role}',
        [RoleController::class, 'destroy']
    )->middleware('permission:role.manage,can_delete');

    // PERMISSION ROUTES

    Route::get('permissions/{id?}',
        [PermissionController::class, 'index']
    )->middleware('permission:permission.manage,can_view');

    Route::post('permissions',
        [PermissionController::class, 'store']
    )->middleware('permission:permission.manage,can_add');

    Route::put('permissions/update/{permission}',
        [PermissionController::class, 'update']
    )->middleware('permission:permission.manage,can_edit');

    Route::delete('permissions/delete/{permission}',
        [PermissionController::class, 'destroy']
    )->middleware('permission:permission.manage,can_delete');
    // ASSIGN ROLE PERMISSION

    Route::post('roles/{role}/permissions',
        [RolePermissionController::class, 'updatePermissions']
    )->middleware('permission:role.manage,can_edit');

    Route::post('company/save', [CompanyController::class, 'save']);
    Route::get('company/list/{id?}', [CompanyController::class, 'index']);
    Route::delete('company/delete/{id}', [CompanyController::class, 'delete']);

    Route::prefix(' ')->group(function () {
        Route::get('/all', [AttendanceController::class, 'index']); // List all attendances
        Route::post('/mark', [AttendanceController::class, 'mark']); // Mark attendance
        Route::get('/report', [AttendanceController::class, 'report']);
        Route::get('/my-attendance/report/export', [AttendanceController::class, 'export']);
    });

    Route::prefix('overtimes')->group(function () {
        Route::get('/', [OvertimeController::class, 'index']); // List overtimes
        Route::post('/add', [OvertimeController::class, 'add']); // Add overtime
    });

    Route::prefix('leaves')->group(function () {
        Route::get('/', [LeaveController::class, 'index']); // List leaves
        Route::post('/apply', [LeaveController::class, 'apply']); // Apply leave
    });

    // block/unblock
    Route::post('/block', [BlockController::class, 'blockById']);
    Route::delete('/unblock', [BlockController::class, 'unblockById']);
    Route::post('/users/{user}/block', [BlockController::class, 'block']);
    Route::delete('/users/{user}/block', [BlockController::class, 'unblock']);

    // threads
    Route::get('/threads', [ThreadController::class, 'index']);
    Route::post('/threads/direct', [ThreadController::class, 'direct']); // Direct Thread Create / Get
    Route::post('/threads/group', [ThreadController::class, 'createGroup']);
    Route::post('/threads/{thread}/members', [ThreadController::class, 'addMembers']);
    Route::post('/threads/{thread}/leave', [ThreadController::class, 'leave']);
    Route::get('/threads/{thread}/members', [ThreadAdminController::class, 'members']);
    Route::post('/threads/{thread}/admins', [ThreadAdminController::class, 'promote']);
    Route::delete('/threads/{thread}/admins/{user}', [ThreadAdminController::class, 'demote']);
    Route::delete('/threads/{thread}/admins', [ThreadAdminController::class, 'demote']);

    // messages
    Route::get('/threads/{thread}/messages', [MessageController::class, 'list']);
    Route::post('/threads/{thread}/messages', [MessageController::class, 'send']); // json or multipart
    Route::delete('/messages/{message}', [MessageController::class, 'delete']); // scope=me|all

    // seen/unseen
    Route::post('/threads/{thread}/read', [MessageController::class, 'markThreadRead']);
    Route::get('/messages/{message}/reads', [MessageController::class, 'messageReads']);

    Route::get('company/wise/users', [UsersController::class, 'index']);     // company users list
    Route::get('company/wise/users/{user}', [UsersController::class, 'show']); // user profile

    Route::get('/my-tasks', [MyTaskController::class, 'index']); // My Tasks List
    Route::post('/tasks/{task}/action', [MyTaskController::class, 'action']); // Accept Task
    Route::post('/tasks/{task}/feedback', [MyTaskController::class, 'feedback']); // comment + attachment (single API)

    Route::prefix('tasks-admin')->group(function () {
        Route::get('/', [TaskController::class, 'index']);             // list/filter
        Route::post('/add-update', [TaskController::class, 'store']);            // create task
        Route::delete('delete/{task}', [TaskController::class, 'destroy']);  // delete (soft)
        Route::get('/tasks/assigned', [TaskController::class, 'assignedTasks']);
    });

    Route::prefix('tasks/{task}')->group(function () {
        Route::post('/assign', [TaskAssignmentController::class, 'assignToUsers']);   // multi users
        Route::post('/assign-team', [TaskAssignmentController::class, 'assignToTeam']); // team -> users
        Route::post('/update-assignments', [TaskAssignmentController::class, 'updateAssignments']);
    });

    Route::get('/teams/fetch', [TeamController::class, 'index']);
    Route::post('/teams/add-update', [TeamController::class, 'store']);
    Route::delete('/teams/{team}', [TeamController::class, 'destroy']);

    // Work Schedules
    Route::get('/work-schedules', [WorkScheduleController::class, 'index']);
    Route::post('/work-schedules/add-update', [WorkScheduleController::class, 'store']);
    Route::delete('/work-schedules/{workSchedule}', [WorkScheduleController::class, 'destroy']);

    // Holiday Calendar
    Route::get('/holiday-calendars/year', [HolidayCalendarController::class, 'year']);
    Route::post('/holiday-calendars/holidays/add-update', [HolidayCalendarController::class, 'addUpdateHoliday']);
    Route::delete('/holiday-calendars/holidays/delete', [HolidayCalendarController::class, 'deleteHoliday']);

    // Leave Policy
    Route::get('/leave-policies', [LeavePolicyController::class, 'index']);
    Route::post('/leave-policies/add-update', [LeavePolicyController::class, 'store']);
    Route::post('/leave-balances/generate', [LeavePolicyController::class, 'generateBalances']);

    Route::get('/leave-types', [LeaveTypeController::class, 'index']);               // fetch
    Route::post('/leave-types/add-update', [LeaveTypeController::class, 'store']);  // add/update
    Route::delete('/leave-types/{leaveType}', [LeaveTypeController::class, 'destroy']); // delete

    // Calendar + counts (working days/holidays)
    Route::get('/my-calendar/summary', [MyCalendarController::class, 'summary']); // month/year

    // Employee leave
    Route::get('/my-leaves/summary', [MyLeaveController::class, 'summary']);  // allocated/used/balance + counts
    Route::get('/my-leaves/history', [MyLeaveController::class, 'history']);  // list with reason/status
    Route::post('/my-leaves/apply', [MyLeaveController::class, 'apply']);     // apply leave

    // Admin approvals (optional but needed for cut)
    Route::post('/leave-requests/{leaveRequest}/action', [LeaveAdminController::class, 'action']);
    Route::prefix('live')->group(function () {
        Route::post('/location/ping', [\App\Http\Controllers\Api\LiveLocationController::class, 'ping']);
        Route::get('/location/me', [\App\Http\Controllers\Api\LiveLocationController::class, 'me']);
        Route::get('/location/company', [\App\Http\Controllers\Api\LiveLocationController::class, 'company']);
        Route::get('/location/user/{userId}', [\App\Http\Controllers\Api\LiveLocationController::class, 'user']);
    });

    Route::get('/employee-salaries', [\App\Http\Controllers\Api\EmployeeSalaryController::class, 'index']);          // list
    Route::get('/employee-salaries/{id}', [\App\Http\Controllers\Api\EmployeeSalaryController::class, 'show']);      // single
    Route::post('/employee-salaries/add-update', [\App\Http\Controllers\Api\EmployeeSalaryController::class, 'addUpdate']); // create-update
    Route::delete('/employee-salaries/{id}', [\App\Http\Controllers\Api\EmployeeSalaryController::class, 'destroy']); // delete
    Route::get('/salary-slip/pdf', [\App\Http\Controllers\Api\EmployeeSalaryController::class, 'downloadPdf']);
    Route::get('/salary-slip/pdf-range', [\App\Http\Controllers\Api\EmployeeSalaryController::class, 'downloadPdfRange']);
    // APP (accordion)
    Route::get('/faqs', [FaqController::class, 'index']);

    // ADMIN
    Route::get('/faqs', [FaqController::class, 'adminIndex']);
    Route::post('/faqs/add-update', [FaqController::class, 'store']);
    Route::get('/faqs/{id}', [FaqController::class, 'show']);
    Route::delete('/faqs/{id}', [FaqController::class, 'destroy']);
    Route::post('/faqs/{id}/toggle', [FaqController::class, 'toggle']);
});
