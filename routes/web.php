<?php

use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\SettingsController;
use App\Http\Controllers\Admin\NotificationController;
use App\Http\Controllers\Admin\OrderController as AdminOrderController;
use App\Http\Controllers\Admin\MediaController;
use App\Http\Controllers\Admin\ProductController as AdminProductController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\StoreController;
use Illuminate\Support\Facades\Route;

// Public storefront
Route::get('/', [StoreController::class, 'index'])->name('store.index');
Route::get('/products/{product:slug}', [StoreController::class, 'show'])->name('store.product');

// Guest checkout
Route::post('/orders', [OrderController::class, 'store'])->name('order.store');
Route::get('/orders/{order}/confirmation', [OrderController::class, 'confirmation'])->name('order.confirmation');

// Admin routes (auth protected)
Route::prefix('admin')->name('admin.')->middleware(['auth', 'verified'])->group(function () {
    Route::get('/', [DashboardController::class, 'index'])->name('dashboard');

    // Products CRUD
    Route::get('/products', [AdminProductController::class, 'index'])->name('products.index');
    Route::get('/products/create', [AdminProductController::class, 'create'])->name('products.create');
    Route::post('/products', [AdminProductController::class, 'store'])->name('products.store');
    Route::post('/products/import', [AdminProductController::class, 'import'])->name('products.import');
    Route::get('/products/{product}/edit', [AdminProductController::class, 'edit'])->name('products.edit');
    Route::put('/products/{product}', [AdminProductController::class, 'update'])->name('products.update');
    Route::delete('/products/{product}', [AdminProductController::class, 'destroy'])->name('products.destroy');
    Route::post('/products/bulk-visibility', [AdminProductController::class, 'bulkVisibility'])->name('products.bulk-visibility');
    Route::post('/products/bulk-image', [AdminProductController::class, 'bulkImage'])->name('products.bulk-image');

    // Orders
    Route::get('/orders', [AdminOrderController::class, 'index'])->name('orders.index');
    Route::get('/orders/{order}', [AdminOrderController::class, 'show'])->name('orders.show');
    Route::patch('/orders/{order}/status', [AdminOrderController::class, 'updateStatus'])->name('orders.status');
    Route::delete('/orders/{order}', [AdminOrderController::class, 'destroy'])->name('orders.destroy');

    // Financials
    Route::get('/financials', [AdminOrderController::class, 'financials'])->name('financials');

    // Site settings
    Route::post('/settings/hero-image', [SettingsController::class, 'updateHeroImage'])->name('settings.hero-image');
    Route::delete('/settings/hero-image', [SettingsController::class, 'removeHeroImage'])->name('settings.hero-image.remove');
    Route::post('/settings/hero-content', [SettingsController::class, 'updateHeroContent'])->name('settings.hero-content');

    // Media library
    Route::get('/media', [MediaController::class, 'index'])->name('media.index');
    Route::post('/media', [MediaController::class, 'store'])->name('media.store');
    Route::post('/media/sync', [MediaController::class, 'sync'])->name('media.sync');
    Route::delete('/media/{medium}', [MediaController::class, 'destroy'])->name('media.destroy');
    Route::post('/media/{medium}/assign', [MediaController::class, 'assign'])->name('media.assign');

    // Notifications
    Route::post('/notifications/read', [NotificationController::class, 'markRead'])->name('notifications.read');
});

require __DIR__.'/settings.php';
