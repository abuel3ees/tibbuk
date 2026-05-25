<?php

namespace App\Jobs;

use App\Models\Product;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Storage;

class ProcessProductImages implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly int $productId,
        public readonly ?string $featuredImagePending,   // temp path or null
        public readonly array $variantsPending,          // [variantIndex => tempPath]
    ) {}

    public function handle(): void
    {
        $product = Product::find($this->productId);

        if (!$product) {
            $this->cleanup();
            return;
        }

        $updates = [];

        // Move featured image
        if ($this->featuredImagePending) {
            $temp = $this->featuredImagePending;
            if (Storage::disk('spaces')->exists($temp)) {
                $final = 'products/' . basename($temp);
                Storage::disk('spaces')->move($temp, $final);
                $updates['featured_image'] = $final;
            }
        }

        // Move variant images
        if (!empty($this->variantsPending)) {
            $raw = $product->getRawOriginal('variants');
            $variants = $raw ? json_decode($raw, true) : [];

            foreach ($this->variantsPending as $i => $temp) {
                if (!Storage::disk('spaces')->exists($temp)) continue;

                $final = 'products/variants/' . basename($temp);
                Storage::disk('spaces')->move($temp, $final);

                if (isset($variants[$i])) {
                    $variants[$i]['image'] = $final;
                }
            }

            $updates['variants'] = json_encode($variants);
        }

        if (!empty($updates)) {
            Product::where('id', $this->productId)->update($updates);
        }
    }

    private function cleanup(): void
    {
        if ($this->featuredImagePending) {
            Storage::disk('spaces')->delete($this->featuredImagePending);
        }
        foreach ($this->variantsPending as $path) {
            Storage::disk('spaces')->delete($path);
        }
    }
}
