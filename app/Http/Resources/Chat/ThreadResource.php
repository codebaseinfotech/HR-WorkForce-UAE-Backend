<?php

namespace App\Http\Resources\Chat;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ThreadResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'company_id' => $this->company_id,
            'type' => $this->type,
            'name' => $this->name,
            'created_by' => $this->created_by,
            'last_message_id' => $this->last_message_id,
            'last_message_at' => optional($this->last_message_at)->toISOString(),
            'unread_count' => (int) ($this->unread_count ?? 0),
            'members' => ThreadMemberResource::collection($this->whenLoaded('members')),
            'last_message' => $this->whenLoaded(
                'lastMessage',
                fn () => $this->lastMessage ? new MessageResource($this->lastMessage) : null
            ),
        ];
    }
}
