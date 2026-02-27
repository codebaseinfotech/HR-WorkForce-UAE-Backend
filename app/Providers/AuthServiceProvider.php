<?php

namespace App\Providers;

use App\Models\Message;
use App\Models\Thread;
use App\Policies\MessagePolicy;
use App\Policies\ThreadPolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        Gate::policy(Thread::class, ThreadPolicy::class);
        Gate::policy(Message::class, MessagePolicy::class);
    }
}
