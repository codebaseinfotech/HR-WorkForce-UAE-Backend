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
        Schema::table('tasks', function (Blueprint $table) {

            // ✅ Add only if not exists
            if (! Schema::hasColumn('tasks', 'company_id')) {
                $table->unsignedBigInteger('company_id')->nullable()->after('id');
                $table->index('company_id');
            }

            if (! Schema::hasColumn('tasks', 'created_by')) {
                $table->unsignedBigInteger('created_by')->nullable()->after('company_id');
                $table->index('created_by');
            }
        });

        // ✅ Foreign keys alag thi add karo (avoid errors)
        Schema::table('tasks', function (Blueprint $table) {

            // company_id FK (only if column exists)
            if (Schema::hasColumn('tasks', 'company_id')) {
                // FK already na hoy to j add thase (manual safe approach)
                // NOTE: FK name fixed rakho to drop easy rahe
                $table->foreign('company_id', 'tasks_company_id_fk')
                    ->references('id')->on('companies')
                    ->onDelete('cascade');
            }

            if (Schema::hasColumn('tasks', 'created_by')) {
                $table->foreign('created_by', 'tasks_created_by_fk')
                    ->references('id')->on('users')
                    ->onDelete('cascade');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
         Schema::table('tasks', function (Blueprint $table) {
            // Drop FK first
            try { $table->dropForeign('tasks_company_id_fk'); } catch (\Throwable $e) {}
            try { $table->dropForeign('tasks_created_by_fk'); } catch (\Throwable $e) {}

            // Drop columns if exist
            if (Schema::hasColumn('tasks', 'created_by')) {
                $table->dropColumn('created_by');
            }
            // company_id already existed; usually you SHOULD NOT drop it.
            // If you really want:
            // if (Schema::hasColumn('tasks', 'company_id')) $table->dropColumn('company_id');
        });
    }
};
