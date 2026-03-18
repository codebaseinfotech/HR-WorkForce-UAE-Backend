<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LeaveType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class LeaveTypeController extends Controller
{
    // GET /leave-types
    public function index(Request $request)
    {
        $companyId = Auth::user()->company_id;

        $types = LeaveType::where('company_id', $companyId)
            ->orderBy('code')
            ->get();

        return response()->json([
            'status' => true,
            'data' => $types,
        ]);
    }

    // POST /leave-types/add-update
    public function store(Request $request)
    {
        $companyId = $request->company_id ?? Auth::user()->company_id;
        $data = $request->validate([
            'id' => 'nullable|exists:leave_types,id',
            'code' => [
                'required',
                'string',
                'max:20',
                Rule::unique('leave_types', 'code')
                    ->where(fn($q) => $q->where('company_id', $companyId))
                    ->ignore($request->id),
            ],
            'name' => 'required|string|max:100',
        ]);

        // security: company_id auth mathi
        $leaveType = LeaveType::updateOrCreate(
            ['id' => $data['id'] ?? null, 'company_id' => $companyId],
            ['code' => strtoupper(trim($data['code'])), 'name' => $data['name']]
        );

        return response()->json([
            'status' => true,
            'message' => ($data['id'] ?? null) ? 'Leave type updated' : 'Leave type created',
            'data' => $leaveType,
        ]);
    }

    // DELETE /leave-types/{leaveType}
    public function destroy(LeaveType $leaveType)
    {
        $companyId = Auth::user()->company_id;

        if ((int) $leaveType->company_id !== (int) $companyId) {
            return response()->json([
                'status' => false,
                'message' => 'Leave type not found for your company',
            ], 404);
        }

        $leaveType->delete();

        return response()->json([
            'status' => true,
            'message' => 'Leave type deleted',
        ]);
    }
}