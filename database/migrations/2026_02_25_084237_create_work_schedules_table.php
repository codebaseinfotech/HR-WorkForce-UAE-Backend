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
        Schema::create('work_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->onDelete('cascade');
            $table->foreignId('role_id')->constrained('roles')->onDelete('cascade');

            $table->time('start_time');
            $table->time('end_time');
            $table->unsignedInteger('break_minutes')->default(0);

            // Example:
            // {"sun":"off","mon":"on","tue":"on","wed":"on","thu":"on","fri":"on","sat":"off"}
            // Or: {"sun":"off","sat":"alternate"} with extra rule below
            $table->json('weekly_rules');

            // optional: alternate saturday pattern, e.g. 2nd&4th off
            // {"sat_off_weeks":[2,4]}
            $table->json('monthly_rules')->nullable();

            $table->date('effective_from')->nullable();
            $table->date('effective_to')->nullable();

            $table->timestamps();

            $table->unique(['company_id', 'role_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('work_schedules');
    }
};
