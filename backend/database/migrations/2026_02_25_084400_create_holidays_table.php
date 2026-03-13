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
        Schema::create('holidays', function (Blueprint $table) {
            $table->id();
            $table->foreignId('holiday_calendar_id')->constrained('holiday_calendars')->onDelete('cascade');

            $table->date('date');
            $table->string('title'); // e.g. Diwali, Holi
            $table->enum('type', ['festival', 'public', 'company'])->default('festival');
            $table->boolean('is_optional')->default(false); // optional holiday?
            $table->timestamps();

            $table->unique(['holiday_calendar_id', 'date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('holidays');
    }
};
