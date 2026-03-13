<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Role;
use Illuminate\Http\Request;

class RolePermissionController extends Controller
{
    public function updatePermissions(Request $request, $roleId)
    {
        $request->validate([
            'permissions' => 'required|array',
            'permissions.*.permission_id' => 'required|exists:permissions,id',
        ]);

        $role = Role::find($roleId);

        if (! $role) {
            return response()->json([
                'message' => 'Role not found',
            ], 404);
        }

        foreach ($request->permissions as $perm) {

            $role->permissions()->syncWithoutDetaching([
                $perm['permission_id'] => [
                    'can_view' => $perm['can_view'] ?? false,
                    'can_add' => $perm['can_add'] ?? false,
                    'can_edit' => $perm['can_edit'] ?? false,
                    'can_delete' => $perm['can_delete'] ?? false,
                ],
            ]);
        }

        $role->load('permissions');

        return response()->json([
            'message' => 'Permissions updated successfully',
            'data' => $role,
        ], 200);
    }
}
