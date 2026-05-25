<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Product::orderBy('category')->orderBy('name');

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('sku', 'like', "%{$search}%")
                  ->orWhere('category', 'like', "%{$search}%");
            });
        }

        if ($category = $request->input('category')) {
            $query->where('category', $category);
        }

        if ($request->input('stock') === 'out') {
            $query->where('stock_status', 'out_of_stock');
        } elseif ($request->input('stock') === 'in') {
            $query->where('stock_status', 'in_stock');
        }

        $products = $query->paginate(25)->withQueryString();
        $categories = Product::distinct()->orderBy('category')->pluck('category')->filter()->values();

        return Inertia::render('admin/products/index', [
            'products'   => $products,
            'categories' => $categories,
            'filters'    => $request->only(['search', 'category', 'stock']),
        ]);
    }

    public function create(): Response
    {
        $categories = Product::distinct()->orderBy('category')->pluck('category')->filter()->values();
        return Inertia::render('admin/products/form', ['product' => null, 'categories' => $categories]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validateProduct($request);
        $validated['slug'] = $this->uniqueSlug($validated['name']);

        if ($request->hasFile('featured_image')) {
            $validated['featured_image'] = $request->file('featured_image')->store('products', 'public');
        }

        $validated['variants'] = $this->processVariantImages($request, $validated['variants'] ?? []);

        Product::create($validated);

        return redirect()->route('admin.products.index')
            ->with('success', 'Product created successfully.');
    }

    public function edit(Product $product): Response
    {
        $categories = Product::distinct()->orderBy('category')->pluck('category')->filter()->values();
        return Inertia::render('admin/products/form', ['product' => $product, 'categories' => $categories]);
    }

    public function update(Request $request, Product $product): RedirectResponse
    {
        $validated = $this->validateProduct($request, $product->id);

        if ($validated['name'] !== $product->name) {
            $validated['slug'] = $this->uniqueSlug($validated['name'], $product->id);
        }

        if ($request->hasFile('featured_image')) {
            $old = $product->getRawOriginal('featured_image');
            if ($old && !str_starts_with($old, 'http')) {
                Storage::disk('public')->delete($old);
            }
            $validated['featured_image'] = $request->file('featured_image')->store('products', 'public');
        } else {
            unset($validated['featured_image']);
        }

        $validated['variants'] = $this->processVariantImages(
            $request,
            $validated['variants'] ?? [],
            $product->getRawOriginal('variants') ? json_decode($product->getRawOriginal('variants'), true) : []
        );

        $product->update($validated);

        return redirect()->route('admin.products.index')
            ->with('success', 'Product updated successfully.');
    }

    public function destroy(Product $product): RedirectResponse
    {
        $raw = $product->getRawOriginal('featured_image');
        if ($raw && !str_starts_with($raw, 'http')) {
            Storage::disk('public')->delete($raw);
        }
        $product->delete();

        return redirect()->route('admin.products.index')
            ->with('success', 'Product deleted.');
    }

    public function import(Request $request): RedirectResponse
    {
        $request->validate([
            'csv_file' => ['required', 'file', 'mimes:csv,txt', 'max:5120'],
        ]);

        $file = $request->file('csv_file');
        $handle = fopen($file->getRealPath(), 'r');

        $headers = array_map('trim', fgetcsv($handle) ?: []);

        $required = ['name', 'price'];
        foreach ($required as $col) {
            if (!in_array($col, $headers)) {
                fclose($handle);
                return back()->with('error', "CSV is missing required column: {$col}");
            }
        }

        $created = 0;
        $updated = 0;
        $skipped = 0;

        while (($row = fgetcsv($handle)) !== false) {
            if (count($row) < count($headers)) {
                $skipped++;
                continue;
            }

            $data = array_combine($headers, array_map('trim', $row));

            if (empty($data['name']) || !is_numeric($data['price'] ?? '')) {
                $skipped++;
                continue;
            }

            $sku = !empty($data['sku']) ? $data['sku'] : null;
            $product = $sku ? Product::where('sku', $sku)->first() : null;

            $isActive = !isset($data['is_active']) || in_array(strtolower($data['is_active']), ['1', 'true', 'yes', '']);
            $stockStatus = in_array($data['stock_status'] ?? '', ['in_stock', 'out_of_stock'])
                ? $data['stock_status']
                : 'in_stock';

            $payload = [
                'name'           => $data['name'],
                'sku'            => $sku,
                'description'    => $data['description'] ?? null,
                'excerpt'        => $data['excerpt'] ?? null,
                'price'          => (float) $data['price'],
                'sale_price'     => isset($data['sale_price']) && is_numeric($data['sale_price']) ? (float) $data['sale_price'] : null,
                'cost_price'     => isset($data['cost_price']) && is_numeric($data['cost_price']) ? (float) $data['cost_price'] : null,
                'category'       => $data['category'] ?? null,
                'stock_status'   => $stockStatus,
                'quantity'       => isset($data['quantity']) && is_numeric($data['quantity']) ? (int) $data['quantity'] : null,
                'featured_image' => $data['featured_image'] ?? null,
                'is_active'      => $isActive,
            ];

            if ($product) {
                $product->update($payload);
                $updated++;
            } else {
                $payload['slug'] = $this->uniqueSlug($data['name']);
                Product::create($payload);
                $created++;
            }
        }

        fclose($handle);

        $msg = "Import complete — {$created} created, {$updated} updated";
        if ($skipped > 0) $msg .= ", {$skipped} skipped";

        return redirect()->route('admin.products.index')->with('success', $msg . '.');
    }

    private function validateProduct(Request $request, ?int $excludeId = null): array
    {
        return $request->validate([
            'name'          => ['required', 'string', 'max:255'],
            'sku'           => ['nullable', 'string', 'max:100'],
            'description'   => ['nullable', 'string'],
            'excerpt'       => ['nullable', 'string', 'max:500'],
            'price'         => ['required', 'numeric', 'min:0'],
            'sale_price'    => ['nullable', 'numeric', 'min:0'],
            'cost_price'    => ['nullable', 'numeric', 'min:0'],
            'category'      => ['nullable', 'string', 'max:255'],
            'stock_status'  => ['required', 'in:in_stock,out_of_stock'],
            'quantity'      => ['nullable', 'integer', 'min:0'],
            'featured_image' => ['nullable', 'image', 'max:4096'],
            'is_active'     => ['boolean'],
            'variants'               => ['nullable', 'array'],
            'variants.*.value'       => ['required_with:variants', 'string', 'max:100'],
            'variants.*.price'       => ['required_with:variants', 'numeric', 'min:0'],
            'variants.*.image'       => ['nullable', 'image', 'max:4096'],
            'variants.*.current_image' => ['nullable', 'string'],
        ]);
    }

    private function processVariantImages(Request $request, array $variants, array $existing = []): array
    {
        foreach ($variants as $i => &$variant) {
            if ($request->hasFile("variants.{$i}.image")) {
                // Delete old variant image if stored locally
                $oldImage = $existing[$i]['image'] ?? null;
                if ($oldImage && !str_starts_with($oldImage, 'http')) {
                    Storage::disk('public')->delete($oldImage);
                }
                $variant['image'] = $request->file("variants.{$i}.image")->store('products/variants', 'public');
            } else {
                // Keep the existing image or the current_image passed from the form
                $variant['image'] = $variant['current_image'] ?? ($existing[$i]['image'] ?? null);
            }
            unset($variant['current_image']);
        }
        unset($variant);
        return $variants;
    }

    private function uniqueSlug(string $name, ?int $excludeId = null): string
    {
        $slug = Str::slug($name);
        $original = $slug;
        $count = 1;

        while (
            Product::where('slug', $slug)
                ->when($excludeId, fn ($q) => $q->where('id', '!=', $excludeId))
                ->exists()
        ) {
            $slug = $original . '-' . $count++;
        }

        return $slug;
    }
}
