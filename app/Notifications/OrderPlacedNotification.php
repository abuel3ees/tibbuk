<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class OrderPlacedNotification extends Notification
{
    use Queueable;

    public function __construct(public Order $order)
    {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'order_id'       => $this->order->id,
            'customer_name'  => $this->order->customer_name,
            'customer_phone' => $this->order->customer_phone,
            'total_amount'   => $this->order->total_amount,
            'message'        => "New order #{$this->order->id} from {$this->order->customer_name}",
        ];
    }
}
