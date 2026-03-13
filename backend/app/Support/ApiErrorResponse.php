<?php

namespace App\Support;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class ApiErrorResponse
{
    public static function isApiRequest(Request $request): bool
    {
        return $request->is('api/*') || $request->expectsJson() || $request->wantsJson();
    }

    public static function make(
        string $message,
        int $statusCode,
        array $errors = [],
        array $extra = [],
        array $headers = []
    ): JsonResponse {
        return response()->json(
            self::normalizePayload(array_merge($extra, [
                'message' => $message,
                'errors' => $errors,
            ]), $statusCode),
            $statusCode,
            $headers
        );
    }

    public static function normalizeResponse(SymfonyResponse $response): SymfonyResponse
    {
        $statusCode = $response->getStatusCode();

        if ($response instanceof JsonResponse) {
            $payload = $response->getData(true);

            $response->setData(
                self::normalizePayload(is_array($payload) ? $payload : [], $statusCode)
            );

            return $response;
        }

        $payload = [];
        $content = $response->getContent();

        if (is_string($content) && $content !== '') {
            $decoded = json_decode($content, true);

            if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                $payload = $decoded;
            }
        }

        return response()->json(
            self::normalizePayload($payload, $statusCode),
            $statusCode,
            $response->headers->allPreserveCaseWithoutCookies()
        );
    }

    public static function normalizePayload(array $payload, int $statusCode): array
    {
        $normalized = [
            'status' => false,
            'message' => self::resolveMessage($payload, $statusCode),
            'error_code' => $statusCode,
        ];

        $errors = $payload['errors'] ?? null;
        if (is_array($errors) && $errors !== []) {
            $normalized['errors'] = $errors;
        }

        foreach ($payload as $key => $value) {
            if (in_array($key, ['status', 'success', 'message', 'errors', 'error_code'], true)) {
                continue;
            }

            $normalized[$key] = $value;
        }

        return $normalized;
    }

    public static function defaultMessage(int $statusCode): string
    {
        return match ($statusCode) {
            401 => 'Unauthorized access',
            403 => 'Access denied',
            404 => 'Resource not found',
            422 => 'Validation failed',
            500 => 'Something went wrong',
            default => SymfonyResponse::$statusTexts[$statusCode] ?? 'Something went wrong',
        };
    }

    private static function resolveMessage(array $payload, int $statusCode): string
    {
        $message = $payload['message'] ?? null;

        if (is_string($message) && trim($message) !== '') {
            return $message;
        }

        return self::defaultMessage($statusCode);
    }
}
