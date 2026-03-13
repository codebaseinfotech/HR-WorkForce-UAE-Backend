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

            // If message_id missing, add it
            if (!Schema::hasColumn('message_deletions', 'message_id')) {
                $table->foreignId('message_id')
                      ->after('id')
                      ->constrained('messages')
                      ->cascadeOnDelete();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('message_deletions', function (Blueprint $table) {
            if (Schema::hasColumn('message_deletions', 'message_id')) {
                $table->dropForeign(['message_id']);
                $table->dropColumn('message_id');
            }
        });
    }
};