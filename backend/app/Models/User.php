<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Tymon\JWTAuth\Contracts\JWTSubject;

class User extends Authenticatable implements JWTSubject
{
    use HasFactory, Notifiable, SoftDeletes;

    /* =========================
     |  STATUS CONSTANTS
     ========================= */
    const STATUS_PENDING = 0;

    const STATUS_ACTIVE = 1;

    const STATUS_INACTIVE = 2;

    const STATUS_BLOCKED = 3;

    const STATUS_UNBLOCKED = 4;

    public static $statusLabels = [
        0 => 'pending',
        1 => 'active',
        2 => 'inactive',
        3 => 'blocked',
        4 => 'unblocked',
    ];

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
        'is_company_owner',
        'is_super_admin',
        'created_by_user',
        'address',
        'position_id',
        'country_code'
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

    protected $appends = ['p_image_url', 'signature_image_url', 'status_name'];

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
            'bod' => 'date:Y-m-d',
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
        return trim($this->first_name . ' ' . $this->last_name);
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
        if (!$this->p_image) {
            return '';
        }

        return asset('storage/' . $this->p_image);
    }

    public function getSignatureImageUrlAttribute()
    {
        if (!$this->signature_image) {
            return '';
        }

        return asset('storage/' . $this->signature_image);
    }
    public function position()
    {
        return $this->belongsTo(Position::class);
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

    public function hasPermission($permissionSlug, $action)
    {
        if (!$this->role) {
            return false;
        }

        if ($this->role->slug === 'company') {
            return true;
        }

        $permission = $this->role->permissions()
            ->where('slug', $permissionSlug)
            ->first();

        if (!$permission) {
            return false;
        }

        return $permission->pivot->$action ?? false;
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by_user');
    }

    public function createdUsers()
    {
        return $this->hasMany(User::class, 'created_by_user');
    }

    public function teams()
    {
        return $this->belongsToMany(Team::class, 'team_user');
    }

    public function getStatusNameAttribute()
    {
        return self::$statusLabels[$this->status] ?? 'unknown';
    }

    public function threadMemberships()
    {
        return $this->hasMany(ThreadMember::class, 'user_id');
    }

    public function sentMessages()
    {
        return $this->hasMany(Message::class, 'sender_id');
    }

    public function blockedUsers()
    {
        return $this->hasMany(UserBlock::class, 'blocker_id');
    }

    public function blockedByUsers()
    {
        return $this->hasMany(UserBlock::class, 'blocked_id');
    }
    public function getPhoneAttribute($value)
    {
        $phone = ltrim($value, '0');

        $countryCode = $this->country_code ?? '+971';

        // avoid duplicate (jo already +971 hoy)
        if (str_starts_with($phone, '+')) {
            return $phone;
        }

        return $countryCode . $phone;
    }
     public function getBodAttribute($value)
    {
        return $value ? \Carbon\Carbon::parse($value)->format('Y-m-d') : null;
    }
}
