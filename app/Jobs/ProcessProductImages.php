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
        public readonly ?string $featuredImageLocal,   // local pending-uploads path or null
        public readonly array $variantsLocal,          // [variantIndex => local pending-uploads path]
        public readonly ?string $oldFeaturedImage = null,      // Spaces path to delete after upload
        public readonly array $oldVariantImages = [],          // [variantIndex => Spaces path to delete]
    ) {}

    public function handle(): void
    {
        $product = Product::find($this->productId);

        if (!$product) {
            $this->cleanupLocal();
            return;
        }

        $updates = [];
        $local = Storage::disk('local');
        $spaces = Storage::disk('spaces');

        // Upload featured image
        if ($this->featuredImageLocal && $local->exists($this->featuredImageLocal)) {
            $final = 'products/' . basename($this->featuredImageLocal);
            $spaces->put($final, $local->get($this->featuredImageLocal));
            $local->delete($this->featuredImageLocal);

            if ($this->oldFeaturedImage) {
                $spaces->delete($this->oldFeaturedImage);
            }

            $updates['featured_image'] = $final;
        }

        // Upload variant images
        if (!empty($this->variantsLocal)) {
            $raw = $product->getRawOriginal('variants');
            $variants = $raw ? json_decode($raw, true) : [];

            foreach ($this->variantsLocal as $i => $localPath) {
                if (!$local->exists($localPath)) continue;

                $final = 'products/variants/' . basename($localPath);
                $spaces->put($final, $local->get($localPath));
                $local->delete($localPath);

                if (isset($this->oldVariantImages[$i])) {
                    $spaces->delete($this->oldVariantImages[$i]);
                }

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

    private function cleanupLocal(): void
    {
        $local = Storage::disk('local');
        if ($this->featuredImageLocal) {
            $local->delete($this->featuredImageLocal);
        }
        foreach ($this->variantsLocal as $path) {
            $local->delete($path);
        }
    }
}
