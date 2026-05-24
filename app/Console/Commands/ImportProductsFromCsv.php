<?php

namespace App\Console\Commands;

use App\Models\Product;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

#[Signature('medstore:import-products {file? : Path to CSV file}')]
#[Description('Import products from a WooCommerce-exported CSV file into the products table')]
class ImportProductsFromCsv extends Command
{
    public function handle(): int
    {
        $filePath = $this->argument('file')
            ?? base_path('../../Downloads/export_product-2026_05_24-21_59_51-34003076.csv');

        if (! file_exists($filePath)) {
            $this->error("CSV file not found: {$filePath}");
            return self::FAILURE;
        }

        $handle = fopen($filePath, 'r');
        $headers = fgetcsv($handle);

        // Normalize headers
        $headers = array_map('trim', $headers);

        $imported = 0;
        $skipped = 0;

        while (($row = fgetcsv($handle)) !== false) {
            $data = array_combine($headers, $row);

            $name = trim($data['Product Name'] ?? $data['Post Title'] ?? '');
            if (empty($name)) {
                $skipped++;
                continue;
            }

            // Skip variable "parent" type if it has no meaningful price
            $price = (float) ($data['Price'] ?? 0);
            if ($price <= 0 && ($data['Type'] ?? '') === 'Variable') {
                // Try to use net price
                $price = (float) ($data['Net Price'] ?? 0);
            }
            if ($price <= 0) {
                $price = 0.01; // placeholder
            }

            $salePrice = (float) ($data['Sale Price'] ?? 0);
            $costPrice = (float) ($data['Net Price'] ?? 0);

            // Parse category — take the first segment
            $rawCategory = $data['Category'] ?? '';
            $category = explode('|', $rawCategory)[0];
            $category = trim(str_replace('&amp;', '&', $category));

            // Build a unique slug
            $slug = Str::slug($name);
            $sku = trim($data['Product SKU'] ?? '');
            if ($sku) {
                $slug = Str::slug($sku);
            }

            // Ensure slug uniqueness
            $originalSlug = $slug;
            $count = 1;
            while (Product::where('slug', $slug)->exists()) {
                $slug = $originalSlug . '-' . $count++;
            }

            $stockStatus = strtolower(str_replace(' ', '_', $data['Stock Status'] ?? 'In Stock')) === 'out_of_stock'
                ? 'out_of_stock'
                : 'in_stock';

            Product::create([
                'sku'           => $sku ?: null,
                'name'          => $name,
                'slug'          => $slug,
                'description'   => strip_tags($data['Description'] ?? ''),
                'excerpt'       => strip_tags($data['Excerpt'] ?? ''),
                'price'         => $price,
                'sale_price'    => $salePrice > 0 && $salePrice < $price ? $salePrice : null,
                'cost_price'    => $costPrice > 0 ? $costPrice : null,
                'category'      => $category ?: null,
                'stock_status'  => $stockStatus,
                'quantity'      => is_numeric($data['Quantity'] ?? '') ? (int) $data['Quantity'] : null,
                'featured_image' => null, // Images are WordPress attachment IDs; no URL available
                'is_active'     => true,
            ]);

            $imported++;
            $this->line("  ✓ {$name}");
        }

        fclose($handle);

        $this->info("Import complete: {$imported} products imported, {$skipped} skipped.");

        return self::SUCCESS;
    }
}
