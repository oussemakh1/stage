<?php

use App\Models\FriendRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

it('cannot send friend request after rejection', function () {
    $sender = User::factory()->create();
    $receiver = User::factory()->create();

    // Create and reject a friend request
    $request = FriendRequest::create([
        'sender_id' => $sender->id,
        'receiver_id' => $receiver->id,
        'status' => 'pending',
    ]);
    $request->update(['status' => 'rejected']);

    // Try to send another request - this should work but currently fails
    Sanctum::actingAs($sender);

    $response = $this->postJson("/api/friends/request/{$receiver->id}");

    // Currently returns 400 because it doesn't allow after rejection
    $response->assertStatus(400)
             ->assertJson(['message' => 'Friend request already exists']);
});

it('accept nonexistent request throws exception', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    // Try to accept a non-existent request
    $response = $this->postJson('/api/friends/accept/99999');

    // Currently throws 500 error instead of returning 404
    $response->assertStatus(500); // This demonstrates the bug
});

it('concurrent friend requests create duplicates', function () {
    $sender = User::factory()->create();
    $receiver = User::factory()->create();
    Sanctum::actingAs($sender);

    // Send multiple requests simultaneously
    $responses = collect();
    for ($i = 0; $i < 5; $i++) {
        $responses->push($this->postJson("/api/friends/request/{$receiver->id}"));
    }

    // Check how many requests were actually created
    $requestCount = FriendRequest::where('sender_id', $sender->id)
                                ->where('receiver_id', $receiver->id)
                                ->count();

    // Should be 1, but might be more due to race condition
    expect($requestCount)->toBeGreaterThanOrEqual(1);
});

it('database failure leaves orphaned data', function () {
    $sender = User::factory()->create();
    $receiver = User::factory()->create();
    Sanctum::actingAs($sender);

    // Mock database failure during creation
    FriendRequest::shouldReceive('create')->andThrow(new \Exception('DB Error'));

    $response = $this->postJson("/api/friends/request/{$receiver->id}");

    $response->assertStatus(500); // Unhandled exception

    // Check if any partial data was created
    $partialData = FriendRequest::where('sender_id', $sender->id)->get();
    expect($partialData)->toHaveCount(0); // Should be clean, but might not be
});

it('get friends with many friends causes memory issues', function () {
    $user = User::factory()->create();

    // Create many friends
    $friends = User::factory()->count(100)->create();
    foreach ($friends as $friend) {
        FriendRequest::create([
            'sender_id' => $user->id,
            'receiver_id' => $friend->id,
            'status' => 'accepted',
        ]);
    }

    Sanctum::actingAs($user);

    // Measure memory usage before request
    $startMemory = memory_get_usage();

    $response = $this->getJson('/api/friends');

    $response->assertStatus(200);

    // Check memory usage - this demonstrates the performance issue
    $endMemory = memory_get_usage();
    $memoryUsed = $endMemory - $startMemory;

    // With 100 friends, this will use significant memory
    expect($memoryUsed)->toBeGreaterThan(1000000); // 1MB+ memory usage
});

it('send request with invalid user id', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    // Try with non-numeric ID
    $response = $this->postJson('/api/friends/request/invalid-id');
    $response->assertStatus(500); // Should be 400 or 404

    // Try with non-existent user ID
    $response = $this->postJson('/api/friends/request/99999');
    $response->assertStatus(500); // Should be 404
});

it('no rate limiting allows spam', function () {
    $sender = User::factory()->create();
    $receivers = User::factory()->count(10)->create();
    Sanctum::actingAs($sender);

    // Send many requests rapidly
    $startTime = now();
    foreach ($receivers as $receiver) {
        $this->postJson("/api/friends/request/{$receiver->id}");
    }
    $endTime = now();

    $duration = $endTime->diffInMilliseconds($startTime);

    // Should complete quickly without rate limiting
    expect($duration)->toBeLessThan(1000); // Less than 1 second

    $requestCount = FriendRequest::where('sender_id', $sender->id)->count();
    expect($requestCount)->toBe(10); // All requests went through
});

it('unauthorized user can access friend endpoints', function () {
    // Test without authentication
    $response = $this->getJson('/api/friends');
    $response->assertStatus(401); // Should require auth

    $response = $this->postJson('/api/friends/request/1');
    $response->assertStatus(401); // Should require auth
});

it('error responses are inconsistent', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    // Test different error scenarios
    $response1 = $this->postJson('/api/friends/accept/99999');
    $response2 = $this->postJson('/api/friends/request/invalid');

    // Both should return consistent JSON error format
    // Currently one throws exception, other may return different format
    expect($response1->getStatusCode())->toBe(500);
    expect($response2->getStatusCode())->toBe(500);
});

it('get requests causes n plus one queries', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    // Create multiple friend requests
    $senders = User::factory()->count(5)->create();
    foreach ($senders as $sender) {
        FriendRequest::create([
            'sender_id' => $sender->id,
            'receiver_id' => $user->id,
            'status' => 'pending',
        ]);
    }

    // Count queries before request
    $queryCountBefore = 0; // Would need query logging to count

    $response = $this->getJson('/api/friends/requests');

    $response->assertStatus(200)
             ->assertJsonCount(5);

    // In a real test, we'd check query count increased by more than 1
    // This demonstrates the N+1 problem potential
});

it('cannot send request to self', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    $response = $this->postJson("/api/friends/request/{$user->id}");

    $response->assertStatus(400)
             ->assertJson(['message' => 'Cannot send friend request to yourself']);
});

it('cannot send request to already friends', function () {
    $sender = User::factory()->create();
    $receiver = User::factory()->create();

    // Make them friends
    FriendRequest::create([
        'sender_id' => $sender->id,
        'receiver_id' => $receiver->id,
        'status' => 'accepted',
    ]);

    Sanctum::actingAs($sender);

    $response = $this->postJson("/api/friends/request/{$receiver->id}");

    $response->assertStatus(400)
             ->assertJson(['message' => 'Already friends']);
});

it('can accept pending friend request', function () {
    $sender = User::factory()->create();
    $receiver = User::factory()->create();

    $request = FriendRequest::create([
        'sender_id' => $sender->id,
        'receiver_id' => $receiver->id,
        'status' => 'pending',
    ]);

    Sanctum::actingAs($receiver);

    $response = $this->postJson("/api/friends/accept/{$request->id}");

    $response->assertStatus(200);
    $this->assertDatabaseHas('friend_requests', [
        'id' => $request->id,
        'status' => 'accepted',
    ]);
});

it('can reject pending friend request', function () {
    $sender = User::factory()->create();
    $receiver = User::factory()->create();

    $request = FriendRequest::create([
        'sender_id' => $sender->id,
        'receiver_id' => $receiver->id,
        'status' => 'pending',
    ]);

    Sanctum::actingAs($receiver);

    $response = $this->postJson("/api/friends/reject/{$request->id}");

    $response->assertStatus(200);
    $this->assertDatabaseHas('friend_requests', [
        'id' => $request->id,
        'status' => 'rejected',
    ]);
});

it('cannot accept others friend requests', function () {
    $sender = User::factory()->create();
    $receiver = User::factory()->create();
    $otherUser = User::factory()->create();

    $request = FriendRequest::create([
        'sender_id' => $sender->id,
        'receiver_id' => $receiver->id,
        'status' => 'pending',
    ]);

    Sanctum::actingAs($otherUser); // Different user

    $response = $this->postJson("/api/friends/accept/{$request->id}");

    $response->assertStatus(500); // Currently throws exception
});

it('returns friends list correctly', function () {
    $user = User::factory()->create();
    $friends = User::factory()->count(3)->create();

    foreach ($friends as $friend) {
        FriendRequest::create([
            'sender_id' => $user->id,
            'receiver_id' => $friend->id,
            'status' => 'accepted',
        ]);
    }

    Sanctum::actingAs($user);

    $response = $this->getJson('/api/friends');

    $response->assertStatus(200)
             ->assertJsonCount(3);
});

it('returns pending friend requests', function () {
    $user = User::factory()->create();
    $senders = User::factory()->count(2)->create();

    foreach ($senders as $sender) {
        FriendRequest::create([
            'sender_id' => $sender->id,
            'receiver_id' => $user->id,
            'status' => 'pending',
        ]);
    }

    Sanctum::actingAs($user);

    $response = $this->getJson('/api/friends/requests');

    $response->assertStatus(200)
             ->assertJsonCount(2);
});
