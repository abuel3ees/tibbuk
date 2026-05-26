<?php

namespace App\Listeners;

use App\Events\OrderPlaced;
use App\Mail\NewOrderAlert;
use App\Models\User;
use App\Notifications\OrderPlacedNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Mail;

class SendOrderNotifications implements ShouldQueue
{
    public function handle(OrderPlaced $event): void
    {
        $order = $event->order->load('items.product');

        // Notify all admin users via database notification
        $admins = User::where('role', 'admin')->get();
        foreach ($admins as $admin) {
            $admin->notify(new OrderPlacedNotification($order));
        }

        // Send email alert to admin — wrapped so a missing/invalid API key doesn't crash the order
        try {
            $adminEmail = config('mail.admin_email', env('ADMIN_EMAIL', 'admin@medstore-jo.com'));
            Mail::to($adminEmail)->queue(new NewOrderAlert($order));
        } catch (\Throwable) {
            // Mail is best-effort; order is already saved
        }
    }
}
