<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

class Product extends Model
{
    protected $fillable = [
        'sku', 'name', 'slug', 'description', 'excerpt',
        'price', 'sale_price', 'cost_price', 'category',
        'stock_status', 'quantity', 'featured_image', 'is_active', 'variants', 'allows_engraving',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'sale_price' => 'decimal:2',
        'cost_price' => 'decimal:2',
        'is_active' => 'boolean',
        'allows_engraving' => 'boolean',
    ];

    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function getEffectivePriceAttribute(): string
    {
        return $this->sale_price ?? $this->price;
    }

    public function getFeaturedImageAttribute(?string $value): ?string
    {
        if (!$value) return null;
        if ($this->isAlreadyUrl($value)) return $value;
        return Storage::disk('spaces')->url($value);
    }

    protected function variants(): Attribute
    {
        return Attribute::make(
            get: function ($value) {
                if (!$value) return null;
                $arr = is_string($value) ? json_decode($value, true) : (is_array($value) ? $value : null);
                if (!$arr) return null;
                return array_map(function ($v) {
                    if (!empty($v['image']) && !$this->isAlreadyUrl($v['image'])) {
                        $v['image'] = Storage::disk('spaces')->url($v['image']);
                    }
                    return $v;
                }, $arr);
            },
            set: fn ($value) => is_array($value) ? json_encode($value) : $value,
        );
    }

    private function isAlreadyUrl(string $value): bool
    {
        return str_starts_with($value, 'http');
    }
}
