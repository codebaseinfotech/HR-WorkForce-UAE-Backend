<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Tymon\JWTAuth\Facades\JWTAuth;

class AuthController extends Controller
{
    public function signup(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'first_name' => 'required|string',
            'last_name' => 'required|string',
            'email' => 'required|email|unique:users,email',
            'phone' => 'nullable',
            'company_id' => 'nullable|exists:companies,id',
            'role_id' => 'nullable|exists:roles,id',
            'nationality_id' => 'nullable|exists:nationalities,id',
            'bod' => 'nullable|date|before_or_equal:'.now()->subYears(18)->format('Y-m-d'),
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

        $autoPassword = Str::random(8); // example: A8f#kP2Q

        $profileImagePath = null;
        if ($request->hasFile('p_image')) {
            $profileImagePath = $request->file('p_image')->store('users/profile', 'public');
        }

        $signatureImagePath = null;
        if ($request->hasFile('signature_image')) {
            $signatureImagePath = $request->file('signature_image')->store('users/signature', 'public');
        }

        $user = User::create([
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'phone' => $request->phone,
            'email' => $request->email,
            'company_id' => $request->company_id,
            'role_id' => $request->role_id,
            'nationality_id' => $request->nationality_id,
            'bod' => $request->bod,
            'gender' => $request->gender,
            'agree' => $request->agree ? 1 : 0,
            'p_image' => $profileImagePath,
            'signature_image' => $signatureImagePath,
            'password' => Hash::make($autoPassword),
            'passd' => $autoPassword,
            'status' => User::STATUS_ACTIVE,
        ]);

        $roleName = 'HR';
        if ($user->role_id) {
            $role = Role::find($user->role_id);
            if ($role) {
                $roleName = $role->name;
            }
        }
        $user->employeeId = generateEmployeeId($user->id, $roleName);
        $user->save();

        $user->p_image = $user->p_image ? asset('storage/'.$user->p_image) : null;
        $user->signature_image = $user->signature_image ? asset('storage/'.$user->signature_image) : null;

        $token = JWTAuth::fromUser($user);
        Mail::raw("Your temporary password is: $user->passd", function ($message) use ($user) {
            $message->to($user->email)
                ->subject('Password Information');
        });

        return response()->json([
            'status' => true,
            'message' => 'Signup successful',
            'token' => $token,
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
            ->with(['role.permissions', 'company', 'nationality'])
            ->first();

        if (! $user) {
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

        if (! Hash::check($request->password, $user->password)) {
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
            'company' => $user->company?->name,
            'company_latitude' => $user->company?->latitude,
            'company_longitude' => $user->company?->longitude,
            'company_radius' => $user->company?->radius,
            'nationality' => $user->nationality?->name,
            'signature_image_url' => $user->signature_image_url,
            'p_image_url' => $user->p_image_url,
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
        $user = authUser();

        if (! is_object($user)) {
            return $user;
        }

        return response()->json([
            'status' => true,
            'user' => Auth::user(),
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

        if (! $user) {
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

        if (! $user) {
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
}