<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Team;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TeamController extends Controller
{
    public function index()
    {
        $companyId = Auth::user()->company_id;

        $teams = Team::with('users')
            ->where('company_id', $companyId)
            ->get();

        return response()->json([
            'status' => true,
            'data' => $teams,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'id' => 'nullable|exists:teams,id',
            'name' => 'required|string',
            'description' => 'nullable|string',
            'user_ids' => 'nullable|array',
            'user_ids.*' => 'exists:users,id',
        ]);

        $companyId = Auth::user()->company_id;

        $team = Team::updateOrCreate(
            [
                'id' => $data['id'] ?? null,
                'company_id' => $companyId, // security: same company
            ],
            [
                'name' => $data['name'],
                'description' => $data['description'] ?? null,
            ]
        );

        // pivot sync
        if (array_key_exists('user_ids', $data)) {
            $team->users()->sync($data['user_ids'] ?? []);
        }

        return response()->json([
            'status' => true,
            'message' => ($data['id'] ?? null) ? 'Team updated successfully' : 'Team created successfully',
            'data' => $team->load('users'),
        ]);
    }

    public function destroy(Team $team)
    {
        $companyId = Auth::user()->company_id;

        if ((int) $team->company_id !== (int) $companyId) {
            return response()->json([
                'status' => false,
                'message' => 'Team not found for your company',
            ], 404);
        }

        // optional safety if no FK cascade
        $team->users()->detach();

        $team->delete();

        return response()->json([
            'status' => true,
            'message' => 'Team deleted successfully',
        ]);
    }
}
