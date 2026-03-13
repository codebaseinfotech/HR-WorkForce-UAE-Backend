<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Team extends Model
{
    protected $fillable = [
        'company_id',
        'name',
        'description',
    ];

    protected $hidden = ['created_at', 'updated_at', 'deleted_at'];

    public function users()
    {
        return $this->belongsToMany(User::class, 'team_user');
    }

    public function company()
    {
        return $this->belongsTo(Company::class);
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
}
