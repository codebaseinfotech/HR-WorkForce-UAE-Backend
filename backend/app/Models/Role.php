<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

class Role extends Model
{
    protected $fillable = ['name', 'slug', 'company_id'];

    protected $hidden = [
        'created_at',
        'updated_at',
    ];

    public function permissions()
    {
        return $this->belongsToMany(Permission::class, 'role_permissions')
            ->withPivot('can_view', 'can_add', 'can_edit', 'can_delete')
            ->withTimestamps();
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

    public function scopeCompanyWise($query)
    {
        $user = Auth::user();

        if (! $user) {
            return $query;
        }

        if ($user->role && $user->role->slug === 'company') {
            return $query;
        }

        return $query->where('company_id', $user->company_id);
    }
}
