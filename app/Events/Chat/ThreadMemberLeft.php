<?php

namespace App\Events\Chat;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ThreadMemberLeft implements ShouldBroadcast
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public bool $afterCommit = true;

    public function __construct(
        public int $threadId,
        public int $userId,
        public string $leftAt
    ) {
    }

    public function broadcastOn(): array
    {
        return [new PrivateChannel("thread.{$this->threadId}")];
    }

    public function broadcastAs(): string
    {
        return 'thread.member_left';
    }

    public function broadcastWith(): array
    {
        return [
            'thread_id' => $this->threadId,
            'user_id' => $this->userId,
            'left_at' => $this->leftAt,
        ];
    }
}
