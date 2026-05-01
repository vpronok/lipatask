<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckActivation
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // If logged in, is NOT active, and is NOT an admin -> Block them
        if ($user && !$user->is_active && $user->role !== 'admin') {
            
            // Allow them to visit the activation payment page, or log out
            if ($request->routeIs('activation.*') || $request->routeIs('logout')) {
                return $next($request);
            }

            // Redirect all other blocked attempts to the payment page
            return redirect()->route('activation.index');
        }

        return $next($request);
    }
}