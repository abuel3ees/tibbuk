<?php

use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\DiscountController as AdminDiscountController;
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
Route::get('/api/active-discount', [StoreController::class, 'activeDiscount'])->name('active-discount');
Route::get('/products/{product:slug}', [StoreController::class, 'show'])->name('store.product');

// Guest checkout & tracking
Route::post('/orders', [OrderController::class, 'store'])->name('order.store');
Route::get('/orders/{order}/confirmation', [OrderController::class, 'confirmation'])->name('order.confirmation');
Route::get('/track/{token}', [OrderController::class, 'track'])->name('order.track');

// Admin routes (auth protected)
Route::prefix('admin')->name('admin.')->middleware(['auth', 'verified'])->group(function () {
    Route::get('/', [DashboardController::class, 'index'])->name('dashboard');

    // Products CRUD
    Route::get('/products', [AdminProductController::class, 'index'])->name('products.index');
    Route::get('/products/create', [AdminProductController::class, 'create'])->name('products.create');
    Route::post('/products', [AdminProductController::class, 'store'])->name('products.store');
    Route::post('/products/import', [AdminProductController::class, 'import'])->name('products.import');
    Route::get('/products/export', [AdminProductController::class, 'exportCsv'])->name('products.export');
    Route::post('/products/bulk-visibility', [AdminProductController::class, 'bulkVisibility'])->name('products.bulk-visibility');
    Route::post('/products/bulk-image', [AdminProductController::class, 'bulkImage'])->name('products.bulk-image');
    Route::get('/products/{product}/edit', [AdminProductController::class, 'edit'])->name('products.edit');
    Route::put('/products/{product}', [AdminProductController::class, 'update'])->name('products.update');
    Route::delete('/products/{product}', [AdminProductController::class, 'destroy'])->name('products.destroy');
    Route::post('/products/{product}/duplicate', [AdminProductController::class, 'duplicate'])->name('products.duplicate');
    Route::patch('/products/{product}/stock', [AdminProductController::class, 'updateStock'])->name('products.stock');
    Route::patch('/products/{product}/restore', [AdminProductController::class, 'restore'])->name('products.restore');

    // Orders
    Route::get('/orders', [AdminOrderController::class, 'index'])->name('orders.index');
    Route::get('/orders/export', [AdminOrderController::class, 'export'])->name('orders.export');
    Route::post('/orders/bulk-status', [AdminOrderController::class, 'bulkStatus'])->name('orders.bulk-status');
    Route::delete('/orders/bulk', [AdminOrderController::class, 'bulkDelete'])->name('orders.bulk-delete');
    Route::get('/orders/{order}', [AdminOrderController::class, 'show'])->name('orders.show');
    Route::patch('/orders/{order}/status', [AdminOrderController::class, 'updateStatus'])->name('orders.status');
    Route::patch('/orders/{order}/notes', [AdminOrderController::class, 'updateAdminNotes'])->name('orders.notes');
    Route::patch('/orders/{order}/restore', [AdminOrderController::class, 'restore'])->name('orders.restore');
    Route::delete('/orders/{order}', [AdminOrderController::class, 'destroy'])->name('orders.destroy');

    // Financials
    Route::get('/financials', [AdminOrderController::class, 'financials'])->name('financials');

    // Site settings
    Route::post('/settings/hero-images', [SettingsController::class, 'addHeroImages'])->name('settings.hero-images.add');
    Route::delete('/settings/hero-images', [SettingsController::class, 'removeHeroImage'])->name('settings.hero-images.remove');
    Route::post('/settings/hero-content', [SettingsController::class, 'updateHeroContent'])->name('settings.hero-content');
    Route::post('/settings/category-images', [SettingsController::class, 'setCategoryImage'])->name('settings.category-images.set');
    Route::delete('/settings/category-images', [SettingsController::class, 'removeCategoryImage'])->name('settings.category-images.remove');
    // Legacy
    Route::post('/settings/hero-image', [SettingsController::class, 'updateHeroImage'])->name('settings.hero-image');

    // Media library
    Route::get('/media', [MediaController::class, 'index'])->name('media.index');
    Route::post('/media', [MediaController::class, 'store'])->name('media.store');
    Route::post('/media/sync', [MediaController::class, 'sync'])->name('media.sync');
    Route::delete('/media/{medium}', [MediaController::class, 'destroy'])->name('media.destroy');
    Route::post('/media/{medium}/assign', [MediaController::class, 'assign'])->name('media.assign');

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount'])->name('notifications.unread-count');
    Route::post('/notifications/read', [NotificationController::class, 'markRead'])->name('notifications.read');

    // Discounts
    Route::get('/discounts', [AdminDiscountController::class, 'index'])->name('discounts.index');
    Route::get('/discounts/create', [AdminDiscountController::class, 'create'])->name('discounts.create');
    Route::post('/discounts', [AdminDiscountController::class, 'store'])->name('discounts.store');
    Route::get('/discounts/{discount}/edit', [AdminDiscountController::class, 'edit'])->name('discounts.edit');
    Route::put('/discounts/{discount}', [AdminDiscountController::class, 'update'])->name('discounts.update');
    Route::delete('/discounts/{discount}', [AdminDiscountController::class, 'destroy'])->name('discounts.destroy');
    Route::patch('/discounts/{discount}/toggle', [AdminDiscountController::class, 'toggle'])->name('discounts.toggle');

    // Order sequence reset
    Route::post('/orders/reset-sequence', [AdminOrderController::class, 'resetSequence'])->name('orders.reset-sequence');
});

require __DIR__.'/settings.php';
