<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LeaveBalance;
use App\Models\LeaveRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class LeaveAdminController extends Controller
{
    public function action(Request $request, LeaveRequest $leaveRequest)
    {
        $validator = Validator::make($request->all(), [
            'action' => 'required|in:approve,reject',
            'note' => 'nullable|string|max:500',
        ], [
            'action.required' => 'Action is required.',
            'action.in' => 'Action must be approve or reject.',
            'note.max' => 'Note may not be greater than 500 characters.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $data = $validator->validated();
        $admin = Auth::user();

        // company security
        if ((int) $leaveRequest->company_id !== (int) $admin->company_id) {
            return response()->json(['status' => false, 'message' => 'Not allowed'], 403);
        }

        if ($leaveRequest->status !== 'pending') {
            return response()->json(['status' => false, 'message' => 'Only pending request can be actioned'], 409);
        }

        // reject requires note
        if ($data['action'] === 'reject' && empty($data['note'])) {
            return response()->json([
                'status' => false,
                'message' => 'Note is required for reject',
                'errors' => ['note' => ['Note is required for reject.']],
            ], 422);
        }

        // ✅ APPROVE
        if ($data['action'] === 'approve') {

            $year = (int) $leaveRequest->from_date->year;

            return DB::transaction(function () use ($leaveRequest, $admin, $data, $year) {

                $bal = LeaveBalance::where('company_id', $leaveRequest->company_id)
                    ->where('user_id', $leaveRequest->user_id)
                    ->where('leave_type_id', $leaveRequest->leave_type_id)
                    ->where('year', $year)
                    ->lockForUpdate()
                    ->first();

                if (! $bal) {
                    return response()->json([
                        'status' => false,
                        'message' => 'Leave balance not generated for this user/type/year',
                    ], 422);
                }

                if ($bal->balance < $leaveRequest->days) {
                    return response()->json([
                        'status' => false,
                        'message' => 'Insufficient leave balance',
                        'available' => (float) $bal->balance,
                        'required' => (float) $leaveRequest->days,
                    ], 422);
                }

                // cut balance
                $bal->used = $bal->used + $leaveRequest->days;
                $bal->balance = max($bal->allocated - $bal->used, 0);
                $bal->save();

                // approve request
                $leaveRequest->update([
                    'status' => 'approved',
                    'action_by' => $admin->id,
                    'action_at' => now(),
                    'action_note' => $data['note'] ?? null,
                ]);

                return response()->json([
                    'status' => true,
                    'message' => 'Leave approved and balance updated',
                    'data' => [
                        'leave_request' => $leaveRequest->fresh(),
                        'leave_balance' => $bal->fresh(),
                    ],
                ]);
            });
        }

        // ✅ REJECT
        $leaveRequest->update([
            'status' => 'rejected',
            'action_by' => $admin->id,
            'action_at' => now(),
            'action_note' => $data['note'],
        ]);

        return response()->json([
            'status' => true,
            'message' => 'Leave rejected',
            'data' => [
                'leave_request' => $leaveRequest->fresh(),
            ],
        ]);
    }
}
