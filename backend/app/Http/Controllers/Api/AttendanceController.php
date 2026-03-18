<?php

namespace App\Http\Controllers\Api;

use App\Exports\AttendanceReportExport;
use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Company;
use App\Models\HolidayCalendar;
use App\Models\LeaveRequest;
use App\Models\User;
use App\Models\WorkSchedule;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Maatwebsite\Excel\Facades\Excel;

class AttendanceController extends Controller
{
    public function index(Request $request)
    {
        $authUser = Auth::user();
        $tz = 'Asia/Kolkata';

        $date = $request->get('date', now()->setTimezone($tz)->toDateString());

        // Today's attendance
        $attendance = Attendance::where('user_id', $authUser->id)
            ->where('date', $date)
            ->latest('id')
            ->first();

        // All attendances history
        $attendances = Attendance::where('user_id', $authUser->id)
            ->orderBy('date', 'desc')
            ->get();

        // Helpers
        $fmtTime = function ($t) use ($tz) {
            if (!$t) {
                return null;
            }

            return Carbon::createFromFormat(strlen($t) > 5 ? 'H:i:s' : 'H:i', $t, $tz)->format('h:i A');
        };

        $fmtDuration = function ($minutes) {
            $minutes = (int) max($minutes, 0);
            $h = intdiv($minutes, 60);
            $m = $minutes % 60;

            return sprintf('%02d Hrs %02d Min', $h, $m);
        };

        $breakMinutes = 0;
        $shiftWorkMinutes = 0;
        $shiftOvertime = 0;
        $sessionOvertime = 0;
        $totalWorkedMinutes = 0;

        if ($attendance && $attendance->check_in) {

            $inDT = Carbon::createFromFormat(
                'Y-m-d H:i',
                $date . ' ' . substr($attendance->check_in, 0, 5),
                $tz
            );

            $outDT = $attendance->check_out
                ? Carbon::createFromFormat(
                    'Y-m-d H:i',
                    $date . ' ' . substr($attendance->check_out, 0, 5),
                    $tz
                )
                : now()->setTimezone($tz);

            $totalMinutes = max($inDT->diffInMinutes($outDT, false), 0);

            // Break
            if ($attendance->break_in && $attendance->break_out) {
                $bInDT = Carbon::createFromFormat(
                    'Y-m-d H:i',
                    $date . ' ' . substr($attendance->break_in, 0, 5),
                    $tz
                );
                $bOutDT = Carbon::createFromFormat(
                    'Y-m-d H:i',
                    $date . ' ' . substr($attendance->break_out, 0, 5),
                    $tz
                );
                $breakMinutes = max($bInDT->diffInMinutes($bOutDT, false), 0);
            }

            $shiftWorkMinutes = max($totalMinutes - $breakMinutes, 0);

            // Shift overtime (stored already in DB)
            $shiftOvertime = (int) ($attendance->overtime_minutes ?? 0);

            // Session overtime (overtime_in/out)
            if ($attendance->overtime_in && $attendance->overtime_out) {
                $otInDT = Carbon::createFromFormat(
                    'Y-m-d H:i',
                    $date . ' ' . substr($attendance->overtime_in, 0, 5),
                    $tz
                );
                $otOutDT = Carbon::createFromFormat(
                    'Y-m-d H:i',
                    $date . ' ' . substr($attendance->overtime_out, 0, 5),
                    $tz
                );
                $sessionOvertime = max($otInDT->diffInMinutes($otOutDT, false), 0);
            }

            // Final Total = shift work + overtime
            $totalWorkedMinutes = $shiftWorkMinutes + $shiftOvertime + $sessionOvertime;
        }

        return response()->json([
            'success' => true,

            'user' => [
                'id' => $authUser->id,
                'name' => trim(($authUser->first_name ?? '') . ' ' . ($authUser->last_name ?? '')),
                'company_id' => $authUser->company_id,
                'company_name' => optional($authUser->company)->name,
                'current_time' => now()->setTimezone($tz)->format('h:i A'),
                'today_date' => now()->setTimezone($tz)->format('d M, Y'),
            ],

            'today_summary' => [
                'date' => $date,

                'check_in' => $attendance ? $fmtTime($attendance->check_in) : null,
                'break_in' => $attendance ? $fmtTime($attendance->break_in) : null,
                'break_out' => $attendance ? $fmtTime($attendance->break_out) : null,
                'check_out' => $attendance ? $fmtTime($attendance->check_out) : null,
                'overtime_in' => $attendance ? $fmtTime($attendance->overtime_in) : null,
                'overtime_out' => $attendance ? $fmtTime($attendance->overtime_out) : null,

                'total_hours_breaked' => $fmtDuration($breakMinutes),
                'total_hours_worked' => $fmtDuration($totalWorkedMinutes),
                'overtime_minutes' => (int) ($attendance->overtime_minutes ?? 0),
            ],

            'attendances' => $attendances->map(function ($a) use ($fmtTime, $fmtDuration) {

                $breakMinutes = 0;
                $workMinutes = 0;

                if ($a->check_in && $a->check_out) {

                    $inDT = Carbon::createFromFormat('Y-m-d H:i', $a->date . ' ' . substr($a->check_in, 0, 5));
                    $outDT = Carbon::createFromFormat('Y-m-d H:i', $a->date . ' ' . substr($a->check_out, 0, 5));

                    $totalMinutes = max($inDT->diffInMinutes($outDT, false), 0);

                    if ($a->break_in && $a->break_out) {
                        $bInDT = Carbon::createFromFormat('Y-m-d H:i', $a->date . ' ' . substr($a->break_in, 0, 5));
                        $bOutDT = Carbon::createFromFormat('Y-m-d H:i', $a->date . ' ' . substr($a->break_out, 0, 5));
                        $breakMinutes = max($bInDT->diffInMinutes($bOutDT, false), 0);
                    }

                    $workMinutes = max($totalMinutes - $breakMinutes, 0);
                }

                return [
                    'id' => $a->id,
                    'date' => $a->date,
                    'check_in' => $fmtTime($a->check_in),
                    'break_in' => $fmtTime($a->break_in),
                    'break_out' => $fmtTime($a->break_out),
                    'check_out' => $fmtTime($a->check_out),
                    'overtime_in' => $fmtTime($a->overtime_in),
                    'overtime_out' => $fmtTime($a->overtime_out),
                    'total_hours_worked' => $fmtDuration($workMinutes + (int) ($a->overtime_minutes ?? 0)),
                    'overtime_minutes' => (int) ($a->overtime_minutes ?? 0),
                ];
            })->values(),
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
            'action' => 'nullable|string|in:check_in,check_out,break_in,break_out,overtime_in,overtime_out',
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

        // Security: logged-in user ni company j allow
        if ((int) $authUser->company_id !== (int) $request->company_id) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid company.',
            ], 403);
        }

        // Company location + radius
        $company = Company::select('id', 'name', 'latitude', 'longitude', 'radius')
            ->findOrFail($request->company_id);

        $allowedRadius = (int) ($company->radius ?? 100);
        if (!$allowedRadius || $allowedRadius < 100) {
            $allowedRadius = 100;
        }

        // Distance check (meters)
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

        $time = $request->time ?? now()->setTimezone($tz)->format('H:i');

        // =========================
        //  FETCH WORK SCHEDULE (company + role wise)
        // =========================
        $roleId = $authUser->role_id ?? null;

        $wsQuery = \App\Models\WorkSchedule::query()
            ->where('company_id', $company->id)
            ->when($roleId, fn($q) => $q->where('role_id', $roleId))
            ->where(function ($q) use ($request) {
                $q->whereNull('effective_from')->orWhere('effective_from', '<=', $request->date);
            })
            ->where(function ($q) use ($request) {
                $q->whereNull('effective_to')->orWhere('effective_to', '>=', $request->date);
            })
            ->latest('id');

        $workSchedule = $wsQuery->first();

        if (!$workSchedule) {
            $workSchedule = \App\Models\WorkSchedule::where('company_id', $company->id)
                ->whereNull('role_id')
                ->latest('id')
                ->first();
        }

        $shiftStart = $workSchedule->start_time ?? '09:00:00';
        $shiftEnd = $workSchedule->end_time ?? '18:00:00';
        $breakDefaultMinutes = (int) ($workSchedule->break_minutes ?? 60);

        $shiftStartHM = Carbon::parse($shiftStart)->format('H:i');
        $shiftEndHM = Carbon::parse($shiftEnd)->format('H:i');

        $shiftStartDT = Carbon::createFromFormat('Y-m-d H:i', $request->date . ' ' . $shiftStartHM, $tz);
        $shiftEndDT = Carbon::createFromFormat('Y-m-d H:i', $request->date . ' ' . $shiftEndHM, $tz);

        $shiftTotalMinutes = max($shiftStartDT->diffInMinutes($shiftEndDT, false), 0);
        $shiftWorkMinutes = max($shiftTotalMinutes - $breakDefaultMinutes, 0);

        // =========================
        //  GET or CREATE attendance
        // =========================
        $attendance = Attendance::firstOrCreate(
            [
                'user_id' => $userId,
                'date' => $request->date,
            ],
            [
                'company_id' => $company->id,
            ]
        );

        // =========================
        //  RULES (only if action sent)
        // =========================
        if (!empty($request->action)) {
            switch ($request->action) {

                case 'check_in':
                    if ($attendance->check_in) {
                        return response()->json([
                            'success' => false,
                            'message' => 'You have already checked in. Please select check_out next.',
                        ], 400);
                    }
                    $attendance->check_in = $time;
                    $attendance->check_in_latitude = $request->latitude;
                    $attendance->check_in_longitude = $request->longitude;
                    break;

                case 'check_out':
                    if (!$attendance->check_in) {
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
                    if ($attendance->overtime_in && !$attendance->overtime_out) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Please end overtime (overtime_out) before check_out.',
                        ], 400);
                    }
                    $attendance->check_out = $time;
                    $attendance->check_out_latitude = $request->latitude;
                    $attendance->check_out_longitude = $request->longitude;
                    break;

                case 'break_in':
                case 'break_out':
                    if ($attendance->overtime_in && !$attendance->overtime_out) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Break not allowed in overtime session.',
                        ], 400);
                    }

                    if (!$attendance->check_in) {
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
                        $attendance->break_in_latitude = $request->latitude;
                        $attendance->break_in_longitude = $request->longitude;
                    } else {
                        if (!$attendance->break_in) {
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
                        $attendance->break_out_latitude = $request->latitude;
                        $attendance->break_out_longitude = $request->longitude;
                    }
                    break;

                case 'overtime_in':
                    if (!$attendance->check_in) {
                        return response()->json([
                            'success' => false,
                            'message' => 'You must check_in first before overtime.',
                        ], 400);
                    }

                    if ($attendance->overtime_in && !$attendance->overtime_out) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Overtime already started.',
                        ], 400);
                    }

                    $reqNowDT = Carbon::createFromFormat('Y-m-d H:i', $attendance->date . ' ' . $time, $tz);
                    if (!$attendance->check_out && $reqNowDT->lessThan($shiftEndDT)) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Overtime can start only after shift end time.',
                        ], 400);
                    }

                    $attendance->overtime_in = $time;
                    $attendance->overtime_out = null;
                    $attendance->overtime_in_latitude = $request->latitude;
                    $attendance->overtime_in_longitude = $request->longitude;
                    break;

                case 'overtime_out':
                    if (!$attendance->overtime_in) {
                        return response()->json([
                            'success' => false,
                            'message' => 'You must overtime_in first.',
                        ], 400);
                    }
                    if ($attendance->overtime_out) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Overtime already ended.',
                        ], 400);
                    }

                    $attendance->overtime_out = $time;
                    $attendance->overtime_out_latitude = $request->latitude;
                    $attendance->overtime_out_longitude = $request->longitude;
                    break;
            }

            // =========================
            //  CALCULATE TOTAL + OVERTIME
            // total_minutes = shift work (check_in->check_out minus break)
            // overtime_minutes = (shift check_out - shiftEnd) + (overtime_out - overtime_in)
            // =========================

            // calculate shift total only if both present
            if ($attendance->check_in && $attendance->check_out) {

                $inDT = Carbon::createFromFormat(
                    'Y-m-d H:i',
                    $attendance->date . ' ' . substr($attendance->check_in, 0, 5),
                    $tz
                );

                $outDT = Carbon::createFromFormat(
                    'Y-m-d H:i',
                    $attendance->date . ' ' . substr($attendance->check_out, 0, 5),
                    $tz
                );

                $totalMinutes = max($inDT->diffInMinutes($outDT, false), 0);

                $breakMinutesCalc = 0;
                if ($attendance->break_in && $attendance->break_out) {
                    $bInDT = Carbon::createFromFormat(
                        'Y-m-d H:i',
                        $attendance->date . ' ' . substr($attendance->break_in, 0, 5),
                        $tz
                    );
                    $bOutDT = Carbon::createFromFormat(
                        'Y-m-d H:i',
                        $attendance->date . ' ' . substr($attendance->break_out, 0, 5),
                        $tz
                    );

                    $breakMinutesCalc = max($bInDT->diffInMinutes($bOutDT, false), 0);
                }

                $workMinutesCalc = max($totalMinutes - $breakMinutesCalc, 0);
                $attendance->total_minutes = (int) $workMinutesCalc;
            }

            // shift overtime (checkout after shift end)
            $shiftOvertime = 0;
            if ($attendance->check_out) {
                $outDT = Carbon::createFromFormat(
                    'Y-m-d H:i',
                    $attendance->date . ' ' . substr($attendance->check_out, 0, 5),
                    $tz
                );

                if ($outDT->greaterThan($shiftEndDT)) {
                    $shiftOvertime = $shiftEndDT->diffInMinutes($outDT);
                }
            }

            // session overtime (overtime_in/out)
            $sessionOvertime = 0;
            if ($attendance->overtime_in && $attendance->overtime_out) {
                $otInDT = Carbon::createFromFormat(
                    'Y-m-d H:i',
                    $attendance->date . ' ' . substr($attendance->overtime_in, 0, 5),
                    $tz
                );
                $otOutDT = Carbon::createFromFormat(
                    'Y-m-d H:i',
                    $attendance->date . ' ' . substr($attendance->overtime_out, 0, 5),
                    $tz
                );
                $sessionOvertime = max($otInDT->diffInMinutes($otOutDT, false), 0);
            }

            //  final overtime = previous shift overtime + overtime session
            $attendance->overtime_minutes = (int) max($shiftOvertime + $sessionOvertime, 0);

            $attendance->save();
        }

        // =========================
        //  is_show_overtime:
        // show overtime button if checked_in and (now >= shift end) and overtime not running
        // =========================
        $isShowOvertime = false;
        $nowDT = now()->setTimezone($tz);

        if ($attendance->check_in && $nowDT->greaterThanOrEqualTo($shiftEndDT)) {
            // if overtime session already started & not ended -> don't show button
            if (!($attendance->overtime_in && !$attendance->overtime_out)) {
                $isShowOvertime = true;
            }
        }

        // =========================
        //  Attendances list
        // =========================
        $attList = Attendance::where('user_id', $userId)
            ->where('company_id', $company->id)
            ->orderBy('date', 'desc')
            ->get();

        // Helpers
        $fmtTime = function ($t) use ($tz) {
            if (!$t) {
                return null;
            }

            return Carbon::createFromFormat(strlen($t) > 5 ? 'H:i:s' : 'H:i', $t, $tz)->format('h:i A');
        };

        $fmtDuration = function ($minutes) {
            $minutes = (int) max($minutes, 0);
            $h = intdiv($minutes, 60);
            $m = $minutes % 60;

            return sprintf('%02d Hrs %02d Min', $h, $m);
        };

        // =========================
        //  Today summary (Carbon, current time if no check_out)
        // =========================
        $today = Attendance::where('user_id', $userId)
            ->where('company_id', $company->id)
            ->where('date', $request->date)
            ->latest('id')
            ->first();

        $breakMinutes = 0;
        $workMinutes = 0;

        if ($today && $today->check_in) {
            $inDT = Carbon::createFromFormat('Y-m-d H:i', $today->date . ' ' . substr($today->check_in, 0, 5), $tz);
            $outDT = $today->check_out
                ? Carbon::createFromFormat('Y-m-d H:i', $today->date . ' ' . substr($today->check_out, 0, 5), $tz)
                : now()->setTimezone($tz);

            $totalMinutes = max($inDT->diffInMinutes($outDT, false), 0);

            if ($today->break_in && $today->break_out) {
                $bInDT = Carbon::createFromFormat('Y-m-d H:i', $today->date . ' ' . substr($today->break_in, 0, 5), $tz);
                $bOutDT = Carbon::createFromFormat('Y-m-d H:i', $today->date . ' ' . substr($today->break_out, 0, 5), $tz);
                $breakMinutes = max($bInDT->diffInMinutes($bOutDT, false), 0);
            }

            $workMinutes = max($totalMinutes - $breakMinutes, 0);
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

        // =========================
        //  Assigned Tasks (exclude Done)
        // =========================
        $tasks = \App\Models\Task::query()
            ->where('company_id', $company->id)
            ->where('status', '!=', 'Done')
            ->whereHas('assignments', function ($q) use ($userId) {
                $q->where('user_id', $userId);
            })
            // ->with([
            //     'assignments' => function ($q) use ($userId) {
            //         $q->where('user_id', $userId)->select('id', 'task_id', 'user_id', 'status', 'progress', 'note');
            //     },
            // ])
            ->latest('id')
            ->get();

        // =========================
        //  Response
        // =========================
        return response()->json([
            'success' => true,
            'message' => 'Attendance updated successfully',
            'distance_meters' => round($distance, 2),
            'allowed_radius' => $allowedRadius,

            'work_schedule' => [
                'company_id' => $company->id,
                'role_id' => $roleId,
                'start_time' => $shiftStartHM,
                'end_time' => $shiftEndHM,
                'break_minutes' => $breakDefaultMinutes,
                'shift_total' => $fmtDuration($shiftTotalMinutes),
                'working_hours' => $fmtDuration($shiftWorkMinutes),
            ],

            'is_show_overtime' => $isShowOvertime,

            'user' => [
                'id' => $authUser->id,
                'name' => trim(($authUser->first_name ?? '') . ' ' . ($authUser->last_name ?? '')),
                'company_id' => $authUser->company_id,
                'company_name' => $company->name,
                'current_time' => now()->setTimezone($tz)->format('h:i A'),
                'today_date' => now()->setTimezone($tz)->format('d M, Y'),
            ],

            'today_attendance' => [
                'id' => $attendance->id,
                'date' => $attendance->date,
                'check_in' => $attendance->check_in,
                'check_out' => $attendance->check_out,
                'break_in' => $attendance->break_in,
                'break_out' => $attendance->break_out,
                'overtime_in' => $attendance->overtime_in,
                'overtime_out' => $attendance->overtime_out,
                'check_in_latitude' => $attendance->check_in_latitude ?? null,
                'check_in_longitude' => $attendance->check_in_longitude ?? null,
                'check_out_latitude' => $attendance->check_out_latitude ?? null,
                'check_out_longitude' => $attendance->check_out_longitude ?? null,
                'break_in_latitude' => $attendance->break_in_latitude ?? null,
                'break_in_longitude' => $attendance->break_in_longitude ?? null,
                'break_out_latitude' => $attendance->break_out_latitude ?? null,
                'break_out_longitude' => $attendance->break_out_longitude ?? null,
                'overtime_in_latitude' => $attendance->overtime_in_latitude,
                'overtime_in_longitude' => $attendance->overtime_in_longitude,
                'overtime_out_latitude' => $attendance->overtime_out_latitude,
                'overtime_out_longitude' => $attendance->overtime_out_longitude,
                'total_minutes' => (int) ($attendance->total_minutes ?? 0),
                'overtime_minutes' => (int) ($attendance->overtime_minutes ?? 0),
            ],

            'today_summary' => $todaySummary,
            'assigned_tasks' => $tasks,

            'attendances' => $attList->map(function ($a) use ($fmtTime, $fmtDuration) {
                $breakMinutes = 0;
                if ($a->break_in && $a->break_out) {
                    $bIn = strtotime($a->break_in);
                    $bOut = strtotime($a->break_out);
                    $breakMinutes = max(($bOut - $bIn) / 60, 0);
                }

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
                    'check_in' => $fmtTime($a->check_in),
                    'break_in' => $fmtTime($a->break_in),
                    'break_out' => $fmtTime($a->break_out),
                    'check_out' => $fmtTime($a->check_out),
                    'total_hours_breaked' => $fmtDuration($breakMinutes),
                    'total_hours_worked' => $fmtDuration($workMinutes),
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

    public function report(Request $request)
    {
       $companyId = $request->company_id;             
        $tz = 'Asia/Kolkata';

        $data = $request->validate([
            'range' => 'nullable|in:today,week,month,year,last_7_days,last_30_days,last_3_months',
            'from' => 'nullable|date_format:Y-m-d',
            'to' => 'nullable|date_format:Y-m-d|after_or_equal:from',
            'company_id' => 'nullable|exists:companies,id',
            'user_id' => 'nullable|exists:users,id',
        ]);

        if (!$companyId) {
            return response()->json([
                'status' => false,
                'message' => 'Company id is required',
            ], 422);
        }

        [$from, $to] = $this->resolveRange($data, $tz);

        $schedule = WorkSchedule::where('company_id', $companyId)->first();

        if (!$schedule) {
            return response()->json([
                'status' => false,
                'message' => 'Work schedule not set for this company',
            ], 422);
        }

        $holidayMap = $this->getHolidayMap($companyId, (int) $from->year, (int) $to->year);

        $usersQuery = User::where('company_id', $companyId);

        if (!empty($data['user_id'])) {
            $usersQuery->where('id', $data['user_id']);
        }

        $users = $usersQuery->get();

        if ($users->isEmpty()) {
            return response()->json([
                'status' => false,
                'message' => 'No users found',
            ], 404);
        }

        $reports = [];

        foreach ($users as $user) {
            $attRows = Attendance::where('company_id', $companyId)
                ->where('user_id', $user->id)
                ->whereBetween('date', [$from->toDateString(), $to->toDateString()])
                ->get()
                ->keyBy(fn($a) => Carbon::parse($a->date)->toDateString());

            $leaveRows = LeaveRequest::where('company_id', $companyId)
                ->where('user_id', $user->id)
                ->where('status', 'approved')
                ->whereDate('to_date', '>=', $from->toDateString())
                ->whereDate('from_date', '<=', $to->toDateString())
                ->get();

            $leaveDates = $this->buildLeaveDatesSet($leaveRows, $from, $to);

            $period = CarbonPeriod::create($from->toDateString(), $to->toDateString());

            $totalDays = 0;
            $weeklyOffDays = 0;
            $holidayDays = 0;
            $workingDays = 0;

            $presentDays = 0;
            $leaveDays = 0;
            $absentDays = 0;

            $totalWorkMinutes = 0;
            $totalOvertimeMinutes = 0;

            $days = [];

            foreach ($period as $d) {
                $totalDays++;
                $ds = $d->toDateString();

                $isHoliday = isset($holidayMap[$ds]);
                $isWeekOff = $this->isWeekOff($d, $schedule->weekly_rules, $schedule->monthly_rules ?? null);

                if ($isHoliday) {
                    $holidayDays++;
                }

                if ($isWeekOff) {
                    $weeklyOffDays++;
                }

                $isWorkingDay = (!$isHoliday && !$isWeekOff);

                if ($isWorkingDay) {
                    $workingDays++;
                }

                $att = $attRows->get($ds);

                $present = false;
                $workMinutes = 0;
                $shiftOvertime = 0;
                $sessionOvertime = 0;

                if ($att) {
                    $workMinutes = (int) ($att->total_minutes ?? 0);
                    $shiftOvertime = (int) ($att->overtime_minutes ?? 0);

                    if ($workMinutes === 0 && $att->check_in && $att->check_out) {
                        $workMinutes = $this->calcWorkMinutes(
                            $att->check_in,
                            $att->check_out,
                            $att->break_in,
                            $att->break_out
                        );
                    }

                    if ($att->overtime_in && $att->overtime_out) {
                        $otIn = strtotime($att->overtime_in);
                        $otOut = strtotime($att->overtime_out);
                        $sessionOvertime = max((int) (($otOut - $otIn) / 60), 0);
                    }

                    $present = ($att->check_in != null);
                }

                $onLeave = isset($leaveDates[$ds]);

                $dayStatus = 'N/A';

                if ($isHoliday) {
                    $dayStatus = 'holiday';
                } elseif ($isWeekOff) {
                    $dayStatus = 'weekly_off';
                } else {
                    if ($onLeave) {
                        $dayStatus = 'leave';
                        $leaveDays++;
                    } elseif ($present) {
                        $dayStatus = 'present';
                        $presentDays++;

                        $totalWorkMinutes += ($workMinutes + $shiftOvertime + $sessionOvertime);
                        $totalOvertimeMinutes += ($shiftOvertime + $sessionOvertime);
                    } else {
                        $dayStatus = 'absent';
                        $absentDays++;
                    }
                }

                $days[] = [
                    'date' => $ds,
                    'day' => $d->format('D'),
                    'status' => $dayStatus,
                    'holiday_title' => $isHoliday ? ($holidayMap[$ds]['title'] ?? null) : null,
                    'attendance' => $att ? [
                        'check_in' => $att->check_in,
                        'check_out' => $att->check_out,
                        'break_in' => $att->break_in,
                        'break_out' => $att->break_out,
                        'overtime_in' => $att->overtime_in,
                        'overtime_out' => $att->overtime_out,
                        'work_minutes' => $workMinutes,
                        'shift_overtime_minutes' => $shiftOvertime,
                        'session_overtime_minutes' => $sessionOvertime,
                        'final_total_minutes' => $workMinutes + $shiftOvertime + $sessionOvertime,
                    ] : null,
                ];
            }

            $reports[] = [
                'user' => [
                    'id' => $user->id,
                    'name' => trim(($user->first_name ?? '') . ' ' . ($user->last_name ?? '')),
                    'company_id' => $companyId,
                ],
                'summary' => [
                    'total_days' => $totalDays,
                    'working_days' => $workingDays,
                    'holiday_days' => $holidayDays,
                    'weekly_off_days' => $weeklyOffDays,
                    'present_days' => $presentDays,
                    'leave_days' => $leaveDays,
                    'absent_days' => $absentDays,
                    'total_worked' => $this->fmtDuration($totalWorkMinutes),
                    'total_overtime' => $this->fmtDuration($totalOvertimeMinutes),
                ],
                'days' => $days,
            ];
        }

        return response()->json([
            'status' => true,
            'range' => [
                'from' => $from->toDateString(),
                'to' => $to->toDateString(),
                'timezone' => $tz,
            ],
            'company_id' => $companyId,
            'total_users' => $users->count(),
            'reports' => $reports,
        ]);
    }
    private function resolveRange(array $data, string $tz): array
    {
        $now = now()->setTimezone($tz);

        if (!empty($data['from']) && !empty($data['to'])) {
            return [Carbon::parse($data['from'], $tz)->startOfDay(), Carbon::parse($data['to'], $tz)->startOfDay()];
        }

        $range = $data['range'] ?? 'today';

        return match ($range) {
            'today' => [$now->copy()->startOfDay(), $now->copy()->startOfDay()],
            'week' => [$now->copy()->startOfWeek(), $now->copy()->endOfWeek()->startOfDay()],
            'month' => [$now->copy()->startOfMonth(), $now->copy()->endOfMonth()->startOfDay()],
            'year' => [$now->copy()->startOfYear(), $now->copy()->endOfYear()->startOfDay()],
            'last_7_days' => [$now->copy()->subDays(6)->startOfDay(), $now->copy()->startOfDay()],
            'last_30_days' => [$now->copy()->subDays(29)->startOfDay(), $now->copy()->startOfDay()],
            'last_3_months' => [$now->copy()->subMonthsNoOverflow(3)->startOfDay(), $now->copy()->startOfDay()],
            default => [$now->copy()->startOfDay(), $now->copy()->startOfDay()],
        };
    }

    private function getHolidayMap(int $companyId, int $yearFrom, int $yearTo): array
    {
        $map = [];

        for ($y = $yearFrom; $y <= $yearTo; $y++) {
            $cal = HolidayCalendar::with('holidays')
                ->where('company_id', $companyId)
                ->where('year', $y)
                ->first();

            if ($cal) {
                foreach ($cal->holidays as $h) {
                    $ds = $h->date->toDateString();
                    $map[$ds] = [
                        'title' => $h->title,
                        'type' => $h->type,
                        'is_optional' => (bool) $h->is_optional,
                    ];
                }
            }
        }

        return $map;
    }

    private function buildLeaveDatesSet($leaveRows, Carbon $from, Carbon $to): array
    {
        $set = [];

        foreach ($leaveRows as $lr) {
            $start = $lr->from_date->greaterThan($from) ? $lr->from_date : $from;
            $end = $lr->to_date->lessThan($to) ? $lr->to_date : $to;

            $p = CarbonPeriod::create($start->toDateString(), $end->toDateString());
            foreach ($p as $d) {
                $set[$d->toDateString()] = true;
            }
        }

        return $set;
    }

    private function isWeekOff(Carbon $date, array $weeklyRules, ?array $monthlyRules): bool
    {
        // keys: mon,tue,wed,thu,fri,sat,sun
        $key = strtolower($date->format('D'));
        $value = $weeklyRules[$key] ?? 'on';

        if ($value === 'off') {
            return true;
        }

        if ($value === 'alternate' && $key === 'sat') {
            $weekOfMonth = (int) ceil($date->day / 7);
            $offWeeks = $monthlyRules['sat_off_weeks'] ?? [];

            return in_array($weekOfMonth, $offWeeks);
        }

        return false;
    }

    private function calcWorkMinutes($checkIn, $checkOut, $breakIn = null, $breakOut = null): int
    {
        $in = strtotime($checkIn);
        $out = strtotime($checkOut);
        $total = max((int) (($out - $in) / 60), 0);

        $break = 0;
        if ($breakIn && $breakOut) {
            $bIn = strtotime($breakIn);
            $bOut = strtotime($breakOut);
            $break = max((int) (($bOut - $bIn) / 60), 0);
        }

        return max($total - $break, 0);
    }

    private function fmtDuration(int $minutes): string
    {
        $minutes = max($minutes, 0);
        $h = intdiv($minutes, 60);
        $m = $minutes % 60;

        return sprintf('%02d Hrs %02d Min', $h, $m);
    }

    public function export(Request $request)
    {
        $data = $request->validate([
            'range' => 'nullable|in:today,week,month,year,last_7_days,last_30_days,last_3_months',
            'from' => 'nullable|date_format:Y-m-d',
            'to' => 'nullable|date_format:Y-m-d|after_or_equal:from',
        ]);

        $user = Auth::user();

        $filename = 'attendance_report_' . $user->id . '_' . now()->format('Ymd_His') . '.xlsx';

        return Excel::download(
            new AttendanceReportExport($user, $data),
            $filename,
            \Maatwebsite\Excel\Excel::XLSX
        );
    }
    public function dateDetail(Request $request)
    {
        $authUser = authUser();

        if (!is_object($authUser)) {
            return $authUser;
        }

        $tz = config('app.timezone', 'Asia/Dubai');
        $date = $request->date ?? now()->setTimezone($tz)->format('Y-m-d');

        $attendance = Attendance::where('user_id', $authUser->id)
            ->whereDate('date', $date)
            ->latest('id')
            ->first();

        $fmtTime = function ($t) use ($tz) {
            if (!$t) {
                return null;
            }

            return Carbon::createFromFormat(strlen($t) > 5 ? 'H:i:s' : 'H:i', $t, $tz)->format('h:i A');
        };

        $fmtDuration = function ($minutes) {
            $minutes = (int) max($minutes, 0);
            $h = intdiv($minutes, 60);
            $m = $minutes % 60;

            return sprintf('%02d Hr %02d Min', $h, $m);
        };

        $breakMinutes = 0;
        $shiftWorkMinutes = 0;
        $shiftOvertime = 0;
        $sessionOvertime = 0;
        $totalWorkedMinutes = 0;

        if ($attendance && $attendance->check_in) {
            $inDT = Carbon::createFromFormat(
                'Y-m-d H:i',
                $date . ' ' . substr($attendance->check_in, 0, 5),
                $tz
            );

            $outDT = $attendance->check_out
                ? Carbon::createFromFormat(
                    'Y-m-d H:i',
                    $date . ' ' . substr($attendance->check_out, 0, 5),
                    $tz
                )
                : now()->setTimezone($tz);

            $totalMinutes = max($inDT->diffInMinutes($outDT, false), 0);

            if ($attendance->break_in && $attendance->break_out) {
                $bInDT = Carbon::createFromFormat(
                    'Y-m-d H:i',
                    $date . ' ' . substr($attendance->break_in, 0, 5),
                    $tz
                );
                $bOutDT = Carbon::createFromFormat(
                    'Y-m-d H:i',
                    $date . ' ' . substr($attendance->break_out, 0, 5),
                    $tz
                );
                $breakMinutes = max($bInDT->diffInMinutes($bOutDT, false), 0);
            }

            $shiftWorkMinutes = max($totalMinutes - $breakMinutes, 0);
            $shiftOvertime = (int) ($attendance->overtime_minutes ?? 0);

            if ($attendance->overtime_in && $attendance->overtime_out) {
                $otInDT = Carbon::createFromFormat(
                    'Y-m-d H:i',
                    $date . ' ' . substr($attendance->overtime_in, 0, 5),
                    $tz
                );
                $otOutDT = Carbon::createFromFormat(
                    'Y-m-d H:i',
                    $date . ' ' . substr($attendance->overtime_out, 0, 5),
                    $tz
                );
                $sessionOvertime = max($otInDT->diffInMinutes($otOutDT, false), 0);
            }

            $totalWorkedMinutes = $shiftWorkMinutes + $shiftOvertime + $sessionOvertime;
        }

        return response()->json([
            'status' => true,
            'message' => 'Attendance date detail fetched successfully.',
            'data' => [
                'user' => [
                    'id' => $authUser->id,
                    'name' => trim(($authUser->first_name ?? '') . ' ' . ($authUser->last_name ?? '')),
                    'company_id' => $authUser->company_id,
                    'company_name' => optional($authUser->company)->name,
                    'selected_date' => $date,
                    'selected_date_label' => Carbon::parse($date)->format('d M, Y'),
                    'current_time' => now()->setTimezone($tz)->format('h:i A'),
                ],

                'attendance_detail' => [
                    'id' => $attendance->id ?? null,
                    'date' => $date,

                    'check_in' => $attendance ? $fmtTime($attendance->check_in) : null,
                    'break_in' => $attendance ? $fmtTime($attendance->break_in) : null,
                    'break_out' => $attendance ? $fmtTime($attendance->break_out) : null,
                    'check_out' => $attendance ? $fmtTime($attendance->check_out) : null,
                    'overtime_in' => $attendance ? $fmtTime($attendance->overtime_in) : null,
                    'overtime_out' => $attendance ? $fmtTime($attendance->overtime_out) : null,

                    'total_hours_breaked' => $fmtDuration($breakMinutes),
                    'total_hours_worked' => $fmtDuration($totalWorkedMinutes),
                    'overtime_minutes' => (int) ($attendance->overtime_minutes ?? 0),

                    'status_name' => $attendance && $attendance->check_in ? 'Present' : 'Not Available',

                    // check-in location
                    'check_in_latitude' => $attendance->check_in_latitude ?? null,
                    'check_in_longitude' => $attendance->check_in_longitude ?? null,
                    'check_in_address' => $attendance->check_in_address ?? null,
                    'check_in_map_url' => (
                        !empty($attendance->check_in_latitude) && !empty($attendance->check_in_longitude)
                    )
                        ? 'https://www.google.com/maps?q=' . $attendance->check_in_latitude . ',' . $attendance->check_in_longitude
                        : null,

                    // break-in location
                    'break_in_latitude' => $attendance->break_in_latitude ?? null,
                    'break_in_longitude' => $attendance->break_in_longitude ?? null,
                    'break_in_address' => $attendance->break_in_address ?? null,
                    'break_in_map_url' => (
                        !empty($attendance->break_in_latitude) && !empty($attendance->break_in_longitude)
                    )
                        ? 'https://www.google.com/maps?q=' . $attendance->break_in_latitude . ',' . $attendance->break_in_longitude
                        : null,

                    // break-out location
                    'break_out_latitude' => $attendance->break_out_latitude ?? null,
                    'break_out_longitude' => $attendance->break_out_longitude ?? null,
                    'break_out_address' => $attendance->break_out_address ?? null,
                    'break_out_map_url' => (
                        !empty($attendance->break_out_latitude) && !empty($attendance->break_out_longitude)
                    )
                        ? 'https://www.google.com/maps?q=' . $attendance->break_out_latitude . ',' . $attendance->break_out_longitude
                        : null,

                    // check-out location
                    'check_out_latitude' => $attendance->check_out_latitude ?? null,
                    'check_out_longitude' => $attendance->check_out_longitude ?? null,
                    'check_out_address' => $attendance->check_out_address ?? null,
                    'check_out_map_url' => (
                        !empty($attendance->check_out_latitude) && !empty($attendance->check_out_longitude)
                    )
                        ? 'https://www.google.com/maps?q=' . $attendance->check_out_latitude . ',' . $attendance->check_out_longitude
                        : null,

                    // overtime location
                    'overtime_in_latitude' => $attendance->overtime_in_latitude ?? null,
                    'overtime_in_longitude' => $attendance->overtime_in_longitude ?? null,
                    'overtime_in_address' => $attendance->overtime_in_address ?? null,
                    'overtime_in_map_url' => (
                        !empty($attendance->overtime_in_latitude) && !empty($attendance->overtime_in_longitude)
                    )
                        ? 'https://www.google.com/maps?q=' . $attendance->overtime_in_latitude . ',' . $attendance->overtime_in_longitude
                        : null,

                    'overtime_out_latitude' => $attendance->overtime_out_latitude ?? null,
                    'overtime_out_longitude' => $attendance->overtime_out_longitude ?? null,
                    'overtime_out_address' => $attendance->overtime_out_address ?? null,
                    'overtime_out_map_url' => (
                        !empty($attendance->overtime_out_latitude) && !empty($attendance->overtime_out_longitude)
                    )
                        ? 'https://www.google.com/maps?q=' . $attendance->overtime_out_latitude . ',' . $attendance->overtime_out_longitude
                        : null,
                ],
            ],
        ]);
    }
    public function attendanceHistory(Request $request)
    {
        $authUser = authUser();

        if (!is_object($authUser)) {
            return $authUser;
        }

        $tz = config('app.timezone', 'Asia/Dubai');
        $today = now()->setTimezone($tz)->startOfDay();

        $attendances = Attendance::where('user_id', $authUser->id)
            ->when($request->filled('from_date'), function ($q) use ($request) {
                $q->whereDate('date', '>=', $request->from_date);
            })
            ->when($request->filled('to_date'), function ($q) use ($request) {
                $q->whereDate('date', '<=', $request->to_date);
            })
            ->orderBy('date', 'desc')
            ->get();

        $fmtTime = function ($t) use ($tz) {
            if (!$t) {
                return null;
            }

            return Carbon::createFromFormat(strlen($t) > 5 ? 'H:i:s' : 'H:i', $t, $tz)->format('h:i A');
        };

        $fmtDuration = function ($minutes) {
            $minutes = (int) max($minutes, 0);
            $h = intdiv($minutes, 60);
            $m = $minutes % 60;

            return sprintf('%02d Hr %02d Min', $h, $m);
        };

        $history = $attendances->map(function ($a) use ($fmtTime, $fmtDuration, $tz, $today) {
            $breakMinutes = 0;
            $workMinutes = 0;

            $dateObj = Carbon::parse($a->date, $tz)->startOfDay();
            $diffDays = $today->diffInDays($dateObj, false);

            if ($a->check_in && $a->check_out) {
                $inDT = Carbon::createFromFormat('Y-m-d H:i', $a->date . ' ' . substr($a->check_in, 0, 5), $tz);
                $outDT = Carbon::createFromFormat('Y-m-d H:i', $a->date . ' ' . substr($a->check_out, 0, 5), $tz);

                $totalMinutes = max($inDT->diffInMinutes($outDT, false), 0);

                if ($a->break_in && $a->break_out) {
                    $bInDT = Carbon::createFromFormat('Y-m-d H:i', $a->date . ' ' . substr($a->break_in, 0, 5), $tz);
                    $bOutDT = Carbon::createFromFormat('Y-m-d H:i', $a->date . ' ' . substr($a->break_out, 0, 5), $tz);
                    $breakMinutes = max($bInDT->diffInMinutes($bOutDT, false), 0);
                }

                $workMinutes = max($totalMinutes - $breakMinutes, 0);
            }

            // Status logic
            if ($a->check_in) {
                $status_name = 'Present';
            } else {
                $status_name = 'Not Available';
            }

            // Date label logic
            if ($diffDays === 0) {
                $date_label = 'Today';
            } elseif ($diffDays === 1) {
                $date_label = 'Tomorrow';
            } elseif ($diffDays === -1) {
                $date_label = 'Yesterday';
            } elseif ($diffDays > 1 && $diffDays < 7) {
                $date_label = $diffDays . ' days';
            } elseif ($diffDays < -1 && $diffDays > -7) {
                $date_label = abs($diffDays) . ' days';
            } elseif ($diffDays >= 7 && $diffDays < 30) {
                $weeks = floor($diffDays / 7);
                $date_label = $weeks . ' week' . ($weeks > 1 ? 's' : '');
            } elseif ($diffDays <= -7 && $diffDays > -30) {
                $weeks = floor(abs($diffDays) / 7);
                $date_label = $weeks . ' week' . ($weeks > 1 ? 's' : '');
            } else {
                $months = max(1, floor(abs($diffDays) / 30));
                $date_label = $months . ' month' . ($months > 1 ? 's' : '');
            }

            return [
                'id' => $a->id,
                'date' => $a->date,
                'date_label' => $date_label,
                'status_name' => $status_name,
                'check_in' => $fmtTime($a->check_in),
                'break_in' => $fmtTime($a->break_in),
                'break_out' => $fmtTime($a->break_out),
                'check_out' => $fmtTime($a->check_out),
                'overtime_in' => $fmtTime($a->overtime_in),
                'overtime_out' => $fmtTime($a->overtime_out),
                'location' => $a->company_id ? optional($a->company)->name : null,
                'total_hours_worked' => $fmtDuration($workMinutes + (int) ($a->overtime_minutes ?? 0)),
                'overtime_minutes' => (int) ($a->overtime_minutes ?? 0),
            ];
        })->values();

        return response()->json([
            'status' => true,
            'message' => 'Attendance history fetched successfully.',
            'data' => $history,
        ]);
    }
}