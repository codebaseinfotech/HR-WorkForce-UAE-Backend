<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

// use Illuminate\Database\Eloquent\SoftDeletes;

class Attendance extends Model
{
    // use SoftDeletes;
    protected $fillable = [
        'user_id',
        'company_id',
        'date',
        'check_in',
        'check_out',
        'break_in',
        'break_out',
        'total_minutes',
        'overtime_minutes',
        'overtimes_user_id', // optional if you use it
    ];

    public function overtime()
    {
        return $this->belongsTo(OvertimesUser::class, 'overtimes_user_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

      public function company()
    {
        return $this->belongsTo(Company::class);
    }

    protected $hidden = [
        'created_at',
        'updated_at',
    ];

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