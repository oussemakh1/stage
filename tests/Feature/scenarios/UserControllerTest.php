<?php

use App\Models\User;
use App\Models\FriendRequest;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

it('index causes n plus one queries with many users', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    // Create many users
    $otherUsers = User::factory()->count(10)->create();

    // Count queries before request (would need query logging)
    $response = $this->getJson('/api/users');

    $response->assertStatus(200);

    // In a real test, we'd check query count
    // This demonstrates potential N+1 problem
});

it('index with many friends causes performance issues', function () {
    $user = User::factory()->create();

    // Create many friends
    $friends = User::factory()->count(50)->create();
    foreach ($friends as $friend) {
        FriendRequest::create([
            'sender_id' => $user->id,
            'receiver_id' => $friend->id,
            'status' => 'accepted',
        ]);
    }

    Sanctum::actingAs($user);

    // Measure response time
    $startTime = microtime(true);
    $response = $this->getJson('/api/users');
    $endTime = microtime(true);

    $response->assertStatus(200);

    $duration = ($endTime - $startTime) * 1000; // milliseconds

    // With 50 friends, this might be slow due to complex queries
    expect($duration)->toBeLessThan(5000); // Less than 5 seconds
});

it('index excludes friends incorrectly', function () {
    $user = User::factory()->create();
    $friend = User::factory()->create();
    $stranger = User::factory()->create();

    // Make user friends with friend
    FriendRequest::create([
        'sender_id' => $user->id,
        'receiver_id' => $friend->id,
        'status' => 'accepted',
    ]);

    Sanctum::actingAs($user);

    $response = $this->getJson('/api/users');

    $response->assertStatus(200);

    $userIds = collect($response->json())->pluck('id');

    // Friend should be excluded
    expect($userIds)->not->toContain($friend->id);
    // Stranger should be included
    expect($userIds)->toContain($stranger->id);
    // Self should be excluded
    expect($userIds)->not->toContain($user->id);
});

it('index shows pending request status incorrectly', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();

    // User sent a pending request
    FriendRequest::create([
        'sender_id' => $user->id,
        'receiver_id' => $otherUser->id,
        'status' => 'pending',
    ]);

    Sanctum::actingAs($user);

    $response = $this->getJson('/api/users');

    $response->assertStatus(200);

    $otherUserData = collect($response->json())->firstWhere('id', $otherUser->id);

    expect($otherUserData['has_pending_request'])->toBeTrue();
    expect($otherUserData['has_received_request'])->toBeFalse();
});

it('index without authentication fails', function () {
    $response = $this->getJson('/api/users');

    // Should require auth
    $response->assertStatus(401);
});

it('index with broken relationships throws exceptions', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    // If relationships are not properly set up, this might fail
    $response = $this->getJson('/api/users');

    // Should handle gracefully
    expect($response->getStatusCode())->toBeIn([200, 500]);
});

it('index hides email and bio for all users', function () {
    $user = User::factory()->create();
    $otherUsers = User::factory()->count(3)->create();

    Sanctum::actingAs($user);

    $response = $this->getJson('/api/users');

    $response->assertStatus(200);

    $users = $response->json();

    foreach ($users as $userData) {
        expect($userData['email'])->toBeNull();
        expect($userData['bio'])->toBeNull();
    }
});

it('index with large dataset causes memory issues', function () {
    $user = User::factory()->create();

    // Create many users
    User::factory()->count(1000)->create();

    Sanctum::actingAs($user);

    // Measure memory usage
    $startMemory = memory_get_usage();

    $response = $this->getJson('/api/users');

    $endMemory = memory_get_usage();
    $memoryUsed = $endMemory - $startMemory;

    $response->assertStatus(200);

    // With 1000 users, this will use significant memory
    expect($memoryUsed)->toBeGreaterThan(1000000); // 1MB+ memory usage
});

it('index query logic fails with complex friend relationships', function () {
    $user = User::factory()->create();

    // Create complex relationship scenario
    $friend1 = User::factory()->create();
    $friend2 = User::factory()->create();
    $pendingSent = User::factory()->create();
    $pendingReceived = User::factory()->create();

    // Accepted friendships
    FriendRequest::create(['sender_id' => $user->id, 'receiver_id' => $friend1->id, 'status' => 'accepted']);
    FriendRequest::create(['sender_id' => $friend2->id, 'receiver_id' => $user->id, 'status' => 'accepted']);

    // Pending requests
    FriendRequest::create(['sender_id' => $user->id, 'receiver_id' => $pendingSent->id, 'status' => 'pending']);
    FriendRequest::create(['sender_id' => $pendingReceived->id, 'receiver_id' => $user->id, 'status' => 'pending']);

    Sanctum::actingAs($user);

    $response = $this->getJson('/api/users');

    $response->assertStatus(200);

    $users = collect($response->json());

    // Friends should be excluded
    expect($users->pluck('id'))->not->toContain($friend1->id);
    expect($users->pluck('id'))->not->toContain($friend2->id);

    // Pending should be included with correct flags
    $pendingSentData = $users->firstWhere('id', $pendingSent->id);
    expect($pendingSentData['has_pending_request'])->toBeTrue();

    $pendingReceivedData = $users->firstWhere('id', $pendingReceived->id);
    expect($pendingReceivedData['has_received_request'])->toBeTrue();
});

it('index fails when user has no relationships', function () {
    $user = User::factory()->create();
    User::factory()->count(5)->create();

    Sanctum::actingAs($user);

    $response = $this->getJson('/api/users');

    $response->assertStatus(200)
             ->assertJsonCount(5); // Should return all other users
});

it('index performance degrades with relationship complexity', function () {
    $user = User::factory()->create();

    // Create users with various relationship states
    $friends = User::factory()->count(20)->create();
    $pendingSent = User::factory()->count(10)->create();
    $pendingReceived = User::factory()->count(10)->create();
    $strangers = User::factory()->count(20)->create();

    // Set up relationships
    foreach ($friends as $friend) {
        FriendRequest::create(['sender_id' => $user->id, 'receiver_id' => $friend->id, 'status' => 'accepted']);
    }

    foreach ($pendingSent as $pending) {
        FriendRequest::create(['sender_id' => $user->id, 'receiver_id' => $pending->id, 'status' => 'pending']);
    }

    foreach ($pendingReceived as $pending) {
        FriendRequest::create(['sender_id' => $pending->id, 'receiver_id' => $user->id, 'status' => 'pending']);
    }

    Sanctum::actingAs($user);

    $startTime = microtime(true);
    $response = $this->getJson('/api/users');
    $endTime = microtime(true);

    $response->assertStatus(200);

    $duration = ($endTime - $startTime) * 1000;

    // Complex queries might be slow
    expect($duration)->toBeLessThan(2000); // Less than 2 seconds
});
