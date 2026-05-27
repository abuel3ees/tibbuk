<?php

namespace App\Console\Commands;

use App\Mail\WeeklyDigest;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

class SendWeeklyDigest extends Command
{
    protected $signature = 'digest:weekly';
    protected $description = 'Send weekly digest email to admin';

    public function handle(): void
    {
        $since = now()->subDays(7);

        $totalOrders = Order::where('created_at', '>=', $since)->count();

        $revenue = Order::where('created_at', '>=', $since)
            ->where('status', 'delivered')
            ->sum('total_amount');

        $newCustomers = Order::where('created_at', '>=', $since)
            ->distinct('customer_phone')
            ->count('customer_phone');

        $lowStock = Product::where('is_active', true)
            ->where(fn ($q) => $q->where('stock_status', 'out_of_stock')
                ->orWhere(fn ($q2) => $q2->where('quantity', '<=', 5)->where('quantity', '>', 0)))
            ->count();

        $topProduct = OrderItem::join('orders', 'order_items.order_id', '=', 'orders.id')
            ->where('orders.created_at', '>=', $since)
            ->select('order_items.product_name', DB::raw('SUM(order_items.quantity) as sold'))
            ->groupBy('order_items.product_name')
            ->orderByDesc('sold')
            ->first();

        $adminEmail = config('mail.admin_email', env('ADMIN_EMAIL', 'admin@medstore-jo.com'));

        Mail::to($adminEmail)->send(new WeeklyDigest(
            total_orders_week: $totalOrders,
            revenue_week: (float) $revenue,
            new_customers_week: $newCustomers,
            low_stock_count: $lowStock,
            top_product_name: $topProduct?->product_name ?? '',
        ));

        $this->info('Weekly digest sent to ' . $adminEmail);
    }
}
