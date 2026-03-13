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
        Schema::table('users', function (Blueprint $table) {
            $table->date('bod')->nullable()->change();
            $table->unsignedInteger('login_count')->default(0)->after('remember_token');
            $table->string('last_login_ip')->nullable()->after('login_count');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['login_count', 'last_login_ip']);
            $table->string('bod')->nullable()->change();
        });
    }
};
