<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Setting;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $stats = [
            'total_products' => Product::where('is_active', true)->count(),
            'total_orders'   => Order::count(),
            'pending_orders' => Order::where('status', 'pending')->count(),
            'delivered_orders' => Order::where('status', 'delivered')->count(),
        ];

        $deliveredOrders = Order::with('items')
            ->where('status', 'delivered')
            ->get();

        $totalRevenue = 0;
        $totalCost = 0;
        foreach ($deliveredOrders as $order) {
            foreach ($order->items as $item) {
                $totalRevenue += $item->unit_price * $item->quantity;
                $totalCost += ($item->cost_price ?? 0) * $item->quantity;
            }
        }

        $financials = [
            'total_revenue' => round($totalRevenue, 2),
            'total_cost'    => round($totalCost, 2),
            'net_profit'    => round($totalRevenue - $totalCost, 2),
        ];

        $recentOrders = Order::with('items')
            ->latest()
            ->limit(5)
            ->get();

        // Analytics: orders per day (last 14 days)
        $ordersPerDay = Order::select(
                DB::raw("DATE(created_at) as date"),
                DB::raw('COUNT(*) as count')
            )
            ->where('created_at', '>=', now()->subDays(13)->startOfDay())
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->keyBy('date');

        $ordersPerDayFilled = collect();
        for ($i = 13; $i >= 0; $i--) {
            $date = now()->subDays($i)->format('Y-m-d');
            $ordersPerDayFilled->push([
                'date'  => $date,
                'label' => now()->subDays($i)->format('M d'),
                'count' => $ordersPerDay->has($date) ? (int) $ordersPerDay[$date]->count : 0,
            ]);
        }

        // Top 5 products by revenue
        $topProducts = OrderItem::join('orders', 'order_items.order_id', '=', 'orders.id')
            ->where('orders.status', 'delivered')
            ->select('order_items.product_name', DB::raw('SUM(order_items.unit_price * order_items.quantity) as revenue'), DB::raw('SUM(order_items.quantity) as units'))
            ->groupBy('order_items.product_name')
            ->orderByDesc('revenue')
            ->limit(5)
            ->get()
            ->map(fn ($r) => ['name' => $r->product_name, 'revenue' => round((float) $r->revenue, 2), 'units' => (int) $r->units]);

        // Revenue by category
        $revenueByCategory = OrderItem::join('orders', 'order_items.order_id', '=', 'orders.id')
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->where('orders.status', 'delivered')
            ->select('products.category', DB::raw('SUM(order_items.unit_price * order_items.quantity) as revenue'))
            ->groupBy('products.category')
            ->orderByDesc('revenue')
            ->get()
            ->map(fn ($r) => ['category' => $r->category ?? 'Uncategorized', 'revenue' => round((float) $r->revenue, 2)]);

        // Low stock products (quantity > 0 and <= 5, or out of stock)
        $lowStockProducts = Product::where('is_active', true)
            ->where(fn ($q) => $q->where('stock_status', 'out_of_stock')->orWhere(fn ($q2) => $q2->where('quantity', '<=', 5)->where('quantity', '>', 0)))
            ->orderBy('quantity')
            ->limit(10)
            ->get(['id', 'name', 'quantity', 'stock_status']);

        $repeatCustomers = Order::select('customer_phone', DB::raw('COUNT(*) as cnt'))
            ->groupBy('customer_phone')
            ->having('cnt', '>', 1)
            ->count();
        $totalCustomers = Order::distinct('customer_phone')->count('customer_phone');

        return Inertia::render('admin/dashboard', [
            'stats'              => $stats,
            'financials'         => $financials,
            'recentOrders'       => $recentOrders,
            'hero_images'        => Setting::heroImages(),
            'hero_content'       => Setting::heroContent(),
            'orders_per_day'     => $ordersPerDayFilled,
            'top_products'       => $topProducts,
            'revenue_by_category'=> $revenueByCategory,
            'low_stock'          => $lowStockProducts,
            'customer_stats'     => [
                'total'  => $totalCustomers,
                'repeat' => $repeatCustomers,
                'rate'   => $totalCustomers > 0 ? round($repeatCustomers / $totalCustomers * 100) : 0,
            ],
        ]);
    }
}
