<?php

namespace App\Exceptions;

use App\Support\ApiErrorResponse;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Throwable;

class Handler extends ExceptionHandler
{
    /**
     * Render an exception into an HTTP response.
     */
    public function render($request, Throwable $e): SymfonyResponse
    {
        if (! ApiErrorResponse::isApiRequest($request)) {
            return parent::render($request, $e);
        }

        return match (true) {
            $e instanceof HttpResponseException => ApiErrorResponse::normalizeResponse($e->getResponse()),
            $e instanceof AuthenticationException => ApiErrorResponse::make('Unauthorized access', 401),
            $e instanceof AuthorizationException => ApiErrorResponse::make('Access denied', 403),
            $e instanceof ModelNotFoundException => ApiErrorResponse::make('Resource not found', 404),
            $e instanceof ValidationException => ApiErrorResponse::make('Validation failed', 422, $e->errors()),
            $e instanceof HttpExceptionInterface => ApiErrorResponse::make(
                ApiErrorResponse::defaultMessage($e->getStatusCode()),
                $e->getStatusCode(),
                headers: $e->getHeaders()
            ),
            default => ApiErrorResponse::make('Something went wrong', 500),
        };
    }
}
