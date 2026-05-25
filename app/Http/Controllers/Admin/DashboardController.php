<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Models\Setting;
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

        return Inertia::render('admin/dashboard', [
            'stats'        => $stats,
            'financials'   => $financials,
            'recentOrders' => $recentOrders,
            'hero_image'   => Setting::heroImageUrl(),
            'hero_content' => Setting::heroContent(),
        ]);
    }
}
