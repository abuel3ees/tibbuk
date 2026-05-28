<?php

namespace App\Http\Controllers;

use App\Models\Discount;
use App\Models\Product;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;

class StoreController extends Controller
{
    public function index(): Response
    {
        $products = Product::where('is_active', true)
            ->orderBy('category')
            ->orderBy('name')
            ->get([
                'id', 'name', 'slug', 'price', 'sale_price', 'category',
                'stock_status', 'quantity', 'featured_image', 'excerpt', 'description', 'variants',
                'allows_engraving', 'engraving_price',
                'allows_stitching', 'stitching_price',
                'allows_sizes', 'available_sizes',
                'allows_gender',
                'allows_color', 'available_colors',
                'meta_title', 'meta_description',
            ]);

        $categories = $products->pluck('category')->unique()->filter()->values();

        $discount = Discount::valid()->with('products:id')->latest()->first();

        return Inertia::render('store/index', [
            'products'       => $products,
            'categories'     => $categories,
            'hero_images'    => Setting::heroImages(),
            'hero_content'   => Setting::heroContent(),
            'activeDiscount' => $discount ? $this->formatDiscount($discount) : null,
        ]);
    }

    public function activeDiscount(): JsonResponse
    {
        $discount = Discount::valid()->with('products:id')->latest()->first();

        if (!$discount) return response()->json(null);

        return response()->json($this->formatDiscount($discount));
    }

    private function formatDiscount(Discount $discount): array
    {
        return [
            'id'             => $discount->id,
            'name'           => $discount->name,
            'type'           => $discount->type,
            'value'          => (float) $discount->value,
            'applies_to'     => $discount->applies_to,
            'product_ids'    => $discount->products->pluck('id'),
            'categories'     => $discount->categories ?? [],
            'max_uses'       => $discount->max_uses,
            'uses_count'     => $discount->uses_count,
            'remaining_uses' => $discount->remainingUses(),
            'show_banner'    => $discount->show_banner,
            'banner_text'    => $discount->banner_text,
        ];
    }

    public function show(Product $product): Response
    {
        return Inertia::render('store/show', [
            'product' => $product,
        ]);
    }
}
