<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MessageRead extends Model
{
    protected $fillable = ['message_id', 'user_id', 'read_at'];

    protected $casts = ['read_at' => 'datetime'];

    public function message()
    {
        return $this->belongsTo(Message::class);
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
