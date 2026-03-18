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
        'overtime_out',
        'overtime_in',
        'overtimes_user_id', // optional if you use it
        'check_in_latitude',    
        'check_in_longitude',
        'check_out_latitude',
        'check_out_longitude',
        'break_in_latitude',
        'break_in_longitude',
        'break_out_latitude',
        'break_out_longitude',
        'overtime_in_latitude',
        'overtime_in_longitude',
        'overtime_out_latitude',
        'overtime_out_longitude'
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
