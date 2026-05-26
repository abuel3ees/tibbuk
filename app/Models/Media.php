<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class Media extends Model
{
    protected $fillable = ['path', 'filename', 'size'];

    protected $appends = ['url'];

    public function getUrlAttribute(): string
    {
        return Storage::disk('spaces')->url($this->path);
    }
}
