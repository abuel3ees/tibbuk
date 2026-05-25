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
