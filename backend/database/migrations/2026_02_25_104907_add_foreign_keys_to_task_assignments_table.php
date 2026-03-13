<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('task_assignments', function (Blueprint $table) {
            // Make sure columns are unsignedBigInteger (match parent id type)
            $table->unsignedBigInteger('company_id')->nullable()->change();
            $table->unsignedBigInteger('task_id')->nullable()->change();
            $table->unsignedBigInteger('user_id')->nullable()->change();
            $table->unsignedBigInteger('assigned_by')->nullable()->change();
        });
    }

    public function down(): void
    {
        // no-op (optional)
    }
};