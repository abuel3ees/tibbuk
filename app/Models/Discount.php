<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Discount extends Model
{
    protected $fillable = [
        'name', 'description', 'type', 'value', 'applies_to', 'categories',
        'max_uses', 'uses_count', 'starts_at', 'ends_at',
        'is_active', 'show_banner', 'banner_text',
    ];

    protected $casts = [
        'value'      => 'decimal:2',
        'max_uses'   => 'integer',
        'uses_count' => 'integer',
        'is_active'  => 'boolean',
        'show_banner'=> 'boolean',
        'starts_at'  => 'datetime',
        'ends_at'    => 'datetime',
        'categories' => 'array',
    ];

    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class);
    }

    public function isValid(): bool
    {
        if (!$this->is_active) return false;
        if ($this->max_uses !== null && $this->uses_count >= $this->max_uses) return false;
        if ($this->starts_at && $this->starts_at->isFuture()) return false;
        if ($this->ends_at && $this->ends_at->isPast()) return false;
        return true;
    }

    public function remainingUses(): ?int
    {
        if ($this->max_uses === null) return null;
        return max(0, $this->max_uses - $this->uses_count);
    }

    public function calculateDiscount(float $subtotal): float
    {
        if ($this->type === 'percentage') {
            return round($subtotal * ($this->value / 100), 2);
        }
        return min((float) $this->value, $subtotal);
    }

    public function scopeValid($query)
    {
        return $query->where('is_active', true)
            ->where(fn ($q) => $q->whereNull('starts_at')->orWhere('starts_at', '<=', now()))
            ->where(fn ($q) => $q->whereNull('ends_at')->orWhere('ends_at', '>=', now()))
            ->where(fn ($q) => $q->whereNull('max_uses')->orWhereColumn('uses_count', '<', 'max_uses'));
    }
}
