<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Company;
use App\Models\EmployeeSalary;
use App\Models\HolidayCalendar;
use App\Models\LeaveRequest;
use App\Models\User;
use App\Models\WorkSchedule;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class EmployeeSalaryController extends Controller
{
    public function index(Request $request)
    {
        $authUser = Auth::user();

        $validator = Validator::make($request->all(), [
            'company_id' => 'nullable|exists:companies,id',
            'user_id' => 'nullable|exists:users,id',
            'salary_type' => 'nullable|in:monthly,daily,hourly',
            'date' => 'nullable|date_format:Y-m-d', // effective date filter
            'per_page' => 'nullable|integer|min:1|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $companyId = $request->company_id ?? ($authUser->company_id ?? null);
        $perPage = (int) ($request->per_page ?? 20);
        $date = $request->date;

        $query = EmployeeSalary::query()
            ->when($companyId, fn ($q) => $q->where('company_id', $companyId))
            ->when($request->user_id, fn ($q) => $q->where('user_id', $request->user_id))
            ->when($request->salary_type, fn ($q) => $q->where('salary_type', $request->salary_type))
            ->when($date, function ($q) use ($date) {
                $q->where(function ($qq) use ($date) {
                    $qq->whereNull('effective_from')->orWhere('effective_from', '<=', $date);
                })->where(function ($qq) use ($date) {
                    $qq->whereNull('effective_to')->orWhere('effective_to', '>=', $date);
                });
            })
            ->latest('id');

        $rows = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'filters' => [
                'company_id' => $companyId,
                'user_id' => $request->user_id,
                'salary_type' => $request->salary_type,
                'date' => $date,
                'per_page' => $perPage,
            ],
            'data' => $rows,
        ]);
    }

    //  SHOW SINGLE
    // GET /admin/employee-salaries/{id}
    public function show($id)
    {
        $row = EmployeeSalary::find($id);

        if (! $row) {
            return response()->json([
                'success' => false,
                'message' => 'Record not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $row,
        ]);
    }

    public function addUpdate(Request $request)
    {
        $data = $request->validate([
            'id' => 'nullable|exists:employee_salaries,id',

            'company_id' => 'required|exists:companies,id',
            'user_id' => 'required|exists:users,id',

            'salary_type' => 'required|in:monthly,daily,hourly',

            'monthly_salary' => 'nullable|numeric|min:0',
            'daily_salary' => 'nullable|numeric|min:0',
            'hourly_salary' => 'nullable|numeric|min:0',

            'overtime_rate_per_hour' => 'nullable|numeric|min:0',

            'effective_from' => 'required|date_format:Y-m-d',
            'effective_to' => 'nullable|date_format:Y-m-d|after_or_equal:effective_from',
        ]);

        //  salary_type wise required amount
        if ($data['salary_type'] === 'monthly' && empty($data['monthly_salary'])) {
            return response()->json(['success' => false, 'message' => 'monthly_salary is required for monthly type'], 422);
        }
        if ($data['salary_type'] === 'daily' && empty($data['daily_salary'])) {
            return response()->json(['success' => false, 'message' => 'daily_salary is required for daily type'], 422);
        }
        if ($data['salary_type'] === 'hourly' && empty($data['hourly_salary'])) {
            return response()->json(['success' => false, 'message' => 'hourly_salary is required for hourly type'], 422);
        }

        $id = $data['id'] ?? null;

        //  prevent overlap (same user date range) BUT ignore current row while updating
        $overlap = EmployeeSalary::where('company_id', $data['company_id'])
            ->where('user_id', $data['user_id'])
            ->when($id, fn ($q) => $q->where('id', '!=', $id))
            ->where(function ($q) use ($data) {
                $newFrom = $data['effective_from'];
                $newTo = $data['effective_to'] ?? null;

                // Overlap condition:
                // existing_from <= new_to AND existing_to >= new_from
                $q->where(function ($qq) use ($newFrom) {
                    $qq->whereNull('effective_to')
                        ->orWhere('effective_to', '>=', $newFrom);
                });

                if ($newTo) {
                    $q->where(function ($qq) use ($newTo) {
                        $qq->whereNull('effective_from')
                            ->orWhere('effective_from', '<=', $newTo);
                    });
                }
            })
            ->exists();

        if ($overlap) {
            return response()->json([
                'success' => false,
                'message' => 'Salary rule already exists / overlaps for this employee in this date range',
            ], 409);
        }

        //  CREATE or UPDATE
        if ($id) {
            $row = EmployeeSalary::find($id);
            $row->update($data);

            return response()->json([
                'success' => true,
                'message' => 'Employee salary updated',
                'data' => $row->fresh(),
            ], 200);
        }

        // remove id before create
        unset($data['id']);
        $row = EmployeeSalary::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Employee salary created',
            'data' => $row,
        ], 201);
    }

    //  DELETE
    // DELETE /admin/employee-salaries/{id}
    public function destroy($id)
    {
        $row = EmployeeSalary::find($id);

        if (! $row) {
            return response()->json([
                'success' => false,
                'message' => 'Record not found',
            ], 404);
        }

        $row->delete();

        return response()->json([
            'success' => true,
            'message' => 'Employee salary deleted',
        ]);
    }

    // GET /salary-slip/pdf?company_id=1&user_id=2&month=2026-02
    // OR  /salary-slip/pdf?company_id=1&user_id=2&from=2026-01-01&to=2026-03-31
    // OR  /salary-slip/pdf?company_id=1&user_id=2&months=3
    public function downloadPdf(Request $request)
    {
        $data = $request->validate([
            'company_id' => 'required|exists:companies,id',
            'user_id' => 'required|exists:users,id',

            // one of these:
            'month' => 'nullable|date_format:Y-m',
            'from' => 'nullable|date',
            'to' => 'nullable|date|after_or_equal:from',
            'months' => 'nullable|integer|min:1|max:24',
        ]);

        // Resolve range in single function
        [$from, $to] = $this->resolvePdfRange($data);

        return $this->buildAndDownload(
            (int) $data['company_id'],
            (int) $data['user_id'],
            $from,
            $to
        );
    }

    /**
     * One API - resolve range from:
     * - month=Y-m
     * - from/to
     * - months=N (last N months)
     */
    private function resolvePdfRange(array $data): array
    {
        // 1) month
        if (! empty($data['month'])) {
            $from = Carbon::createFromFormat('Y-m', $data['month'])->startOfMonth();
            $to = Carbon::createFromFormat('Y-m', $data['month'])->endOfMonth();

            return [$from, $to];
        }

        // 2) from/to
        if (! empty($data['from']) && ! empty($data['to'])) {
            $from = Carbon::parse($data['from'])->startOfDay();
            $to = Carbon::parse($data['to'])->endOfDay();

            return [$from, $to];
        }

        // 3) months = last N months
        if (! empty($data['months'])) {
            $n = (int) $data['months'];
            $to = now()->endOfMonth();
            $from = now()->copy()->subMonthsNoOverflow($n - 1)->startOfMonth();

            return [$from, $to];
        }

        // Default: current month
        return [now()->startOfMonth(), now()->endOfMonth()];
    }

    private function buildAndDownload(int $companyId, int $userId, Carbon $from, Carbon $to)
    {
        $tz = 'Asia/Kolkata';

        $company = Company::findOrFail($companyId);
        $user = User::findOrFail($userId);

        // WorkSchedule role wise
        $schedule = WorkSchedule::where('company_id', $companyId)
            ->where('role_id', $user->role_id)
            ->first();

        if (! $schedule) {
            return response()->json([
                'success' => false,
                'message' => 'Work schedule not set for this user role',
            ], 422);
        }

        // Salary row
        $salaryRow = EmployeeSalary::where('company_id', $companyId)
            ->where('user_id', $userId)
            ->where(function ($q) use ($from) {
                $q->whereNull('effective_to')
                    ->orWhere('effective_to', '>=', $from->toDateString());
            })
            ->where(function ($q) use ($from) {
                $q->whereNull('effective_from')
                    ->orWhere('effective_from', '<=', $from->toDateString());
            })
            ->orderByDesc('effective_from')
            ->first();

        if (! $salaryRow) {
            return response()->json([
                'success' => false,
                'message' => 'Employee salary not set for this period',
            ], 422);
        }

        // ✅ Month availability check (range case included)
        // If any month has no attendance + no approved leave => error
        $missingMonths = $this->findMissingMonths($companyId, $userId, $from, $to);
        if (! empty($missingMonths)) {
            return response()->json([
                'success' => false,
                'message' => 'Some months are not available in your data',
                'missing_months' => $missingMonths,
            ], 422);
        }

        // Holiday map
        $holidayMap = $this->getHolidayMap($companyId, (int) $from->year, (int) $to->year);

        // Attendance rows in range
        $attRows = Attendance::where('company_id', $companyId)
            ->where('user_id', $userId)
            ->whereBetween('date', [$from->toDateString(), $to->toDateString()])
            ->get()
            ->keyBy(fn ($a) => Carbon::parse($a->date)->toDateString());

        // Approved leaves rows in range
        $leaveRows = LeaveRequest::where('company_id', $companyId)
            ->where('user_id', $userId)
            ->where('status', 'approved')
            ->whereDate('to_date', '>=', $from->toDateString())
            ->whereDate('from_date', '<=', $to->toDateString())
            ->get();

        $leaveDates = $this->buildLeaveDatesSet($leaveRows, $from, $to);

        // Per day compute
        $period = CarbonPeriod::create($from->toDateString(), $to->toDateString());

        $totalDays = 0;
        $workingDays = 0;
        $holidayDays = 0;
        $weeklyOffDays = 0;

        $presentDays = 0;
        $leaveDays = 0;
        $absentDays = 0;

        $totalWorkMinutes = 0;
        $totalOvertimeMinutes = 0;

        foreach ($period as $d) {
            $totalDays++;
            $ds = $d->toDateString();

            $isHoliday = isset($holidayMap[$ds]);
            $isWeekOff = $this->isWeekOff($d, (array) $schedule->weekly_rules, $schedule->monthly_rules ?? null);

            if ($isHoliday) {
                $holidayDays++;
            }
            if ($isWeekOff) {
                $weeklyOffDays++;
            }

            $isWorkingDay = (! $isHoliday && ! $isWeekOff);
            if ($isWorkingDay) {
                $workingDays++;
            }

            $att = $attRows->get($ds);
            $onLeave = isset($leaveDates[$ds]);

            $present = ($att && ! empty($att->check_in));

            $workMinutes = (int) ($att->total_minutes ?? 0);
            $overtimeMin = (int) ($att->overtime_minutes ?? 0);

            if ($workMinutes === 0 && $att && $att->check_in && $att->check_out) {
                $workMinutes = $this->calcWorkMinutes($att->check_in, $att->check_out, $att->break_in, $att->break_out);
            }

            if ($isWorkingDay) {
                if ($onLeave) {
                    $leaveDays++;
                } elseif ($present) {
                    $presentDays++;
                    $totalWorkMinutes += $workMinutes;
                    $totalOvertimeMinutes += $overtimeMin;
                } else {
                    $absentDays++;
                }
            } else {
                // holiday/weekoff - if present still add minutes
                if ($present) {
                    $totalWorkMinutes += $workMinutes;
                    $totalOvertimeMinutes += $overtimeMin;
                }
            }
        }

        // Salary calc
        $salaryType = $salaryRow->salary_type;
        $paidDays = $presentDays + $leaveDays;

        $baseSalary = 0.0;
        $earnedAmount = 0.0;

        if ($salaryType === 'monthly') {
            $baseSalary = (float) ($salaryRow->monthly_salary ?? 0);
            $earnedAmount = ($workingDays > 0) ? ($baseSalary * ($paidDays / $workingDays)) : 0;
        } elseif ($salaryType === 'daily') {
            $daily = (float) ($salaryRow->daily_salary ?? 0);
            $baseSalary = $daily;
            $earnedAmount = $daily * $paidDays;
        } else { // hourly
            $hourly = (float) ($salaryRow->hourly_salary ?? 0);
            $baseSalary = $hourly;
            $workedHours = $totalWorkMinutes / 60;
            $earnedAmount = $hourly * $workedHours;
        }

        $otRate = (float) ($salaryRow->overtime_rate_per_hour ?? 0);
        $otHours = $totalOvertimeMinutes / 60;
        $overtimeAmount = $otRate * $otHours;

        $grossPayable = $earnedAmount + $overtimeAmount;

        $periodData = [
            'from' => $from->copy()->setTimezone($tz)->format('d M Y'),
            'to' => $to->copy()->setTimezone($tz)->format('d M Y'),
            'month_label' => $from->format('F Y').' - '.$to->format('F Y'),
        ];

        $summary = [
            'total_days' => $totalDays,
            'working_days' => $workingDays,
            'holiday_days' => $holidayDays,
            'weekly_off_days' => $weeklyOffDays,
            'present_days' => $presentDays,
            'leave_days' => $leaveDays,
            'absent_days' => $absentDays,
            'worked' => $this->fmtDuration($totalWorkMinutes),
            'overtime' => $this->fmtDuration($totalOvertimeMinutes),
        ];

        $salary = [
            'salary_type' => $salaryType,
            'base_salary' => (float) $baseSalary,
            'earned_amount' => (float) $earnedAmount,
            'overtime_rate_per_hour' => (float) $otRate,
            'overtime_amount' => (float) $overtimeAmount,
            'gross_payable' => (float) $grossPayable,
            'currency' => $company->currency ?? 'INR',
            'payslip_no' => 'PS-'.$from->format('Ym').'-'.$userId,
        ];

        // logo / signature (public)
        $logoPath = public_path('logo.png');
        $signPath = public_path('signature.png');

        $logoBase64 = file_exists($logoPath)
            ? 'data:image/'.pathinfo($logoPath, PATHINFO_EXTENSION).';base64,'.base64_encode(file_get_contents($logoPath))
            : null;

        $signBase64 = file_exists($signPath)
            ? 'data:image/'.pathinfo($signPath, PATHINFO_EXTENSION).';base64,'.base64_encode(file_get_contents($signPath))
            : null;

        $viewData = compact('company', 'user', 'periodData', 'summary', 'salary', 'logoBase64', 'signBase64');

        $pdf = Pdf::loadView('pdf.salary-slip', $viewData)->setPaper('A4', 'portrait');

        $filename = 'salary_slip_'.$userId.'_'.$from->format('Y_m').'_to_'.$to->format('Y_m').'.pdf';

        return $pdf->download($filename);
    }

    private function findMissingMonths(int $companyId, int $userId, Carbon $from, Carbon $to): array
    {
        $missing = [];

        $cursor = $from->copy()->startOfMonth();
        $end = $to->copy()->startOfMonth();

        while ($cursor->lte($end)) {
            $mStart = $cursor->copy()->startOfMonth()->toDateString();
            $mEnd = $cursor->copy()->endOfMonth()->toDateString();

            $hasAttendance = Attendance::where('company_id', $companyId)
                ->where('user_id', $userId)
                ->whereBetween('date', [$mStart, $mEnd])
                ->whereNotNull('check_in')
                ->exists();

            $hasLeave = LeaveRequest::where('company_id', $companyId)
                ->where('user_id', $userId)
                ->where('status', 'approved')
                ->whereDate('to_date', '>=', $mStart)
                ->whereDate('from_date', '<=', $mEnd)
                ->exists();

            if (! $hasAttendance && ! $hasLeave) {
                $missing[] = $cursor->format('Y-m');
            }

            $cursor->addMonthNoOverflow();
        }

        return $missing;
    }

    // ===== Helpers =====

    private function fmtDuration(int $minutes): string
    {
        $minutes = max($minutes, 0);
        $h = intdiv($minutes, 60);
        $m = $minutes % 60;

        return sprintf('%02d Hrs %02d Min', $h, $m);
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
}
