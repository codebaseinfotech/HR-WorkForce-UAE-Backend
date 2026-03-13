<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
         Schema::table('tasks', function (Blueprint $table) {
            $table->enum('status', [
                'To-do',
                'In-progress',
                'In-review',
                'Pending',
                'Block',
                'Bugs',
                'Done',
            ])->default('To-do')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
          Schema::table('tasks', function (Blueprint $table) {
            $table->enum('status', [
                'active',
                'closed',
                'cancelled',
                'done'
            ])->default('active')->change();
        });
    }
};
