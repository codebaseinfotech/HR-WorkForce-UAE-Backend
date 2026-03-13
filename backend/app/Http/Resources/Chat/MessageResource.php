<?php

namespace App\Http\Resources\Chat;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class MessageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $isDeletedForAll = ! is_null($this->deleted_for_all_at);
        $sender = $this->whenLoaded('sender');

        return [
            'id' => $this->id,
            'thread_id' => $this->thread_id,
            'company_id' => $this->company_id,
            'sender_id' => $this->sender_id,
            'type' => $this->type ?: ($this->message_type ?? 'text'),
            'body' => $isDeletedForAll ? 'This message was deleted' : $this->body,
            'attachment_path' => $isDeletedForAll ? null : $this->attachment_path,
            'attachment_url' => $isDeletedForAll || ! $this->attachment_path
                ? null
                : Storage::url($this->attachment_path),
            'attachment_meta' => $isDeletedForAll ? null : $this->attachment_meta,
            'deleted_for_all_at' => optional($this->deleted_for_all_at)->toISOString(),
            'created_at' => optional($this->created_at)->toISOString(),
            'sender' => $sender ? [
                'id' => $sender->id,
                'first_name' => $sender->first_name,
                'last_name' => $sender->last_name,
                'avatar_path' => $sender->avatar_path ?: $sender->p_image,
            ] : null,
        ];
    }
}
