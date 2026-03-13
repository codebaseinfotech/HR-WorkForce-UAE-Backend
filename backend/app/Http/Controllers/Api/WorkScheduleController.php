<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\WorkSchedule;
use Illuminate\Http\Request;

class WorkScheduleController extends Controller
{
    public function index(Request $request)
    {
        $companyId = (int) $request->validate([
            'company_id' => 'required|exists:companies,id',
            'role_id' => 'nullable|exists:roles,id',
        ])['company_id'];

        $roleId = $request->role_id;

        $q = WorkSchedule::where('company_id', $companyId);

        if ($roleId) {
            $q->where('role_id', $roleId);
        }

        return response()->json([
            'status' => true,
            'data' => $q->get(),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'id' => 'nullable|exists:work_schedules,id',
            'company_id' => 'required|exists:companies,id',
            'role_id' => 'required|exists:roles,id',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i',
            'break_minutes' => 'nullable|integer|min:0|max:600',
            'weekly_rules' => 'required|array',
            'monthly_rules' => 'nullable|array',
            'effective_from' => 'nullable|date',
            'effective_to' => 'nullable|date|after_or_equal:effective_from',
        ]);

        $schedule = WorkSchedule::updateOrCreate(
            [
                'id' => $data['id'] ?? null,
                'company_id' => $data['company_id'],
                'role_id' => $data['role_id'],
            ],
            [
                'start_time' => $data['start_time'],
                'end_time' => $data['end_time'],
                'break_minutes' => $data['break_minutes'] ?? 0,
                'weekly_rules' => $data['weekly_rules'],
                'monthly_rules' => $data['monthly_rules'] ?? null,
                'effective_from' => $data['effective_from'] ?? null,
                'effective_to' => $data['effective_to'] ?? null,
            ]
        );

        return response()->json([
            'status' => true,
            'message' => ($data['id'] ?? null) ? 'Work schedule updated' : 'Work schedule created',
            'data' => $schedule,
        ]);
    }

    public function destroy(WorkSchedule $workSchedule)
    {
        $workSchedule->delete();

        return response()->json(['status' => true, 'message' => 'Work schedule deleted']);
    }
}
