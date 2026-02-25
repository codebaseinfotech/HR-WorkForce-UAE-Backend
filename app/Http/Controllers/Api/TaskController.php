<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Task;
use App\Models\TaskAssignment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class TaskController extends Controller
{
    public function store(Request $request)
    {
        try {
            $data = $request->validate([
                'id' => 'nullable|integer|exists:tasks,id',
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'priority' => 'nullable|in:low,medium,high,urgent',
                'due_date' => 'nullable|date_format:Y-m-d',
            ]);

            $user = Auth::user();
            $companyId = $user->company_id ?? $request->company_id;
            //  UPDATE
            if (! empty($data['id'])) {
                $task = Task::where('id', $data['id'])
                    ->where('company_id', $companyId)
                    ->firstOrFail();
                $task->update([
                    'title' => $data['title'],
                    'description' => $data['description'] ?? null,
                    'priority' => $data['priority'] ?? $task->priority,
                    'due_date' => $data['due_date'] ?? null,
                    'status' => 'active',
                ]);
                if (! is_null($user->employeeId)) {
                    TaskAssignment::updateOrCreate(
                        ['task_id' => $task->id, 'user_id' => $user->id],
                        [
                            'company_id' => $companyId,
                            'assigned_by' => $user->id,
                            'status' => 'assigned',
                            'progress' => 0,
                            'note' => null,
                            'accepted_at' => null,
                            'started_at' => null,
                            'completed_at' => null,
                        ]
                    );
                }

                return response()->json([
                    'status' => true,
                    'message' => 'Task updated',
                    'data' => $task,
                ], 200);
            }

            // ✅ CREATE
            $task = Task::create([
                'company_id' => $companyId,
                'created_by' => $user->id,
                'title' => $data['title'],
                'description' => $data['description'] ?? null,
                'priority' => $data['priority'] ?? 'medium',
                'due_date' => $data['due_date'] ?? null,
                'status' => 'active',
            ]);
            // Auto self assign (fix employee_id field name)
            if (! is_null($user->employeeId)) {
                TaskAssignment::updateOrCreate(
                    ['task_id' => $task->id, 'user_id' => $user->id],
                    [
                        'company_id' => $companyId,
                        'assigned_by' => $user->id,
                        'status' => 'assigned',
                        'progress' => 0,
                        'note' => null,
                        'accepted_at' => null,
                        'started_at' => null,
                        'completed_at' => null,
                    ]
                );
            }

            return response()->json([
                'status' => true,
                'message' => 'Task created',
                'data' => $task,
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        }
    }

    public function index(Request $request)
    {
        $companyId = Auth::user()->company_id ?? $request->company_id;

        $tasks = Task::with(['assignments.user:id,first_name,last_name,email,phone,status'])
            ->where('company_id', $companyId)
            ->latest()
            ->get();

        return response()->json([
            'status' => true,
            'data' => $tasks,
        ]);
    }

    public function assignedTasks(Request $request)
    {
        $companyId = Auth::user()->company_id ?? $request->company_id;

        $tasks = Task::with(['assignments.user:id,first_name,last_name,email,phone'])
            ->where('company_id', $companyId)
            ->whereHas('assignments') // only assigned
            ->latest()
            ->get();

        return response()->json([
            'status' => true,
            'data' => $tasks,
        ]);
    }

    public function destroy(Request $request, $taskId)
    {
        $companyId = Auth::user()->company_id;

        $validator = Validator::make(
            ['task_id' => $taskId],
            [
                'task_id' => [
                    'required',
                    Rule::exists('tasks', 'id')
                        ->where(fn ($q) => $q->where('company_id', $companyId)),
                ],
            ],
            [
                'task_id.required' => 'Task ID is required.',
                'task_id.exists' => 'Task not found for your company.',
            ]
        );

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'message' => $validator->errors()->first(),
            ], 404);
        }

        $task = Task::where('id', $taskId)
            ->where('company_id', $companyId)
            ->first();

        $task->delete();

        return response()->json([
            'status' => true,
            'message' => 'Task deleted successfully',
        ]);
    }
}
