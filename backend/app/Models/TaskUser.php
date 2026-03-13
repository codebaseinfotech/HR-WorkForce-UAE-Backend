<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TaskUser extends Model
{
    protected $table = 'task_user';

    protected $fillable = [
        'company_id',
        'task_id',
        'user_id',
        'status',
        'progress',
        'accepted_at',
        'started_at',
        'completed_at',
        'blocked_reason',
        'done_note',
    ];

    protected $casts = [
        'accepted_at' => 'datetime',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    protected $hidden = ['created_at', 'updated_at', 'deleted_at'];

    public function task()
    {
        return $this->belongsTo(Task::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function toArray()
    {
        $array = parent::toArray();

        foreach ($array as $key => $value) {
            if (is_null($value)) {
                $array[$key] = '-';
            }
        }

        return $array;
    }
}
