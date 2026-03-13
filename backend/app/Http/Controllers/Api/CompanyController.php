<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class CompanyController extends Controller
{
    public function index($id = null)
    {
        //  If ID provided → return single company
        if ($id) {

            $company = Company::where('status', 1)
                ->where('id', $id)
                ->first();

            if (! $company) {
                return response()->json([
                    'status' => false,
                    'message' => 'Company not found',
                ], 404);
            }

            return response()->json([
                'status' => true,
                'data' => $company,
            ]);
        }

        // If ID not provided → return all active companies
        $companies = Company::where('status', 1)->get();

        return response()->json([
            'status' => true,
            'data' => $companies,
        ]);
    }

    public function save(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id' => 'nullable|exists:companies,id',
            'name' => 'required|string|max:255',
            'first_name' => 'required|string',
            'last_name' => 'required|string',
            'email' => 'required|email',
            'phone' => 'required|string|max:20',
            'bod' => 'nullable|date|before_or_equal:'.now()->subYears(18)->format('Y-m-d'),
            'gender' => 'nullable|in:male,female,other',
            'p_image' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
            'signature_image' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        DB::beginTransaction();

        try {

            // UPDATE COMPANY
            if ($request->id) {

                $company = Company::find($request->id);

                if (! $company) {
                    return response()->json([
                        'status' => false,
                        'message' => 'Company not found',
                    ], 422);
                }

                // Logo upload
                $logofileImagePath = $company->logo;
                if ($request->hasFile('logo')) {
                    $logofileImagePath = $request->file('logo')
                        ->store('company/logo', 'public');
                }

                // Update Company (EMAIL REMOVE)
                $company->update([
                    'name' => $request->name,
                    'email' => $request->email,
                    'name_first' => $request->first_name,
                    'name_last' => $request->last_name,
                    'phone' => $request->phone,
                    'gender' => $request->gender,
                    'nationality_id' => $request->nationality_id,
                    'address' => $request->address,
                    'city' => $request->city,
                    'logo' => $logofileImagePath,
                    'ip' => $request->ip(),
                ]);

                //  Update Related Owner User (EMAIL NOT UPDATED)
                $user = User::where('company_id', $company->id)
                    ->where('is_company_owner', 1)
                    ->first();

                if ($user) {
                    $updateData = [
                        'first_name' => $request->first_name,
                        'last_name' => $request->last_name,
                        'phone' => $request->phone,
                        'nationality_id' => $request->nationality_id ?? null,
                        'bod' => $request->bod ?? null,
                        'gender' => $request->gender ?? null,
                    ];

                    if ($request->hasFile('p_image')) {
                        $updateData['p_image'] = $request->file('p_image')
                            ->store('users/profile', 'public');
                    }

                    if ($request->hasFile('signature_image')) {
                        $updateData['signature_image'] = $request->file('signature_image')
                            ->store('users/signature', 'public');
                    }

                    if ($request->filled('password')) {
                        $updateData['password'] = Hash::make($request->password);
                        $updateData['passd'] = $request->password;
                    }

                    $user->update($updateData);

                } else {
                    $autoPassword = $request->password ?? '123456';
                    // $autoPassword = $request->password ?? Str::random(8);

                    $profileImagePath = null;
                    if ($request->hasFile('p_image')) {
                        $profileImagePath = $request->file('p_image')
                            ->store('users/profile', 'public');
                    }

                    $signatureImagePath = null;
                    if ($request->hasFile('signature_image')) {
                        $signatureImagePath = $request->file('signature_image')
                            ->store('users/signature', 'public');
                    }

                    $role = Role::firstOrCreate(
                        ['slug' => 'company'],
                        [
                            'name' => 'Company',
                            'slug' => 'company',
                        ]
                    );

                    $user = User::create([
                        'first_name' => $request->first_name,
                        'last_name' => $request->last_name,
                        'email' => $company->email, // keep original company email
                        'phone' => $request->phone,
                        'nationality_id' => $request->nationality_id ?? null,
                        'bod' => $request->bod ?? null,
                        'gender' => $request->gender ?? null,
                        'p_image' => $profileImagePath,
                        'signature_image' => $signatureImagePath,
                        'password' => Hash::make($autoPassword),
                        'passd' => $autoPassword,
                        'company_id' => $company->id,
                        'status' => User::STATUS_ACTIVE,
                        'is_company_owner' => 1,
                        'role_id' => $role->id,
                    ]);

                    // $user->employeeId = generateEmployeeId($user->id, $role->name);
                    // $user->save();
                }
                DB::commit();

                return response()->json([
                    'status' => true,
                    'message' => 'Company updated successfully',
                    'data' => $company->makeHidden(['created_at', 'updated_at', 'deleted_at']),
                ]);
            }

            //    CREATE COMPANY
            // Check Email Already Exists
            if (User::where('email', $request->email)->exists()) {
                return response()->json([
                    'status' => false,
                    'message' => 'Email already registered',
                ], 422);
            }
            $logofileImagePath = null;
            if ($request->hasFile('logo')) {
                $logofileImagePath = $request->file('logo')->store('users/logo', 'public');
            }

            // Create Company
            $company = Company::create([
                'name' => $request->name,
                'name_first' => $request->first_name,
                'name_last' => $request->last_name,
                'email' => $request->email,
                'phone' => $request->phone,
                'gender' => $request->gender,
                'nationality_id' => $request->nationality_id,
                'address' => $request->address,
                'city' => $request->city,
                'logo' => $logofileImagePath,
                'ip' => $request->ip(),
            ]);

            // CREATE ROLE IF NOT EXISTS
            $role = Role::firstOrCreate(
                ['slug' => 'company'],
                [
                    'name' => 'Company',
                    'slug' => 'company',
                ]
            );

            $autoPassword = '123456' ?? Str::random(8);
            $profileImagePath = null;
            if ($request->hasFile('p_image')) {
                $profileImagePath = $request->file('p_image')->store('users/profile', 'public');
            }

            $signatureImagePath = null;
            if ($request->hasFile('signature_image')) {
                $signatureImagePath = $request->file('signature_image')->store('users/signature', 'public');
            }

            // CREATE COMPANY OWNER USER
            $user = User::create([
                'first_name' => $request->first_name,
                'last_name' => $request->last_name,
                'email' => $request->email,
                'phone' => $request->phone,
                'nationality_id' => $request->nationality_id ?? null,
                'bod' => $request->bod ?? null,
                'gender' => $request->gender ?? null,
                'agree' => $request->agree ? 1 : 0,
                'p_image' => $profileImagePath ?? null,
                'signature_image' => $signatureImagePath ?? null,
                'password' => Hash::make($autoPassword) ?? null,
                'passd' => $autoPassword ?? null,
                'company_id' => $company->id,
                'status' => User::STATUS_ACTIVE,
                'is_company_owner' => 1,
                'role_id' => $role->id, // Correct role ID
            ]);
            // $user->employeeId = generateEmployeeId($user->id, $role->name);
            // $user->save();
            DB::commit();

            return response()->json([
                'status' => true,
                'message' => 'Company and User created successfully',
                'data' => $company->makeHidden(['created_at', 'updated_at', 'deleted_at']),
            ], 201);

        } catch (\Exception $e) {

            DB::rollBack();

            return response()->json([
                'status' => false,
                'message' => 'Something went wrong',
                'error' => $e->getMessage(), // remove in production if needed
            ], 500);
        }
    }

    public function delete($id)
    {
        $company = Company::find($id);

        if (! $company) {
            return response()->json([
                'status' => false,
                'message' => 'Company not found',
            ], 404);
        }

        $company->delete();

        return response()->json([
            'status' => true,
            'message' => 'Company deleted successfully',
        ]);
    }
}
