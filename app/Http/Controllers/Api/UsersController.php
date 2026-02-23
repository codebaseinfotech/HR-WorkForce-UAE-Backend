<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\UserBlock;
use Illuminate\Http\Request;

class UsersController extends Controller
{
    public function index(Request $request)
    {
        $me = $request->user();

        $q = trim((string) $request->query('q', ''));

        $query = User::query()
            ->where('company_id', $me->company_id)
            ->where('id', '!=', $me->id)
            ->select('id', 'first_name', 'email', 'avatar_path', 'company_id');

        if ($q !== '') {
            $query->where(function ($w) use ($q) {
                $w->where('first_name', 'like', "%{$q}%")
                    ->orWhere('email', 'like', "%{$q}%");
            });
        }

        // who I blocked (so UI can show "Blocked" badge)
        $blockedIds = UserBlock::where('company_id', $me->company_id)
            ->where('blocker_id', $me->id)
            ->pluck('blocked_id')
            ->toArray();

        $users = $query->orderBy('first_name')->paginate(30);

        // add is_blocked flag
        $users->getCollection()->transform(function ($u) use ($blockedIds) {
            $u->is_blocked = in_array($u->id, $blockedIds);

            return $u;
        });

        return response()->json($users);
    }

    /**
     * GET /users/{user}
     * Single user profile (only same company)
     */
    public function show(Request $request, User $user)
    {
        $me = $request->user();

        abort_if($user->company_id !== $me->company_id, 404);

        return response()->json([
            'id' => $user->id,
            'name' => $user->first_name.' '. $user->last_name,
            'email' => $user->email,
            'phone' => $user->phone,
            'avatar_path' => $user->avatar_path,
            'company_id' => $user->company_id,
        ]);
    }
}