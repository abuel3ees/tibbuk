<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Inertia\Inertia;
use Inertia\Response;

class StoreController extends Controller
{
    public function index(): Response
    {
        $products = Product::where('is_active', true)
            ->orderBy('category')
            ->orderBy('name')
            ->get(['id', 'name', 'slug', 'price', 'sale_price', 'category', 'stock_status', 'featured_image', 'excerpt']);

        $categories = $products->pluck('category')->unique()->filter()->values();

        return Inertia::render('store/index', [
            'products'   => $products,
            'categories' => $categories,
        ]);
    }

    public function show(Product $product): Response
    {
        return Inertia::render('store/show', [
            'product' => $product,
        ]);
    }
}
