<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\HolidayCalendar;
use App\Models\LeaveBalance;
use App\Models\LeaveRequest;
use App\Models\WorkSchedule;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class MyLeaveController extends Controller
{
    // GET /my-leaves/summary?year=2026
    public function summary(Request $request)
    {
        $data = $request->validate([
            'year' => 'required|digits:4|integer|min:2000|max:2100',
        ]);

        $user = Auth::user();
        $companyId = $user->company_id;
        $year = (int) $data['year'];

        $balances = LeaveBalance::with('leaveType')
            ->where('company_id', $companyId)
            ->where('user_id', $user->id)
            ->where('year', $year)
            ->get();

        $approved = LeaveRequest::where('company_id', $companyId)
            ->where('user_id', $user->id)
            ->where('status', 'approved')
            ->whereYear('from_date', $year)
            ->sum('days');

        return response()->json([
            'status' => true,
            'data' => [
                'year' => $year,
                'balances' => $balances,
                'approved_leave_days' => (float) $approved,
            ],
        ]);
    }

    // GET /my-leaves/history?from=2026-01-01&to=2026-12-31
    public function history(Request $request)
    {
        $data = $request->validate([
            'from' => 'nullable|date',
            'to' => 'nullable|date|after_or_equal:from',
            'status' => 'nullable|in:pending,approved,rejected,cancelled',
        ]);

        $user = Auth::user();
        $companyId = $user->company_id;

        $q = LeaveRequest::with('leaveType')
            ->where('company_id', $companyId)
            ->where('user_id', $user->id)
            ->latest();

        if (! empty($data['from'])) {
            $q->whereDate('from_date', '>=', $data['from']);
        }
        if (! empty($data['to'])) {
            $q->whereDate('to_date', '<=', $data['to']);
        }
        if (! empty($data['status'])) {
            $q->where('status', $data['status']);
        }

        return response()->json([
            'status' => true,
            'data' => $q->paginate(20),
        ]);
    }

    // POST /my-leaves/apply
    public function apply(Request $request)
    {
        $user = Auth::user();
        $companyId = $user->company_id;
        $validator = Validator::make($request->all(), [
            'leave_type_id' => [
                'required',
                Rule::exists('leave_types', 'id')
                    ->where(fn ($q) => $q->where('company_id', $companyId)),
            ],
            'from_date' => 'required|date_format:Y-m-d',
            'to_date' => 'required|date_format:Y-m-d|after_or_equal:from_date',
            'reason' => 'required|string|max:500',
        ], [
            //  Custom Messages
            'leave_type_id.required' => 'Please select leave type.',
            'leave_type_id.exists' => 'Selected leave type is invalid for your company.',
            'from_date.required' => 'From date is required.',
            'from_date.date_format' => 'From date must be in YYYY-MM-DD format.',
            'to_date.required' => 'To date is required.',
            'to_date.date_format' => 'To date must be in YYYY-MM-DD format.',
            'to_date.after_or_equal' => 'To date must be same or after From date.',
            'reason.required' => 'Reason is required.',
            'reason.max' => 'Reason may not be greater than 500 characters.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $data = $validator->validated();
        // schedule required to calculate working leave days
        $schedule = WorkSchedule::where('company_id', $companyId)
            ->where('role_id', $user->role_id)
            ->first();

        if (! $schedule) {
            return response()->json(['status' => false, 'message' => 'Work schedule not set for your role'], 422);
        }

        $from = Carbon::parse($data['from_date'])->startOfDay();
        $to = Carbon::parse($data['to_date'])->startOfDay();

        // holiday map for year(s)
        $years = array_unique([(int) $from->year, (int) $to->year]);
        $holidayMap = [];
        foreach ($years as $y) {
            $cal = HolidayCalendar::with('holidays')
                ->where('company_id', $companyId)
                ->where('year', $y)
                ->first();
            if ($cal) {
                foreach ($cal->holidays as $h) {
                    $holidayMap[$h->date->toDateString()] = true;
                }
            }
        }

        // calculate leave days excluding holiday/weekoff
        $days = 0;
        $period = CarbonPeriod::create($from->toDateString(), $to->toDateString());
        foreach ($period as $d) {
            $ds = $d->toDateString();
            $isHoliday = isset($holidayMap[$ds]);
            $isWeekOff = $this->isWeekOff($d, $schedule->weekly_rules, $schedule->monthly_rules ?? null);

            if (! $isHoliday && ! $isWeekOff) {
                $days++;
            }
        }

        if ($days <= 0) {
            return response()->json([
                'status' => false,
                'message' => 'Selected dates are holidays/week-offs only. No leave days to apply.',
            ], 422);
        }

        // create pending request (cut will be on approve)
        $lr = LeaveRequest::create([
            'company_id' => $companyId,
            'user_id' => $user->id,
            'leave_type_id' => $data['leave_type_id'],
            'from_date' => $from->toDateString(),
            'to_date' => $to->toDateString(),
            'days' => $days,
            'reason' => $data['reason'],
            'status' => 'pending',
        ]);

        return response()->json([
            'status' => true,
            'message' => 'Leave request submitted',
            'data' => $lr,
        ]);
    }

    private function isWeekOff(Carbon $date, array $weeklyRules, ?array $monthlyRules): bool
    {
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
}