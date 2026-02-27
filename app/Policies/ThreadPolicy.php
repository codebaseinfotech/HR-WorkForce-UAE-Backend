<?php

namespace App\Policies;

use App\Models\Thread;
use App\Models\ThreadMember;
use App\Models\User;

class ThreadPolicy
{
    public function view(User $user, Thread $thread): bool
    {
        if ((int) $thread->company_id !== (int) $user->company_id) {
            return false;
        }

        return $this->isActiveMember($user, $thread);
    }

    public function addMembers(User $user, Thread $thread): bool
    {
        if ((int) $thread->company_id !== (int) $user->company_id) {
            return false;
        }

        if ($thread->type !== 'group') {
            return false;
        }

        return $this->isActiveAdmin($user, $thread);
    }

    public function manageAdmins(User $user, Thread $thread): bool
    {
        if ((int) $thread->company_id !== (int) $user->company_id) {
            return false;
        }

        if ($thread->type !== 'group') {
            return false;
        }

        return $this->isActiveAdmin($user, $thread);
    }

    public function leave(User $user, Thread $thread): bool
    {
        return $this->view($user, $thread);
    }

    private function isActiveMember(User $user, Thread $thread): bool
    {
        return ThreadMember::query()
            ->where('thread_id', $thread->id)
            ->where('user_id', $user->id)
            ->whereNull('left_at')
            ->exists();
    }

    private function isActiveAdmin(User $user, Thread $thread): bool
    {
        return ThreadMember::query()
            ->where('thread_id', $thread->id)
            ->where('user_id', $user->id)
            ->whereNull('left_at')
            ->where('role', 'admin')
            ->exists();
    }
}
