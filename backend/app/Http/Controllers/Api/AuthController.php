<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\EmployeeSalary;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Tymon\JWTAuth\Facades\JWTAuth;
use Illuminate\Support\Facades\DB;

class AuthController extends Controller
{
    public function signup(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id' => 'nullable|exists:users,id',
            'first_name' => 'required|string',
            'last_name' => 'required|string',
            'email' => [
                'required',
                'email',
                Rule::unique('users', 'email')->ignore($request->id),
            ],
            'phone' => 'nullable',
            'company_id' => 'nullable|exists:companies,id',
            'role_id' => 'nullable|exists:roles,id',
            'nationality_id' => 'nullable|exists:nationalities,id',
            'bod' => 'nullable|date|before_or_equal:' . now()->subYears(18)->format('Y-m-d'),
            'gender' => 'nullable|in:male,female,other',
            'agree' => 'required|boolean',
            'p_image' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
            'signature_image' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'message' => 'Validation Error',
                'errors' => $validator->errors(),
            ], 422);
        }
        $autoPassword = '123456' ?? Str::random(8); // example: A8f#kP2Q

        $profileImagePath = null;
        if ($request->hasFile('p_image')) {
            $profileImagePath = $request->file('p_image')->store('users/profile', 'public');
        }

        $signatureImagePath = null;
        if ($request->hasFile('signature_image')) {
            $signatureImagePath = $request->file('signature_image')->store('users/signature', 'public');
        }

        $data = [
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'phone' => $request->phone,
            'email' => $request->email,
            'company_id' => $request->company_id,
            'role_id' => $request->role_id,
            'nationality_id' => $request->nationality_id,
            'dob' => $request->bod,
            'gender' => $request->gender,
            'address' => $request->address,
            'country_code' => $request->country_code ?? "+971",
            'position_id' => $request->position_id,
            'agree' => $request->agree ? 1 : 0,
            'p_image' => $profileImagePath,
            'signature_image' => $signatureImagePath,
        ];

        // If creating new user → add password + created_by_user
        if (!$request->id) {
            $data['password'] = Hash::make($autoPassword);
            $data['passd'] = $autoPassword;
            $data['created_by_user'] = $request->created_by_user ?? Auth::id();
            $data['status'] = User::STATUS_ACTIVE;
        }
        $user = User::updateOrCreate(
            ['id' => $request->id], // if id exists → update
            $data
        );

        $roleName = 'HR';
        if ($user->role_id) {
            $role = Role::find($user->role_id);
            if ($role) {
                $roleName = $role->name;
            }
        }

        if (!$request->id) {
            $roleName = strtolower(trim($user->role?->name ?? ''));

            if ($roleName !== 'manager') {
                $user->employeeId = generateEmployeeId($user->id, $roleName);
            } else {
                $user->employeeId = null;
            }

            $user->save();
        }

        if (!empty($request->id)) {
            $message = 'User updated successfully';
        } else {
            $message = 'User Add successfully';
        }
        // $token = JWTAuth::fromUser($user);
        // Mail::raw("Your temporary password is: $user->passd", function ($message) use ($user) {
        //     $message->to($user->email)
        //         ->subject('Password Information');
        // });

        return response()->json([
            'status' => true,
            'message' => $message,
            // 'token' => $token,
            'password' => $autoPassword,
            'user' => $user,
        ]);
    }

    public function signin(Request $request)
    {
        $request->validate([
            'login' => 'required',
            'password' => 'required',
        ]);

        $platform = $request->header('platform', 'web');

        $user = User::where('email', $request->login)
            ->orWhere('phone', $request->login)
            ->orWhere('employeeId', $request->login)
            ->with(['role.permissions', 'company', 'nationality', 'position'])
            ->first();

        if (!$user) {
            return response()->json([
                'status' => false,
                'message' => 'User not found',
            ], 404);
        }

        // Platform Based Restriction
        if ($platform === 'mobile' && $user->is_company_owner == 1) {
            return response()->json([
                'status' => false,
                'message' => 'Company owner cannot login in mobile application',
            ], 403);
        }

        if (
            $platform === 'web' &&
            $user->is_company_owner == 0 &&
            $user->is_super_admin == 0
        ) {
            return response()->json([
                'status' => false,
                'message' => 'Employees cannot login in website',
            ], 403);
        }

        if (!Hash::check($request->password, $user->password)) {
            return response()->json([
                'status' => false,
                'message' => 'Invalid credentials',
            ], 401);
        }

        if ($user->status == User::STATUS_BLOCKED) {
            return response()->json([
                'status' => false,
                'message' => 'Your account is blocked',
            ], 403);
        }

        $user->increment('login_count');

        $user->update([
            'last_login_ip' => $request->ip(),
        ]);

        $token = JWTAuth::fromUser($user);

        // Common Fields
        $responseUser = [
            'id' => $user->id,
            'employeeId' => $user->employeeId,
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'email' => $user->email,
            'phone' => $user->phone,
            'login_count' => $user->login_count,
            'last_login_ip' => $user->last_login_ip,
            'company_id' => $user->company?->id,
            'company' => $user->company?->name,
            'company_latitude' => $user->company?->latitude,
            'company_longitude' => $user->company?->longitude,
            'company_radius' => $user->company?->radius,
            'nationality' => $user->nationality?->name,
            'signature_image_url' => $user->signature_image_url,
            'p_image_url' => $user->p_image_url,
            'position' => $user->position?->name ?? "",
            'position_id' => $user->position_id ?? "",
            'address' => $user->address ?? "",
            'country_code' => $user->country_code ?? "",
        ];
        //  Super Admin Login (Web Only)
        if ($user->is_super_admin == 1 && $platform === 'web') {
            if ($platform !== 'web') {
                return response()->json([
                    'status' => false,
                    'message' => 'Super admin can login only in website',
                ], 403);
            }

            $token = JWTAuth::fromUser($user);

            return response()->json([
                'status' => true,
                'message' => 'Super Admin login successful',
                'token' => $token,
                'platform' => $platform,
                'user' => $user,
            ]);
        }
        // Web Login (Company Owner) → Role + Permissions
        if ($platform === 'web' && $user->is_company_owner == 1) {
            $responseUser['role'] = $user->role?->name;
            $responseUser['role_id'] = $user->role?->id;
            $responseUser['permissions'] = $user->role?->permissions;
        }

        return response()->json([
            'status' => true,
            'message' => 'Login successful',
            'token' => $token,
            'platform' => $platform,
            'user' => $responseUser,
        ]);
    }

    public function profile()
    {
        $authUser = authUser();

        if (!is_object($authUser)) {
            return $authUser;
        }
        $user = User::with(['role.permissions', 'company', 'nationality', 'position'])->find($authUser->id);
        $responseUser = [
            'id' => $user->id,
            'created_by_user' => $user->created_by_user ?? "",
            'employeeId' => $user->employeeId ?? "",
            'first_name' => $user->first_name ?? "",
            'last_name' => $user->last_name ?? "",
            'phone' => $user->phone ?? "",
            'email' => $user->email ?? "",
            'avatar_path' => $user->avatar_path ?? "",
            'dob' => $user->bod ?? "",
            'gender' => $user->gender ?? "",
            'role_id' => $user->role_id ?? "",
            'is_super_admin' => $user->is_super_admin ?? 0,
            'company_id' => $user->company_id ?? "",
            'is_company_owner' => $user->is_company_owner ?? 0,
            'nationality_id' => $user->nationality_id ?? "",
            'agree' => (bool) ($user->agree ?? false),
            'remember_me' => (bool) ($user->remember_me ?? false),
            'status' => $user->status ?? 0,
            'login_count' => $user->login_count ?? 0,
            'last_login_ip' => $user->last_login_ip ?? "",
            'email_otp' => $user->email_otp ?? "",
            'email_verified_at' => $user->email_verified_at ?? "",
            'p_image_url' => $user->p_image_url ?? "",
            'signature_image_url' => $user->signature_image_url ?? "",
            'status_name' => $user->status_name ?? "",
            'position' => $user->position?->name ?? "",
            'position_id' => $user->position_id ?? "",
            'address' => $user->address ?? "",
            'country_code' => $user->country_code ?? "",
            'role' => $user->role ? [
                'id' => $user->role->id,
                'name' => $user->role->name ?? "",
                'slug' => $user->role->slug ?? "",
                'company_id' => $user->role->company_id ?? "-",
                'status' => $user->role->status ?? 0,
                'permissions' => $user->role->permissions ?? [],
            ] : (object) [],

            'company' => $user->company ? $user->company->name : "",
            'nationality' => $user->nationality ? $user->nationality->name : "",
        ];

        return response()->json([
            'status' => true,
            'message' => 'show successful',
            'user' => $responseUser,
        ]);
    }

    public function logout()
    {
        try {

            JWTAuth::parseToken()->invalidate(true);

            return response()->json([
                'status' => true,
                'message' => 'Logged out successfully',
            ]);

        } catch (\Exception $e) {

            return response()->json([
                'status' => false,
                'message' => 'Something went wrong',
            ], 401);
        }
    }

    public function forgotPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
        ]);

        $user = User::where('email', $request->email)->first();

        $otp = rand(100000, 999999);

        $user->email_otp = $otp;
        $user->email_verified_at = now();
        // $user->email_verified_at = now()->addMinutes(60);
        $user->save();

        Mail::raw("Your OTP for password reset is: $otp", function ($message) use ($user) {
            $message->to($user->email)
                ->subject('Password Reset OTP');
        });

        return response()->json([
            'status' => true,
            'otp' => $user->email_otp,
            'message' => 'OTP sent to your email',
        ]);
    }

    public function verifyOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'otp' => 'required',
        ]);

        $user = User::where('email', $request->email)
            ->where('email_otp', $request->otp)
            ->first();

        if (!$user) {
            return response()->json([
                'status' => false,
                'message' => 'Invalid OTP',
            ], 400);
        }

        return response()->json([
            'status' => true,
            'message' => 'OTP verified successfully',
        ]);
    }

    public function resetPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'otp' => 'required',
            'password' => 'required|min:6|confirmed',
        ]);

        $user = User::where('email', $request->email)
            ->where('email_otp', $request->otp)
            ->first();

        if (!$user) {
            return response()->json([
                'status' => false,
                'message' => 'Invalid OTP',
            ], 400);
        }

        $user->password = Hash::make($request->password);
        $user->passd = $request->password;
        $user->email_otp = null;
        $user->email_verified_at = null;
        $user->save();

        return response()->json([
            'status' => true,
            'message' => 'Password reset successfully',
        ]);
    }

    public function userFetch(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'company_id' => 'required|exists:companies,id',
            'role' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'message' => 'Validation Error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $query = User::with('role')
            ->where('company_id', $request->company_id)->where('is_super_admin', 0)->whereNot('is_super_admin', 1);

        // Role filter (optional)
        if ($request->filled('role')) {
            $query->whereHas('role', function ($q) use ($request) {
                $q->where('name', $request->role);
            });
        }

        $users = $query->get();

        return response()->json([
            'status' => true,
            'users' => $users,
            'message' => 'Users fetched successfully',
        ]);
    }

    public function myCreatedUsers(Request $request, $company_id)
    {
        $validator = Validator::make(
            array_merge($request->all(), ['company_id' => $company_id]),
            [
                'company_id' => 'required|exists:companies,id',
                'created_by_user' => 'required|exists:users,id',
            ]
        );

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'message' => 'Validation Error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $creatorId = $request->created_by_user;

        $users = User::where('company_id', $company_id)
            ->where('created_by_user', $creatorId)
            ->select('id', 'employeeId', 'first_name', 'last_name', 'email', 'phone', 'company_id', 'created_by_user', 'status')
            ->get();

        return response()->json([
            'status' => true,
            'message' => 'Users fetched successfully',
            'users' => $users,
        ]);
    }

    public function updateCreatedBy(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
            'created_by_user' => 'required|exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'message' => 'Validation Error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = User::find($request->user_id);

        $user->created_by_user = $request->created_by_user;
        $user->save();

        return response()->json([
            'status' => true,
            'message' => 'created_by_user updated successfully',
            'user' => $user,
        ]);
    }

    public function summary(Request $request)
    {
        $user = auth()->user();

        $userCompanyId = $user->company_id; // may be null for super admin
        $isSuperAdmin = (int) ($user->is_super_admin ?? 0) === 1;

        // optional filter only for super admin
        $filterCompanyId = $isSuperAdmin ? $request->input('company_id') : null;

        // base global: super admin + no company_id
        $isGlobal = $isSuperAdmin && empty($userCompanyId);

        // effective scope:
        // - super admin + no filter => all companies
        // - super admin + filter => single company (filtered)
        // - non super admin => user's company only
        $isAllCompanies = $isGlobal && empty($filterCompanyId);

        $effectiveCompanyId = null;
        if (!$isAllCompanies) {
            $effectiveCompanyId = $isSuperAdmin && !empty($filterCompanyId)
                ? (int) $filterCompanyId
                : (int) $userCompanyId;
        }

        // Validate company_id if provided
        if ($isSuperAdmin && !empty($filterCompanyId)) {
            $exists = \App\Models\Company::where('id', $effectiveCompanyId)->exists();
            if (!$exists) {
                return response()->json([
                    'status' => false,
                    'message' => 'Invalid company_id',
                ], 422);
            }
        }

        // Companies count
        $companiesCount = $isAllCompanies
            ? \App\Models\Company::count()
            : \App\Models\Company::where('id', $effectiveCompanyId)->count();

        // Users query
        $usersQuery = \App\Models\User::query()
            ->when(!$isAllCompanies, fn($q) => $q->where('company_id', $effectiveCompanyId));

        $usersTotal = (clone $usersQuery)->count();

        $roleCounts = (clone $usersQuery)
            ->selectRaw('role_id, COUNT(*) as total')
            ->groupBy('role_id')
            ->pluck('total', 'role_id');

        $roleMap = \App\Models\Role::pluck('name', 'id');

        $roleWise = [];
        foreach ($roleCounts as $roleId => $cnt) {
            $roleWise[] = [
                'role_id' => (int) $roleId,
                'role_name' => $roleMap[$roleId] ?? 'Unknown',
                'count' => (int) $cnt,
            ];
        }

        // Tasks query
        $tasksQuery = \App\Models\Task::query()
            ->when(!$isAllCompanies, fn($q) => $q->where('company_id', $effectiveCompanyId));

        $tasksTotal = (clone $tasksQuery)->count();

        $tasksByStatus = (clone $tasksQuery)
            ->selectRaw('status, COUNT(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $assignedTasksCount = (clone $tasksQuery)
            ->whereHas('assignments')
            ->count();

        return response()->json([
            'status' => true,
            'scope' => $isAllCompanies ? 'global_all_companies' : 'single_company',
            'filters' => [
                'company_id' => $effectiveCompanyId, // null when global
            ],
            'data' => [
                'companies_count' => (int) $companiesCount,
                'users' => [
                    'total' => (int) $usersTotal,
                    'role_wise' => $roleWise,
                ],
                'tasks' => [
                    'total' => (int) $tasksTotal,
                    'assigned' => (int) $assignedTasksCount,
                    'by_status' => $tasksByStatus,
                ],
            ],
        ]);
    }

    public function employee_salary(Request $request)
    {
        $data = $request->validate([
            'company_id' => 'required|exists:companies,id',
            'user_id' => 'required|exists:users,id',

            'salary_type' => 'required|in:monthly,daily,hourly',

            'monthly_salary' => 'nullable|numeric',
            'daily_salary' => 'nullable|numeric',
            'hourly_salary' => 'nullable|numeric',

            'overtime_rate_per_hour' => 'nullable|numeric',

            'effective_from' => 'required|date',
            'effective_to' => 'nullable|date|after_or_equal:effective_from',
        ]);

        $salary = EmployeeSalary::create($data);

        return response()->json([
            'success' => true,
            'data' => $salary,
        ]);
    }
    public function changePassword(Request $request)
    {
        $user = authUser();

        if (!is_object($user)) {
            return $user;
        }

        // Validation
        $request->validate([
            'current_password' => 'required',
            'new_password' => 'required|min:6|different:current_password',
            'confirm_password' => 'required|same:new_password',
        ]);

        // Check current password
        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'status' => false,
                'message' => 'Current password is incorrect.',
            ], 422);
        }

        // Update password
        $user->password = Hash::make($request->new_password);
        $user->save();

        return response()->json([
            'status' => true,
            'message' => 'Password changed successfully.',
        ]);
    }

    public function deleteAccount(Request $request)
    {
        $user = authUser();

        if (!is_object($user)) {
            return $user;
        }

        // Optional: password confirmation
        if ($request->filled('password')) {
            if (!Hash::check($request->password, $user->password)) {
                return response()->json([
                    'status' => false,
                    'message' => 'Password is incorrect.',
                ], 422);
            }
        }

        DB::beginTransaction();

        try {
            if (method_exists($user, 'tokens')) {
                $user->tokens()->delete();
            }

            // Delete user
            $user->delete();

            DB::commit();

            return response()->json([
                'status' => true,
                'message' => 'Account deleted successfully.',
            ]);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'status' => false,
                'message' => 'Something went wrong.',
            ], 500);
        }
    }
}