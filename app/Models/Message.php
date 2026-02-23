<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Message extends Model
{
    protected $fillable = [
        'thread_id', 'sender_id', 'body', 'message_type', 'reply_to_id', 'deleted_at',
    ];

    protected $casts = [
        'deleted_at' => 'datetime',
    ];

    public function thread()
    {
        return $this->belongsTo(Thread::class);
    }

    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function attachments()
    {
        return $this->hasMany(MessageAttachment::class);
    }

    public function deletions()
    {
        return $this->hasMany(\App\Models\MessageDeletion::class, 'id');
    }

    public function reads()
    {
        return $this->hasMany(MessageRead::class);
    }

    public function toArray()
    {
        $array = parent::toArray();

        foreach ($array as $key => $value) {
            if (is_null($value)) {
                $array[$key] = '';
            }
        }

        return $array;
    }
}
