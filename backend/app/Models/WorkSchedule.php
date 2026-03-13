<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WorkSchedule extends Model
{
    protected $fillable = [
        'company_id', 'role_id', 'start_time', 'end_time', 'break_minutes',
        'weekly_rules', 'monthly_rules', 'effective_from', 'effective_to',
    ];

    protected $casts = [
        'weekly_rules' => 'array',
        'monthly_rules' => 'array',
        'effective_from' => 'date',
        'effective_to' => 'date',
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
