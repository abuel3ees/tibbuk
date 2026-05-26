<?php

namespace App\Console\Commands;

use App\Models\Media;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class SyncMediaFromSpaces extends Command
{
    protected $signature = 'media:sync {--fresh : Truncate the media table before syncing}';
    protected $description = 'Sync all images from DigitalOcean Spaces into the media table';

    public function handle(): int
    {
        $disk = Storage::disk('spaces');

        if ($this->option('fresh')) {
            Media::truncate();
            $this->line('Media table cleared.');
        }

        $existing = Media::pluck('path')->flip();
        $added = 0;
        $skipped = 0;

        $files = $disk->allFiles();

        $bar = $this->output->createProgressBar(count($files));
        $bar->start();

        foreach ($files as $path) {
            $bar->advance();

            $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
            if (!in_array($ext, ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif', 'svg'])) {
                $skipped++;
                continue;
            }

            if ($existing->has($path)) {
                $skipped++;
                continue;
            }

            $size = null;
            try { $size = $disk->size($path); } catch (\Throwable) {}

            Media::create([
                'path'     => $path,
                'filename' => basename($path),
                'size'     => $size,
            ]);
            $added++;
        }

        $bar->finish();
        $this->newLine();
        $this->info("Done — {$added} added, {$skipped} skipped.");

        return self::SUCCESS;
    }
}
