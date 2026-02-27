<?php

namespace App\Policies;

use App\Models\Message;
use App\Models\ThreadMember;
use App\Models\User;

class MessagePolicy
{
    public function view(User $user, Message $message): bool
    {
        $thread = $message->thread;

        if (! $thread || (int) $thread->company_id !== (int) $user->company_id) {
            return false;
        }

        return ThreadMember::query()
            ->where('thread_id', $thread->id)
            ->where('user_id', $user->id)
            ->whereNull('left_at')
            ->exists();
    }

    public function deleteForMe(User $user, Message $message): bool
    {
        if (! $this->view($user, $message)) {
            return false;
        }

        return (int) $message->sender_id === (int) $user->id || $this->isThreadAdmin($user, $message);
    }

    public function deleteForAll(User $user, Message $message): bool
    {
        if (! $this->view($user, $message)) {
            return false;
        }

        if ($this->isThreadAdmin($user, $message)) {
            return true;
        }

        if ((int) $message->sender_id !== (int) $user->id) {
            return false;
        }

        return $message->created_at?->gte(now()->subMinutes(15)) ?? false;
    }

    private function isThreadAdmin(User $user, Message $message): bool
    {
        return ThreadMember::query()
            ->where('thread_id', $message->thread_id)
            ->where('user_id', $user->id)
            ->whereNull('left_at')
            ->where('role', 'admin')
            ->exists();
    }
}
