<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Task;
use App\Models\TaskAssignment;
use App\Models\Team;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TaskAssignmentController extends Controller
{
    // Assign to multiple users
    public function assignToUsers(Request $request, Task $task)
    {
        $data = $request->validate([
            'company_id' => 'required',
            'user_ids' => 'required|array|min:1',
            'user_ids.*' => 'required|integer|exists:users,id',
        ]);

        $companyId = $data['company_id'];
        $alreadyAssigned = [];
        $newlyAssigned = [];

        foreach ($data['user_ids'] as $uid) {

            $exists = TaskAssignment::where('task_id', $task->id)
                ->where('user_id', $uid)
                ->exists();

            if ($exists) {
                $alreadyAssigned[] = $uid;
            } else {
                TaskAssignment::create([
                    'task_id' => $task->id,
                    'user_id' => $uid,
                    'company_id' => $companyId,
                    'assigned_by' => Auth::id(),
                    'status' => 'assigned',
                    'progress' => 0,
                    'note' => null,
                ]);

                $newlyAssigned[] = $uid;
            }
        }

        if (count($newlyAssigned) > 0) {
            $task->update(['status' => 'active']);
        }

        return response()->json([
            'status' => true,
            'message' => count($alreadyAssigned) > 0
                ? 'Some users were already assigned to this task.'
                : 'Task assigned successfully.',
            'already_assigned_user_ids' => $alreadyAssigned,
            'newly_assigned_user_ids' => $newlyAssigned,
        ]);
    }

    // Assign task to a team -> convert to users
    public function assignToTeam(Request $request, Task $task)
    {
        $data = $request->validate([
            'team_id' => 'required|exists:teams,id',
        ]);

        $team = Team::with('users')->find($data['team_id']);

        if (! $team) {
            return response()->json([
                'status' => false,
                'message' => 'Team not found',
            ], 404);
        }

        $userIds = $team->users->pluck('id')->toArray();

        if (empty($userIds)) {
            return response()->json([
                'status' => false,
                'message' => 'Team has no members',
            ], 422);
        }

        foreach ($userIds as $uid) {
            TaskAssignment::firstOrCreate(
                [
                    'task_id' => $task->id,
                    'user_id' => $uid,
                ],
                [
                    'company_id' => auth()->user()->company_id,
                    'assigned_by' => auth()->id(),
                    'status' => 'assigned',
                    'progress' => 0,
                ]
            );
        }

        $task->update(['status' => 'assigned']);

        return response()->json([
            'status' => true,
            'message' => 'Task assigned to team members',
        ]);
    }

    // Unassign specific users from a task
    public function updateAssignments(Request $request, Task $task)
    {
        $companyId = $request->company_id;

        // Security: task must belong to same company
        if ((int) $task->company_id !== (int) $companyId) {
            return response()->json([
                'status' => false,
                'message' => 'Task not found for your company',
            ], 404);
        }

        $data = $request->validate([
            'remove_user_ids' => 'nullable|array',
            'remove_user_ids.*' => 'integer|exists:users,id',

            'add_user_ids' => 'nullable|array',
            'add_user_ids.*' => 'integer|exists:users,id',
        ]);

        $removedCount = 0;
        $addedCount = 0;
        $alreadyAssigned = [];

        //  REMOVE USERS
        if (! empty($data['remove_user_ids'])) {
            $removedCount = TaskAssignment::where('task_id', $task->id)
                ->where('company_id', $companyId)
                ->whereIn('user_id', $data['remove_user_ids'])
                ->delete();
        }

        //  ADD USERS
        if (! empty($data['add_user_ids'])) {

            foreach ($data['add_user_ids'] as $uid) {

                $exists = TaskAssignment::where('task_id', $task->id)
                    ->where('user_id', $uid)
                    ->where('company_id', $companyId)
                    ->exists();

                if ($exists) {
                    $alreadyAssigned[] = $uid;

                    continue;
                }

                TaskAssignment::create([
                    'task_id' => $task->id,
                    'user_id' => $uid,
                    'company_id' => $companyId,
                    'assigned_by' => auth()->id(),
                    'status' => 'assigned',
                    'progress' => 0,
                ]);

                $addedCount++;
            }
        }

        //  UPDATE TASK STATUS
        $remaining = TaskAssignment::where('task_id', $task->id)
            ->where('company_id', $companyId)
            ->count();

        if ($remaining === 0) {
            $task->update(['status' => 'draft']);   // ensure draft exists in enum
        } else {
            $task->update(['status' => 'active']);
        }

        return response()->json([
            'status' => true,
            'message' => 'Assignments updated successfully',
            'removed_count' => $removedCount,
            'added_count' => $addedCount,
            'already_assigned_user_ids' => $alreadyAssigned,
            'total_remaining_assignments' => $remaining,
        ]);
    }
}
