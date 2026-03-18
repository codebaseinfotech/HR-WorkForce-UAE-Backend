<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class RoleController extends Controller
{
    public function index(Request $request , $id = null)
    {
        $query = Role::companyWise()
            ->with('permissions')
            ->whereNotIn('name', ['Super Admin', 'Company']); //  hide these 2 roles

        // If ID provided → return single role
        if ($id) {
            $role = $query->find($id);

            if (! $role) {
                return response()->json([
                    'message' => 'Role not found',
                ], 404);
            }

            return response()->json($role);
        }
        $company_id = $request->company_id;
        if ($company_id) {
            $role = $query->where('company_id',$company_id);

            if (! $role) {
                return response()->json([
                    'message' => 'Role not found',
                ], 404);
            }

            return response()->json($role);
        }

        // If no ID → return all roles
        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $role = Role::create([
            'name' => $request->name,
            'slug' => $request->slug,
            'company_id' => Auth::user()->company_id,
        ]);

        return response()->json($role);
    }

    public function update(Request $request, $id)
    {
        $role = Role::findOrFail($id);
        $role->update($request->only('name', 'slug'));

        return response()->json($role);
    }

    public function destroy($id)
    {
        Role::destroy($id);

        return response()->json([
            'message' => 'Role Created Successfully',
            'data' => $role,
        ], 200);
    }
}
