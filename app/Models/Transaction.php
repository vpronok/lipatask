<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

// Tell Laravel which columns are safe to insert data into
#[Fillable([
    'user_id', 
    'amount', 
    'type', 
    'wallet', 
    'status', 
    'description'
])]
class Transaction extends Model
{
    /**
     * Get the user that owns the transaction.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}