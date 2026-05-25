<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::firstOrCreate(
            ['email' => 'admin@tibbuk.store'],
            [
                'name'     => 'Tibbuk Admin',
                'password' => Hash::make('Admin@2026!'),
                'role'     => 'admin',
                'email_verified_at' => now(),
            ]
        );
    }
}
