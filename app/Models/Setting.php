<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class Setting extends Model
{
    protected $primaryKey = 'key';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = ['key', 'value'];

    public static function get(string $key, mixed $default = null): mixed
    {
        return static::find($key)?->value ?? $default;
    }

    public static function set(string $key, mixed $value): void
    {
        static::updateOrCreate(['key' => $key], ['value' => $value]);
    }

    public static function heroImageUrl(): ?string
    {
        $path = static::get('hero_image');
        if (!$path) return null;
        if (str_starts_with($path, 'http')) return $path;
        return Storage::disk('spaces')->url($path);
    }

    public static function heroImages(): array
    {
        $raw = static::get('hero_images');
        $paths = $raw ? json_decode($raw, true) : [];
        if (empty($paths)) {
            // fall back to legacy single image
            $url = static::heroImageUrl();
            return $url ? [$url] : [];
        }
        return array_map(function (string $path) {
            if (str_starts_with($path, 'http')) return $path;
            return Storage::disk('spaces')->url($path);
        }, $paths);
    }

    public static function heroImagePaths(): array
    {
        $raw = static::get('hero_images');
        return $raw ? (json_decode($raw, true) ?? []) : [];
    }

    public static function heroContent(): array
    {
        return [
            'pill_en'  => static::get('hero_pill_en'),
            'pill_ar'  => static::get('hero_pill_ar'),
            'title_en' => static::get('hero_title_en'),
            'title_ar' => static::get('hero_title_ar'),
            'lede_en'  => static::get('hero_lede_en'),
            'lede_ar'  => static::get('hero_lede_ar'),
        ];
    }

    public static function categoryImagePaths(): array
    {
        $raw = static::get('category_images');
        return $raw ? (json_decode($raw, true) ?? []) : [];
    }

    public static function categoryImages(): array
    {
        $paths = static::categoryImagePaths();
        $result = [];
        foreach ($paths as $cat => $path) {
            if (str_starts_with($path, 'http')) {
                $result[$cat] = $path;
            } else {
                $result[$cat] = Storage::disk('spaces')->url($path);
            }
        }
        return $result;
    }
}
