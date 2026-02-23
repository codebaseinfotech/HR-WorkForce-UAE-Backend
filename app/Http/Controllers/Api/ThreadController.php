<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Thread;
use App\Models\ThreadMember;
use App\Models\User;
use App\Models\UserBlock;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ThreadController extends Controller
{
    public function direct(Request $request)
    {
        $me = $request->user();

        $request->validate([
            'user_id' => 'required|integer|exists:users,id',
        ]);

        $other = User::findOrFail($request->user_id);

        // same company check
        abort_if($other->company_id !== $me->company_id, 404, 'User not found in your company');

        // block check (both ways)
        $blocked = UserBlock::where('company_id', $me->company_id)
            ->where(function ($q) use ($me, $other) {
                $q->where([
                    ['blocker_id', '=', $me->id],
                    ['blocked_id', '=', $other->id],
                ])->orWhere([
                    ['blocker_id', '=', $other->id],
                    ['blocked_id', '=', $me->id],
                ]);
            })
            ->exists();

        abort_if($blocked, 403, 'Chat blocked');

        // find existing direct thread where both users are members
        $thread = Thread::where('company_id', $me->company_id)
            ->where('type', 'direct')
            ->whereHas('members', fn ($q) => $q->where('user_id', $me->id))
            ->whereHas('members', fn ($q) => $q->where('user_id', $other->id))
            ->first();

        if ($thread) {
            // ensure not left
            ThreadMember::where('thread_id', $thread->id)
                ->whereIn('user_id', [$me->id, $other->id])
                ->update(['left_at' => null]);

            return response()->json($thread->load('members.user:id,first_name,avatar_path'));
        }

        // create new direct thread
        return DB::transaction(function () use ($me, $other) {
            $thread = Thread::create([
                'company_id' => $me->company_id,
                'type' => 'direct',
                'created_by' => $me->id,
            ]);

            ThreadMember::insert([
                [
                    'thread_id' => $thread->id,
                    'user_id' => $me->id,
                    'role' => 'member',
                    'joined_at' => now(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'thread_id' => $thread->id,
                    'user_id' => $other->id,
                    'role' => 'member',
                    'joined_at' => now(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            ]);

            return response()->json($thread->load('members.user:id,first_name,avatar_path'), 201);
        });
    }

    public function index(Request $request)
    {
        $me = $request->user();

        abort_if(! $me, 401, 'Unauthenticated');

        $threads = \App\Models\Thread::where('company_id', $me->company_id)
            ->whereNull('deleted_at')
            ->whereHas('members', function ($q) use ($me) {
                $q->where('user_id', $me->id)
                    ->whereNull('left_at');
            })
            ->with(['members.user:id,first_name,avatar_path'])
            ->orderByDesc('updated_at')
            ->paginate(20);

        return response()->json($threads);
    }

    public function createGroup(Request $request)
    {
        $me = $request->user();

        abort_if(! $me, 401, 'Unauthenticated');

        $request->validate([
            'name' => 'required|string|max:255',
            'member_ids' => 'required|array|min:1',
            'member_ids.*' => 'integer|exists:users,id',
        ]);

        // All members + me (unique)
        $memberIds = collect($request->member_ids)
            ->push($me->id)
            ->unique()
            ->values();

        // Company check (badha same company ma hova joie)
        $count = \App\Models\User::where('company_id', $me->company_id)
            ->whereIn('id', $memberIds)
            ->count();

        abort_if($count !== $memberIds->count(), 422, 'All members must be in same company');

        return DB::transaction(function () use ($me, $memberIds, $request) {

            $thread = \App\Models\Thread::create([
                'company_id' => $me->company_id,
                'type' => 'group',
                'name' => $request->name,
                'created_by' => $me->id,
            ]);

            foreach ($memberIds as $uid) {
                \App\Models\ThreadMember::create([
                    'thread_id' => $thread->id,
                    'user_id' => $uid,
                    'role' => $uid == $me->id ? 'admin' : 'member',
                    'joined_at' => now(),
                ]);
            }

            return response()->json($thread->load('members.user:id,first_name,avatar_path'), 201);
        });
    }
}
