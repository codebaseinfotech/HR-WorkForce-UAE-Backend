<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Position;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PositionController extends Controller
{
    public function index(Request $request)
    {
        $query = Position::query();

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        $positions = $query->latest()->get()->map(function ($position) {
            return [
                'id' => $position->id,
                'name' => $position->name,
                'status' => $position->status,
                'status_name' => $position->status == 1 ? 'active' : 'inactive',
                'created_at' => $position->created_at ? $position->created_at->format('Y-m-d H:i:s') : null,
                'updated_at' => $position->updated_at ? $position->updated_at->format('Y-m-d H:i:s') : null,
            ];
        });

        return response()->json([
            'status' => true,
            'message' => 'Position list fetched successfully.',
            'data' => $positions,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:positions,name',
            'status' => 'nullable|in:0,1',
        ]);

        $position = Position::create([
            'name' => $validated['name'],
            'status' => $request->status ?? 1,
        ]);

        return response()->json([
            'status' => true,
            'message' => 'Position created successfully.',
            'data' => $position,
        ]);
    }

    public function show($id)
    {
        $position = Position::find($id);

        if (!$position) {
            return response()->json([
                'status' => false,
                'message' => 'Position not found.',
            ], 404);
        }

        return response()->json([
            'status' => true,
            'message' => 'Position fetched successfully.',
            'data' => [
                'id' => $position->id,
                'name' => $position->name,
                'status' => $position->status,
                'status_name' => $position->status == 1 ? 'active' : 'inactive',
                'created_at' => $position->created_at ? $position->created_at->format('Y-m-d H:i:s') : null,
                'updated_at' => $position->updated_at ? $position->updated_at->format('Y-m-d H:i:s') : null,
            ],
        ]);
    }

    public function update(Request $request, $id)
    {
        $position = Position::find($id);

        if (!$position) {
            return response()->json([
                'status' => false,
                'message' => 'Position not found.',
            ], 404);
        }

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('positions', 'name')->ignore($position->id),
            ],
            'status' => 'required|in:0,1',
        ]);

        $position->update([
            'name' => $validated['name'],
            'status' => $validated['status'],
        ]);

        return response()->json([
            'status' => true,
            'message' => 'Position updated successfully.',
            'data' => $position,
        ]);
    }

    public function destroy($id)
    {
        $position = Position::find($id);

        if (!$position) {
            return response()->json([
                'status' => false,
                'message' => 'Position not found.',
            ], 404);
        }

        if ($position->users()->count() > 0) {
            return response()->json([
                'status' => false,
                'message' => 'Position is assigned to users, cannot delete.',
            ], 422);
        }

        $position->delete();

        return response()->json([
            'status' => true,
            'message' => 'Position deleted successfully.',
        ]);
    }

    public function changeStatus(Request $request, $id)
    {
        $position = Position::find($id);

        if (!$position) {
            return response()->json([
                'status' => false,
                'message' => 'Position not found.',
            ], 404);
        }

        $validated = $request->validate([
            'status' => 'required|in:0,1',
        ]);

        $position->status = $validated['status'];
        $position->save();

        return response()->json([
            'status' => true,
            'message' => 'Position status updated successfully.',
            'data' => $position,
        ]);
    }
}
