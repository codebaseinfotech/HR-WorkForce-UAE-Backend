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
            $table->string('name_first')->nullable()->after('name');
            $table->string('name_last')->nullable()->after('name_first');

            $table->string('email')->nullable()->after('name_last');
            $table->string('phone')->nullable()->after('email');

            $table->string('ip')->nullable()->after('phone');

            $table->string('gender')->nullable()->after('ip');
            $table->string('nationality')->nullable()->after('gender');

            $table->string('address')->nullable()->after('nationality');
            $table->string('city')->nullable()->after('address');

            $table->decimal('latitude', 10, 7)->nullable()->after('city');
            $table->decimal('longitude', 10, 7)->nullable()->after('latitude');

            // 0.1 KM = 100 meter
            $table->decimal('radius', 5, 2)->default(100)->after('longitude');

            $table->string('logo')->nullable()->after('radius');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->dropColumn([
                'latitude',
                'longitude',
                'radius',
                'address',
            ]);
        });
    }
};