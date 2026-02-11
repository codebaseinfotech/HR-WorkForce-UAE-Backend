<?php

if (! function_exists('generateEmployeeId')) {
    function generateEmployeeId($userId, $roleName)
    {
        // role name na first 2 alphabet
        $prefix = strtoupper(substr($roleName, 0, 2));

        $random = rand(100, 999);

        return $prefix.$userId.$random;
    }
}

if (! function_exists('null_string')) {

    function null_string($value, $default = 'N/A')
    {
        return $value ?? $default;
    }
}
if (! function_exists('authUser')) {
    function authUser()
    {
        if (! auth('api')->check()) {
            return response()->json([
                'status' => false,
                'message' => 'Unauthenticated',
            ], 401);
        }

        return auth('api')->user();
    }
}
