<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

// 1. UPDATE THE FILLABLE ATTRIBUTE HERE:
#[Fillable([
    'name', 
    'username', 
    'email', 
    'phone',
    'password', 
    'role', 
    'referral_code', 
    'referred_by', 
    'is_active'
])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean', // Tells Laravel to treat this as true/false
        ];
    }

    // 2. ADD THE AUTO-GENERATOR:
    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($user) {
            // Auto-generate an 8-character code (e.g. A7B9F1X2) when they sign up
            $user->referral_code = strtoupper(substr(str_shuffle('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'), 0, 8));
        });
    }

    // 3. ADD THE RELATIONSHIPS:
    public function transactions() 
    { 
        return $this->hasMany(Transaction::class); 
    }

    public function referrals() 
    { 
        return $this->hasMany(User::class, 'referred_by'); 
    }
    public function referrer()
    {
        return $this->belongsTo(User::class, 'referred_by');
    }
}
