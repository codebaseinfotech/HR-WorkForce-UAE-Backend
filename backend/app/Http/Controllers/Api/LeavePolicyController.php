<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LeaveBalance;
use App\Models\LeavePolicy;
use App\Models\LeavePolicyItem;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class LeavePolicyController extends Controller
{
    // GET /leave-policies?company_id=1&year=2026&role_id=3
    public function index(Request $request)
    {
        $data = $request->validate([
            'company_id' => 'required|exists:companies,id',
            'year' => 'required|digits:4|integer|min:2000|max:2100',
            'role_id' => 'nullable|exists:roles,id',
        ]);

        $q = LeavePolicy::with('items')
            ->where('company_id', $data['company_id'])
            ->where('year', $data['year']);

        if (! empty($data['role_id'])) {
            $q->where('role_id', $data['role_id']);
        }

        return response()->json(['status' => true, 'data' => $q->get()]);
    }

    // POST /leave-policies/add-update
    public function store(Request $request)
    {
        try {
            $data = $request->validate([
                'company_id' => 'required|exists:companies,id',
                'role_id' => [
                    'required',
                    Rule::exists('roles', 'id')->where('company_id', $request->company_id),
                ],
                'year' => 'required|digits:4|integer|min:2000',
                'name' => 'nullable|string|max:100',

                'items' => 'required|array|min:1',
                'items.*.leave_type_id' => [
                    'required',
                    Rule::exists('leave_types', 'id')->where('company_id', $request->company_id),
                ],
                'items.*.annual_quota' => 'required|numeric|min:0|max:365',
                'items.*.carry_forward' => 'nullable|boolean',
                'items.*.max_carry_forward' => 'nullable|numeric|min:0|max:365',
                'items.*.encashment' => 'nullable|boolean',
                'items.*.max_encashment' => 'nullable|numeric|min:0|max:365',
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'status' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        }

        return DB::transaction(function () use ($data) {

            $policy = LeavePolicy::updateOrCreate(
                [
                    'company_id' => $data['company_id'],
                    'role_id' => $data['role_id'],
                    'year' => $data['year'],
                ],
                [
                    'name' => $data['name'] ?? 'Default Policy',
                ]
            );

            // Replace items (sync style)
            LeavePolicyItem::where('leave_policy_id', $policy->id)->delete();

            foreach ($data['items'] as $item) {
                LeavePolicyItem::create([
                    'leave_policy_id' => $policy->id,
                    'leave_type_id' => $item['leave_type_id'],
                    'annual_quota' => $item['annual_quota'],
                    'carry_forward' => $item['carry_forward'] ?? false,
                    'max_carry_forward' => $item['max_carry_forward'] ?? 0,
                    'encashment' => $item['encashment'] ?? false,
                    'max_encashment' => $item['max_encashment'] ?? 0,
                ]);
            }

            return response()->json([
                'status' => true,
                'message' => 'Leave policy saved',
                'data' => $policy->load('items'),
            ]);
        });
    }

    // POST /leave-balances/generate
    // Creates/updates leave_balances for users based on role policy
    public function generateBalances(Request $request)
    {
        $data = $request->validate([
            'company_id' => 'required|exists:companies,id',
            'year' => 'required|digits:4|integer|min:2000',
            'role_id' => 'nullable|exists:roles,id',
            'user_ids' => 'nullable|array',
            'user_ids.*' => 'exists:users,id',
        ]);

        $companyId = $data['company_id'];
        $year = $data['year'];

        // users scope
        $usersQ = User::where('company_id', $companyId);

        if (! empty($data['user_ids'])) {
            $usersQ->whereIn('id', $data['user_ids']);
        } elseif (! empty($data['role_id'])) {
            $usersQ->where('role_id', $data['role_id']);
        }

        $users = $usersQ->get(['id', 'role_id']);

        $createdOrUpdated = 0;

        DB::transaction(function () use ($users, $companyId, $year, &$createdOrUpdated) {
            foreach ($users as $user) {

                $policy = LeavePolicy::with('items')
                    ->where('company_id', $companyId)
                    ->where('year', $year)
                    ->where('role_id', $user->role_id)
                    ->first();

                if (! $policy) {
                    continue;
                }

                foreach ($policy->items as $item) {
                    LeaveBalance::updateOrCreate(
                        [
                            'company_id' => $companyId,
                            'user_id' => $user->id,
                            'leave_type_id' => $item->leave_type_id,
                            'year' => $year,
                        ],
                        [
                            'allocated' => $item->annual_quota,
                            'balance' => DB::raw('GREATEST(allocated - used, 0)'), // safe-ish, recalculated later
                        ]
                    );
                    $createdOrUpdated++;
                }
            }
        });

        return response()->json([
            'status' => true,
            'message' => 'Leave balances generated',
            'count' => $createdOrUpdated,
        ]);
    }
}
