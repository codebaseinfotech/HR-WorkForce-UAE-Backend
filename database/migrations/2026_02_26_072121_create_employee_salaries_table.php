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

        Schema::create('employee_salaries', function (Blueprint $table) {

            $table->id();

            // 🔹 Foreign Keys
            $table->unsignedBigInteger('company_id');
            $table->unsignedBigInteger('user_id');

            $table->enum('salary_type', ['monthly', 'daily', 'hourly'])
                ->default('monthly');

            $table->decimal('monthly_salary', 10, 2)->nullable();
            $table->decimal('daily_salary', 10, 2)->nullable();
            $table->decimal('hourly_salary', 10, 2)->nullable();

            $table->decimal('overtime_rate_per_hour', 10, 2)
                ->default(0);

            $table->date('effective_from')->nullable();
            $table->date('effective_to')->nullable();

            $table->timestamps();

            // 🔹 Unique constraint
            $table->unique(['company_id', 'user_id', 'effective_from'], 'emp_salary_unique');

            // 🔹 Index (performance)
            $table->index(['company_id', 'user_id']);

            // 🔹 Foreign Key Constraints
            $table->foreign('company_id')
                ->references('id')
                ->on('companies')
                ->onDelete('cascade');

            $table->foreign('user_id')
                ->references('id')
                ->on('users')
                ->onDelete('cascade');
        });

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employee_salaries');
    }
};