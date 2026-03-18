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
        'company_license',
        'company_start_date',
        'company_license_image',
    ];

    protected $casts = [
        'latitude' => 'decimal:7',
        'longitude' => 'decimal:7',
        'radius' => 'decimal:2',
        'company_start_date' => 'date',
        'bod' => 'date:Y-m-d',
    ];
    protected $appends = ['company_license_image_url'];
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
    public function getBodAttribute($value)
    {
        return $value ? \Carbon\Carbon::parse($value)->format('Y-m-d') : null;
    }
    public function getCompanyLicenseImageUrlAttribute()
    {
        $path = $this->company_license_image;

        if (!$path) {
            return '';
        }

        // already full URL hoy to
        if (str_starts_with($path, 'http')) {
            return $path;
        }

        return asset('storage/' . $path);
    }
}