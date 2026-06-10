<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class TeamController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = $user->referrals();
        
        // Calculate stats efficiently before filtering and pagination
        $totalCount = $query->count();
        $activeCount = (clone $query)->where('is_active', true)->count();
        $inactiveCount = $totalCount - $activeCount;

        // Apply status filter
        $filter = $request->query('filter', 'all');
        if ($filter === 'active') {
            $query->where('is_active', true);
        } elseif ($filter === 'inactive') {
            $query->where('is_active', false);
        }

        // Apply pagination
        $perPage = $request->query('per_page', 20);
        $allowedPerPage = [20, 50, 100];
        if (!in_array((int)$perPage, $allowedPerPage)) {
            $perPage = 20;
        }

        // Fetch paginated referrals
        $referrals = $query->orderBy('created_at', 'desc')->paginate((int)$perPage)->withQueryString();

        return Inertia::render('Team', [
            'referrals' => $referrals,
            'filters' => [
                'filter' => $filter,
                'per_page' => $perPage,
            ],
            'stats' =>[
                'total' => $totalCount,
                'active' => $activeCount,
                'inactive' => $inactiveCount,
            ],
            'referralLink' => url('/register?ref=' . $user->referral_code),
        ]);
    }
}