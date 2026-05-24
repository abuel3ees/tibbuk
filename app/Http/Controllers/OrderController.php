<?php

namespace App\Http\Controllers;

use App\Events\OrderPlaced;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'customer_name'    => ['required', 'string', 'max:255'],
            'customer_phone'   => ['required', 'string', 'regex:/^(\+?962|0)7[789]\d{7}$/'],
            'customer_email'   => ['nullable', 'email', 'max:255'],
            'delivery_address' => ['required', 'string', 'max:500'],
            'notes'            => ['nullable', 'string', 'max:1000'],
            'items'            => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'exists:products,id'],
            'items.*.quantity'   => ['required', 'integer', 'min:1'],
        ]);

        $total = 0;
        $orderItems = [];

        foreach ($validated['items'] as $item) {
            $product = Product::findOrFail($item['product_id']);
            $price = $product->sale_price ?? $product->price;
            $subtotal = $price * $item['quantity'];
            $total += $subtotal;

            $orderItems[] = [
                'product_id'   => $product->id,
                'product_name' => $product->name,
                'quantity'     => $item['quantity'],
                'unit_price'   => $price,
                'cost_price'   => $product->cost_price,
            ];
        }

        $order = Order::create([
            'customer_name'    => $validated['customer_name'],
            'customer_phone'   => $validated['customer_phone'],
            'customer_email'   => $validated['customer_email'] ?? null,
            'delivery_address' => $validated['delivery_address'],
            'notes'            => $validated['notes'] ?? null,
            'total_amount'     => $total,
            'status'           => 'pending',
        ]);

        $order->items()->createMany($orderItems);

        OrderPlaced::dispatch($order);

        return redirect()->route('order.confirmation', $order)
            ->with('success', 'Order placed successfully!');
    }

    public function confirmation(Order $order): Response
    {
        return Inertia::render('store/confirmation', [
            'order' => $order->load('items'),
        ]);
    }
}
