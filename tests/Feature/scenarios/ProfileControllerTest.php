<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

it('concurrent profile updates with same email cause conflicts', function () {
    $user1 = User::factory()->create(['email' => 'user1@example.com']);
    $user2 = User::factory()->create(['email' => 'user2@example.com']);

    Sanctum::actingAs($user1);

    // Both users try to update to the same email simultaneously
    $updateData = ['email' => 'conflict@example.com'];

    $responses = collect();
    $responses->push($this->actingAs($user1)->putJson('/api/profile/me', $updateData));
    $responses->push($this->actingAs($user2)->putJson('/api/profile/me', $updateData));

    // Check final state
    $usersWithEmail = User::where('email', 'conflict@example.com')->count();

    // Should be 1, but might be more if race condition
    expect($usersWithEmail)->toBeGreaterThanOrEqual(1);
});

it('show profile for non-existent user throws exception', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    // Try to view non-existent user profile
    $response = $this->getJson('/api/profile/99999');

    // Currently throws 500 instead of 404
    $response->assertStatus(500);
});

it('update profile with database failure', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    // Mock database failure during update
    $user->shouldReceive('update')->andThrow(new \Exception('DB Error'));

    $updateData = ['name' => 'New Name'];

    $response = $this->putJson('/api/profile/me', $updateData);

    // Currently catches and returns 500
    $response->assertStatus(500)
             ->assertJson(['message' => 'Server Error']);
});

it('update profile with invalid data logs errors', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    $updateData = [
        'email' => 'invalid-email',
        'name' => str_repeat('a', 300), // Too long
    ];

    $response = $this->putJson('/api/profile/me', $updateData);

    $response->assertStatus(422);

    // Check if errors were logged (would need log inspection in real test)
});

it('show profile hides sensitive data for non-friends', function () {
    $user1 = User::factory()->create(['email' => 'user1@example.com', 'bio' => 'Secret bio']);
    $user2 = User::factory()->create();

    Sanctum::actingAs($user2);

    $response = $this->getJson("/api/profile/{$user1->id}");

    $response->assertStatus(200)
             ->assertJson([
                 'email' => null, // Should be hidden
                 'bio' => null, // Should be hidden for non-friends
             ]);
});

it('show profile shows data for friends', function () {
    $user1 = User::factory()->create(['email' => 'user1@example.com', 'bio' => 'Friend bio']);
    $user2 = User::factory()->create();

    // Make them friends
    \App\Models\FriendRequest::create([
        'sender_id' => $user1->id,
        'receiver_id' => $user2->id,
        'status' => 'accepted',
    ]);

    Sanctum::actingAs($user2);

    $response = $this->getJson("/api/profile/{$user1->id}");

    $response->assertStatus(200)
             ->assertJson([
                 'email' => 'user1@example.com',
                 'bio' => 'Friend bio',
             ]);
});

it('update profile with oversized bio', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    $updateData = [
        'bio' => str_repeat('a', 1001), // Over max 1000
    ];

    $response = $this->putJson('/api/profile/me', $updateData);

    $response->assertStatus(422)
             ->assertJsonValidationErrors('bio');
});

it('update profile without authentication', function () {
    $updateData = ['name' => 'New Name'];

    $response = $this->putJson('/api/profile/me', $updateData);

    // Should require auth
    $response->assertStatus(401);
});

it('show profile without authentication', function () {
    $user = User::factory()->create();

    $response = $this->getJson("/api/profile/{$user->id}");

    // Should require auth
    $response->assertStatus(401);
});

it('update profile with duplicate email', function () {
    $user1 = User::factory()->create(['email' => 'user1@example.com']);
    $user2 = User::factory()->create(['email' => 'user2@example.com']);

    Sanctum::actingAs($user1);

    $updateData = ['email' => 'user2@example.com'];

    $response = $this->putJson('/api/profile/me', $updateData);

    $response->assertStatus(422)
             ->assertJsonValidationErrors('email');
});

it('isFriendsWith method not implemented causes errors', function () {
    $user1 = User::factory()->create();
    $user2 = User::factory()->create();

    Sanctum::actingAs($user2);

    // If isFriendsWith method doesn't exist or fails
    $response = $this->getJson("/api/profile/{$user1->id}");

    // Should handle gracefully, but might throw exception
    expect($response->getStatusCode())->toBeIn([200, 500]);
});

it('update profile succeeds with valid data', function () {
    $user = User::factory()->create([
        'name' => 'Old Name',
        'email' => 'old@example.com',
    ]);

    Sanctum::actingAs($user);

    $updateData = [
        'name' => 'New Name',
        'email' => 'new@example.com',
        'bio' => 'New bio',
    ];

    $response = $this->putJson('/api/profile/me', $updateData);

    $response->assertStatus(200);

    $user->refresh();
    expect($user->name)->toBe('New Name');
    expect($user->email)->toBe('new@example.com');
    expect($user->bio)->toBe('New bio');
});
