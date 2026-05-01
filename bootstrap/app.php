<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php', // Ensure API routes are loaded for PayHero
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append:[
            \App\Http\Middleware\HandleInertiaRequests::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
        ]);

        // --- REGISTER YOUR MIDDLEWARE ALIASES HERE ---
        $middleware->alias([
            'admin' => \App\Http\Middleware\IsAdmin::class,
            'active' => \App\Http\Middleware\CheckActivation::class,
        ]);
        // ---------------------------------------------

        // Allow PayHero to send webhooks to your app without CSRF blocks
        $middleware->validateCsrfTokens(except:[
            '/api/payhero/callback'
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();