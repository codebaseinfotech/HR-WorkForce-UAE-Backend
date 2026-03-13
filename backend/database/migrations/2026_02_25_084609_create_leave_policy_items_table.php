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
        Schema::create('leave_policy_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('leave_policy_id')->constrained('leave_policies')->onDelete('cascade');
            $table->foreignId('leave_type_id')->constrained('leave_types')->onDelete('cascade');

            $table->decimal('annual_quota', 6, 2)->default(0); // 12.00 etc
            $table->boolean('carry_forward')->default(false);
            $table->decimal('max_carry_forward', 6, 2)->default(0);
            $table->boolean('encashment')->default(false);
            $table->decimal('max_encashment', 6, 2)->default(0);

            $table->timestamps();

            $table->unique(['leave_policy_id', 'leave_type_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('leave_policy_items');
    }
};
