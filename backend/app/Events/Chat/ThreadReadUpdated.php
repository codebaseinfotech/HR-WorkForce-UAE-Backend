<?php

namespace App\Events\Chat;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ThreadReadUpdated implements ShouldBroadcast
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public bool $afterCommit = true;

    public function __construct(
        public int $threadId,
        public int $userId,
        public string $lastReadAt
    ) {
    }

    public function broadcastOn(): array
    {
        return [new PrivateChannel("thread.{$this->threadId}")];
    }

    public function broadcastAs(): string
    {
        return 'thread.read';
    }

    public function broadcastWith(): array
    {
        return [
            'thread_id' => $this->threadId,
            'user_id' => $this->userId,
            'last_read_at' => $this->lastReadAt,
        ];
    }
}
