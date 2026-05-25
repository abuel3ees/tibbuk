<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->decimal('engraving_price', 10, 2)->nullable()->after('allows_engraving');
            $table->boolean('allows_stitching')->default(false)->after('engraving_price');
            $table->decimal('stitching_price', 10, 2)->nullable()->after('allows_stitching');
            $table->boolean('allows_sizes')->default(false)->after('stitching_price');
            $table->json('available_sizes')->nullable()->after('allows_sizes');
            $table->boolean('allows_gender')->default(false)->after('available_sizes');
            $table->boolean('allows_color')->default(false)->after('allows_gender');
            $table->json('available_colors')->nullable()->after('allows_color');
        });

        Schema::table('order_items', function (Blueprint $table) {
            $table->string('stitching_text', 100)->nullable()->after('engraving_text');
            $table->string('selected_size', 50)->nullable()->after('stitching_text');
            $table->string('selected_gender', 10)->nullable()->after('selected_size');
            $table->string('selected_color', 50)->nullable()->after('selected_gender');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn([
                'engraving_price', 'allows_stitching', 'stitching_price',
                'allows_sizes', 'available_sizes', 'allows_gender',
                'allows_color', 'available_colors',
            ]);
        });

        Schema::table('order_items', function (Blueprint $table) {
            $table->dropColumn(['stitching_text', 'selected_size', 'selected_gender', 'selected_color']);
        });
    }
};
