<?php

namespace App\Http\Controllers;

use App\Events\OrderPlaced;
use App\Models\Discount;
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
            'customer_email'    => ['nullable', 'email', 'max:255'],
            'customer_facebook' => ['required', 'string', 'max:500'],
            'delivery_address'  => ['required', 'string', 'max:500'],
            'notes'            => ['nullable', 'string', 'max:1000'],
            'discount_id'      => ['nullable', 'integer', 'exists:discounts,id'],
            'items'                   => ['required', 'array', 'min:1'],
            'items.*.product_id'      => ['required', 'exists:products,id'],
            'items.*.quantity'        => ['required', 'integer', 'min:1'],
            'items.*.variant'         => ['nullable', 'string', 'max:100'],
            'items.*.engraving_text'  => ['nullable', 'string', 'max:100'],
            'items.*.stitching_text'  => ['nullable', 'string', 'max:100'],
            'items.*.selected_size'   => ['nullable', 'string', 'max:50'],
            'items.*.selected_gender' => ['nullable', 'string', 'max:10'],
            'items.*.selected_color'  => ['nullable', 'string', 'max:50'],
        ]);

        $total = 0;
        $orderItems = [];

        foreach ($validated['items'] as $item) {
            $product = Product::findOrFail($item['product_id']);

            // Resolve base price: prefer variant price if a matching variant exists
            $price = (float) ($product->sale_price ?? $product->price);
            if (!empty($item['variant']) && is_array($product->variants)) {
                foreach ($product->variants as $v) {
                    if (($v['value'] ?? null) === $item['variant'] && isset($v['price'])) {
                        $price = (float) $v['price'];
                        break;
                    }
                }
            }

            // Add engraving / stitching surcharges to unit price
            $engravingText = null;
            if ($product->allows_engraving && !empty($item['engraving_text'])) {
                $engravingText = trim($item['engraving_text']);
                if ($product->engraving_price) {
                    $price += (float) $product->engraving_price;
                }
            }

            $stitchingText = null;
            if ($product->allows_stitching && !empty($item['stitching_text'])) {
                $stitchingText = trim($item['stitching_text']);
                if ($product->stitching_price) {
                    $price += (float) $product->stitching_price;
                }
            }

            $total += $price * $item['quantity'];

            $orderItems[] = [
                'product_id'      => $product->id,
                'product_name'    => $product->name . (!empty($item['variant']) ? ' — ' . $item['variant'] : ''),
                'quantity'        => $item['quantity'],
                'unit_price'      => $price,
                'cost_price'      => $product->cost_price,
                'engraving_text'  => $engravingText,
                'stitching_text'  => $stitchingText,
                'selected_size'   => !empty($item['selected_size'])   ? $item['selected_size']   : null,
                'selected_gender' => !empty($item['selected_gender']) ? $item['selected_gender'] : null,
                'selected_color'  => !empty($item['selected_color'])  ? $item['selected_color']  : null,
            ];
        }

        // Apply discount if provided and still valid
        $discountAmount = 0;
        $discount = null;
        if (!empty($validated['discount_id'])) {
            $discount = Discount::find($validated['discount_id']);
            if ($discount && $discount->isValid()) {
                if ($discount->applies_to === 'categories' && !empty($discount->categories)) {
                    $applicableSubtotal = collect($orderItems)
                        ->filter(function ($item) use ($discount) {
                            $product = Product::find($item['product_id']);
                            return $product && in_array($product->category, $discount->categories);
                        })
                        ->sum(fn ($item) => $item['unit_price'] * $item['quantity']);
                    $discountAmount = $discount->calculateDiscount($applicableSubtotal);
                } else {
                    $discountAmount = $discount->calculateDiscount($total);
                }
                $total = max(0, $total - $discountAmount);
            }
        }

        $order = Order::create([
            'customer_name'    => $validated['customer_name'],
            'customer_phone'   => $validated['customer_phone'],
            'customer_email'    => $validated['customer_email'],
            'customer_facebook' => $validated['customer_facebook'],
            'delivery_address' => $validated['delivery_address'],
            'notes'            => $validated['notes'] ?? null,
            'total_amount'     => $total,
            'status'           => 'pending',
            'discount_id'      => $discount?->id,
            'discount_amount'  => $discountAmount,
        ]);

        $order->items()->createMany($orderItems);

        if ($discount) {
            $discount->increment('uses_count');
        }

        OrderPlaced::dispatch($order);

        return redirect()->route('order.confirmation', $order)
            ->with('success', 'Order placed successfully!');
    }

    public function confirmation(Order $order): Response
    {
        $order->load('items');

        return Inertia::render('store/confirmation', [
            'order' => $order,
        ]);
    }

    public function track(string $token): Response
    {
        $order = Order::where('tracking_token', $token)->with('items')->firstOrFail();

        return Inertia::render('store/track', [
            'order' => [
                'id'               => $order->id,
                'tracking_token'   => $order->tracking_token,
                'status'           => $order->status,
                'customer_name'    => $order->customer_name,
                'delivery_address' => $order->delivery_address,
                'total_amount'     => $order->total_amount,
                'created_at'       => $order->created_at->toISOString(),
                'items'            => $order->items->map(fn ($i) => [
                    'product_name' => $i->product_name,
                    'quantity'     => $i->quantity,
                    'unit_price'   => $i->unit_price,
                ]),
            ],
        ]);
    }
}
