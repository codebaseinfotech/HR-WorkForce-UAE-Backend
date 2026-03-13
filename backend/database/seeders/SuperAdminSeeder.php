<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class SuperAdminSeeder extends Seeder
{
    public function run()
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement('SET FOREIGN_KEY_CHECKS=0;');
            User::truncate();
            Role::truncate();
            DB::statement('SET FOREIGN_KEY_CHECKS=1;');
        } elseif (DB::getDriverName() === 'pgsql') {
            DB::statement('TRUNCATE TABLE users, roles RESTART IDENTITY CASCADE');
        } else {
            User::query()->delete();
            Role::query()->delete();
        }

        /*
        |---------------------------------------
        | CREATE SUPER ADMIN ROLE
        |---------------------------------------
        */

        $superAdminRole = Role::create([
            'name' => 'Super Admin',
            'slug' => 'super_admin',
        ]);

        /*
        |---------------------------------------
        | CREATE SUPER ADMIN USER
        |---------------------------------------
        */

        User::create([
            'first_name' => 'Super',
            'last_name' => 'Admin',
            'email' => 'superadmin@gmail.com',
            'phone' => '9999999999',
            'password' => Hash::make('123456'),
            'passd' => '123456',
            'role_id' => $superAdminRole->id,
            'is_super_admin' => 1,
            'status' => User::STATUS_ACTIVE,
        ]);
    }
}
