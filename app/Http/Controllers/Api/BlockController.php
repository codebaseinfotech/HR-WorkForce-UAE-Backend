<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\UserBlock;
use Illuminate\Http\Request;

class BlockController extends Controller
{
    public function block(Request $request, User $user)
    {
        $me = $request->user();

        if ($me->id == $user->id) {
            return response()->json([
                'message' => 'You cannot block yourself',
            ], 422);
        }

        UserBlock::firstOrCreate([
            'blocker_id' => $me->id,
            'blocked_id' => $user->id,
            'company_id' => $me->company_id, //  ADD THIS
        ]);

        return response()->json([
            'message' => 'User blocked successfully',
        ]);
    }

    public function unblock(Request $request, User $user)
    {
        $me = $request->user();

        UserBlock::where('blocker_id', $me->id)
            ->where('blocked_id', $user->id)
            ->delete();

        return response()->json([
            'message' => 'User unblocked successfully',
        ]);
    }
}