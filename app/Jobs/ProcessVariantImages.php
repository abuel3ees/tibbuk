<?php

namespace App\Jobs;

use App\Models\Product;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Storage;

class ProcessVariantImages implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly int $productId,
        public readonly array $pendingPaths, // [variantIndex => tempPath]
    ) {}

    public function handle(): void
    {
        $product = Product::find($this->productId);

        if (!$product) {
            foreach ($this->pendingPaths as $path) {
                Storage::disk('spaces')->delete($path);
            }
            return;
        }

        $raw = $product->getRawOriginal('variants');
        $variants = $raw ? json_decode($raw, true) : [];

        foreach ($this->pendingPaths as $i => $tempPath) {
            if (!Storage::disk('spaces')->exists($tempPath)) continue;

            $finalPath = 'products/variants/' . basename($tempPath);
            Storage::disk('spaces')->move($tempPath, $finalPath);

            if (isset($variants[$i])) {
                $variants[$i]['image'] = $finalPath;
            }
        }

        Product::where('id', $this->productId)->update(['variants' => json_encode($variants)]);
    }
}
