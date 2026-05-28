<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
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
            'order'    => $order->load('items.product', 'statusLogs'),
            'products' => Product::where('is_active', true)->orderBy('name')->get(['id', 'name', 'sku', 'price', 'sale_price', 'cost_price', 'variants', 'allows_engraving', 'engraving_price', 'allows_stitching', 'stitching_price', 'allows_sizes', 'available_sizes', 'allows_gender', 'allows_color', 'available_colors']),
        ]);
    }

    public function update(Request $request, Order $order): RedirectResponse
    {
        $validated = $request->validate([
            'customer_name'    => ['required', 'string', 'max:255'],
            'customer_phone'   => ['required', 'string', 'max:50'],
            'customer_email'   => ['nullable', 'email', 'max:255'],
            'customer_facebook'=> ['nullable', 'string', 'max:500'],
            'delivery_address' => ['required', 'string', 'max:500'],
            'notes'            => ['nullable', 'string', 'max:1000'],
            'items'                   => ['required', 'array', 'min:1'],
            'items.*.id'              => ['nullable', 'integer'],
            'items.*.product_id'      => ['nullable', 'integer', 'exists:products,id'],
            'items.*.product_name'    => ['required', 'string', 'max:255'],
            'items.*.quantity'        => ['required', 'integer', 'min:1'],
            'items.*.unit_price'      => ['required', 'numeric', 'min:0'],
            'items.*.engraving_text'  => ['nullable', 'string', 'max:100'],
            'items.*.stitching_text'  => ['nullable', 'string', 'max:100'],
            'items.*.selected_size'   => ['nullable', 'string', 'max:50'],
            'items.*.selected_gender' => ['nullable', 'string', 'max:10'],
            'items.*.selected_color'  => ['nullable', 'string', 'max:50'],
        ]);

        $order->update([
            'customer_name'     => $validated['customer_name'],
            'customer_phone'    => $validated['customer_phone'],
            'customer_email'    => $validated['customer_email'] ?? null,
            'customer_facebook' => $validated['customer_facebook'] ?? null,
            'delivery_address'  => $validated['delivery_address'],
            'notes'             => $validated['notes'] ?? null,
        ]);

        $incomingIds = collect($validated['items'])->pluck('id')->filter()->all();
        $order->items()->whereNotIn('id', $incomingIds)->delete();

        $total = 0;
        foreach ($validated['items'] as $itemData) {
            $fields = [
                'product_id'      => $itemData['product_id'] ?? null,
                'product_name'    => $itemData['product_name'],
                'quantity'        => (int) $itemData['quantity'],
                'unit_price'      => $itemData['unit_price'],
                'engraving_text'  => $itemData['engraving_text'] ?? null,
                'stitching_text'  => $itemData['stitching_text'] ?? null,
                'selected_size'   => $itemData['selected_size'] ?? null,
                'selected_gender' => $itemData['selected_gender'] ?? null,
                'selected_color'  => $itemData['selected_color'] ?? null,
            ];

            if (!empty($itemData['id'])) {
                $order->items()->where('id', $itemData['id'])->update($fields);
            } else {
                $product = !empty($itemData['product_id']) ? Product::find($itemData['product_id']) : null;
                $fields['cost_price'] = $product?->cost_price;
                $order->items()->create($fields);
            }

            $total += (float) $itemData['unit_price'] * (int) $itemData['quantity'];
        }

        $total += 3; // delivery fee

        $order->update(['total_amount' => round($total, 2)]);

        return back()->with('success', 'Order updated.');
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
        Order::withTrashed()->each(function (Order $order) {
            $order->items()->delete();
            $order->forceDelete();
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER SEQUENCE orders_id_seq RESTART WITH 1');
        } elseif (DB::getDriverName() === 'sqlite') {
            DB::statement("DELETE FROM sqlite_sequence WHERE name = 'orders'");
        }

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
