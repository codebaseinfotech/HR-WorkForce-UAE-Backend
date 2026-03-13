<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Company extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'name_first',
        'name_last',
        'email',
        'phone',
        'ip',
        'gender',
        'nationality',
        'address',
        'city',
        'latitude',
        'longitude',
        'radius',
        'logo',
    ];

    protected $casts = [
        'latitude' => 'decimal:7',
        'longitude' => 'decimal:7',
        'radius' => 'decimal:2',
    ];

    protected $hidden = ['created_at', 'updated_at', 'deleted_at'];

    public function attendances()
    {
        return $this->hasMany(Attendance::class);
    }

    public function nationality()
    {
        return $this->belongsTo(Nationality::class);
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
    
    public function users()
    {
        return $this->hasMany(User::class);
    }
}