<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Order extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'customer_name', 'customer_phone', 'customer_email', 'customer_facebook',
        'delivery_address', 'status', 'notes', 'admin_notes', 'total_amount', 'tracking_token',
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $order) {
            $order->tracking_token ??= (string) Str::uuid();
        });
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function statusLogs(): HasMany
    {
        return $this->hasMany(\App\Models\OrderStatusLog::class)->orderBy('created_at');
    }
}
