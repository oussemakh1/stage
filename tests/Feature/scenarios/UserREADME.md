# UserController Failure Scenarios

This document outlines potential failure scenarios in the UserController that can break the application, along with test cases that demonstrate these issues.

## Critical Issues Found

### 1. N+1 Query Problem in User Listing
**Problem**: Multiple database queries executed for each user relationship check.

**Code Location**: `app/Http/Controllers/API/UserController.php:16-34`

**Current Code**:
```php
$sentFriendIds = $user->sentFriendRequests()
    ->where('status', 'accepted')
    ->pluck('receiver_id');

$receivedFriendIds = $user->receivedFriendRequests()
    ->where('status', 'accepted')
    ->pluck('sender_id');

// Similar for pending requests
```

**Issue**: Separate queries for each relationship type, causing N+1 problems.

**Test Scenario**: `UserControllerTest::test_index_causes_n_plus_one_queries_with_many_users`

### 2. Performance Issues with Large Datasets
**Problem**: No pagination or limits on user listing, causing memory and performance issues.

**Code Location**: `app/Http/Controllers/API/UserController.php:42-43`

**Current Code**:
```php
$users = User::whereNotIn('id', $excludeIds)
    ->get(['id', 'name', 'email', 'bio', 'created_at'])
```

**Issue**: Loads all users into memory without pagination.

**Test Scenario**: `UserControllerTest::test_index_with_large_dataset_causes_memory_issues`

### 3. Complex Query Logic Prone to Errors
**Problem**: Complex exclusion and inclusion logic for friends and pending requests.

**Code Location**: `app/Http/Controllers/API/UserController.php:15-40`

**Current Code**:
```php
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
```

**Issue**: Logic errors could include/exclude wrong users.

**Test Scenario**: `UserControllerTest::test_index_excludes_friends_incorrectly`

### 4. No Caching of Relationship Data
**Problem**: Relationship data recalculated on every request.

**Code Location**: All relationship queries

**Issue**: Expensive queries run repeatedly for same data.

**Test Scenario**: `UserControllerTest::test_index_with_many_friends_causes_performance_issues`

### 5. Potential Memory Leaks with Large Collections
**Problem**: Large collections kept in memory during processing.

**Code Location**: `app/Http/Controllers/API/UserController.php:42-60`

**Current Code**:
```php
$users = User::whereNotIn('id', $excludeIds)
    ->get(['id', 'name', 'email', 'bio', 'created_at'])
    ->map(function ($otherUser) use ($pendingSentIds, $pendingReceivedIds) {
        // Processing each user
    });
```

**Issue**: All users loaded and processed in memory.

**Test Scenario**: `UserControllerTest::test_index_with_large_dataset_causes_memory_issues`

### 6. Inefficient Array Operations
**Problem**: Multiple array operations on collections.

**Code Location**: `app/Http/Controllers/API/UserController.php:24-40`

**Issue**: `toArray()`, `merge()`, `push()`, `unique()` operations on large datasets.

**Test Scenario**: `UserControllerTest::test_index_performance_degrades_with_relationship_complexity`

### 7. No Rate Limiting
**Problem**: No protection against spam user listing requests.

**Code Location**: `app/Http/Controllers/API/UserController.php:11-62`

**Issue**: Users can request user lists rapidly.

**Test Scenario**: N/A - would need rapid request test

### 8. Hard-coded Data Hiding
**Problem**: Email and bio always hidden, no flexibility.

**Code Location**: `app/Http/Controllers/API/UserController.php:54-55`

**Current Code**:
```php
'email' => null, 
'bio' => null,
```

**Issue**: No logic for showing data to friends.

**Test Scenario**: `UserControllerTest::test_index_hides_email_and_bio_for_all_users`

### 9. Missing Relationship Validation
**Problem**: Assumes relationship methods exist and work correctly.

**Code Location**: `app/Http/Controllers/API/UserController.php:16-34`

**Issue**: If User model relationships not properly defined, queries fail.

**Test Scenario**: `UserControllerTest::test_index_with_broken_relationships_throws_exceptions`

### 10. No Query Optimization
**Problem**: No eager loading or query optimization.

**Code Location**: All relationship queries

**Issue**: Lazy loading causes additional queries.

**Test Scenario**: `UserControllerTest::test_index_causes_n_plus_one_queries_with_many_users`

## Test Implementation

See `tests/Feature/scenarios/UserControllerTest.php` for test cases that demonstrate these failure scenarios.

## Recommended Fixes

1. **Add pagination**: Implement paginated responses for large datasets
2. **Optimize queries**: Use eager loading and combine relationship queries
3. **Add caching**: Cache relationship data for performance
4. **Implement rate limiting**: Add throttle middleware
5. **Refactor logic**: Simplify user exclusion/inclusion logic
6. **Add database indexes**: Index foreign keys for better query performance
7. **Use chunking**: Process users in chunks for large datasets
8. **Add query logging**: Monitor and optimize slow queries
9. **Implement flexible privacy**: Allow friends to see more data
10. **Add comprehensive tests**: Cover all edge cases and performance scenarios
