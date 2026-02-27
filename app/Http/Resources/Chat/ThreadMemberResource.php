<?php

namespace App\Http\Resources\Chat;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ThreadMemberResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $user = $this->whenLoaded('user');

        return [
            'id' => $this->user_id,
            'first_name' => $user?->first_name,
            'last_name' => $user?->last_name,
            'avatar_path' => $user?->avatar_path ?: $user?->p_image,
            'role' => $this->role,
            'joined_at' => optional($this->joined_at)->toISOString(),
            'left_at' => optional($this->left_at)->toISOString(),
        ];
    }
}
