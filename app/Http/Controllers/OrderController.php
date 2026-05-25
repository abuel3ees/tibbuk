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
            'customer_email'    => ['required', 'email', 'max:255'],
            'customer_facebook' => ['required', 'string', 'max:500'],
            'delivery_address'  => ['required', 'string', 'max:500'],
            'notes'            => ['nullable', 'string', 'max:1000'],
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

        $order = Order::create([
            'customer_name'    => $validated['customer_name'],
            'customer_phone'   => $validated['customer_phone'],
            'customer_email'    => $validated['customer_email'],
            'customer_facebook' => $validated['customer_facebook'],
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
