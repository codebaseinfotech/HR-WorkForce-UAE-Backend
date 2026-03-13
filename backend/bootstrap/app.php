<?php

use App\Exceptions\Handler as ExceptionHandler;
use App\Http\Middleware\FormatApiErrorResponse;
use Illuminate\Contracts\Debug\ExceptionHandler as ExceptionHandlerContract;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Middleware;

$app = Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'jwt.auth' => \App\Http\Middleware\ApiAuthMiddleware::class,
            'permission' => \App\Http\Middleware\CheckPermission::class,
        ]);

        $middleware->api(prepend: [
            FormatApiErrorResponse::class,
        ]);
    })
    ->create();

$app->singleton(ExceptionHandlerContract::class, ExceptionHandler::class);

return $app;
