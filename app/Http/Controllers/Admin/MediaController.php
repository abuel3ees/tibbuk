<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Media;
use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\AllowedSort;
use Spatie\QueryBuilder\QueryBuilder;


class MediaController extends Controller
{
    public function index(Request $request): Response
    {
        $media = QueryBuilder::for(Media::orderByDesc('created_at'))
            ->allowedFilters(
                AllowedFilter::partial('search', 'filename'),
            )
            ->allowedSorts(
                AllowedSort::field('date', 'created_at'),
                AllowedSort::field('name', 'filename'),
                AllowedSort::field('size'),
            )
            ->paginate(48)
            ->withQueryString();

        $products = Product::orderBy('name')->get(['id', 'name', 'featured_image']);

        return Inertia::render('admin/media/index', [
            'media'    => $media,
            'products' => $products,
            'filters'  => $request->query('filter', []),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'images'   => ['required', 'array', 'min:1'],
            'images.*' => ['required', 'image', 'max:20480'],
        ]);

        foreach ($request->file('images', []) as $file) {
            $path = $file->store('media', 'spaces');
            Media::create([
                'path'     => $path,
                'filename' => $file->getClientOriginalName(),
                'size'     => $file->getSize(),
            ]);
        }

        return redirect()->route('admin.media.index')->with('success', 'Images uploaded.');
    }

    public function destroy(Media $medium): RedirectResponse
    {
        Storage::disk('spaces')->delete($medium->path);
        $medium->delete();

        return redirect()->route('admin.media.index')->with('success', 'Image deleted.');
    }

    public function sync(): RedirectResponse
    {
        $disk = Storage::disk('spaces');
        $existing = Media::pluck('path')->flip();
        $added = 0;

        foreach ($disk->allFiles() as $path) {
            $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
            if (!in_array($ext, ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif', 'svg'])) {
                continue;
            }
            if ($existing->has($path)) continue;

            $size = null;
            try { $size = $disk->size($path); } catch (\Throwable) {}

            Media::create(['path' => $path, 'filename' => basename($path), 'size' => $size]);
            $added++;
        }

        return redirect()->route('admin.media.index')
            ->with('success', "Sync complete — {$added} new image(s) imported from Spaces.");
    }

    public function assign(Request $request, Media $medium): RedirectResponse
    {
        $request->validate(['product_id' => ['required', 'exists:products,id']]);

        $product = Product::findOrFail($request->product_id);

        $old = $product->getRawOriginal('featured_image');
        if ($old && !str_starts_with($old, 'http')) {
            Storage::disk('spaces')->delete($old);
        }

        $product->update(['featured_image' => $medium->path]);

        return redirect()->route('admin.media.index')
            ->with('success', "Image assigned to \"{$product->name}\".");
    }
}
