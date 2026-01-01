<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\FriendRequest;
use App\Models\User;
use Illuminate\Http\Request;

class FriendController extends Controller
{
    public function sendRequest(Request $request, $userId)
    {
        $sender = $request->user();
        $receiver = User::findOrFail($userId);

        if ($sender->id === $receiver->id) {
            return response()->json(['message' => 'Cannot send friend request to yourself'], 400);
        }

        if ($sender->isFriendsWith($receiver)) {
            return response()->json(['message' => 'Already friends'], 400);
        }

        $existingRequest = FriendRequest::where(function ($query) use ($sender, $receiver) {
            $query->where('sender_id', $sender->id)->where('receiver_id', $receiver->id);
        })->orWhere(function ($query) use ($sender, $receiver) {
            $query->where('sender_id', $receiver->id)->where('receiver_id', $sender->id);
        })->first();

        if ($existingRequest && $existingRequest->status === 'pending') {
            return response()->json(['message' => 'Friend request already exists'], 400);
        }

        $friendRequest = FriendRequest::create([
            'sender_id' => $sender->id,
            'receiver_id' => $receiver->id,
            'status' => 'pending',
        ]);

        return response()->json($friendRequest, 201);
    }

    public function getRequests(Request $request)
    {
        $user = $request->user();
        $requests = $user->receivedFriendRequests()->with('sender')->where('status', 'pending')->get();

        return response()->json($requests);
    }

    public function acceptRequest(Request $request, $requestId)
    {
        $user = $request->user();
        $friendRequest = FriendRequest::where('id', $requestId)
            ->where('receiver_id', $user->id)
            ->where('status', 'pending')
            ->firstOrFail();

        $friendRequest->update(['status' => 'accepted']);

        return response()->json($friendRequest);
    }

    public function rejectRequest(Request $request, $requestId)
    {
        $user = $request->user();
        $friendRequest = FriendRequest::where('id', $requestId)
            ->where('receiver_id', $user->id)
            ->where('status', 'pending')
            ->firstOrFail();

        $friendRequest->update(['status' => 'rejected']);

        return response()->json($friendRequest);
    }

    public function getFriends(Request $request)
    {
        $user = $request->user();

        $friends = $user->friends();

        return response()->json($friends);
    }
}
