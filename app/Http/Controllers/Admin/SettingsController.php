<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class SettingsController extends Controller
{
    public function addHeroImages(Request $request): RedirectResponse
    {
        $request->validate([
            'images'   => ['required', 'array', 'min:1'],
            'images.*' => ['required', 'image', 'max:8192'],
        ]);

        $paths = Setting::heroImagePaths();

        foreach ($request->file('images') as $file) {
            $paths[] = $file->store('settings', 'spaces');
        }

        Setting::set('hero_images', json_encode(array_values($paths)));

        return back()->with('success', 'Hero image(s) added.');
    }

    public function removeHeroImage(Request $request): RedirectResponse
    {
        $request->validate(['index' => ['required', 'integer', 'min:0']]);

        $paths = Setting::heroImagePaths();
        $index = (int) $request->input('index');

        if (isset($paths[$index])) {
            $old = $paths[$index];
            if (!str_starts_with($old, 'http')) {
                Storage::disk('spaces')->delete($old);
            }
            array_splice($paths, $index, 1);
        }

        Setting::set('hero_images', json_encode(array_values($paths)));

        return back()->with('success', 'Image removed.');
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

    // Legacy single-image endpoints kept for backward compat
    public function updateHeroImage(Request $request): RedirectResponse
    {
        $request->validate(['hero_image' => ['required', 'image', 'max:8192']]);

        $paths   = Setting::heroImagePaths();
        $paths[] = $request->file('hero_image')->store('settings', 'spaces');
        Setting::set('hero_images', json_encode(array_values($paths)));

        return back()->with('success', 'Hero image added.');
    }

    public function setCategoryImage(Request $request): RedirectResponse
    {
        $request->validate([
            'category' => ['required', 'string', 'max:255'],
            'image'    => ['required', 'image', 'max:8192'],
        ]);

        $paths = Setting::categoryImagePaths();
        $cat   = $request->input('category');

        if (isset($paths[$cat]) && !str_starts_with($paths[$cat], 'http')) {
            Storage::disk('spaces')->delete($paths[$cat]);
        }

        $paths[$cat] = $request->file('image')->store('settings/cats', 'spaces');
        Setting::set('category_images', json_encode($paths));

        return back()->with('success', 'Category image updated.');
    }

    public function removeCategoryImage(Request $request): RedirectResponse
    {
        $request->validate(['category' => ['required', 'string', 'max:255']]);

        $paths = Setting::categoryImagePaths();
        $cat   = $request->input('category');

        if (isset($paths[$cat]) && !str_starts_with($paths[$cat], 'http')) {
            Storage::disk('spaces')->delete($paths[$cat]);
        }

        unset($paths[$cat]);
        Setting::set('category_images', json_encode($paths));

        return back()->with('success', 'Category image removed.');
    }
}
