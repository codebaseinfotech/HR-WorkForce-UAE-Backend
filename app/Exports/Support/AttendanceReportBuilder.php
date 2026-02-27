<?php

namespace App\Exports\Support;

use App\Models\Attendance;
use App\Models\HolidayCalendar;
use App\Models\LeaveRequest;
use App\Models\WorkSchedule;
use Carbon\Carbon;
use Carbon\CarbonPeriod;

class AttendanceReportBuilder
{
    public function build($user, array $params): array
    {
        $companyId = $user->company_id;
        $tz = 'Asia/Kolkata';

        [$from, $to] = $this->resolveRange($params, $tz);

        $schedule = WorkSchedule::where('company_id', $companyId)
            ->where('role_id', $user->role_id)
            ->first();

        if (! $schedule) {
            return [
                'user' => [
                    'id' => $user->id,
                    'name' => trim(($user->first_name ?? '').' '.($user->last_name ?? '')),
                    'company_id' => $companyId,
                ],
                'summary' => [
                    'from' => $from->toDateString(),
                    'to' => $to->toDateString(),
                ],
                'days' => [],
                'leaves' => [],
                'holidays' => [],
                'error' => 'Work schedule not set for your role',
            ];
        }

        $holidayMap = $this->getHolidayMap($companyId, (int) $from->year, (int) $to->year);

        $attRows = Attendance::where('company_id', $companyId)
            ->where('user_id', $user->id)
            ->whereBetween('date', [$from->toDateString(), $to->toDateString()])
            ->get()
            ->keyBy(fn ($a) => Carbon::parse($a->date)->toDateString());

        $leaveRows = LeaveRequest::where('company_id', $companyId)
            ->where('user_id', $user->id)
            ->where('status', 'approved')
            ->whereDate('to_date', '>=', $from->toDateString())
            ->whereDate('from_date', '<=', $to->toDateString())
            ->get();

        $leaveDates = $this->buildLeaveDatesSet($leaveRows, $from, $to);

        $period = CarbonPeriod::create($from->toDateString(), $to->toDateString());

        $summary = [
            'from' => $from->toDateString(),
            'to' => $to->toDateString(),

            'total_days' => 0,
            'working_days' => 0,
            'holiday_days' => 0,
            'weekly_off_days' => 0,

            'present_days' => 0,
            'leave_days' => 0,
            'absent_days' => 0,

            // ✅ total_work_minutes now means FINAL TOTAL minutes (work + overtime)
            'total_work_minutes' => 0,

            // ✅ total overtime (shift overtime + session overtime)
            'total_overtime_minutes' => 0,
        ];

        $days = [];

        foreach ($period as $d) {
            $summary['total_days']++;
            $ds = $d->toDateString();

            $isHoliday = isset($holidayMap[$ds]);
            $isWeekOff = $this->isWeekOff($d, $schedule->weekly_rules, $schedule->monthly_rules ?? null);
            $isWorkingDay = (! $isHoliday && ! $isWeekOff);

            if ($isHoliday) {
                $summary['holiday_days']++;
            }
            if ($isWeekOff) {
                $summary['weekly_off_days']++;
            }
            if ($isWorkingDay) {
                $summary['working_days']++;
            }

            $att = $attRows->get($ds);

            $present = ($att && $att->check_in);

            $workMinutes = 0;
            $shiftOvertime = 0;
            $sessionOvertime = 0;
            $finalTotal = 0;

            if ($att) {
                $workMinutes = (int) ($att->total_minutes ?? 0);
                $shiftOvertime = (int) ($att->overtime_minutes ?? 0);

                // fallback if total_minutes not stored
                if ($workMinutes === 0 && $att->check_in && $att->check_out) {
                    $workMinutes = $this->calcWorkMinutes(
                        $att->check_in,
                        $att->check_out,
                        $att->break_in,
                        $att->break_out
                    );
                }

                // ✅ session overtime (overtime_in/out)
                if ($att->overtime_in && $att->overtime_out) {
                    $otIn = strtotime($att->overtime_in);
                    $otOut = strtotime($att->overtime_out);
                    $sessionOvertime = max((int) (($otOut - $otIn) / 60), 0);
                }

                $finalTotal = $workMinutes + $shiftOvertime + $sessionOvertime;
            }

            $onLeave = isset($leaveDates[$ds]);

            $status = 'N/A';
            if ($isHoliday) {
                $status = 'holiday';
            } elseif ($isWeekOff) {
                $status = 'weekly_off';
            } else {
                if ($onLeave) {
                    $status = 'leave';
                    $summary['leave_days']++;
                } elseif ($present) {
                    $status = 'present';
                    $summary['present_days']++;

                    // ✅ Add FINAL TOTAL in worked minutes
                    $summary['total_work_minutes'] += $finalTotal;

                    // ✅ Add TOTAL overtime (shift + session)
                    $summary['total_overtime_minutes'] += ($shiftOvertime + $sessionOvertime);
                } else {
                    $status = 'absent';
                    $summary['absent_days']++;
                }
            }

            $days[] = [
                'date' => $ds,
                'day' => $d->format('D'),
                'status' => $status,
                'holiday_title' => $isHoliday ? ($holidayMap[$ds]['title'] ?? '') : '',

                'check_in' => $att->check_in ?? '',
                'break_in' => $att->break_in ?? '',
                'break_out' => $att->break_out ?? '',
                'check_out' => $att->check_out ?? '',

                // ✅ overtime session times
                'overtime_in' => $att->overtime_in ?? '',
                'overtime_out' => $att->overtime_out ?? '',

                // ✅ minutes
                'work_minutes' => (int) $workMinutes,
                'shift_overtime_minutes' => (int) $shiftOvertime,
                'session_overtime_minutes' => (int) $sessionOvertime,
                'final_total_minutes' => (int) $finalTotal,
            ];
        }

        $leaves = $leaveRows->map(function ($l) {
            return [
                'from_date' => $l->from_date->toDateString(),
                'to_date' => $l->to_date->toDateString(),
                'days' => (float) $l->days,
                'status' => $l->status,
                'reason' => $l->reason,
            ];
        })->values()->all();

        return [
            'user' => [
                'id' => $user->id,
                'name' => trim(($user->first_name ?? '').' '.($user->last_name ?? '')),
                'company_id' => $companyId,
            ],
            'summary' => $summary,
            'days' => $days,
            'leaves' => $leaves,
            'holidays' => $holidayMap,
        ];
    }

    private function resolveRange(array $data, string $tz): array
    {
        $now = now()->setTimezone($tz);

        if (! empty($data['from']) && ! empty($data['to'])) {
            return [
                Carbon::parse($data['from'], $tz)->startOfDay(),
                Carbon::parse($data['to'], $tz)->startOfDay(),
            ];
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
                    $map[$h->date->toDateString()] = [
                        'date' => $h->date->toDateString(),
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

            foreach (CarbonPeriod::create($start->toDateString(), $end->toDateString()) as $d) {
                $set[$d->toDateString()] = true;
            }
        }

        return $set;
    }

    private function isWeekOff(Carbon $date, array $weeklyRules, ?array $monthlyRules): bool
    {
        $key = strtolower($date->format('D')); // mon,tue...
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
}
