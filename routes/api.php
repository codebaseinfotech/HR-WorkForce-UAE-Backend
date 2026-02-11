<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;

Route::get('/test', function () {
    return response()->json([
        'status' => true,
        'message' => 'API working'
    ]);
});

Route::post('sign-up', [AuthController::class, 'signup']);
Route::post('sign-in', [AuthController::class, 'signin'])->name('login');
Route::post('forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('verify-otp', [AuthController::class, 'verifyOtp']);
Route::post('reset-password', [AuthController::class, 'resetPassword']);

Route::middleware('jwt.auth')->group(function () {

    Route::get('profile', [AuthController::class, 'profile']);
    // Route::post('logout', [AuthController::class, 'logout']);

});
