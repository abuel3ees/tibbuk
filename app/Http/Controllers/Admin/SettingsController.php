<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class SettingsController extends Controller
{
    public function updateHeroImage(Request $request): RedirectResponse
    {
        $request->validate([
            'hero_image' => ['required', 'image', 'max:8192'],
        ]);

        $old = Setting::get('hero_image');
        if ($old && !str_starts_with($old, 'http')) {
            Storage::disk('public')->delete($old);
        }

        $path = $request->file('hero_image')->store('settings', 'public');
        Setting::set('hero_image', $path);

        return back()->with('success', 'Hero image updated.');
    }

    public function updateHeroContent(Request $request): RedirectResponse
    {
        $request->validate([
            'pill_en'  => ['nullable', 'string', 'max:120'],
            'pill_ar'  => ['nullable', 'string', 'max:120'],
            'title_en' => ['nullable', 'string', 'max:200'],
            'title_ar' => ['nullable', 'string', 'max:200'],
            'lede_en'  => ['nullable', 'string', 'max:400'],
            'lede_ar'  => ['nullable', 'string', 'max:400'],
        ]);

        foreach (['pill_en', 'pill_ar', 'title_en', 'title_ar', 'lede_en', 'lede_ar'] as $key) {
            Setting::set("hero_{$key}", $request->input($key) ?: null);
        }

        return back()->with('success', 'Hero content updated.');
    }

    public function removeHeroImage(): RedirectResponse
    {
        $old = Setting::get('hero_image');
        if ($old && !str_starts_with($old, 'http')) {
            Storage::disk('public')->delete($old);
        }
        Setting::set('hero_image', null);

        return back()->with('success', 'Hero image removed.');
    }
}
