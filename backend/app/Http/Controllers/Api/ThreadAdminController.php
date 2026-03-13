<?php

namespace App\Http\Controllers\Api;

use App\Events\Chat\ThreadRoleUpdated;
use App\Http\Controllers\Controller;
use App\Http\Requests\Chat\DemoteAdminRequest;
use App\Http\Requests\Chat\PromoteAdminRequest;
use App\Http\Resources\Chat\ThreadMemberResource;
use App\Http\Resources\Chat\ThreadResource;
use App\Models\Thread;
use App\Models\ThreadMember;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ThreadAdminController extends Controller
{
    public function promote(PromoteAdminRequest $request, Thread $thread): JsonResponse
    {
        $me = $request->user();

        if ((int) $thread->company_id !== (int) $me->company_id) {
            return $this->errorResponse('You are not allowed to access this thread.', 403);
        }

        if ($thread->type !== 'group') {
            return $this->errorResponse('Admin roles can only be managed in group threads.', 422);
        }

        if ($response = $this->authorizeAction('manageAdmins', $thread)) {
            return $response;
        }

        $targetUser = User::query()->findOrFail((int) $request->validated('user_id'));

        if ((int) $targetUser->company_id !== (int) $me->company_id) {
            return $this->errorResponse('Target user must belong to your company.', 422);
        }

        $member = ThreadMember::query()
            ->where('thread_id', $thread->id)
            ->where('user_id', $targetUser->id)
            ->first();

        if (! $member) {
            return $this->errorResponse('Target user is not a member of this thread.', 422);
        }

        if ($member->left_at !== null) {
            return $this->errorResponse('Target user is not an active member. Ask them to re-join first.', 422);
        }

        DB::transaction(function () use ($member, $thread, $targetUser) {
            $member->update(['role' => 'admin']);

            DB::afterCommit(function () use ($thread, $targetUser) {
                event(new ThreadRoleUpdated((int) $thread->id, (int) $targetUser->id, 'admin'));
            });
        });

        return response()->json([
            'status' => true,
            'data' => new ThreadResource($this->threadWithMembers($thread)),
        ]);
    }

    public function demote(DemoteAdminRequest $request, Thread $thread, ?User $user = null): JsonResponse
    {
        $me = $request->user();

        if ((int) $thread->company_id !== (int) $me->company_id) {
            return $this->errorResponse('You are not allowed to access this thread.', 403);
        }

        if ($thread->type !== 'group') {
            return $this->errorResponse('Admin roles can only be managed in group threads.', 422);
        }

        if ($response = $this->authorizeAction('manageAdmins', $thread)) {
            return $response;
        }

        $targetUser = $user;
        if (! $targetUser) {
            $targetUser = User::query()->findOrFail((int) $request->validated('user_id'));
        }

        if ((int) $targetUser->company_id !== (int) $me->company_id) {
            return $this->errorResponse('Target user must belong to your company.', 422);
        }

        $member = ThreadMember::query()
            ->where('thread_id', $thread->id)
            ->where('user_id', $targetUser->id)
            ->first();

        if (! $member) {
            return $this->errorResponse('Target user is not a member of this thread.', 422);
        }

        if ($member->left_at !== null) {
            return $this->errorResponse('Target user is not an active member. Ask them to re-join first.', 422);
        }

        if ($member->role !== 'admin') {
            return $this->errorResponse('Target user is not an admin in this thread.', 422);
        }

        $activeAdminCount = ThreadMember::query()
            ->where('thread_id', $thread->id)
            ->whereNull('left_at')
            ->where('role', 'admin')
            ->count();

        if ($activeAdminCount <= 1) {
            return $this->errorResponse('You cannot demote the last remaining admin.', 422);
        }

        DB::transaction(function () use ($member, $thread, $targetUser) {
            $member->update(['role' => 'member']);

            DB::afterCommit(function () use ($thread, $targetUser) {
                event(new ThreadRoleUpdated((int) $thread->id, (int) $targetUser->id, 'member'));
            });
        });

        return response()->json([
            'status' => true,
            'data' => new ThreadResource($this->threadWithMembers($thread)),
        ]);
    }

    public function members(Request $request, Thread $thread): JsonResponse
    {
        $me = $request->user();

        if ((int) $thread->company_id !== (int) $me->company_id) {
            return $this->errorResponse('You are not allowed to access this thread.', 403);
        }

        if ($response = $this->authorizeAction('view', $thread)) {
            return $response;
        }

        $members = ThreadMember::query()
            ->where('thread_id', $thread->id)
            ->whereNull('left_at')
            ->with('user:id,first_name,last_name,avatar_path,p_image')
            ->orderBy('id')
            ->get();

        return response()->json([
            'status' => true,
            'data' => [
                'thread_id' => (int) $thread->id,
                'members' => ThreadMemberResource::collection($members)->resolve(),
            ],
        ]);
    }

    private function threadWithMembers(Thread $thread): Thread
    {
        return $thread->fresh([
            'members' => fn ($q) => $q->whereNull('left_at')->with('user:id,first_name,last_name,avatar_path,p_image'),
            'lastMessage.sender:id,first_name,last_name,avatar_path,p_image',
        ]);
    }

    private function authorizeAction(string $ability, Thread $thread): ?JsonResponse
    {
        try {
            $this->authorize($ability, $thread);

            return null;
        } catch (AuthorizationException $e) {
            return $this->errorResponse('You are not allowed to perform this action on this thread.', 403);
        }
    }

    private function errorResponse(string $message, int $statusCode): JsonResponse
    {
        return response()->json([
            'status' => false,
            'message' => $message,
        ], $statusCode);
    }
}
