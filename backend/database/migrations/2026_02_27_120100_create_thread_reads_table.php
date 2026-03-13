<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('thread_reads')) {
            return;
        }

        Schema::create('thread_reads', function (Blueprint $table) {
            $table->id();
            $table->foreignId('thread_id')->constrained('threads')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->timestamp('last_read_at')->nullable();
            $table->timestamps();

            $table->unique(['thread_id', 'user_id'], 'thread_reads_thread_user_unique');
            $table->index(['user_id', 'last_read_at'], 'thread_reads_user_last_read_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('thread_reads');
    }
};
