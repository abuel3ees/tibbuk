<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'pgsql') {
            DB::statement("ALTER TABLE discounts DROP CONSTRAINT IF EXISTS discounts_applies_to_check");
            DB::statement("ALTER TABLE discounts ADD CONSTRAINT discounts_applies_to_check CHECK (applies_to IN ('all', 'products', 'categories'))");
        }

        if (!Schema::hasColumn('discounts', 'categories')) {
            Schema::table('discounts', function (Blueprint $table) {
                $table->json('categories')->nullable()->after('applies_to');
            });
        }
    }

    public function down(): void
    {
        Schema::table('discounts', function (Blueprint $table) {
            $table->dropColumn('categories');
        });

        $driver = DB::getDriverName();

        if ($driver === 'pgsql') {
            DB::statement("ALTER TABLE discounts DROP CONSTRAINT IF EXISTS discounts_applies_to_check");
            DB::statement("ALTER TABLE discounts ADD CONSTRAINT discounts_applies_to_check CHECK (applies_to IN ('all', 'products'))");
        }
    }
};
