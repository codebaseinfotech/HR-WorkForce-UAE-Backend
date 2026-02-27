<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LiveLocation extends Model
{
    protected $fillable = [
        'company_id', 'user_id', 'latitude', 'longitude',
        'accuracy', 'speed', 'is_inside_radius', 'tracked_at',
    ];

    protected $casts = [
        'tracked_at' => 'datetime',
        'is_inside_radius' => 'boolean',
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
}
