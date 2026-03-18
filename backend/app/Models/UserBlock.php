<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

class UserBlock extends Model
{
    protected $table = 'user_blocks';

    protected $fillable = [
        'company_id',
        'blocker_id',
        'blocked_id',
    ];

    public function blocker(): BelongsTo
    {
        return $this->belongsTo(User::class, 'blocker_id');
    }

    public function blocked(): BelongsTo
    {
        return $this->belongsTo(User::class, 'blocked_id');
    }

    public function scopeBetweenUsers(Builder $query, int $companyId, int $userA, int $userB): Builder
    {
        return $query
            ->where('company_id', $companyId)
            ->where(function (Builder $where) use ($userA, $userB) {
                $where->where([
                    ['blocker_id', '=', $userA],
                    ['blocked_id', '=', $userB],
                ])->orWhere([
                            ['blocker_id', '=', $userB],
                            ['blocked_id', '=', $userA],
                        ]);
            });
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
