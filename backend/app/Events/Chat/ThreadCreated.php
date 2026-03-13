<?php

namespace App\Events\Chat;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ThreadCreated implements ShouldBroadcast
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public bool $afterCommit = true;

    public function __construct(
        public array $recipientIds,
        public array $thread
    ) {
    }

    public function broadcastOn(): array
    {
        return collect($this->recipientIds)
            ->unique()
            ->map(fn ($id) => new PrivateChannel("user.{$id}"))
            ->all();
    }

    public function broadcastAs(): string
    {
        return 'thread.created';
    }

    public function broadcastWith(): array
    {
        return [
            'thread' => $this->thread,
        ];
    }
}
