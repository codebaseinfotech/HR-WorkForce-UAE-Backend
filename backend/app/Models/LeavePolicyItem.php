<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LeavePolicyItem extends Model
{
    protected $fillable = [
        'leave_policy_id', 'leave_type_id', 'annual_quota',
        'carry_forward', 'max_carry_forward', 'encashment', 'max_encashment',
    ];

    protected $casts = [
        'carry_forward' => 'boolean',
        'encashment' => 'boolean',
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
