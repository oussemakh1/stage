# FriendController Failure Scenarios

This document outlines potential failure scenarios in the FriendController that can break the application, along with test cases that demonstrate these issues.

## Critical Issues Found

### 1. Missing Case for Rejected Friend Requests
**Problem**: Users cannot send new friend requests after a previous request was rejected.

**Code Location**: `app/Http/Controllers/API/FriendController.php:30-33`

**Current Code**:
```php
if ($existingRequest && $existingRequest->status === 'pending') {
    return response()->json(['message' => 'Friend request already exists'], 400);
}
```

**Issue**: Only checks for 'pending' status, ignores 'rejected' requests.

**Test Scenario**: `FriendControllerTest::test_cannot_send_request_after_rejection`

### 2. Exception Handling with firstOrFail()
**Problem**: `firstOrFail()` throws exceptions instead of returning proper API responses.

**Code Location**: `app/Http/Controllers/API/FriendController.php:55-58, 69-72`

**Current Code**:
```php
$friendRequest = FriendRequest::where('id', $requestId)
    ->where('receiver_id', $user->id)
    ->where('status', 'pending')
    ->firstOrFail();
```

**Issue**: Throws `ModelNotFoundException` (500 error) instead of 404 JSON response.

**Test Scenario**: `FriendControllerTest::test_accept_nonexistent_request_throws_exception`

### 3. Race Condition in Friend Request Creation
**Problem**: Multiple simultaneous requests can create duplicate friend requests.

**Code Location**: `app/Http/Controllers/API/FriendController.php:24-33`

**Current Code**:
```php
$existingRequest = FriendRequest::where(/* complex query */)->first();
if ($existingRequest && $existingRequest->status === 'pending') {
    return response()->json(['message' => 'Friend request already exists'], 400);
}
```

**Issue**: No database-level constraints or atomic operations.

**Test Scenario**: `FriendControllerTest::test_concurrent_friend_requests_create_duplicates`

### 4. No Database Transactions
**Problem**: Database operations are not atomic, can leave inconsistent state.

**Code Location**: `app/Http/Controllers/API/FriendController.php:35-41`

**Current Code**:
```php
$friendRequest = FriendRequest::create([
    'sender_id' => $sender->id,
    'receiver_id' => $receiver->id,
    'status' => 'pending',
]);
```

**Issue**: No transaction wrapping for data consistency.

**Test Scenario**: `FriendControllerTest::test_database_failure_leaves_orphaned_data`

### 5. Performance Issue in getFriends()
**Problem**: Returns loaded collection instead of query builder.

**Code Location**: `app/Http/Controllers/API/FriendController.php:80-87`

**Current Code**:
```php
$friends = $user->friends(); // Returns Collection
return response()->json($friends);
```

**Issue**: Loads all friends into memory, poor performance.

**Test Scenario**: `FriendControllerTest::test_get_friends_with_many_friends_causes_memory_issues`

### 6. Missing Input Validation
**Problem**: No validation on route parameters.

**Code Location**: `app/Http/Controllers/API/FriendController.php:12`

**Current Code**:
```php
public function sendRequest(Request $request, $userId)
```

**Issue**: `$userId` not validated for type, existence, or accessibility.

**Test Scenario**: `FriendControllerTest::test_send_request_with_invalid_user_id`

### 7. No Rate Limiting
**Problem**: No protection against spam friend requests.

**Code Location**: All methods in FriendController

**Issue**: Users can spam requests without limits.

**Test Scenario**: `FriendControllerTest::test_no_rate_limiting_allows_spam`

### 8. Missing Authorization Checks
**Problem**: No verification of user permissions for friend operations.

**Code Location**: All methods in FriendController

**Issue**: Unauthorized access possible.

**Test Scenario**: `FriendControllerTest::test_unauthorized_user_can_access_friend_endpoints`

### 9. Inconsistent Error Responses
**Problem**: Mix of JSON responses and exceptions.

**Code Location**: Various locations

**Issue**: Inconsistent API behavior.

**Test Scenario**: `FriendControllerTest::test_error_responses_are_inconsistent`

### 10. N+1 Query Problem
**Problem**: Potential for additional database queries.

**Code Location**: `app/Http/Controllers/API/FriendController.php:47-49`

**Current Code**:
```php
$requests = $user->receivedFriendRequests()->with('sender')->where('status', 'pending')->get();
```

**Issue**: May still cause N+1 queries if relationships not properly loaded.

**Test Scenario**: `FriendControllerTest::test_get_requests_causes_n_plus_one_queries`

## Test Implementation

See `tests/Feature/FriendControllerTest.php` for test cases that demonstrate these failure scenarios.

## Recommended Fixes

1. **Handle rejected requests**: Check for 'rejected' status and allow new requests
2. **Replace `firstOrFail()`**: Use `first()` and return proper 404 responses
3. **Add database transactions**: Wrap operations in `DB::transaction()`
4. **Implement unique constraints**: Add database constraints to prevent duplicates
5. **Add input validation**: Use Laravel validation rules
6. **Implement rate limiting**: Add throttle middleware
7. **Add authorization**: Use Laravel policies
8. **Optimize queries**: Use eager loading and pagination
9. **Standardize errors**: Return consistent JSON error format
10. **Add comprehensive tests**: Cover all edge cases and failure scenarios
