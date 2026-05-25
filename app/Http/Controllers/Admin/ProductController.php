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
            'csv_file' => ['required', 'file', 'mimes:csv,txt', 'max:10240'],
        ]);

        $file = $request->file('csv_file');
        $handle = fopen($file->getRealPath(), 'r');

        // Strip UTF-8 BOM if present
        $bom = fread($handle, 3);
        if ($bom !== "\xEF\xBB\xBF") {
            rewind($handle);
        }

        $rawHeaders = fgetcsv($handle) ?: [];
        $headers = array_map('trim', $rawHeaders);

        // Detect WooCommerce export vs simple format
        $isWoo = in_array('Product Name', $headers) && in_array('Product SKU', $headers);

        $nameCol  = $isWoo ? 'Product Name'  : 'name';
        $skuCol   = $isWoo ? 'Product SKU'   : 'sku';
        $priceCol = $isWoo ? 'Price'          : 'price';

        if (!in_array($nameCol, $headers) || !in_array($priceCol, $headers)) {
            fclose($handle);
            return back()->with('error', 'CSV is missing required columns (Product Name / Price).');
        }

        $created = 0;
        $updated = 0;
        $skipped = 0;

        while (($row = fgetcsv($handle)) !== false) {
            // Pad short rows so array_combine never crashes
            $row = array_pad(array_map('trim', $row), count($headers), '');
            $data = array_combine($headers, $row);

            $name = $data[$nameCol] ?? '';
            if (empty($name)) {
                $skipped++;
                continue;
            }

            // Price: WooCommerce may export ranges like "52.00-74.00" — take lower bound
            $rawPrice = $data[$priceCol] ?? '';
            $price = (float) strtok($rawPrice, '-');
            if ($price <= 0) {
                $skipped++;
                continue;
            }

            $sku = !empty($data[$skuCol]) ? $data[$skuCol] : null;
            $product = $sku ? Product::where('sku', $sku)->first() : null;

            if ($isWoo) {
                // Sale price: skip when empty or identical to price
                $rawSale = $data['Sale Price'] ?? '';
                $salePrice = strlen($rawSale) > 0 ? (float) $rawSale : null;
                if ($salePrice !== null && $salePrice >= $price) {
                    $salePrice = null;
                }

                // Description / excerpt: strip HTML tags
                $description = !empty($data['Description']) ? strip_tags(html_entity_decode($data['Description'], ENT_QUOTES | ENT_HTML5, 'UTF-8')) : null;
                $excerpt     = !empty($data['Excerpt'])     ? strip_tags(html_entity_decode($data['Excerpt'],     ENT_QUOTES | ENT_HTML5, 'UTF-8')) : null;

                // Category: take first segment before "|", strip sub-categories after ">", decode HTML entities
                $rawCategory = $data['Category'] ?? '';
                $category = null;
                if (!empty($rawCategory)) {
                    $firstSegment = explode('|', $rawCategory)[0];
                    $firstSegment = explode('>', $firstSegment)[0];
                    $category = html_entity_decode(trim($firstSegment), ENT_QUOTES | ENT_HTML5, 'UTF-8');
                    if (empty($category)) $category = null;
                }

                // Stock status
                $rawStock = strtolower($data['Stock Status'] ?? '');
                $stockStatus = str_contains($rawStock, 'in stock') ? 'in_stock' : 'out_of_stock';

                // Quantity
                $rawQty = $data['Quantity'] ?? '';
                $quantity = is_numeric($rawQty) ? (int) $rawQty : null;

                // Active flag
                $isActive = strtolower($data['Product Published'] ?? '') === 'publish';

                $payload = [
                    'name'           => $name,
                    'sku'            => $sku,
                    'description'    => $description,
                    'excerpt'        => $excerpt,
                    'price'          => $price,
                    'sale_price'     => $salePrice,
                    'category'       => $category,
                    'stock_status'   => $stockStatus,
                    'quantity'       => $quantity,
                    'is_active'      => $isActive,
                ];
            } else {
                $isActive = !isset($data['is_active']) || in_array(strtolower($data['is_active']), ['1', 'true', 'yes', '']);
                $rawStock = $data['stock_status'] ?? '';
                $stockStatus = in_array($rawStock, ['in_stock', 'out_of_stock']) ? $rawStock : 'in_stock';

                $payload = [
                    'name'           => $name,
                    'sku'            => $sku,
                    'description'    => $data['description'] ?? null,
                    'excerpt'        => $data['excerpt'] ?? null,
                    'price'          => $price,
                    'sale_price'     => isset($data['sale_price']) && is_numeric($data['sale_price']) ? (float) $data['sale_price'] : null,
                    'cost_price'     => isset($data['cost_price']) && is_numeric($data['cost_price']) ? (float) $data['cost_price'] : null,
                    'category'       => $data['category'] ?? null,
                    'stock_status'   => $stockStatus,
                    'quantity'       => isset($data['quantity']) && is_numeric($data['quantity']) ? (int) $data['quantity'] : null,
                    'featured_image' => $data['featured_image'] ?? null,
                    'is_active'      => $isActive,
                ];
            }

            if ($product) {
                $product->update($payload);
                $updated++;
            } else {
                $payload['slug'] = $this->uniqueSlug($name);
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
