<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Task;
use App\Models\TaskAssignment;
use App\Models\TaskAttachment;
use App\Models\TaskComment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class MyTaskController extends Controller
{
    private function findTaskUser($taskId)
    {
        $userId = Auth::id();
        $companyId = Auth::user()->company_id;

        $tu = TaskAssignment::where('task_id', $taskId)
            ->where('user_id', $userId)
            ->where('company_id', $companyId)
            ->first();

        if (! $tu) {
            // 2 case: task exist che ke nahi? (company wise)
            $taskExists = Task::where('id', $taskId)
                ->where('company_id', $companyId)
                ->exists();

            if (! $taskExists) {
                abort(response()->json([
                    'status' => false,
                    'message' => 'Task not found',
                ], 404));
            }

            // task exists but not assigned to this user
            abort(response()->json([
                'status' => false,
                'message' => 'This task is not assigned to you',
            ], 403));
        }

        return $tu;
    }

    public function index(Request $request)
    {
        $data = $request->validate([
            'company_id' => 'required|integer|exists:companies,id',
            'user_id' => 'nullable|integer|exists:users,id',

            // optional filters
            'status' => 'nullable|in:draft,assigned,in_progress,blocked,done', // task status
            'q' => 'nullable|string|max:100',
            'per_page' => 'nullable|integer|min:1|max:100',
        ]);

        $companyId = (int) $data['company_id'];
        $userId = isset($data['user_id']) ? (int) $data['user_id'] : null;
        $perPage = $data['per_page'] ?? 20;

        $query = Task::query()
            ->where('company_id', $companyId)
            ->with([
                'assignments' => function ($q) use ($companyId, $userId) {
                    $q->where('company_id', $companyId);

                    if ($userId) {
                        $q->where('user_id', $userId);
                    }

                    $q->with('user:id,first_name,last_name,email,status');
                },

                //  comments load
                'comments' => function ($q) use ($companyId) {
                    $q->where('company_id', $companyId)
                        ->latest()
                        ->with('user:id,first_name,last_name,email,status');
                },

                //  attachments load (optional)
                'attachments' => function ($q) use ($companyId) {
                    $q->where('company_id', $companyId)
                        ->latest()
                        ->with('user:id,first_name,last_name,email,status');
                },
            ]);

        // If user_id passed => only tasks that are assigned to that user
        if ($userId) {
            $query->whereHas('assignments', function ($q) use ($companyId, $userId) {
                $q->where('company_id', $companyId)
                    ->where('user_id', $userId);
            });
        }

        // optional task status filter
        if (! empty($data['status'])) {
            $query->where('status', $data['status']);
        }

        // optional search (title/description)
        if (! empty($data['q'])) {
            $q = $data['q'];
            $query->where(function ($w) use ($q) {
                $w->where('title', 'like', "%{$q}%")
                    ->orWhere('description', 'like', "%{$q}%");
            });
        }

        $tasks = $query->latest()->paginate($perPage);

        return response()->json([
            'status' => true,
            'data' => $tasks,
        ]);
    }

    public function action(Request $request, $taskId)
    {
        $data = $request->validate([
            'action' => 'required|in:accept,start,progress,done,block',
            'progress' => 'nullable|integer|min:0|max:100',
            'note' => 'nullable|string|max:1000',
        ]);

        $tu = $this->findTaskUser($taskId);

        switch ($data['action']) {

            case 'accept':
                if ($tu->status !== 'assigned') {
                    return response()->json(['status' => false, 'message' => 'Invalid status for accept'], 409);
                }

                $tu->update([
                    'status' => 'accepted',
                    'accepted_at' => now(),
                ]);

                return response()->json(['status' => true, 'message' => 'Task accepted']);

            case 'start':
                if (! in_array($tu->status, ['assigned', 'accepted'])) {
                    return response()->json(['status' => false, 'message' => 'Invalid status for start'], 409);
                }

                $tu->update([
                    'status' => 'in_progress',
                    'accepted_at' => $tu->accepted_at ?? now(),
                    'started_at' => now(),
                ]);

                return response()->json(['status' => true, 'message' => 'Task started']);

            case 'progress':
                if (! isset($data['progress'])) {
                    return response()->json(['status' => false, 'message' => 'progress is required for progress action'], 422);
                }

                // Blocked task ma progress allow karvu che? (Yes) — status blocked j rahe.
                $updates = ['progress' => (int) $data['progress']];

                // If assigned/accepted -> auto in_progress
                if (in_array($tu->status, ['assigned', 'accepted'])) {
                    $updates['status'] = 'in_progress';
                    $updates['accepted_at'] = $tu->accepted_at ?? now();
                    $updates['started_at'] = $tu->started_at ?? now();
                }

                // If progress=100 => done (blocked hoy to done allow nai karvu hoy to aa part remove kari dejo)
                if ((int) $data['progress'] === 100) {
                    if ($tu->status === 'blocked') {
                        return response()->json(['status' => false, 'message' => 'Blocked task cannot be completed'], 409);
                    }

                    $updates['status'] = 'done';
                    $updates['completed_at'] = now();
                    if (! empty($data['note'])) {
                        $updates['note'] = $data['note'];
                    }
                }

                $tu->update($updates);

                return response()->json([
                    'status' => true,
                    'message' => 'Progress updated',
                    'current_status' => $tu->fresh()->status,
                    'progress' => (int) $tu->fresh()->progress,
                ]);

            case 'block':
                // block only when not done
                if ($tu->status === 'done') {
                    return response()->json(['status' => false, 'message' => 'Done task cannot be blocked'], 409);
                }

                $tu->update([
                    'status' => 'blocked',
                    'note' => $data['note'] ?? $tu->note,
                ]);

                return response()->json(['status' => true, 'message' => 'Task blocked']);

            case 'done':
                if (! in_array($tu->status, ['in_progress', 'accepted', 'assigned'])) {
                    return response()->json(['status' => false, 'message' => 'Invalid status for done'], 409);
                }

                $tu->update([
                    'status' => 'done',
                    'progress' => 100,
                    'accepted_at' => $tu->accepted_at ?? now(),
                    'started_at' => $tu->started_at ?? now(),
                    'completed_at' => now(),
                    'note' => $data['note'] ?? $tu->note,
                ]);

                return response()->json(['status' => true, 'message' => 'Task marked as done']);
        }

        return response()->json(['status' => false, 'message' => 'Invalid action'], 422);
    }

    public function feedback(Request $request, $taskId)
    {
        $request->validate([
            'comment' => 'nullable|string|min:1',
            'file' => 'nullable|file|max:10240',
        ]);

        // At least one required
        if (! $request->filled('comment') && ! $request->hasFile('file')) {
            return response()->json([
                'status' => false,
                'message' => 'Either comment or file is required',
            ], 422);
        }

        // Ensure task is assigned to this user (or valid access)
        $this->findTaskUser($taskId);

        $userId = Auth::id();
        $companyId = Auth::user()->company_id;
        $created = [
            'comment_id' => null,
            'attachment_id' => null,
        ];

        // Save comment if provided
        if ($request->filled('comment')) {
            $comment = TaskComment::create([
                'company_id' => $companyId,
                'task_id' => $taskId,
                'user_id' => $userId,
                'comment' => $request->comment,
            ]);
            $created['comment_id'] = $comment->id;
        }

        // Save file if provided
        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $path = $file->store("tasks/{$taskId}");

            $attachment = TaskAttachment::create([
                'company_id' => $companyId,
                'task_id' => $taskId,
                'user_id' => $userId,
                'file_path' => $path,
                'original_name' => $file->getClientOriginalName(),
                'mime' => $file->getClientMimeType(),
                'size' => $file->getSize(),
            ]);

            $created['attachment_id'] = $attachment->id;
        }

        return response()->json([
            'status' => true,
            'message' => 'Saved successfully',
            'created' => $created,
        ]);
    }
}