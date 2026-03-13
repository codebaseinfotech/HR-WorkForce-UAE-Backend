<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Artisan;

Route::get('/run-secret-commands-123', function () {

    Artisan::call('optimize:clear');
    Artisan::call('config:clear');
    Artisan::call('cache:clear');
    Artisan::call('migrate', ['--force' => true]);
    Artisan::call('db:seed', ['--force' => true]);

    return "Commands executed successfully";
});

Route::get('/', function () {
    return response()->json([
        'status' => true,
        'message' => 'Laravel app is live on Render'
    ]);
});

Route::get('/test', function () {
    return 'OK';
});

Route::get('/health', function () {
    return response()->json([
        'app' => config('app.name'),
        'env' => config('app.env'),
        'status' => 'running'
    ]);
});