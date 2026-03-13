<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LeaveRequest extends Model
{
    protected $fillable = [
        'company_id', 'user_id', 'leave_type_id',
        'from_date', 'to_date', 'days', 'reason',
        'status', 'action_by', 'action_at', 'action_note',
    ];

    protected $casts = [
        'from_date' => 'date',
        'to_date' => 'date',
        'action_at' => 'datetime',
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

    public function leaveType()
    {
        return $this->belongsTo(LeaveType::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
