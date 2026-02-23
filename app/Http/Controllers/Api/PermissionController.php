<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PermissionController extends Controller
{
    public function index($id = null)
    {
        if ($id) {

            $permission = Permission::find($id);

            if (! $permission) {
                return response()->json([
                    'message' => 'Permission not found',
                ], 404);
            }

            return response()->json([
                'message' => 'Permission fetched successfully',
                'data' => $permission,
            ], 200);
        }

        $permissions = Permission::all();

        return response()->json([
            'message' => 'All permissions fetched successfully',
            'data' => $permissions,
        ], 200);
    }

    public function store(Request $request)
    {
        $permission = Permission::create($request->all());

        return response()->json($permission);
    }

    public function update(Request $request, $id)
    {
        $permission = Permission::findOrFail($id);
        $permission->update($request->all());

        return response()->json($permission);
    }

    public function destroy($id)
    {
        Permission::destroy($id);

        return response()->json(['message' => 'Deleted']);
    }

    public function myPermissions()
    {
        $user = Auth::user();

        if (! $user) {
            return response()->json([
                'message' => 'Unauthorized',
            ], 401);
        }

        $role = $user->role()->with('permissions')->first();

        if (! $role) {
            return response()->json([
                'message' => 'Role not assigned',
            ], 404);
        }

        $menus = $role->permissions->map(function ($permission) {

            return [
                'permission_id' => $permission->id,
                'name' => $permission->name,
                'can_view' => $permission->pivot->can_view,
                'can_add' => $permission->pivot->can_add,
                'can_edit' => $permission->pivot->can_edit,
                'can_delete' => $permission->pivot->can_delete,
            ];
        });

        return response()->json([
            'message' => 'Menu permissions fetched successfully',
            'data' => $menus,
        ], 200);
    }
}
