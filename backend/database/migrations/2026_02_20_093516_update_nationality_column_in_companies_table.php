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
        Schema::table('companies', function (Blueprint $table) {

            // Rename column
            $table->renameColumn('nationality', 'nationality_id');
        });

        Schema::table('companies', function (Blueprint $table) {

            // Change type if needed (must be unsignedBigInteger)
            $table->unsignedBigInteger('nationality_id')->nullable()->change();

            // Add Foreign Key
            $table->foreign('nationality_id')
                ->references('id')
                ->on('nationalities')
                ->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('companies', function (Blueprint $table) {

            $table->dropForeign(['nationality_id']);
            $table->renameColumn('nationality_id', 'nationality');
        });
    }
};
