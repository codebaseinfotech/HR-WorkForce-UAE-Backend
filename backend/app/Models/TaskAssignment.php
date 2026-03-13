<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TaskAssignment extends Model
{
    protected $table = "task_assignments";
    protected $fillable = [
        'company_id', 'task_id', 'user_id', 'assigned_by',
        'status', 'progress', 'note', 'accepted_at', 'started_at', 'completed_at',
    ];

    protected $hidden = ['created_at', 'updated_at', 'deleted_at'];

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

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class, 'task_id');
    }
}
