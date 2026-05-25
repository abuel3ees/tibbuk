<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->boolean('allows_engraving')->default(false)->after('is_active');
        });

        Schema::table('order_items', function (Blueprint $table) {
            $table->string('engraving_text', 100)->nullable()->after('unit_price');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('allows_engraving');
        });
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropColumn('engraving_text');
        });
    }
};
