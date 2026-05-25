<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Setting;
use Inertia\Inertia;
use Inertia\Response;

class StoreController extends Controller
{
    public function index(): Response
    {
        $products = Product::where('is_active', true)
            ->orderBy('category')
            ->orderBy('name')
            ->get(['id', 'name', 'slug', 'price', 'sale_price', 'category', 'stock_status', 'featured_image', 'excerpt', 'variants', 'allows_engraving']);

        $categories = $products->pluck('category')->unique()->filter()->values();

        return Inertia::render('store/index', [
            'products'    => $products,
            'categories'  => $categories,
            'hero_image'   => Setting::heroImageUrl(),
            'hero_content' => Setting::heroContent(),
        ]);
    }

    public function show(Product $product): Response
    {
        return Inertia::render('store/show', [
            'product' => $product,
        ]);
    }
}
