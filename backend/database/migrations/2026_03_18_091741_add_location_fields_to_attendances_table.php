<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            $table->decimal('check_in_latitude', 10, 7)->nullable();
            $table->decimal('check_in_longitude', 10, 7)->nullable();
            $table->string('check_in_address')->nullable();

            $table->decimal('check_out_latitude', 10, 7)->nullable();
            $table->decimal('check_out_longitude', 10, 7)->nullable();
            $table->string('check_out_address')->nullable();

            $table->decimal('break_in_latitude', 10, 7)->nullable();
            $table->decimal('break_in_longitude', 10, 7)->nullable();
            $table->string('break_in_address')->nullable();

            $table->decimal('break_out_latitude', 10, 7)->nullable();
            $table->decimal('break_out_longitude', 10, 7)->nullable();
            $table->string('break_out_address')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            //
        });
    }
};
