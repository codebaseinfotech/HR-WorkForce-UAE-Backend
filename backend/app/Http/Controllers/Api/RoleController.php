<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class RoleController extends Controller
{
    public function index(Request $request, $id = null)
    {
        $company_id = $request->company_id;
        $query = Role::where('company_id', $company_id)
            ->whereNotIn('name', ['Super Admin', 'Company'])
            ->with(['permissions:id,name']); // only required fields

        //  Single role
        if ($id) {
            $role = $query->select('id', 'name', 'slug', 'company_id', 'status')
                ->find($id);

            if (!$role) {
                return response()->json([
                    'status' => false,
                    'message' => 'Role not found',
                ], 404);
            }

            return response()->json([
                'status' => true,
                'data' => $role
            ]);
        }

        //  All roles
        $roles = $query->get();


        return response()->json([
            'status' => true,
            'data' => $roles
        ]);
    }
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'company_id' => 'nullable|exists:companies,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'message' => 'Validation Error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $role = Role::create([
            'name' => $request->name,
            'slug' => $request->slug,
            'company_id' => $request->company_id,
        ]);

        return response()->json($role);
    }

    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'company_id' => 'nullable|exists:companies,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'message' => 'Validation Error',
                'errors' => $validator->errors(),
            ], 422);
        }
        $role = Role::findOrFail($id);
        $role->update($request->only('name', 'slug', 'company_id'));

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
