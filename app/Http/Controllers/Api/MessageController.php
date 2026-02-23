<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Message;
use App\Models\MessageAttachment;
use App\Models\MessageDeletion;
use App\Models\MessageRead;
use App\Models\Thread;
use App\Models\ThreadMember;
use App\Support\ChatAuth;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class MessageController extends Controller
{
    public function list(Request $request, Thread $thread)
    {
        $me = $request->user(); // ✅ best for API
        abort_if(! $me, 401, 'Unauthenticated');

        abort_if($thread->company_id !== $me->company_id, 404);
        ChatAuth::ensureMember($thread->id, $me->id);

        $messages = Message::where('thread_id', $thread->id)
            ->whereNull('deleted_at')
            ->whereDoesntHave('deletions', function ($q) use ($me) {
                $q->where('user_id', $me->id)->whereNotNull('deleted_at');
            })
            ->with(['sender:id,first_name,avatar_path', 'attachments'])
            ->orderByDesc('id')
            ->paginate(30);

        $messages->getCollection()->transform(function ($m) {
            $m->attachments->transform(function ($a) {
                $a->url = Storage::disk($a->disk)->url($a->path);
                return $a;
            });

            return $m;
        });

        return response()->json($messages);
    }

    /**
     * POST /threads/{thread}/messages
     * Send message (JSON for text OR multipart for files)
     * - JSON: { body, message_type=text }
     * - Multipart: body, message_type=file, files[]
     */
    public function send(Request $request, Thread $thread)
    {
        $me = $request->user();

        abort_if($thread->company_id !== $me->company_id, 404);
        ChatAuth::ensureMember($thread->id, $me->id);

        $request->validate([
            'body' => 'nullable|string',
            'message_type' => 'nullable|in:text,media,file',
            'files' => 'nullable|array',
            'files.*' => 'file|max:20480',
            'file' => 'nullable|file|max:20480', // single file support
        ]);

        $messageType = $request->message_type ?? ($request->hasFile('files') ? 'file' : 'text');
        return DB::transaction(function () use ($request, $thread, $me, $messageType) {
            $msg = Message::create([
                'thread_id' => $thread->id,
                'sender_id' => $me->id,
                'body' => $request->body,
                'message_type' => $messageType,
            ]);

            if ($request->hasFile('files')) {
                foreach ($request->file('files') as $file) {
                    $path = $file->store("chat/threads/{$thread->id}", 'public');

                    MessageAttachment::create([
                        'message_id' => $msg->id,
                        'disk' => 'public',
                        'path' => $path,
                        'original_name' => $file->getClientOriginalName(),
                        'mime' => $file->getClientMimeType(),
                        'size' => (int) ($file->getSize() ?? 0),
                    ]);
                }

                // if files present and type was text, convert to file
                if ($msg->message_type === 'text') {
                    $msg->message_type = 'file';
                    $msg->save();
                }
            }

            $msg->load(['sender:id,first_name,avatar_path', 'attachments']);
            $msg->attachments->transform(function ($a) {
                $a->url = Storage::disk($a->disk)->url($a->path);

                return $a;
            });

            return response()->json($msg, 201);
        });
    }

    /**
     * DELETE /messages/{message}
     * Body: { "scope": "me" } or { "scope": "all" }
     */
    public function delete(Request $request, Message $message)
    {
        $me = $request->user();
        $thread = $message->thread;

        abort_if(! $thread, 404);
        abort_if($thread->company_id !== $me->company_id, 404);

        ChatAuth::ensureMember($thread->id, $me->id);

        $request->validate([
            'scope' => 'required|in:me,all',
        ]);

        if ($request->scope === 'all') {
            // only sender or group admin can delete-for-all
            $isSender = $message->sender_id === $me->id;

            $isAdmin = ThreadMember::where('thread_id', $thread->id)
                ->where('user_id', $me->id)
                ->whereNull('left_at')
                ->where('role', 'admin')
                ->exists();

            abort_if(! $isSender && ! $isAdmin, 403, 'Not allowed');

            $message->deleted_at = now();
            $message->save();

            return response()->json(['message' => 'Deleted for everyone']);
        }

        // delete-for-me
        MessageDeletion::updateOrCreate(
            ['message_id' => $message->id, 'user_id' => $me->id],
            ['deleted_at' => now()]
        );

        return response()->json(['message' => 'Deleted for you']);
    }

    /**
     * POST /threads/{thread}/read
     * Mark all messages in thread as read for current user
     */
    public function markThreadRead(Request $request, Thread $thread)
    {
        $me = $request->user();

        abort_if($thread->company_id !== $me->company_id, 404);
        ChatAuth::ensureMember($thread->id, $me->id);

        $msgIds = Message::where('thread_id', $thread->id)
            ->whereNull('deleted_at')
            ->where('sender_id', '!=', $me->id)
            ->pluck('id');

        $now = now();
        foreach ($msgIds as $mid) {
            MessageRead::updateOrCreate(
                ['message_id' => $mid, 'user_id' => $me->id],
                ['read_at' => $now]
            );
        }

        return response()->json(['message' => 'Marked as read','code' => 200]);
    }

    /**
     * GET /messages/{message}/reads
     * Response: seen[] / unseen[] (kone seen karyu nathi)
     */
    public function messageReads(Request $request, Message $message)
    {
        $me = $request->user();
        $thread = $message->thread;

        abort_if(! $thread, 404);
        abort_if($thread->company_id !== $me->company_id, 404);
        ChatAuth::ensureMember($thread->id, $me->id);

        // active members only
        $members = ThreadMember::where('thread_id', $thread->id)
            ->whereNull('left_at')
            ->with('user:id,first_name,avatar_path')
            ->get();

        $readUserIds = MessageRead::where('message_id', $message->id)
            ->whereNotNull('read_at')
            ->pluck('user_id')
            ->toArray();

        $seen = [];
        $unseen = [];

        foreach ($members as $m) {
            if (! $m->user) {
                continue;
            }

            // optionally: sender always seen (UI choice)
            if ($m->user->id === $message->sender_id) {
                $seen[] = $m->user;

                continue;
            }

            if (in_array($m->user->id, $readUserIds)) {
                $seen[] = $m->user;
            } else {
                $unseen[] = $m->user;
            }
        }

        return response()->json([
            'message_id' => $message->id,
            'seen' => $seen,
            'unseen' => $unseen,
        ]);
    }
}