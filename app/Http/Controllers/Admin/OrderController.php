<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\AllowedSort;
use Spatie\QueryBuilder\QueryBuilder;

class OrderController extends Controller
{
    public function index(Request $request): Response
    {
        $orders = QueryBuilder::for(Order::with('items.product')->latest())
            ->allowedFilters(
                AllowedFilter::callback('search', function ($query, $value) {
                    $lower = mb_strtolower($value);
                    $query->where(function ($q) use ($lower) {
                        $q->whereRaw('LOWER(customer_name) LIKE ?', ["%{$lower}%"])
                          ->orWhereRaw('LOWER(customer_phone) LIKE ?', ["%{$lower}%"]);
                    });
                }),
                AllowedFilter::exact('status'),
            )
            ->allowedSorts(
                AllowedSort::field('date', 'created_at'),
                AllowedSort::field('total', 'total_amount'),
            )
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('admin/orders/index', [
            'orders'  => $orders,
            'filters' => $request->query('filter', []),
        ]);
    }

    public function show(Order $order): Response
    {
        return Inertia::render('admin/orders/show', [
            'order' => $order->load('items.product'),
        ]);
    }

    public function updateStatus(Request $request, Order $order): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'in:pending,processing,delivered,cancelled'],
        ]);

        $order->update(['status' => $validated['status']]);

        return back()->with('success', 'Order status updated.');
    }

    public function destroy(Order $order): RedirectResponse
    {
        $order->items()->delete();
        $order->delete();

        return redirect()->route('admin.orders.index')->with('success', 'Order deleted.');
    }

    public function financials(): Response
    {
        $deliveredOrders = Order::with('items')
            ->where('status', 'delivered')
            ->latest()
            ->get();

        $totalRevenue = 0;
        $totalCost = 0;

        foreach ($deliveredOrders as $order) {
            foreach ($order->items as $item) {
                $totalRevenue += $item->unit_price * $item->quantity;
                $totalCost += ($item->cost_price ?? 0) * $item->quantity;
            }
        }

        return Inertia::render('admin/financials', [
            'financials' => [
                'total_revenue'   => round($totalRevenue, 2),
                'total_cost'      => round($totalCost, 2),
                'net_profit'      => round($totalRevenue - $totalCost, 2),
                'delivered_count' => $deliveredOrders->count(),
            ],
            'orders' => $deliveredOrders,
        ]);
    }
}
