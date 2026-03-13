<?php

namespace App\Events\Chat;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageDeleted implements ShouldBroadcast
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public bool $afterCommit = true;

    public function __construct(
        public int $threadId,
        public int $messageId,
        public int $deletedBy,
        public string $scope,
        public string $deletedAt
    ) {
    }

    public function broadcastOn(): array
    {
        return [new PrivateChannel("thread.{$this->threadId}")];
    }

    public function broadcastAs(): string
    {
        return 'message.deleted';
    }

    public function broadcastWith(): array
    {
        return [
            'thread_id' => $this->threadId,
            'message_id' => $this->messageId,
            'deleted_by' => $this->deletedBy,
            'scope' => $this->scope,
            'deleted_at' => $this->deletedAt,
        ];
    }
}
