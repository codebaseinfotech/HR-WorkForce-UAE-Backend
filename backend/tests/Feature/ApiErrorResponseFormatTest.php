<?php

namespace Tests\Feature;

use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\Route;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class ApiErrorResponseFormatTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Route::middleware('api')->prefix('api/testing/error-format')->group(function () {
            Route::get('/authentication', fn () => throw new AuthenticationException());
            Route::get('/authorization', fn () => throw new AuthorizationException());
            Route::get('/model-not-found', function () {
                throw (new ModelNotFoundException())->setModel(ApiErrorResponseTestModel::class, [999]);
            });
            Route::post('/validation', function () {
                throw ValidationException::withMessages([
                    'email' => ['The email field is required.'],
                ]);
            });
            Route::get('/exception', fn () => throw new \RuntimeException('Boom'));
            Route::get('/manual', fn () => response()->json([
                'success' => false,
                'message' => 'Invalid request',
                'details' => ['field' => 'company_id'],
            ], 400));
            Route::get('/success', fn () => response()->json([
                'status' => true,
                'data' => ['ok' => true],
            ]));
        });
    }

    public function test_protected_api_route_returns_standard_401_without_token(): void
    {
        $this->getJson('/api/v1/profile')
            ->assertStatus(401)
            ->assertExactJson([
                'status' => false,
                'message' => 'Unauthorized access',
                'error_code' => 401,
            ]);
    }

    public function test_authentication_exception_returns_standard_payload(): void
    {
        $this->getJson('/api/testing/error-format/authentication')
            ->assertStatus(401)
            ->assertExactJson([
                'status' => false,
                'message' => 'Unauthorized access',
                'error_code' => 401,
            ]);
    }

    public function test_authorization_exception_returns_standard_payload(): void
    {
        $this->getJson('/api/testing/error-format/authorization')
            ->assertStatus(403)
            ->assertExactJson([
                'status' => false,
                'message' => 'Access denied',
                'error_code' => 403,
            ]);
    }

    public function test_model_not_found_exception_returns_standard_payload(): void
    {
        $this->getJson('/api/testing/error-format/model-not-found')
            ->assertStatus(404)
            ->assertExactJson([
                'status' => false,
                'message' => 'Resource not found',
                'error_code' => 404,
            ]);
    }

    public function test_validation_exception_returns_standard_payload_with_errors(): void
    {
        $this->postJson('/api/testing/error-format/validation')
            ->assertStatus(422)
            ->assertJson([
                'status' => false,
                'message' => 'Validation failed',
                'error_code' => 422,
                'errors' => [
                    'email' => ['The email field is required.'],
                ],
            ]);
    }

    public function test_unhandled_exception_returns_standard_500_payload(): void
    {
        $this->getJson('/api/testing/error-format/exception')
            ->assertStatus(500)
            ->assertExactJson([
                'status' => false,
                'message' => 'Something went wrong',
                'error_code' => 500,
            ]);
    }

    public function test_manual_error_responses_are_normalized_without_losing_context(): void
    {
        $this->getJson('/api/testing/error-format/manual')
            ->assertStatus(400)
            ->assertJson([
                'status' => false,
                'message' => 'Invalid request',
                'error_code' => 400,
                'details' => ['field' => 'company_id'],
            ])
            ->assertJsonMissing(['success' => false]);
    }

    public function test_success_responses_remain_unchanged(): void
    {
        $this->getJson('/api/testing/error-format/success')
            ->assertStatus(200)
            ->assertExactJson([
                'status' => true,
                'data' => ['ok' => true],
            ]);
    }
}

class ApiErrorResponseTestModel extends Model
{
}
