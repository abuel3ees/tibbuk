<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Discount;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DiscountController extends Controller
{
    public function index(): Response
    {
        $discounts = Discount::withCount('products')
            ->latest()
            ->get();

        return Inertia::render('admin/discounts/index', [
            'discounts' => $discounts,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/discounts/form', [
            'products'   => Product::orderBy('name')->get(['id', 'name', 'sku', 'featured_image']),
            'categories' => Product::distinct()->orderBy('category')->pluck('category')->filter()->values(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validate($request);

        $discount = Discount::create($validated);

        if ($validated['applies_to'] === 'products' && !empty($validated['product_ids'])) {
            $discount->products()->sync($validated['product_ids']);
        }

        return redirect()->route('admin.discounts.index')->with('success', 'Discount created.');
    }

    public function edit(Discount $discount): Response
    {
        return Inertia::render('admin/discounts/form', [
            'discount'    => $discount->load('products:id'),
            'products'    => Product::orderBy('name')->get(['id', 'name', 'sku', 'featured_image']),
            'categories'  => Product::distinct()->orderBy('category')->pluck('category')->filter()->values(),
            'selectedIds' => $discount->products->pluck('id'),
        ]);
    }

    public function update(Request $request, Discount $discount): RedirectResponse
    {
        $validated = $this->validate($request);

        $discount->update($validated);

        if ($validated['applies_to'] === 'products') {
            $discount->products()->sync($validated['product_ids'] ?? []);
            $discount->update(['categories' => null]);
        } elseif ($validated['applies_to'] === 'categories') {
            $discount->products()->detach();
        } else {
            $discount->products()->detach();
            $discount->update(['categories' => null]);
        }

        return redirect()->route('admin.discounts.index')->with('success', 'Discount updated.');
    }

    public function destroy(Discount $discount): RedirectResponse
    {
        $discount->products()->detach();
        $discount->delete();

        return back()->with('success', 'Discount deleted.');
    }

    public function toggle(Discount $discount): JsonResponse
    {
        $discount->update(['is_active' => !$discount->is_active]);

        return response()->json(['is_active' => $discount->is_active]);
    }

    private function validate(Request $request): array
    {
        return $request->validate([
            'name'        => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'type'        => ['required', 'in:percentage,fixed'],
            'value'       => ['required', 'numeric', 'min:0.01', 'max:100000'],
            'applies_to'    => ['required', 'in:all,products,categories'],
            'product_ids'   => ['nullable', 'array'],
            'product_ids.*' => ['integer', 'exists:products,id'],
            'categories'    => ['nullable', 'array'],
            'categories.*'  => ['string', 'max:255'],
            'max_uses'    => ['nullable', 'integer', 'min:1'],
            'starts_at'   => ['nullable', 'date'],
            'ends_at'     => ['nullable', 'date', 'after_or_equal:starts_at'],
            'is_active'   => ['boolean'],
            'show_banner' => ['boolean'],
            'banner_text' => ['nullable', 'string', 'max:255'],
        ]);
    }
}
