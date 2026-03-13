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
        Schema::table('live_locations', function (Blueprint $table) {
            $table->unique(['company_id', 'user_id'], 'live_locations_company_user_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('live_locations', function (Blueprint $table) {
            $table->dropUnique('live_locations_company_user_unique');
        });
    }
};
