<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

use Illuminate\Validation\Rule;

class ProfileController extends Controller
{
    public function showMe(Request $request)
    {
        return response()->json($request->user());
    }

    public function updateMe(Request $request)
    {
        try {
            $user = $request->user();

            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|required|string|max:255',
                'email' => [
                    'sometimes',
                    'required',
                    'string',
                    'email',
                    'max:255',
                    Rule::unique('users')->ignore($user->id),
                ],
                'bio' => 'nullable|string|max:1000',
            ]);

            if ($validator->fails()) {
                \Illuminate\Support\Facades\Log::error('Profile validation failed', ['errors' => $validator->errors()]);
                return response()->json($validator->errors(), 422);
            }

            $user->update($request->only('name', 'email', 'bio'));

            return response()->json($user);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Profile update failed: ' . $e->getMessage());
            return response()->json(['message' => 'Server Error'], 500);
        }
    }

    public function show(Request $request, $userId)
    {
        $user = User::findOrFail($userId);
        $currentUser = $request->user();

        $data = [
            'id' => $user->id,
            'name' => $user->name,
            'email' => null, // Hide email by default
            'created_at' => $user->created_at,
        ];

        // Show email and bio only if friends
        if ($currentUser && $currentUser->isFriendsWith($user)) {
            $data['email'] = $user->email;
            $data['bio'] = $user->bio;
        }

        return response()->json($data);
    }
}
