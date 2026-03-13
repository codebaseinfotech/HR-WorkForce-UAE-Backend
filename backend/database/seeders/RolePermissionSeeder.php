<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;

class RolePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $superAdmin = Role::create([
            'name' => 'Company',
            'slug' => 'company',
            'status' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $permissions = [
            ['name' => 'Role Management', 'slug' => 'role.manage', 'menu' => 'Settings'],
            ['name' => 'Permission Management', 'slug' => 'permission.manage', 'menu' => 'Settings'],
            ['name' => 'Employee List', 'slug' => 'employee.list', 'menu' => 'Employee'],
            ['name' => 'Employee Create', 'slug' => 'employee.create', 'menu' => 'Employee'],
        ];

        foreach ($permissions as $perm) {
            $permission = Permission::create($perm);

            // Super Admin full access
            $superAdmin->permissions()->attach($permission->id, [
                'can_view' => true,
                'can_add' => true,
                'can_edit' => true,
                'can_delete' => true,
            ]);
        }
    }
}
