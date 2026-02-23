<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Leave;
use Illuminate\Http\Request;

class LeaveController extends Controller
{
    public function index()
    {
        return Leave::with('user')->get();
    }

    public function apply(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'company_id' => 'required|exists:companies,id',
            'from_date' => 'required|date',
            'to_date' => 'required|date|after_or_equal:from_date',
            'note' => 'nullable|string',
        ]);

        $leave = Leave::create([
            'user_id' => $request->user_id,
            'company_id' => $request->company_id,
            'from_date' => $request->from_date,
            'to_date' => $request->to_date,
            'note' => $request->note,
            'status' => 'pending',
        ]);

        return response()->json(['success' => true, 'leave' => $leave]);
    }
}
