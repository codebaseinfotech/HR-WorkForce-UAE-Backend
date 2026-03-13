<?php

use App\Models\Thread;
use App\Models\ThreadMember;
use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('thread.{threadId}', function (User $user, int $threadId) {
    $thread = Thread::query()->find($threadId);

    if (! $thread || (int) $thread->company_id !== (int) $user->company_id) {
        return false;
    }

    return ThreadMember::query()
        ->where('thread_id', $thread->id)
        ->where('user_id', $user->id)
        ->whereNull('left_at')
        ->exists();
});

Broadcast::channel('user.{userId}', function (User $user, int $userId) {
    return (int) $user->id === (int) $userId;
});
