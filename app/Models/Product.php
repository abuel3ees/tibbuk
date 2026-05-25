<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

class Product extends Model
{
    protected $fillable = [
        'sku', 'name', 'slug', 'description', 'excerpt',
        'price', 'sale_price', 'cost_price', 'category',
        'stock_status', 'quantity', 'featured_image', 'is_active', 'variants',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'sale_price' => 'decimal:2',
        'cost_price' => 'decimal:2',
        'is_active' => 'boolean',
        'variants' => 'array',
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
        if (str_starts_with($value, 'http')) return $value;
        return Storage::url($value);
    }
}
