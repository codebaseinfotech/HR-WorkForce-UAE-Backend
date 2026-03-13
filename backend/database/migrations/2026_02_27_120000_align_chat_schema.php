<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $this->ensureUserBlocksTable();
        $this->alignThreadsTable();
        $this->alignMessagesTable();
        $this->alignMessageReadsTable();
        $this->alignMessageDeletionsTable();
    }

    public function down(): void
    {
        // Keep migration forward-only to avoid destructive schema rollbacks in production data.
    }

    private function ensureUserBlocksTable(): void
    {
        if (! Schema::hasTable('user_blocks')) {
            Schema::create('user_blocks', function (Blueprint $table) {
                $table->id();
                $table->foreignId('company_id')->constrained()->cascadeOnDelete();
                $table->foreignId('blocker_id')->constrained('users')->cascadeOnDelete();
                $table->foreignId('blocked_id')->constrained('users')->cascadeOnDelete();
                $table->timestamps();
                $table->unique(['company_id', 'blocker_id', 'blocked_id'], 'user_blocks_company_block_unique');
            });
        }

        if (Schema::hasTable('blocks')) {
            DB::statement('
                INSERT IGNORE INTO user_blocks (company_id, blocker_id, blocked_id, created_at, updated_at)
                SELECT company_id, blocker_id, blocked_id, created_at, updated_at
                FROM blocks
            ');
        }
    }

    private function alignThreadsTable(): void
    {
        Schema::table('threads', function (Blueprint $table) {
            if (! Schema::hasColumn('threads', 'last_message_id')) {
                $table->unsignedBigInteger('last_message_id')->nullable()->after('created_by');
            }

            if (! Schema::hasColumn('threads', 'last_message_at')) {
                $table->timestamp('last_message_at')->nullable()->after('last_message_id');
            }

            if (! Schema::hasColumn('threads', 'user_one_id')) {
                $table->unsignedBigInteger('user_one_id')->nullable()->after('last_message_at');
            }

            if (! Schema::hasColumn('threads', 'user_two_id')) {
                $table->unsignedBigInteger('user_two_id')->nullable()->after('user_one_id');
            }
        });

        // Backfill direct pair columns for existing direct threads.
        $directThreads = DB::table('threads')
            ->where('type', 'direct')
            ->where(function ($q) {
                $q->whereNull('user_one_id')->orWhereNull('user_two_id');
            })
            ->pluck('id');

        foreach ($directThreads as $threadId) {
            $members = DB::table('thread_members')
                ->where('thread_id', $threadId)
                ->orderBy('user_id')
                ->pluck('user_id')
                ->unique()
                ->values();

            if ($members->count() < 2) {
                continue;
            }

            DB::table('threads')
                ->where('id', $threadId)
                ->update([
                    'user_one_id' => (int) $members[0],
                    'user_two_id' => (int) $members[1],
                ]);
        }

        $this->deduplicateDirectThreads();

        // Add indexes / constraints with explicit names, swallow only if already exists.
        try {
            Schema::table('threads', function (Blueprint $table) {
                $table->index(['company_id', 'type'], 'threads_company_type_idx');
            });
        } catch (\Throwable $e) {
            // no-op
        }

        try {
            Schema::table('threads', function (Blueprint $table) {
                $table->unique(['company_id', 'user_one_id', 'user_two_id'], 'threads_direct_pair_unique');
            });
        } catch (\Throwable $e) {
            // no-op
        }

        try {
            Schema::table('threads', function (Blueprint $table) {
                $table->foreign('last_message_id', 'threads_last_message_fk')
                    ->references('id')
                    ->on('messages')
                    ->nullOnDelete();
            });
        } catch (\Throwable $e) {
            // no-op
        }

        try {
            Schema::table('threads', function (Blueprint $table) {
                $table->foreign('user_one_id', 'threads_user_one_fk')
                    ->references('id')
                    ->on('users')
                    ->nullOnDelete();
            });
        } catch (\Throwable $e) {
            // no-op
        }

        try {
            Schema::table('threads', function (Blueprint $table) {
                $table->foreign('user_two_id', 'threads_user_two_fk')
                    ->references('id')
                    ->on('users')
                    ->nullOnDelete();
            });
        } catch (\Throwable $e) {
            // no-op
        }
    }

    private function deduplicateDirectThreads(): void
    {
        $duplicatePairs = DB::table('threads')
            ->select('company_id', 'user_one_id', 'user_two_id', DB::raw('COUNT(*) as total'))
            ->where('type', 'direct')
            ->whereNotNull('user_one_id')
            ->whereNotNull('user_two_id')
            ->groupBy('company_id', 'user_one_id', 'user_two_id')
            ->having('total', '>', 1)
            ->get();

        foreach ($duplicatePairs as $pair) {
            $threadIds = DB::table('threads')
                ->where('type', 'direct')
                ->where('company_id', $pair->company_id)
                ->where('user_one_id', $pair->user_one_id)
                ->where('user_two_id', $pair->user_two_id)
                ->orderBy('id')
                ->pluck('id')
                ->values();

            $keepId = (int) $threadIds->first();
            $dropIds = $threadIds->slice(1)->values();

            foreach ($dropIds as $dropId) {
                DB::table('messages')
                    ->where('thread_id', $dropId)
                    ->update(['thread_id' => $keepId]);

                DB::table('thread_members')
                    ->where('thread_id', $dropId)
                    ->get()
                    ->each(function ($member) use ($keepId, $dropId) {
                        $exists = DB::table('thread_members')
                            ->where('thread_id', $keepId)
                            ->where('user_id', $member->user_id)
                            ->exists();

                        if ($exists) {
                            DB::table('thread_members')
                                ->where('id', $member->id)
                                ->delete();

                            return;
                        }

                        DB::table('thread_members')
                            ->where('id', $member->id)
                            ->update(['thread_id' => $keepId]);
                    });

                if (Schema::hasTable('thread_reads')) {
                    DB::table('thread_reads')
                        ->where('thread_id', $dropId)
                        ->get()
                        ->each(function ($read) use ($keepId) {
                            $existing = DB::table('thread_reads')
                                ->where('thread_id', $keepId)
                                ->where('user_id', $read->user_id)
                                ->first();

                            if ($existing) {
                                $existingTime = $existing->last_read_at ? strtotime((string) $existing->last_read_at) : 0;
                                $incomingTime = $read->last_read_at ? strtotime((string) $read->last_read_at) : 0;

                                if ($incomingTime > $existingTime) {
                                    DB::table('thread_reads')
                                        ->where('id', $existing->id)
                                        ->update(['last_read_at' => $read->last_read_at]);
                                }

                                DB::table('thread_reads')
                                    ->where('id', $read->id)
                                    ->delete();

                                return;
                            }

                            DB::table('thread_reads')
                                ->where('id', $read->id)
                                ->update(['thread_id' => $keepId]);
                        });
                }

                DB::table('threads')->where('id', $dropId)->delete();
            }
        }
    }

    private function alignMessagesTable(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            if (! Schema::hasColumn('messages', 'company_id')) {
                $table->unsignedBigInteger('company_id')->nullable()->after('thread_id');
            }

            if (! Schema::hasColumn('messages', 'type')) {
                $table->string('type', 20)->nullable()->after('sender_id');
            }

            if (! Schema::hasColumn('messages', 'attachment_path')) {
                $table->string('attachment_path')->nullable()->after('body');
            }

            if (! Schema::hasColumn('messages', 'attachment_meta')) {
                $table->json('attachment_meta')->nullable()->after('attachment_path');
            }

            if (! Schema::hasColumn('messages', 'deleted_for_all_at')) {
                $table->timestamp('deleted_for_all_at')->nullable()->after('attachment_meta');
            }
        });

        // Backfill company_id.
        DB::statement('
            UPDATE messages m
            JOIN threads t ON t.id = m.thread_id
            SET m.company_id = t.company_id
            WHERE m.company_id IS NULL
        ');

        // Backfill new type from old message_type if available.
        if (Schema::hasColumn('messages', 'message_type')) {
            DB::statement("
                UPDATE messages
                SET type = CASE
                    WHEN message_type = 'media' THEN 'image'
                    WHEN message_type = 'file' THEN 'file'
                    ELSE 'text'
                END
                WHERE type IS NULL OR type = ''
            ");
        } else {
            DB::statement("
                UPDATE messages
                SET type = 'text'
                WHERE type IS NULL OR type = ''
            ");
        }

        try {
            Schema::table('messages', function (Blueprint $table) {
                $table->index(['thread_id', 'created_at'], 'messages_thread_created_idx');
            });
        } catch (\Throwable $e) {
            // no-op
        }

        try {
            Schema::table('messages', function (Blueprint $table) {
                $table->foreign('company_id', 'messages_company_fk')
                    ->references('id')
                    ->on('companies')
                    ->cascadeOnDelete();
            });
        } catch (\Throwable $e) {
            // no-op
        }
    }

    private function alignMessageReadsTable(): void
    {
        Schema::table('message_reads', function (Blueprint $table) {
            if (! Schema::hasColumn('message_reads', 'thread_id')) {
                $table->unsignedBigInteger('thread_id')->nullable()->after('message_id');
            }

            if (! Schema::hasColumn('message_reads', 'seen_at')) {
                $table->timestamp('seen_at')->nullable()->after('user_id');
            }
        });

        if (Schema::hasColumn('message_reads', 'read_at')) {
            DB::statement('
                UPDATE message_reads
                SET seen_at = read_at
                WHERE seen_at IS NULL AND read_at IS NOT NULL
            ');
        }

        DB::statement('
            UPDATE message_reads mr
            JOIN messages m ON m.id = mr.message_id
            SET mr.thread_id = m.thread_id
            WHERE mr.thread_id IS NULL
        ');

        try {
            Schema::table('message_reads', function (Blueprint $table) {
                $table->foreign('thread_id', 'message_reads_thread_fk')
                    ->references('id')
                    ->on('threads')
                    ->cascadeOnDelete();
            });
        } catch (\Throwable $e) {
            // no-op
        }
    }

    private function alignMessageDeletionsTable(): void
    {
        Schema::table('message_deletions', function (Blueprint $table) {
            if (! Schema::hasColumn('message_deletions', 'message_id')) {
                $table->unsignedBigInteger('message_id')->nullable()->after('id');
            }

            if (! Schema::hasColumn('message_deletions', 'user_id')) {
                $table->unsignedBigInteger('user_id')->nullable()->after('message_id');
            }

            if (! Schema::hasColumn('message_deletions', 'deleted_at')) {
                $table->timestamp('deleted_at')->nullable()->after('user_id');
            }
        });

        try {
            Schema::table('message_deletions', function (Blueprint $table) {
                $table->unique(['message_id', 'user_id'], 'message_deletions_message_user_unique');
            });
        } catch (\Throwable $e) {
            // no-op
        }

        try {
            Schema::table('message_deletions', function (Blueprint $table) {
                $table->foreign('message_id', 'message_deletions_message_fk')
                    ->references('id')
                    ->on('messages')
                    ->cascadeOnDelete();
            });
        } catch (\Throwable $e) {
            // no-op
        }

        try {
            Schema::table('message_deletions', function (Blueprint $table) {
                $table->foreign('user_id', 'message_deletions_user_fk')
                    ->references('id')
                    ->on('users')
                    ->cascadeOnDelete();
            });
        } catch (\Throwable $e) {
            // no-op
        }
    }
};
