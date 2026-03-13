<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Task extends Model
{
    use SoftDeletes;

    protected $table = "tasks";
    protected $fillable = [
        'company_id',
        'title',
        'description',
        'priority',
        'start_date',
        'due_date',
        'created_by',
        'status',
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

    public function users()
    {
        return $this->hasMany(TaskUser::class);
    }

    public function comments()
    {
        return $this->hasMany(TaskComment::class);
    }

    public function attachments()
    {
        return $this->hasMany(TaskAttachment::class);
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(TaskAssignment::class);
    }
}
