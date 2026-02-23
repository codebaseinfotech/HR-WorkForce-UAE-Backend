<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OvertimesUser;
use Illuminate\Http\Request;

class OvertimeController extends Controller
{
     public function index() {
        return OvertimesUser::with('user')->get();
    }

    public function add(Request $request) {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'company_id' => 'required|exists:companies,id',
            'date' => 'required|date',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i',
            'hours' => 'nullable|string',
            'reason' => 'nullable|string'
        ]);

        $overtime = OvertimesUser::create($request->all());

        return response()->json(['success'=>true, 'overtime'=>$overtime]);
    }
}