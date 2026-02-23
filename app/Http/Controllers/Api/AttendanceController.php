<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Company;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class AttendanceController extends Controller
{
    public function index(Request $request)
    {
        $authUser = Auth::user();
        $tz = 'Asia/Kolkata';

        //  Date (today by default)
        $date = $request->get('date', now()->setTimezone($tz)->toDateString()); // YYYY-MM-DD

        //  Today's attendance (single row)
        $attendance = Attendance::where('user_id', $authUser->id)
            ->where('date', $date)
            ->latest('id')
            ->first();

        //  Helper: time format
        $fmtTime = function ($t) use ($tz) {
            if (! $t) {
                return null;
            } // or '--'

            // $t expected: "H:i:s" or "H:i"
            return \Carbon\Carbon::createFromFormat(strlen($t) > 5 ? 'H:i:s' : 'H:i', $t, $tz)->format('h:i A');
        };

        //  Helper: minutes -> "01 Hrs 00 Min"
        $fmtDuration = function ($minutes) {
            $minutes = (int) max($minutes, 0);
            $h = intdiv($minutes, 60);
            $m = $minutes % 60;

            return sprintf('%02d Hrs %02d Min', $h, $m);
        };

        $breakMinutes = 0;
        $workMinutes = 0;

        if ($attendance && $attendance->check_in && $attendance->check_out) {
            $in = strtotime($attendance->check_in);
            $out = strtotime($attendance->check_out);

            $total = max(($out - $in) / 60, 0);

            if ($attendance->break_in && $attendance->break_out) {
                $bIn = strtotime($attendance->break_in);
                $bOut = strtotime($attendance->break_out);
                $breakMinutes = max(($bOut - $bIn) / 60, 0);
            }

            $workMinutes = max($total - $breakMinutes, 0);
        }

        return response()->json([
            'success' => true,
            'user' => [
                'id' => $authUser->id,
                'name' => trim(($authUser->first_name ?? '').' '.($authUser->last_name ?? '')),
                'company_id' => $authUser->company_id,
                'company_name' => optional($authUser->company)->name,
                'current_time' => now()->setTimezone($tz)->format('h:i A'),
                'today_date' => now()->setTimezone($tz)->format('d M, Y'),
            ],

            //  This is the image-style block
            'today_summary' => [
                'date' => $date,

                'check_in' => $attendance ? $fmtTime($attendance->check_in) : null,
                'break_in' => $attendance ? $fmtTime($attendance->break_in) : null,
                'break_out' => $attendance ? $fmtTime($attendance->break_out) : null,
                'check_out' => $attendance ? $fmtTime($attendance->check_out) : null,

                'total_hours_breaked' => $fmtDuration($breakMinutes),
                'total_hours_worked' => $fmtDuration($workMinutes),
            ],
        ]);
    }

    public function mark(Request $request)
    {
        $authUser = Auth::user();
        $userId = $authUser->id;
        $tz = 'Asia/Kolkata';

        $validator = Validator::make($request->all(), [
            'company_id' => 'required|exists:companies,id',
            'date' => 'required|date',
            'action' => 'required|string|in:check_in,check_out,break_in,break_out',
            'time' => 'nullable|date_format:H:i',
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        //  Security: logged-in user ni company j allow
        if ((int) $authUser->company_id !== (int) $request->company_id) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid company.',
            ], 403);
        }

        //  Company location + radius (minimum 100m)
        $company = Company::select('id', 'name', 'latitude', 'longitude', 'radius')
            ->findOrFail($request->company_id);

        $allowedRadius = (int) ($company->radius ?? 100);
        if (! $allowedRadius || $allowedRadius < 100) {
            $allowedRadius = 100;
        }

        //  Distance check (meters)
        $distance = $this->distanceInMeters(
            (float) $request->latitude,
            (float) $request->longitude,
            (float) $company->latitude,
            (float) $company->longitude
        );

        if ($distance > $allowedRadius) {
            return response()->json([
                'success' => false,
                'message' => "You must be within {$allowedRadius} meters of the company to mark attendance.",
                'distance_meters' => round($distance, 2),
                'allowed_radius' => $allowedRadius,
            ], 403);
        }

        $time = $request->time ?? now()->format('H:i');

        //  Get or create attendance for the date (logged-in user)
        $attendance = Attendance::firstOrCreate(
            [
                'user_id' => $userId,
                'date' => $request->date,
            ],
            [
                'company_id' => $company->id,
            ]
        );

        // ===== RULES =====
        switch ($request->action) {
            case 'check_in':
                if ($attendance->check_in) {
                    return response()->json([
                        'success' => false,
                        'message' => 'You have already checked in. Please select check_out next.',
                    ], 400);
                }
                $attendance->check_in = $time;
                break;

            case 'check_out':
                if (! $attendance->check_in) {
                    return response()->json([
                        'success' => false,
                        'message' => 'You must check_in first before check_out.',
                    ], 400);
                }
                if ($attendance->check_out) {
                    return response()->json([
                        'success' => false,
                        'message' => 'You have already checked out for this day.',
                    ], 400);
                }
                $attendance->check_out = $time;
                break;

            case 'break_in':
            case 'break_out':
                if (! $attendance->check_in) {
                    return response()->json([
                        'success' => false,
                        'message' => 'You must check_in first before marking break.',
                    ], 400);
                }
                if ($attendance->check_out) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Cannot mark break after check_out.',
                    ], 400);
                }

                if ($request->action === 'break_in') {
                    if ($attendance->break_in) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Break_in already marked.',
                        ], 400);
                    }
                    $attendance->break_in = $time;
                } else { // break_out
                    if (! $attendance->break_in) {
                        return response()->json([
                            'success' => false,
                            'message' => 'You must mark break_in before break_out.',
                        ], 400);
                    }
                    if ($attendance->break_out) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Break_out already marked.',
                        ], 400);
                    }
                    $attendance->break_out = $time;
                }
                break;
        }

        // ===== CALCULATE TOTAL & OVERTIME (store minutes) =====
        if ($attendance->check_in && $attendance->check_out) {
            $in = strtotime($attendance->check_in);
            $out = strtotime($attendance->check_out);
            $total = max(($out - $in) / 60, 0);

            if ($attendance->break_in && $attendance->break_out) {
                $breakStart = strtotime($attendance->break_in);
                $breakEnd = strtotime($attendance->break_out);
                $total -= max(($breakEnd - $breakStart) / 60, 0);
            }

            $attendance->total_minutes = max((int) $total, 0);
            $attendance->overtime_minutes = $attendance->total_minutes > 480
                ? $attendance->total_minutes - 480
                : 0;
        }

        $attendance->save();

        //  After save: fetch all attendances + counts (logged-in user only)
        $attList = Attendance::where('user_id', $userId)
            ->where('company_id', $company->id)
            ->orderBy('date', 'desc')
            ->get();

        //  Helpers for today_summary
        $fmtTime = function ($t) use ($tz) {
            if (! $t) {
                return null;
            }

            return \Carbon\Carbon::createFromFormat(strlen($t) > 5 ? 'H:i:s' : 'H:i', $t, $tz)->format('h:i A');
        };
        $fmtDuration = function ($minutes) {
            $minutes = (int) max($minutes, 0);
            $h = intdiv($minutes, 60);
            $m = $minutes % 60;

            return sprintf('%02d Hrs %02d Min', $h, $m);
        };

        //  Build today_summary (image style) for the SAME date you are marking
        $today = Attendance::where('user_id', $userId)
            ->where('company_id', $company->id)
            ->where('date', $request->date)
            ->latest('id')
            ->first();

        $breakMinutes = 0;
        $workMinutes = 0;

        if ($today && $today->check_in && $today->check_out) {
            $in = strtotime($today->check_in);
            $out = strtotime($today->check_out);
            $total = max(($out - $in) / 60, 0);

            if ($today->break_in && $today->break_out) {
                $bIn = strtotime($today->break_in);
                $bOut = strtotime($today->break_out);
                $breakMinutes = max(($bOut - $bIn) / 60, 0);
            }

            $workMinutes = max($total - $breakMinutes, 0);
        }

        $todaySummary = [
            'date' => $request->date,
            'check_in' => $today ? $fmtTime($today->check_in) : null,
            'break_in' => $today ? $fmtTime($today->break_in) : null,
            'break_out' => $today ? $fmtTime($today->break_out) : null,
            'check_out' => $today ? $fmtTime($today->check_out) : null,
            'total_hours_breaked' => $fmtDuration($breakMinutes),
            'total_hours_worked' => $fmtDuration($workMinutes),
        ];

        return response()->json([
            'success' => true,
            'message' => 'Attendance updated successfully',
            'distance_meters' => round($distance, 2),
            'allowed_radius' => $allowedRadius,

            'user' => [
                'id' => $authUser->id,
                'name' => trim(($authUser->first_name ?? '').' '.($authUser->last_name ?? '')),
                'company_id' => $authUser->company_id,
                'company_name' => $company->name,
                'current_time' => now()->setTimezone($tz)->format('h:i A'),
                'today_date' => now()->setTimezone($tz)->format('d M, Y'),
            ],

            //  raw row (optional)
            'today_attendance' => [
                'id' => $attendance->id,
                'date' => $attendance->date,
                'check_in' => $attendance->check_in,
                'check_out' => $attendance->check_out,
                'break_in' => $attendance->break_in,
                'break_out' => $attendance->break_out,
                'total_minutes' => $attendance->total_minutes,
                'overtime_minutes' => $attendance->overtime_minutes,
            ],

            //  IMAGE STYLE SUMMARY
            'today_summary' => $todaySummary,

            'attendances' => $attList->map(function ($a) use ($fmtTime, $fmtDuration) {

                //  break minutes
                $breakMinutes = 0;
                if ($a->break_in && $a->break_out) {
                    $bIn = strtotime($a->break_in);
                    $bOut = strtotime($a->break_out);
                    $breakMinutes = max(($bOut - $bIn) / 60, 0);
                }

                //  worked minutes
                $workMinutes = 0;
                if ($a->check_in && $a->check_out) {
                    $in = strtotime($a->check_in);
                    $out = strtotime($a->check_out);
                    $total = max(($out - $in) / 60, 0);
                    $workMinutes = max($total - $breakMinutes, 0);
                }

                return [
                    'id' => $a->id,
                    'company_id' => $a->company_id,
                    'date' => $a->date,

                    //  same format as today_summary
                    'check_in' => $fmtTime($a->check_in),
                    'break_in' => $fmtTime($a->break_in),
                    'break_out' => $fmtTime($a->break_out),
                    'check_out' => $fmtTime($a->check_out),

                    'total_hours_breaked' => $fmtDuration($breakMinutes),
                    'total_hours_worked' => $fmtDuration($workMinutes),

                    //  keep raw minutes also (optional)
                    'total_minutes' => (int) ($a->total_minutes ?? 0),
                    'overtime_minutes' => (int) ($a->overtime_minutes ?? 0),
                ];
            })->values(),
        ]);
    }

    /** Haversine distance in meters */
    private function distanceInMeters(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        $earthRadius = 6371000; // meters

        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);

        $a = sin($dLat / 2) * sin($dLat / 2) +
            cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
            sin($dLon / 2) * sin($dLon / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }

    public function listUsers()
    {
        return \App\Models\User::all();
    }
}
