<?php

namespace App\Observers;

use App\Models\Order;
use App\Models\OrderStatusLog;

class OrderObserver
{
    public function created(Order $order): void
    {
        OrderStatusLog::create([
            'order_id'    => $order->id,
            'from_status' => null,
            'to_status'   => $order->status,
            'created_at'  => now(),
        ]);
    }

    public function updated(Order $order): void
    {
        if ($order->isDirty('status')) {
            OrderStatusLog::create([
                'order_id'    => $order->id,
                'from_status' => $order->getOriginal('status'),
                'to_status'   => $order->status,
                'created_at'  => now(),
            ]);
        }
    }
}
