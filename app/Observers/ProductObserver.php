<?php

namespace App\Observers;

use App\Mail\LowStockAlert;
use App\Models\Product;
use Illuminate\Support\Facades\Mail;

class ProductObserver
{
    public function updated(Product $product): void
    {
        if (!$product->isDirty('quantity') && !$product->isDirty('stock_status')) {
            return;
        }

        $qty = $product->quantity;
        $adminEmail = config('mail.admin_email', env('ADMIN_EMAIL', 'admin@medstore-jo.com'));

        if ($product->stock_status === 'out_of_stock' || $qty === 0) {
            try {
                Mail::to($adminEmail)->queue(new LowStockAlert($product, 'out'));
            } catch (\Throwable) {}
        } elseif ($qty !== null && $qty <= 5) {
            try {
                Mail::to($adminEmail)->queue(new LowStockAlert($product, 'low'));
            } catch (\Throwable) {}
        }
    }
}
