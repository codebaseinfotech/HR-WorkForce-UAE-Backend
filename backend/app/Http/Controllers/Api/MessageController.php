<?php

namespace App\Http\Controllers\Api;

use App\Events\Chat\MessageDeleted;
use App\Events\Chat\MessageSent;
use App\Events\Chat\ThreadReadUpdated;
use App\Http\Controllers\Controller;
use App\Http\Requests\Chat\DeleteMessageRequest;
use App\Http\Requests\Chat\SendMessageRequest;
use App\Http\Resources\Chat\MessageResource;
use App\Models\Message;
use App\Models\MessageDeletion;
use App\Models\MessageRead;
use App\Models\Thread;
use App\Models\ThreadMember;
use App\Models\ThreadRead;
use App\Models\UserBlock;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MessageController extends Controller
{
    public function list(Request $request, Thread $thread): JsonResponse
    {
        $me = $request->user();
        $this->authorize('view', $thread);

        $perPage = max(1, min((int) $request->integer('per_page', 30), 100));

        $messages = Message::query()
            ->where('thread_id', $thread->id)
            ->whereDoesntHave('deletions', function (Builder $q) use ($me) {
                $q->where('user_id', $me->id)->whereNotNull('deleted_at');
            })
            ->with('sender:id,first_name,last_name,avatar_path,p_image')
            ->orderByDesc('id')
            ->paginate($perPage);

        return response()->json([
            'status' => true,
            'data' => MessageResource::collection($messages->getCollection())->resolve(),
            'meta' => [
                'current_page' => $messages->currentPage(),
                'last_page' => $messages->lastPage(),
                'per_page' => $messages->perPage(),
                'total' => $messages->total(),
            ],
        ]);
    }

    public function send(SendMessageRequest $request, Thread $thread): JsonResponse
    {
        $me = $request->user();
        $this->authorize('view', $thread);
        $this->ensureThreadNotBlocked($thread, (int) $me->id);

        $type = $request->validated('type');
        $attachment = $request->attachmentFile();
        $message = null;
        $payload = null;

        DB::transaction(function () use ($request, $thread, $me, $type, $attachment, &$message, &$payload) {
            $attachmentPath = null;
            $attachmentMeta = null;

            if ($attachment) {
                $attachmentPath = $attachment->store(
                    "chat/{$thread->company_id}/{$thread->id}",
                    'public'
                );

                $attachmentMeta = [
                    'original_name' => $attachment->getClientOriginalName(),
                    'mime' => $attachment->getClientMimeType(),
                    'size' => (int) ($attachment->getSize() ?? 0),
                ];
            }

            $message = Message::query()->create([
                'thread_id' => $thread->id,
                'company_id' => $thread->company_id,
                'sender_id' => $me->id,
                'type' => $type,
                'body' => $request->validated('body'),
                'attachment_path' => $attachmentPath,
                'attachment_meta' => $attachmentMeta,
            ]);

            $now = now();

            Thread::query()
                ->where('id', $thread->id)
                ->update([
                    'last_message_id' => $message->id,
                    'last_message_at' => $now,
                    'updated_at' => $now,
                ]);

            MessageRead::query()->upsert([
                [
                    'message_id' => $message->id,
                    'thread_id' => $thread->id,
                    'user_id' => $me->id,
                    'seen_at' => $now,
                    'created_at' => $now,
                    'updated_at' => $now,
                ],
            ], ['message_id', 'user_id'], ['thread_id', 'seen_at', 'updated_at']);

            ThreadRead::query()->upsert([
                [
                    'thread_id' => $thread->id,
                    'user_id' => $me->id,
                    'last_read_at' => $now,
                    'created_at' => $now,
                    'updated_at' => $now,
                ],
            ], ['thread_id', 'user_id'], ['last_read_at', 'updated_at']);

            $message->load('sender:id,first_name,last_name,avatar_path,p_image');
            $payload = (new MessageResource($message))->resolve();

            DB::afterCommit(function () use ($thread, $payload) {
                event(new MessageSent($thread->id, $payload));
            });
        });

        return response()->json([
            'status' => true,
            'data' => $payload,
        ], 201);
    }

    public function delete(DeleteMessageRequest $request, Message $message): JsonResponse
    {
        $me = $request->user();
        $thread = $message->thread;

        abort_if(! $thread, 404, 'Thread not found');
        abort_if((int) $thread->company_id !== (int) $me->company_id, 404, 'Message not found');

        $scope = $request->validated('scope');

        if ($scope === 'me') {
            $this->authorize('deleteForMe', $message);

            $deletedAt = now();
            MessageDeletion::query()->updateOrCreate(
                [
                    'message_id' => $message->id,
                    'user_id' => $me->id,
                ],
                [
                    'deleted_at' => $deletedAt,
                ]
            );

            DB::afterCommit(function () use ($thread, $message, $me, $deletedAt) {
                event(new MessageDeleted($thread->id, $message->id, $me->id, 'me', $deletedAt->toISOString()));
            });

            return response()->json([
                'status' => true,
                'data' => ['message' => 'Deleted for you'],
            ]);
        }

        $this->authorize('deleteForAll', $message);
        $deletedAt = now();

        $message->update([
            'deleted_for_all_at' => $deletedAt,
        ]);

        DB::afterCommit(function () use ($thread, $message, $me, $deletedAt) {
            event(new MessageDeleted($thread->id, $message->id, $me->id, 'all', $deletedAt->toISOString()));
        });

        return response()->json([
            'status' => true,
            'data' => ['message' => 'Deleted for everyone'],
        ]);
    }

    public function markThreadRead(Request $request, Thread $thread): JsonResponse
    {
        $me = $request->user();
        $this->authorize('view', $thread);

        $now = now();

        DB::transaction(function () use ($thread, $me, $now) {
            ThreadRead::query()->upsert([
                [
                    'thread_id' => $thread->id,
                    'user_id' => $me->id,
                    'last_read_at' => $now,
                    'created_at' => $now,
                    'updated_at' => $now,
                ],
            ], ['thread_id', 'user_id'], ['last_read_at', 'updated_at']);

            $messageIds = Message::query()
                ->where('thread_id', $thread->id)
                ->where('sender_id', '!=', $me->id)
                ->whereNull('deleted_for_all_at')
                ->whereDoesntHave('deletions', function (Builder $q) use ($me) {
                    $q->where('user_id', $me->id)->whereNotNull('deleted_at');
                })
                ->pluck('id');

            if ($messageIds->isNotEmpty()) {
                $rows = $messageIds->map(function ($messageId) use ($thread, $me, $now) {
                    return [
                        'message_id' => $messageId,
                        'thread_id' => $thread->id,
                        'user_id' => $me->id,
                        'seen_at' => $now,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];
                })->all();

                MessageRead::query()->upsert(
                    $rows,
                    ['message_id', 'user_id'],
                    ['thread_id', 'seen_at', 'updated_at']
                );
            }

            DB::afterCommit(function () use ($thread, $me, $now) {
                event(new ThreadReadUpdated($thread->id, $me->id, $now->toISOString()));
            });
        });

        return response()->json([
            'status' => true,
            'data' => [
                'thread_id' => $thread->id,
                'user_id' => $me->id,
                'last_read_at' => $now->toISOString(),
            ],
        ]);
    }

    public function messageReads(Request $request, Message $message): JsonResponse
    {
        $me = $request->user();
        $this->authorize('view', $message);

        $thread = $message->thread;
        $members = ThreadMember::query()
            ->where('thread_id', $thread->id)
            ->whereNull('left_at')
            ->with('user:id,first_name,last_name,avatar_path,p_image')
            ->get();

        $memberIds = $members->pluck('user_id')->all();
        $threadReads = ThreadRead::query()
            ->where('thread_id', $thread->id)
            ->whereIn('user_id', $memberIds)
            ->get()
            ->keyBy('user_id');

        $seen = [];
        $unseen = [];

        foreach ($members as $member) {
            if (! $member->user) {
                continue;
            }

            if ((int) $member->user_id === (int) $message->sender_id) {
                $seen[] = [
                    'id' => $member->user->id,
                    'first_name' => $member->user->first_name,
                    'avatar_path' => $member->user->avatar_path ?: $member->user->p_image,
                    'seen_at' => optional($message->created_at)->toISOString(),
                ];
                continue;
            }

            $threadRead = $threadReads->get($member->user_id);
            $lastReadAt = $threadRead?->last_read_at;

            if ($lastReadAt && $message->created_at && $lastReadAt->greaterThanOrEqualTo($message->created_at)) {
                $seen[] = [
                    'id' => $member->user->id,
                    'first_name' => $member->user->first_name,
                    'avatar_path' => $member->user->avatar_path ?: $member->user->p_image,
                    'seen_at' => $lastReadAt->toISOString(),
                ];
            } else {
                $unseen[] = [
                    'id' => $member->user->id,
                    'first_name' => $member->user->first_name,
                    'avatar_path' => $member->user->avatar_path ?: $member->user->p_image,
                ];
            }
        }

        return response()->json([
            'status' => true,
            'message_id' => $message->id,
            'seen' => $seen,
            'unseen' => $unseen,
        ]);
    }

    private function ensureThreadNotBlocked(Thread $thread, int $senderId): void
    {
        if ($thread->type !== 'direct') {
            return;
        }

        $memberIds = ThreadMember::query()
            ->where('thread_id', $thread->id)
            ->whereNull('left_at')
            ->pluck('user_id')
            ->map(fn ($id) => (int) $id)
            ->values();

        if ($memberIds->count() < 2) {
            return;
        }

        $otherId = (int) $memberIds->first(fn ($id) => $id !== $senderId);
        if (! $otherId) {
            return;
        }

        $isBlocked = UserBlock::query()
            ->betweenUsers((int) $thread->company_id, $senderId, $otherId)
            ->exists();

        abort_if($isBlocked, 403, 'Chat blocked');
    }
}
