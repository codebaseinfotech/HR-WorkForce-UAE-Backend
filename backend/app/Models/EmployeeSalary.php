<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmployeeSalary extends Model
{
    protected $fillable = [
        'company_id',
        'user_id',
        'salary_type',
        'monthly_salary',
        'daily_salary',
        'hourly_salary',
        'overtime_rate_per_hour',
        'effective_from',
        'effective_to',
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
