<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

class Message extends Model
{
    protected $fillable = [
        'thread_id',
        'company_id',
        'sender_id',
        'type',
        'body',
        'attachment_path',
        'attachment_meta',
        'deleted_for_all_at',
    ];

    protected $casts = [
        'attachment_meta' => 'array',
        'deleted_for_all_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function thread(): BelongsTo
    {
        return $this->belongsTo(Thread::class);
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function reads(): HasMany
    {
        return $this->hasMany(MessageRead::class);
    }

    public function deletions(): HasMany
    {
        return $this->hasMany(MessageDeletion::class, 'message_id');
    }

    public function getAttachmentUrlAttribute(): ?string
    {
        if (! $this->attachment_path) {
            return null;
        }

        return Storage::url($this->attachment_path);
    }

    public function getTypeAttribute($value): string
    {
        if ($value) {
            return $value;
        }

        $legacyType = $this->attributes['message_type'] ?? 'text';
        if ($legacyType === 'media') {
            return 'image';
        }

        return $legacyType;
    }

    public function getDeletedForAllAtAttribute($value)
    {
        if ($value) {
            return $this->asDateTime($value);
        }

        if (! empty($this->attributes['deleted_at'])) {
            return $this->asDateTime($this->attributes['deleted_at']);
        }

        return null;
    }
}
