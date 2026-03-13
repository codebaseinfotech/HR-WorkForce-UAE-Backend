<?php

namespace App\Events\Chat;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class UserBlocked implements ShouldBroadcast
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public bool $afterCommit = true;

    public function __construct(
        public int $userId,
        public int $blockerId,
        public int $blockedId,
        public bool $blocked
    ) {
    }

    public function broadcastOn(): array
    {
        return [new PrivateChannel("user.{$this->userId}")];
    }

    public function broadcastAs(): string
    {
        return 'user.blocked';
    }

    public function broadcastWith(): array
    {
        return [
            'blocker_id' => $this->blockerId,
            'blocked_id' => $this->blockedId,
            'blocked' => $this->blocked,
        ];
    }
}
