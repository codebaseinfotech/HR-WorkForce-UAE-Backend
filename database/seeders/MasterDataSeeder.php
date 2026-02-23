<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MasterDataSeeder extends Seeder
{
public function run(): void
    {
        /* =====================
         | ROLES
         ===================== */
        // DB::table('roles')->insert([
        //     [
        //         'name' => 'Manager',
        //         'status' => 1,
        //         'created_at' => now(),
        //         'updated_at' => now(),
        //     ],
        //     [
        //         'name' => 'Employee',
        //         'status' => 1,
        //         'created_at' => now(),
        //         'updated_at' => now(),
        //     ],
        //     [
        //         'name' => 'HR',
        //         'status' => 1,
        //         'created_at' => now(),
        //         'updated_at' => now(),
        //     ],
        // ]);

        /* =====================
         | COMPANIES
         ===================== */
        DB::table('companies')->insert([
            [
                'name' => 'ABC Technologies LLC',
                'status' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'HR Workforce UAE',
                'status' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        /* =====================
         | NATIONALITIES
         ===================== */
        DB::table('nationalities')->insert([
            [
                'name' => 'Indian',
                'status' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Emirati',
                'status' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Pakistani',
                'status' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Bangladeshi',
                'status' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
