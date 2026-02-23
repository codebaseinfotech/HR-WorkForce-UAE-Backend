<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Thread extends Model
{
    protected $fillable = [
        'company_id',
        'type',
        'name',
        'created_by',
        'deleted_at',
    ];

    protected $casts = [
        'deleted_at' => 'datetime',
    ];
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
    public function members()
    {
        return $this->hasMany(\App\Models\ThreadMember::class);
    }
}