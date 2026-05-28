<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Rap2hpoutre\FastExcel\FastExcel;
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
            'order' => $order->load('items.product', 'statusLogs'),
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

    public function updateAdminNotes(Request $request, Order $order): RedirectResponse
    {
        $validated = $request->validate([
            'admin_notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $order->update(['admin_notes' => $validated['admin_notes'] ?? null]);

        return back()->with('success', 'Notes saved.');
    }

    public function bulkStatus(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'ids'    => ['required', 'array', 'min:1'],
            'ids.*'  => ['integer', 'exists:orders,id'],
            'status' => ['required', 'in:pending,processing,delivered,cancelled'],
        ]);

        Order::whereIn('id', $validated['ids'])->update(['status' => $validated['status']]);

        return back()->with('success', count($validated['ids']) . ' orders updated to ' . $validated['status'] . '.');
    }

    public function destroy(Order $order): RedirectResponse
    {
        $order->delete();
        return redirect()->route('admin.orders.index')->with('success', 'Order deleted.');
    }

    public function bulkDelete(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'ids'   => ['required', 'array'],
            'ids.*' => ['integer', 'exists:orders,id'],
        ]);

        Order::whereIn('id', $validated['ids'])->delete();

        return back()->with('success', count($validated['ids']) . ' orders deleted.');
    }

    public function restore(Order $order): RedirectResponse
    {
        $order->restore();
        return redirect()->route('admin.orders.index')->with('success', 'Order restored.');
    }

    public function export(Request $request)
    {
        $query = QueryBuilder::for(Order::with('items')->latest())
            ->allowedFilters(
                AllowedFilter::callback('search', function ($query, $value) {
                    $lower = mb_strtolower($value);
                    $query->where(function ($q) use ($lower) {
                        $q->whereRaw('LOWER(customer_name) LIKE ?', ["%{$lower}%"])
                          ->orWhereRaw('LOWER(customer_phone) LIKE ?', ["%{$lower}%"]);
                    });
                }),
                AllowedFilter::exact('status'),
            );

        $orders = $query->get();

        $rows = collect();
        foreach ($orders as $order) {
            $itemSummary = $order->items->map(fn ($i) =>
                "{$i->product_name} x{$i->quantity} (JD " . number_format($i->unit_price, 2) . ")"
            )->implode(' | ');

            $rows->push([
                'Order #'          => str_pad($order->id, 5, '0', STR_PAD_LEFT),
                'Date'             => $order->created_at->format('Y-m-d H:i'),
                'Customer'         => $order->customer_name,
                'Phone'            => $order->customer_phone,
                'Email'            => $order->customer_email ?? '',
                'Facebook'         => $order->customer_facebook ?? '',
                'Address'          => $order->delivery_address,
                'Notes'            => $order->notes ?? '',
                'Status'           => ucfirst($order->status),
                'Total (JD)'       => number_format($order->total_amount, 2),
                'Items'            => $itemSummary,
            ]);
        }

        $filename = 'orders-' . now()->format('Y-m-d') . '.xlsx';
        return (new FastExcel($rows))->download($filename);
    }

    public function resetSequence(): JsonResponse
    {
        $count = Order::withTrashed()->count();
        if ($count > 0) {
            return response()->json(['error' => "Cannot reset: {$count} order(s) exist. Delete all orders first."], 422);
        }

        DB::statement('ALTER SEQUENCE orders_id_seq RESTART WITH 1');

        return response()->json(['ok' => true]);
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
