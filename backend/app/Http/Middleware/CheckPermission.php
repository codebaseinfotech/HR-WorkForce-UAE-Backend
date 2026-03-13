<?php

namespace App\Http\Middleware;

use App\Support\ApiErrorResponse;
use Closure;
use Illuminate\Http\Request;

class CheckPermission
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, $permission, $action)
    {
        $user = auth()->user();

        if (! $user) {
            return ApiErrorResponse::make('Unauthorized access', 401);
        }

        if (! $user->hasPermission($permission, $action)) {
            return ApiErrorResponse::make('Access denied', 403);
        }

        return $next($request);
    }
}
