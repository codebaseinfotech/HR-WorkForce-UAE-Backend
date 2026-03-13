<?php

namespace App\Support;

use App\Models\Thread;
use App\Models\ThreadMember;
use App\Models\User;

class ChatAuth
{
    public static function ensureThreadAccess(Thread $thread, User $user): void
    {
        abort_if((int) $thread->company_id !== (int) $user->company_id, 404);

        $isMember = ThreadMember::query()
            ->where('thread_id', $thread->id)
            ->where('user_id', $user->id)
            ->whereNull('left_at')
            ->exists();

        abort_if(! $isMember, 403, 'Not a member of this thread.');
    }

    public static function ensureMember(int $threadId, int $userId): void
    {
        $isMember = ThreadMember::where('thread_id', $threadId)
            ->where('user_id', $userId)
            ->whereNull('left_at')
            ->exists();

        abort_if(! $isMember, 403, 'Not a member of this thread.');
    }

    public static function isThreadAdmin(int $threadId, int $userId): bool
    {
        return ThreadMember::query()
            ->where('thread_id', $threadId)
            ->where('user_id', $userId)
            ->whereNull('left_at')
            ->where('role', 'admin')
            ->exists();
    }
}
