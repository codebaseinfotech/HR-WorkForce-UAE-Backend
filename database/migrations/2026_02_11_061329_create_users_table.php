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
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('employeeId')->nullable();
            $table->string('first_name')->nullable();
            $table->string('last_name')->nullable();
            $table->string('phone')->nullable();
            $table->string('email')->unique();
            $table->string('bod')->nullable();
            $table->string('gender')->nullable();

            $table->unsignedBigInteger('role_id')->nullable();
            $table->unsignedBigInteger('company_id')->nullable();
            $table->unsignedBigInteger('nationality_id')->nullable();

            $table->boolean('agree')->default(false);
            $table->boolean('remember_me')->default(false);
            $table->longText('p_image')->nullable();
            $table->longText('signature_image')->nullable();
            $table->tinyInteger('status')->default(0)->comment('0=pending,1=active,2=inactive,3=blocked,4=unblocked');

            $table->rememberToken();
            $table->string('password');
            $table->string('passd');
            $table->string('email_otp')->nullable();
            $table->timestamp('email_verified_at')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->foreign('nationality_id')
                ->references('id')
                ->on('nationalities')
                ->nullOnDelete();

            $table->foreign('company_id')
                ->references('id')
                ->on('companies')
                ->nullOnDelete();

            $table->foreign('role_id')
                ->references('id')
                ->on('roles')
                ->nullOnDelete();
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('sessions');
    }
};
