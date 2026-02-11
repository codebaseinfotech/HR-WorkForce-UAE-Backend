<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Tymon\JWTAuth\Contracts\JWTSubject;

class User extends Authenticatable implements JWTSubject
{
    use HasFactory, Notifiable , SoftDeletes;

    /* =========================
     |  STATUS CONSTANTS
     ========================= */
    const STATUS_PENDING = 0;

    const STATUS_ACTIVE = 1;

    const STATUS_INACTIVE = 2;

    const STATUS_BLOCKED = 3;

    const STATUS_UNBLOCKED = 4;

    /* =========================
     |  MASS ASSIGNABLE FIELDS
     ========================= */
    protected $fillable = [
        'employeeId',
        'first_name',
        'last_name',
        'phone',
        'email',
        'company_id',
        'role_id',
        'nationality_id',
        'bod',
        'gender',
        'agree',
        'remember_me',
        'p_image',
        'signature_image',
        'password',
        'passd',
        'email_otp',
        'status',
        'email_verified_at',
        'login_count',
        'last_login_ip',
    ];

    /* =========================
     |  HIDDEN FIELDS
     ========================= */
    protected $hidden = [
        'password',
        'remember_token',
        'passd',
        'p_image',
        'created_at',
        'updated_at',
        'deleted_at',
        'signature_image',
    ];

    protected $appends = ['p_image_url', 'signature_image_url'];

    protected $casts = [
        'agree' => 'boolean',
        'status' => 'integer',
        'bod' => 'date',
    ];

    /* =========================
     |  CASTS
     ========================= */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'agree' => 'boolean',
            'remember_me' => 'boolean',
            'status' => 'integer',
        ];
    }

    /* =========================
     |  RELATIONSHIPS
     ========================= */

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function nationality()
    {
        return $this->belongsTo(Nationality::class);
    }

    public function role()
    {
        return $this->belongsTo(Role::class);
    }

    /* =========================
     |  ACCESSORS
     ========================= */

    public function getFullNameAttribute()
    {
        return trim($this->first_name.' '.$this->last_name);
    }

    public function getStatusTextAttribute()
    {
        // used to convert status code to human-readable text $user->status_text;
        return match ($this->status) {
            self::STATUS_PENDING => 'Pending',
            self::STATUS_ACTIVE => 'Active',
            self::STATUS_INACTIVE => 'Inactive',
            self::STATUS_BLOCKED => 'Blocked',
            self::STATUS_UNBLOCKED => 'Unblocked',
            default => 'Unknown',
        };
    }

    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims()
    {
        return [];
    }

    public function getPImageUrlAttribute()
    {
        return $this->p_image
            ? asset('storage/'.$this->p_image)
            : null;
    }

    public function getSignatureImageUrlAttribute()
    {
        return $this->signature_image
            ? asset('storage/'.$this->signature_image)
            : null;
    }

    public function toArray()
    {
        $array = parent::toArray();

        foreach ($array as $key => $value) {
            if (is_null($value)) {
                $array[$key] = '';
            }
        }

        return $array;
    }

}