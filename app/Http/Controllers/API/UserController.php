<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        // Get IDs of friends (both sent and received accepted requests)
        $sentFriendIds = $user->sentFriendRequests()
            ->where('status', 'accepted')
            ->pluck('receiver_id');

        $receivedFriendIds = $user->receivedFriendRequests()
            ->where('status', 'accepted')
            ->pluck('sender_id');

        // Get IDs of pending requests sent by current user
        $pendingSentIds = $user->sentFriendRequests()
            ->where('status', 'pending')
            ->pluck('receiver_id')
            ->toArray();

        // Get IDs of pending requests received by current user
        $pendingReceivedIds = $user->receivedFriendRequests()
            ->where('status', 'pending')
            ->pluck('sender_id')
            ->toArray();

        // Exclude friends and self, but KEEP pending requests
        $excludeIds = $sentFriendIds
            ->merge($receivedFriendIds)
            ->push($user->id)
            ->unique();

        $users = User::whereNotIn('id', $excludeIds)
            ->get(['id', 'name', 'email', 'bio', 'created_at'])
            ->map(function ($otherUser) use ($pendingSentIds, $pendingReceivedIds) {
                // Check if we sent a request to this user
                $hasPendingRequest = in_array($otherUser->id, $pendingSentIds);
                // Check if we received a request from this user
                $hasReceivedRequest = in_array($otherUser->id, $pendingReceivedIds);

                return [
                    'id' => $otherUser->id,
                    'name' => $otherUser->name,
                    // Hide email and bio for non-friends (everyone in this list is not a friend)
                    'email' => null, 
                    'bio' => null,
                    'created_at' => $otherUser->created_at,
                    'has_pending_request' => $hasPendingRequest,
                    'has_received_request' => $hasReceivedRequest,
                ];
            });

        return response()->json($users);
    }
}
