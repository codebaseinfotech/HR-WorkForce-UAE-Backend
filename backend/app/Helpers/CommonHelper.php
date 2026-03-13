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
if (! function_exists('calculateDistance')) {
    function calculateDistance($lat1, $lon1, $lat2, $lon2)
    {
        $earthRadius = 6371;

        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);

        $a = sin($dLat/2) * sin($dLat/2) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($dLon/2) * sin($dLon/2);

        $c = 2 * atan2(sqrt($a), sqrt(1-$a));

        return $earthRadius * $c;
    }

}
