<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\LiveLocation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class LiveLocationController extends Controller
{
    // POST /live-location/ping
    public function ping(Request $request)
    {
        $user = Auth::user();

        $data = $request->validate([
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
            'accuracy' => ['nullable', 'numeric', 'min:0'],
            'speed' => ['nullable', 'numeric', 'min:0'],
            'tracked_at' => ['nullable', 'date'],
        ]);

        $company = Company::select('id', 'latitude', 'longitude', 'radius')
            ->where('id', $user->company_id)
            ->firstOrFail();

        $allowedRadius = (int) ($company->radius ?? 100);
        if ($allowedRadius < 100) {
            $allowedRadius = 100;
        }

        $distance = $this->distanceInMeters(
            (float) $data['latitude'],
            (float) $data['longitude'],
            (float) $company->latitude,
            (float) $company->longitude
        );

        $isInside = $distance <= $allowedRadius;

        //  only one row per (company_id,user_id)
        $row = LiveLocation::updateOrCreate(
            [
                'company_id' => $company->id,
                'user_id' => $user->id,
            ],
            [
                'latitude' => $data['latitude'],
                'longitude' => $data['longitude'],
                'accuracy' => $data['accuracy'] ?? null,
                'speed' => $data['speed'] ?? null,
                'tracked_at' => $data['tracked_at'] ?? now(),
                'is_inside_radius' => $isInside,
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Location updated',
            'data' => [
                'id' => $row->id,
                'company_id' => $row->company_id,
                'user_id' => $row->user_id,
                'latitude' => $row->latitude,
                'longitude' => $row->longitude,
                'accuracy' => $row->accuracy,
                'speed' => $row->speed,
                'tracked_at' => $row->tracked_at,
                'is_inside_radius' => $row->is_inside_radius,
            ],
            'distance_meters' => round($distance, 2),
            'allowed_radius' => $allowedRadius,
        ], 200);
    }

    // GET /live-location/me (last location)
    public function me()
    {
        $user = Auth::user();

        $last = LiveLocation::where('company_id', $user->company_id)
            ->where('user_id', $user->id)
            ->latest('id')
            ->first();

        return response()->json([
            'success' => true,
            'data' => $last,
        ]);
    }

    // GET /live-location/user/{userId} (admin)
    public function user($userId)
    {
        $auth = Auth::user();

        $last = LiveLocation::where('company_id', $auth->company_id)
            ->where('user_id', $userId)
            ->latest('id')
            ->first();

        return response()->json(['success' => true, 'data' => $last]);
    }

    // GET /live-location/company (admin: all users last location)
    public function company()
    {
        $auth = Auth::user();

        //  per user latest row
        $rows = LiveLocation::select('live_locations.*')
            ->where('company_id', $auth->company_id)
            ->whereIn('id', function ($q) use ($auth) {
                $q->selectRaw('MAX(id)')
                    ->from('live_locations')
                    ->where('company_id', $auth->company_id)
                    ->groupBy('user_id');
            })
            ->orderByDesc('id')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $rows,
        ]);
    }

    private function distanceInMeters(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        $earthRadius = 6371000; // meters

        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);

        $a = sin($dLat / 2) * sin($dLat / 2)
            + cos(deg2rad($lat1)) * cos(deg2rad($lat2))
            * sin($dLon / 2) * sin($dLon / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }
}