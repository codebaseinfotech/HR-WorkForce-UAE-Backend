<?php

namespace App\Http\Controllers\Api;

use App\Events\Chat\UserBlocked;
use App\Http\Controllers\Controller;
use App\Http\Requests\Chat\BlockUserRequest;
use App\Models\User;
use App\Models\UserBlock;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BlockController extends Controller
{
    public function block(Request $request, User $user): JsonResponse
    {
        return $this->blockUser($request, $user);
    }

    public function unblock(Request $request, User $user): JsonResponse
    {
        return $this->unblockUser($request, $user);
    }

    public function blockById(BlockUserRequest $request): JsonResponse
    {
        $target = User::query()->findOrFail((int) $request->validated('user_id'));

        return $this->blockUser($request, $target);
    }

    public function unblockById(BlockUserRequest $request): JsonResponse
    {
        $target = User::query()->findOrFail((int) $request->validated('user_id'));

        return $this->unblockUser($request, $target);
    }

    private function blockUser(Request $request, User $target): JsonResponse
    {
        $me = $request->user();

        abort_if((int) $target->id === (int) $me->id, 422, 'You cannot block yourself.');
        abort_if((int) $target->company_id !== (int) $me->company_id, 404, 'User not found in your company.');

        DB::transaction(function () use ($me, $target) {
            UserBlock::query()->updateOrCreate(
                [
                    'company_id' => $me->company_id,
                    'blocker_id' => $me->id,
                    'blocked_id' => $target->id,
                ],
                []
            );

            DB::afterCommit(function () use ($me, $target) {
                event(new UserBlocked((int) $target->id, (int) $me->id, (int) $target->id, true));
                event(new UserBlocked((int) $me->id, (int) $me->id, (int) $target->id, true));
            });
        });

        return response()->json([
            'status' => true,
            'data' => ['message' => 'User blocked successfully'],
        ]);
    }

    private function unblockUser(Request $request, User $target): JsonResponse
    {
        $me = $request->user();

        abort_if((int) $target->id === (int) $me->id, 422, 'You cannot unblock yourself.');
        abort_if((int) $target->company_id !== (int) $me->company_id, 404, 'User not found in your company.');

        DB::transaction(function () use ($me, $target) {
            UserBlock::query()
                ->where('company_id', $me->company_id)
                ->where('blocker_id', $me->id)
                ->where('blocked_id', $target->id)
                ->delete();

            DB::afterCommit(function () use ($me, $target) {
                event(new UserBlocked((int) $target->id, (int) $me->id, (int) $target->id, false));
                event(new UserBlocked((int) $me->id, (int) $me->id, (int) $target->id, false));
            });
        });

        return response()->json([
            'status' => true,
            'data' => ['message' => 'User unblocked successfully'],
        ]);
    }
}
