<?php

use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\FriendController;
use App\Http\Controllers\API\ProfileController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Authentication routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::get('/me', [AuthController::class, 'me'])->middleware('auth:sanctum');

// Profile routes
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/profile/me', [ProfileController::class, 'showMe']);
    Route::put('/profile/me', [ProfileController::class, 'updateMe']);
});
Route::get('/profile/{userId}', [ProfileController::class, 'show'])->middleware('auth:sanctum');

// Users routes
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/users', [\App\Http\Controllers\API\UserController::class, 'index']);
});

// Friend routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/friends/request/{userId}', [FriendController::class, 'sendRequest']);
    Route::get('/friends/requests', [FriendController::class, 'getRequests']);
    Route::post('/friends/accept/{requestId}', [FriendController::class, 'acceptRequest']);
    Route::post('/friends/reject/{requestId}', [FriendController::class, 'rejectRequest']);
    Route::get('/friends', [FriendController::class, 'getFriends']);
});
