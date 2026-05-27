<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->uuid('tracking_token')->nullable()->unique()->after('id');
            $table->text('admin_notes')->nullable()->after('notes');
        });

        // Backfill existing orders
        DB::table('orders')->whereNull('tracking_token')->get()->each(function ($order) {
            DB::table('orders')->where('id', $order->id)->update([
                'tracking_token' => Str::uuid()->toString(),
            ]);
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['tracking_token', 'admin_notes']);
        });
    }
};
