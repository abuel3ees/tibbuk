<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Jobs\ProcessProductImages;
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
            $lower = mb_strtolower($search);
            $query->where(function ($q) use ($lower) {
                $q->whereRaw('LOWER(name) LIKE ?', ["%{$lower}%"])
                  ->orWhereRaw('LOWER(sku) LIKE ?', ["%{$lower}%"])
                  ->orWhereRaw('LOWER(category) LIKE ?', ["%{$lower}%"]);
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

        $featuredPending = null;
        if ($request->hasFile('featured_image')) {
            $featuredPending = $request->file('featured_image')->store('pending-uploads', 'local');
            $validated['featured_image'] = null; // job will set the final path
        }

        $variants = $validated['variants'] ?? [];
        [$variants, $variantsPending] = $this->storeVariantImagesPending($request, $variants);
        $validated['variants'] = $variants;

        $product = Product::create($validated);

        if ($featuredPending !== null || !empty($variantsPending)) {
            ProcessProductImages::dispatch($product->id, $featuredPending, $variantsPending);
        }

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

        $featuredPending = null;
        $oldFeatured = null;
        if ($request->hasFile('featured_image')) {
            $raw = $product->getRawOriginal('featured_image');
            if ($raw && !str_starts_with($raw, 'http')) {
                $oldFeatured = $raw; // job will delete it after uploading the new one
            }
            $featuredPending = $request->file('featured_image')->store('pending-uploads', 'local');
            $validated['featured_image'] = null; // job will set the final path
        } else {
            unset($validated['featured_image']);
        }

        $variants = $validated['variants'] ?? [];
        $rawVariants = $product->getRawOriginal('variants');
        $existing = $rawVariants ? (json_decode($rawVariants, true) ?? []) : [];

        // Collect old variant images for the job to clean up after replacing
        $oldVariantImages = [];
        foreach (array_keys($variants) as $i) {
            if ($request->hasFile("variants.{$i}.image")) {
                $oldImage = isset($existing[$i]) ? ($existing[$i]['image'] ?? null) : null;
                if ($oldImage && !str_starts_with($oldImage, 'http')) {
                    $oldVariantImages[$i] = $oldImage;
                }
            }
        }

        [$variants, $variantsPending] = $this->storeVariantImagesPending($request, $variants, $existing);
        $validated['variants'] = $variants;

        $product->update($validated);

        if ($featuredPending !== null || !empty($variantsPending)) {
            ProcessProductImages::dispatch($product->id, $featuredPending, $variantsPending, $oldFeatured, $oldVariantImages);
        }

        return redirect()->route('admin.products.index')
            ->with('success', 'Product updated successfully.');
    }

    public function destroy(Product $product): RedirectResponse
    {
        $raw = $product->getRawOriginal('featured_image');
        if ($raw && !str_starts_with($raw, 'http')) {
            Storage::disk('spaces')->delete($raw);
        }
        $product->delete();

        return redirect()->route('admin.products.index')
            ->with('success', 'Product deleted.');
    }

    public function bulkVisibility(Request $request): RedirectResponse
    {
        $request->validate(['active' => ['required', 'boolean']]);
        $active = (bool) $request->input('active');
        Product::query()->update(['is_active' => $active]);
        $label = $active ? 'active' : 'hidden';
        return redirect()->route('admin.products.index')
            ->with('success', "All products set to {$label}.");
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
            'featured_image'   => ['nullable', 'image', 'max:20480'],
            'is_active'        => ['boolean'],
            'allows_engraving' => ['boolean'],
            'engraving_price'  => ['nullable', 'numeric', 'min:0'],
            'allows_stitching' => ['boolean'],
            'stitching_price'  => ['nullable', 'numeric', 'min:0'],
            'allows_sizes'     => ['boolean'],
            'available_sizes'  => ['nullable', 'array'],
            'available_sizes.*' => ['string', 'max:50'],
            'allows_gender'    => ['boolean'],
            'allows_color'     => ['boolean'],
            'available_colors'  => ['nullable', 'array'],
            'available_colors.*' => ['string', 'max:50'],
            'variants'               => ['nullable', 'array'],
            'variants.*.value'       => ['required_with:variants', 'string', 'max:100'],
            'variants.*.price'       => ['required_with:variants', 'numeric', 'min:0'],
            'variants.*.image'       => ['nullable', 'image', 'max:20480'],
            'variants.*.current_image' => ['nullable', 'string'],
        ]);
    }

    private function storeVariantImagesPending(Request $request, array $variants, array $existing = []): array
    {
        $pending = [];
        foreach ($variants as $i => &$variant) {
            if ($request->hasFile("variants.{$i}.image")) {
                // Save to local disk — fast, no network roundtrip. Job uploads to Spaces.
                $local = $request->file("variants.{$i}.image")->store('pending-uploads', 'local');
                $variant['image'] = null; // job will fill this in
                $pending[$i] = $local;
            } else {
                $existingImage = isset($existing[$i]) ? ($existing[$i]['image'] ?? null) : null;
                $raw = $variant['current_image'] ?? $existingImage;
                $variant['image'] = $raw ? $this->toRawPath($raw) : null;
            }
            unset($variant['current_image']);
        }
        unset($variant);
        return [$variants, $pending];
    }

    private function toRawPath(?string $path): ?string
    {
        if (!$path) return null;
        if (str_starts_with($path, '/storage/')) {
            return ltrim(substr($path, strlen('/storage/')), '/');
        }
        // Strip full Spaces/CDN URL — keep only the relative object key
        if (str_starts_with($path, 'http')) {
            $parsed = parse_url($path, PHP_URL_PATH);
            return $parsed ? ltrim($parsed, '/') : $path;
        }
        return $path;
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
