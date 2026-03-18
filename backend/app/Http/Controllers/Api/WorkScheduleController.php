<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\WorkSchedule;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

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
        $validator = Validator::make($request->all(), [
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

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $data = $validator->validated();

            $match = [
                'company_id' => $data['company_id'],
                'role_id' => $data['role_id'],
            ];

            if (!empty($data['id'])) {
                $match['id'] = $data['id'];
            }

            $schedule = WorkSchedule::updateOrCreate(
                $match,
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
                'message' => !empty($data['id']) ? 'Work schedule updated' : 'Work schedule created',
                'data' => $schedule,
            ]);
        } catch (\Throwable $e) {
            Log::error('Work schedule save error', [
                'message' => $e->getMessage(),
                'line' => $e->getLine(),
                'file' => $e->getFile(),
            ]);

            return response()->json([
                'status' => false,
                'message' => 'Something went wrong',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function destroy(WorkSchedule $workSchedule)
    {
        $workSchedule->delete();

        return response()->json(['status' => true, 'message' => 'Work schedule deleted']);
    }
}
