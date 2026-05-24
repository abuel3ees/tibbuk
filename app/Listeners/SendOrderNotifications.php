<?php

namespace App\Listeners;

use App\Events\OrderPlaced;
use App\Mail\NewOrderAlert;
use App\Models\User;
use App\Notifications\OrderPlacedNotification;
use Illuminate\Support\Facades\Mail;

class SendOrderNotifications
{
    public function handle(OrderPlaced $event): void
    {
        $order = $event->order->load('items.product');

        // Notify all admin users via database notification
        $admins = User::where('role', 'admin')->get();
        foreach ($admins as $admin) {
            $admin->notify(new OrderPlacedNotification($order));
        }

        // Send email alert to admin
        $adminEmail = config('mail.admin_email', env('ADMIN_EMAIL', 'admin@medstore-jo.com'));
        Mail::to($adminEmail)->send(new NewOrderAlert($order));
    }
}
