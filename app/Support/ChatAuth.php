<?php

namespace App\Support;

use App\Models\ThreadMember;

class ChatAuth
{
    public static function ensureMember(int $threadId, int $userId): void
    {
        $isMember = ThreadMember::where('thread_id', $threadId)
            ->where('user_id', $userId)
            ->whereNull('left_at')
            ->exists();

        abort_if(!$isMember, 403, 'Not a member of this thread.');
    }
}