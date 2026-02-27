<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\UserBlock;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UsersController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $me = $request->user();
        $q = trim((string) $request->query('q', ''));
        $perPage = max(1, min((int) $request->integer('per_page', 30), 100));

        $query = User::query()
            ->where('id', '!=', $me->id)
            ->select('id', 'first_name', 'last_name', 'avatar_path', 'p_image', 'role_id', 'company_id');

        if ((int) $me->is_super_admin !== 1) {
            $query->where('company_id', $me->company_id);
        } elseif ($request->filled('company_id')) {
            $query->where('company_id', (int) $request->query('company_id'));
        }

        if ($q !== '') {
            $query->where(function (Builder $where) use ($q) {
                $where->where('first_name', 'like', "%{$q}%")
                    ->orWhere('last_name', 'like', "%{$q}%");
            });
        }

        if (! $request->boolean('include_blocked', false)) {
            $query->whereNotIn('id', function ($sub) use ($me) {
                $sub->select('blocked_id')
                    ->from('user_blocks')
                    ->where('company_id', $me->company_id)
                    ->where('blocker_id', $me->id);
            })->whereNotIn('id', function ($sub) use ($me) {
                $sub->select('blocker_id')
                    ->from('user_blocks')
                    ->where('company_id', $me->company_id)
                    ->where('blocked_id', $me->id);
            });
        }

        $blockedIds = UserBlock::query()
            ->where('company_id', $me->company_id)
            ->where('blocker_id', $me->id)
            ->pluck('blocked_id')
            ->all();

        $users = $query->orderBy('first_name')->paginate($perPage);
        $users->getCollection()->transform(function ($user) use ($blockedIds) {
            return [
                'id' => $user->id,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'avatar_path' => $user->avatar_path ?: $user->p_image,
                'role_id' => $user->role_id,
                'is_blocked' => in_array($user->id, $blockedIds, true),
            ];
        });

        return response()->json([
            'status' => true,
            'data' => $users->items(),
            'meta' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
            ],
        ]);
    }

    public function show(Request $request, User $user): JsonResponse
    {
        $me = $request->user();

        if ((int) $me->is_super_admin !== 1) {
            abort_if((int) $user->company_id !== (int) $me->company_id, 404);
        }

        return response()->json([
            'status' => true,
            'data' => [
                'id' => $user->id,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'email' => $user->email,
                'phone' => $user->phone,
                'avatar_path' => $user->avatar_path ?: $user->p_image,
                'role_id' => $user->role_id,
            ],
        ]);
    }
}
