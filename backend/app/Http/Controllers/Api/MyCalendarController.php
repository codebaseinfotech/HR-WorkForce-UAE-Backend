<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\HolidayCalendar;
use App\Models\LeaveRequest;
use App\Models\WorkSchedule;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class MyCalendarController extends Controller
{
     // GET /my-calendar/summary?year=2026&month=3
    // or year only => full year summary
    public function summary(Request $request)
    {
        $data = $request->validate([
            'year' => 'required|digits:4|integer|min:2000|max:2100',
            'month' => 'nullable|integer|min:1|max:12',
        ]);

        $user = Auth::user();
        $companyId = $user->company_id;
        $year = (int)$data['year'];
        $month = $data['month'] ?? null;

        // date range
        if ($month) {
            $start = Carbon::create($year, (int)$month, 1)->startOfMonth();
            $end   = (clone $start)->endOfMonth();
        } else {
            $start = Carbon::create($year, 1, 1)->startOfDay();
            $end   = Carbon::create($year, 12, 31)->endOfDay();
        }

        // role schedule
        $schedule = WorkSchedule::where('company_id', $companyId)
            ->where('role_id', $user->role_id)
            ->first();

        if (!$schedule) {
            return response()->json([
                'status' => false,
                'message' => 'Work schedule not set for your role',
            ], 422);
        }

        // holidays for year
        $cal = HolidayCalendar::with(['holidays' => fn($q) => $q->orderBy('date')])
            ->where('company_id', $companyId)
            ->where('year', $year)
            ->first();

        $holidayMap = [];
        if ($cal) {
            foreach ($cal->holidays as $h) {
                $holidayMap[$h->date->toDateString()] = [
                    'title' => $h->title,
                    'type' => $h->type,
                    'is_optional' => (bool)$h->is_optional,
                ];
            }
        }

        $period = CarbonPeriod::create($start->toDateString(), $end->toDateString());

        $totalDays = 0;
        $weeklyOffDays = 0;
        $holidayDays = 0;
        $workingDays = 0;

        // approved leaves in this range
        $approvedLeaves = LeaveRequest::where('company_id', $companyId)
            ->where('user_id', $user->id)
            ->where('status', 'approved')
            ->whereDate('to_date', '>=', $start->toDateString())
            ->whereDate('from_date', '<=', $end->toDateString())
            ->get();

        // build leave dates set (only approved)
        $leaveDates = [];
        foreach ($approvedLeaves as $lr) {
            $p = CarbonPeriod::create(
                max($lr->from_date, $start)->toDateString(),
                min($lr->to_date, $end)->toDateString()
            );
            foreach ($p as $d) {
                $leaveDates[$d->toDateString()] = true;
            }
        }

        foreach ($period as $date) {
            $totalDays++;

            $ds = $date->toDateString();
            $dow = strtolower($date->format('D')); // mon,tue,wed...

            $isHoliday = isset($holidayMap[$ds]);
            $isWeekOff = $this->isWeekOff($date, $schedule->weekly_rules, $schedule->monthly_rules ?? null);

            if ($isHoliday) $holidayDays++;
            if ($isWeekOff) $weeklyOffDays++;

            if (!$isHoliday && !$isWeekOff) $workingDays++;
        }

        // leave count only on working days (exclude weekoff/holiday)
        $leaveOnWorkingDays = 0;
        foreach (array_keys($leaveDates) as $ds) {
            $d = Carbon::parse($ds);
            $isHoliday = isset($holidayMap[$ds]);
            $isWeekOff = $this->isWeekOff($d, $schedule->weekly_rules, $schedule->monthly_rules ?? null);
            if (!$isHoliday && !$isWeekOff) $leaveOnWorkingDays++;
        }

        return response()->json([
            'status' => true,
            'data' => [
                'range' => [
                    'from' => $start->toDateString(),
                    'to' => $end->toDateString(),
                ],
                'counts' => [
                    'total_days' => $totalDays,
                    'weekly_off_days' => $weeklyOffDays,
                    'holiday_days' => $holidayDays,
                    'working_days' => $workingDays,
                    'approved_leave_days' => $leaveOnWorkingDays,
                    'present_working_days' => max($workingDays - $leaveOnWorkingDays, 0),
                ],
            ],
        ]);
    }

    private function isWeekOff(Carbon $date, array $weeklyRules, ?array $monthlyRules): bool
    {
        // keys expected: sun/mon/tue/wed/thu/fri/sat
        $key = strtolower($date->format('D')); // mon,tue...
        $value = $weeklyRules[$key] ?? 'on';

        if ($value === 'off') return true;

        if ($value === 'alternate' && $key === 'sat') {
            $weekOfMonth = (int) ceil($date->day / 7); // 1..5
            $offWeeks = $monthlyRules['sat_off_weeks'] ?? [];
            return in_array($weekOfMonth, $offWeeks);
        }

        return false;
    }
}
