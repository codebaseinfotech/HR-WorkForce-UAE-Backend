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
        Schema::table('message_deletions', function (Blueprint $table) {

            if (! Schema::hasColumn('message_deletions', 'message_id')) {
                $table->foreignId('message_id')->nullable()->after('id');
            }

            if (! Schema::hasColumn('message_deletions', 'user_id')) {
                $table->foreignId('user_id')->nullable()->after('message_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};
