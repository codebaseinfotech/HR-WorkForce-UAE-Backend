<?php

namespace App\Http\Controllers\Api;

use App\Events\Chat\ThreadCreated;
use App\Events\Chat\ThreadMemberLeft;
use App\Events\Chat\ThreadMembersAdded;
use App\Http\Controllers\Controller;
use App\Http\Requests\Chat\AddThreadMembersRequest;
use App\Http\Requests\Chat\DirectThreadRequest;
use App\Http\Requests\Chat\GroupThreadRequest;
use App\Http\Resources\Chat\ThreadResource;
use App\Models\Thread;
use App\Models\ThreadMember;
use App\Models\User;
use App\Models\UserBlock;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ThreadController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $me = $request->user();
        $perPage = max(1, min((int) $request->integer('per_page', 20), 50));

        $threads = Thread::query()
            ->company((int) $me->company_id)
            ->whereHas('members', function ($q) use ($me) {
                $q->where('user_id', $me->id)->whereNull('left_at');
            })
            ->with([
                'members' => function ($q) {
                    $q->whereNull('left_at')
                        ->with('user:id,first_name,last_name,avatar_path');
                },
                'lastMessage.sender:id,first_name,last_name,avatar_path',
            ])
            ->withCount([
                'messages as unread_count' => function ($q) use ($me) {
                    $q->where('sender_id', '!=', $me->id)
                        ->whereNull('deleted_for_all_at')
                        ->whereNotExists(function ($sub) use ($me) {
                            $sub->selectRaw('1')
                                ->from('message_deletions')
                                ->whereColumn('message_deletions.message_id', 'messages.id')
                                ->where('message_deletions.user_id', $me->id)
                                ->whereNotNull('message_deletions.deleted_at');
                        })
                        ->where(function ($readFilter) use ($me) {
                            $readFilter->whereNotExists(function ($sub) use ($me) {
                                $sub->selectRaw('1')
                                    ->from('thread_reads')
                                    ->whereColumn('thread_reads.thread_id', 'messages.thread_id')
                                    ->where('thread_reads.user_id', $me->id);
                            })->orWhere('messages.created_at', '>', function ($sub) use ($me) {
                                $sub->select('thread_reads.last_read_at')
                                    ->from('thread_reads')
                                    ->whereColumn('thread_reads.thread_id', 'messages.thread_id')
                                    ->where('thread_reads.user_id', $me->id)
                                    ->limit(1);
                            });
                        });
                },
        ])
            ->orderByDesc('last_message_at')
            ->orderByDesc('id')
            ->paginate($perPage);

        return response()->json([
            'status' => true,
            'data' => ThreadResource::collection($threads->getCollection())->resolve(),
            'meta' => [
                'current_page' => $threads->currentPage(),
                'last_page' => $threads->lastPage(),
                'per_page' => $threads->perPage(),
                'total' => $threads->total(),
            ],
        ]);
    }

    public function direct(DirectThreadRequest $request): JsonResponse
    {
        $me = $request->user();
        $other = User::query()->findOrFail((int) $request->validated('user_id'));

        abort_if((int) $other->id === (int) $me->id, 422, 'You cannot create a direct thread with yourself.');
        abort_if((int) $other->company_id !== (int) $me->company_id, 404, 'User not found in your company.');

        $this->ensureNotBlocked((int) $me->company_id, (int) $me->id, (int) $other->id);

        [$userOneId, $userTwoId] = [(int) min($me->id, $other->id), (int) max($me->id, $other->id)];

        $thread = null;
        $wasCreated = false;

        DB::transaction(function () use ($me, $other, $userOneId, $userTwoId, &$thread, &$wasCreated) {
            $thread = Thread::query()
                ->where('company_id', $me->company_id)
                ->where('type', 'direct')
                ->where('user_one_id', $userOneId)
                ->where('user_two_id', $userTwoId)
                ->lockForUpdate()
                ->first();

            if (! $thread) {
                $thread = Thread::query()->create([
                    'company_id' => $me->company_id,
                    'type' => 'direct',
                    'created_by' => $me->id,
                    'user_one_id' => $userOneId,
                    'user_two_id' => $userTwoId,
                ]);
                $wasCreated = true;
            }

            $now = now();
            ThreadMember::query()->upsert([
                [
                    'thread_id' => $thread->id,
                    'user_id' => $me->id,
                    'role' => 'member',
                    'joined_at' => $now,
                    'left_at' => null,
                    'created_at' => $now,
                    'updated_at' => $now,
                ],
                [
                    'thread_id' => $thread->id,
                    'user_id' => $other->id,
                    'role' => 'member',
                    'joined_at' => $now,
                    'left_at' => null,
                    'created_at' => $now,
                    'updated_at' => $now,
                ],
            ], ['thread_id', 'user_id'], ['role', 'joined_at', 'left_at', 'updated_at']);

            DB::afterCommit(function () use ($thread, $me, $other) {
                $payload = (new ThreadResource(
                    $thread->fresh([
                        'members.user:id,first_name,last_name,avatar_path,p_image',
                        'lastMessage.sender:id,first_name,last_name,avatar_path,p_image',
                    ])
                ))->resolve();

                event(new ThreadCreated([(int) $me->id, (int) $other->id], $payload));
            });
        });

        $thread = Thread::query()
            ->with([
                'members' => fn ($q) => $q->whereNull('left_at')->with('user:id,first_name,last_name,avatar_path,p_image'),
                'lastMessage.sender:id,first_name,last_name,avatar_path,p_image',
            ])
            ->findOrFail($thread->id);
        $thread->setAttribute('unread_count', 0);

        return response()->json([
            'status' => true,
            'data' => new ThreadResource($thread),
        ], $wasCreated ? 201 : 200);
    }

    public function createGroup(GroupThreadRequest $request): JsonResponse
    {
        $me = $request->user();
        $memberIds = collect($request->validated('member_ids'))
            ->map(fn ($id) => (int) $id)
            ->push((int) $me->id)
            ->unique()
            ->values();

        $sameCompanyCount = User::query()
            ->where('company_id', $me->company_id)
            ->whereIn('id', $memberIds)
            ->count();

        abort_if($sameCompanyCount !== $memberIds->count(), 422, 'All members must belong to the same company.');

        $thread = null;
        DB::transaction(function () use ($request, $me, $memberIds, &$thread) {
            $thread = Thread::query()->create([
                'company_id' => $me->company_id,
                'type' => 'group',
                'name' => $request->validated('name'),
                'created_by' => $me->id,
            ]);

            $now = now();
            $rows = $memberIds->map(function ($memberId) use ($thread, $me, $now) {
                return [
                    'thread_id' => $thread->id,
                    'user_id' => $memberId,
                    'role' => $memberId === (int) $me->id ? 'admin' : 'member',
                    'joined_at' => $now,
                    'left_at' => null,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            })->all();

            ThreadMember::query()->insert($rows);

            DB::afterCommit(function () use ($thread, $memberIds) {
                $payload = (new ThreadResource(
                    $thread->fresh([
                        'members.user:id,first_name,last_name,avatar_path,p_image',
                        'lastMessage.sender:id,first_name,last_name,avatar_path,p_image',
                    ])
                ))->resolve();

                event(new ThreadCreated($memberIds->all(), $payload));
            });
        });

        $thread = Thread::query()
            ->with([
                'members' => fn ($q) => $q->whereNull('left_at')->with('user:id,first_name,last_name,avatar_path,p_image'),
                'lastMessage.sender:id,first_name,last_name,avatar_path,p_image',
            ])
            ->findOrFail($thread->id);
        $thread->setAttribute('unread_count', 0);

        return response()->json([
            'status' => true,
            'data' => new ThreadResource($thread),
        ], 201);
    }

    public function addMembers(AddThreadMembersRequest $request, Thread $thread): JsonResponse
    {
        $me = $request->user();
        $this->authorize('addMembers', $thread);

        $memberIds = collect($request->validated('member_ids'))
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->reject(fn ($id) => $id === (int) $me->id)
            ->values();

        if ($memberIds->isEmpty()) {
            return response()->json([
                'status' => true,
                'data' => new ThreadResource($thread->load([
                    'members.user:id,first_name,last_name,avatar_path',
                    'lastMessage.sender:id,first_name,last_name,avatar_path',
                ])),
            ]);
        }

        $sameCompanyCount = User::query()
            ->where('company_id', $me->company_id)
            ->whereIn('id', $memberIds)
            ->count();

        abort_if($sameCompanyCount !== $memberIds->count(), 422, 'All members must belong to the same company.');

        DB::transaction(function () use ($thread, $memberIds) {
            $now = now();

            foreach ($memberIds as $memberId) {
                $member = ThreadMember::query()
                    ->where('thread_id', $thread->id)
                    ->where('user_id', $memberId)
                    ->first();

                if (! $member) {
                    ThreadMember::query()->create([
                        'thread_id' => $thread->id,
                        'user_id' => $memberId,
                        'role' => 'member',
                        'joined_at' => $now,
                        'left_at' => null,
                    ]);

                    continue;
                }

                $member->left_at = null;
                if (! $member->joined_at) {
                    $member->joined_at = $now;
                }
                $member->save();
            }

            DB::afterCommit(function () use ($thread, $memberIds) {
                event(new ThreadMembersAdded($thread->id, $memberIds->all()));

                $payload = (new ThreadResource(
                    $thread->fresh([
                        'members.user:id,first_name,last_name,avatar_path',
                        'lastMessage.sender:id,first_name,last_name,avatar_path',
                    ])
                ))->resolve();

                event(new ThreadCreated($memberIds->all(), $payload));
            });
        });

        $thread = $thread->fresh([
            'members' => fn ($q) => $q->whereNull('left_at')->with('user:id,first_name,last_name,avatar_path'),
            'lastMessage.sender:id,first_name,last_name,avatar_path',
        ]);

        return response()->json([
            'status' => true,
            'data' => new ThreadResource($thread),
        ]);
    }

    public function leave(Request $request, Thread $thread): JsonResponse
    {
        $me = $request->user();
        $this->authorize('leave', $thread);

        $member = ThreadMember::query()
            ->where('thread_id', $thread->id)
            ->where('user_id', $me->id)
            ->whereNull('left_at')
            ->first();

        abort_if(! $member, 422, 'You already left this thread.');

        $leftAt = now();
        DB::transaction(function () use ($member, $thread, $me, $leftAt) {
            $member->update(['left_at' => $leftAt]);

            DB::afterCommit(function () use ($thread, $me, $leftAt) {
                event(new ThreadMemberLeft($thread->id, $me->id, $leftAt->toISOString()));
            });
        });

        return response()->json([
            'status' => true,
            'data' => ['thread_id' => $thread->id, 'left_at' => $leftAt->toISOString()],
        ]);
    }

    private function ensureNotBlocked(int $companyId, int $userA, int $userB): void
    {
        $isBlocked = UserBlock::query()
            ->betweenUsers($companyId, $userA, $userB)
            ->exists();

        abort_if($isBlocked, 403, 'Chat blocked');
    }
}
