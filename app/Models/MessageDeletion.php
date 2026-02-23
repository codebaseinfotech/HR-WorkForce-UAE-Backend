<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MessageDeletion extends Model
{
    protected $fillable = ['message_id', 'user_id', 'deleted_at'];

    protected $casts = ['deleted_at' => 'datetime'];

    public function message()
    {
        return $this->belongsTo(\App\Models\Message::class, 'message_id');
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