<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderStatusLog extends Model
{
    public $timestamps = false;

    protected $fillable = ['order_id', 'from_status', 'to_status', 'note', 'created_at'];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
}
