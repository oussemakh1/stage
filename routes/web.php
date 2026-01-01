<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

// Auth pages (no auth required since auth is handled by API/context)
Route::get('/register', function () {
    return Inertia::render('auth/register');
})->name('register');

Route::get('/login', function () {
    return Inertia::render('auth/login');
})->name('login');

// Protected pages (auth handled by frontend context)
Route::get('/profile', function () {
    return Inertia::render('profile');
})->name('profile');

Route::get('/users', function () {
    return Inertia::render('users');
})->name('users');

Route::get('/friends', function () {
    return Inertia::render('friends');
})->name('friends');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
});

require __DIR__.'/settings.php';
