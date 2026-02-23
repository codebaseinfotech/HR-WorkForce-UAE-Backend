<?php

use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CompanyController;
use App\Http\Controllers\Api\LeaveController;
use App\Http\Controllers\Api\OvertimeController;
use App\Http\Controllers\Api\PermissionController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\RolePermissionController;
use Illuminate\Support\Facades\Route;

Route::get('/test', function () {
    return response()->json([
        'status' => true,
        'message' => 'API working',
    ]);
});

Route::post('sign-up', [AuthController::class, 'signup']);
Route::post('sign-in', [AuthController::class, 'signin'])->name('login');
Route::post('forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('verify-otp', [AuthController::class, 'verifyOtp']);
Route::post('reset-password', [AuthController::class, 'resetPassword']);

Route::prefix('v1')->middleware('jwt.auth')->group(function () {
    Route::get('my-permissions', [PermissionController::class, 'myPermissions']);
    // Route::post('logout', [AuthController::class, 'logout']);
    Route::get('profile', [AuthController::class, 'profile']);

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
           
    Route::prefix('attendances')->group(function () {
        Route::get('/all', [AttendanceController::class, 'index']); // List all attendances
        Route::post('/mark', [AttendanceController::class, 'mark']); // Mark attendance
    });

    Route::prefix('overtimes')->group(function () {
        Route::get('/', [OvertimeController::class, 'index']); // List overtimes
        Route::post('/add', [OvertimeController::class, 'add']); // Add overtime
    });

    Route::prefix('leaves')->group(function () {
        Route::get('/', [LeaveController::class, 'index']); // List leaves
        Route::post('/apply', [LeaveController::class, 'apply']); // Apply leave
    });
});