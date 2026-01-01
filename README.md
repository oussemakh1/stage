# User Profile and Friend System

A Laravel (API) + React (TypeScript) application featuring user authentication, profiles, and a friend system.

## Features

- User registration and authentication with Laravel Sanctum
- User profiles with bio
- Friend request system
- Only friends can see each other's full bio
- Responsive UI with Tailwind CSS

## Tech Stack

- **Backend**: Laravel 12 (API only)
- **Frontend**: React + TypeScript
- **Authentication**: Laravel Sanctum
- **Database**: MySQL
- **UI**: Tailwind CSS + shadcn/ui components

## Setup Instructions

### Prerequisites

- PHP 8.2+
- Composer
- Node.js 18+
- MySQL
- Git

### Backend Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd <project-directory>
```

2. Install PHP dependencies:
```bash
composer install
```

3. Copy environment file and configure:
```bash
cp .env.example .env
```

4. Configure your `.env` file:
```env
APP_NAME="User Profile System"
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=School
DB_USERNAME=your_mysql_username
DB_PASSWORD=your_mysql_password

# Other configurations...
```

5. Generate application key:
```bash
php artisan key:generate
```

6. Run migrations:
```bash
php artisan migrate
```

7. (Optional) Seed the database with sample users:
```bash
php artisan db:seed
```

### Frontend Setup

1. Install Node.js dependencies:
```bash
npm install
```

2. Build assets:
```bash
npm run build
```

### Running the Application

1. Start the Laravel server:
```bash
php artisan serve
```

2. In another terminal, start the Vite dev server:
```bash
npm run dev
```

3. Open your browser and visit `http://localhost:8000`

## API Endpoints

### Authentication
- `POST /api/register` - Register a new user
- `POST /api/login` - Login user
- `GET /api/me` - Get authenticated user info

### Profile
- `GET /api/profile/me` - Get own profile
- `PUT /api/profile/me` - Update own bio
- `GET /api/profile/{userId}` - Get user's public profile

### Friends
- `GET /api/users` - Get all users
- `POST /api/friends/request/{userId}` - Send friend request
- `GET /api/friends/requests` - Get friend requests
- `POST /api/friends/accept/{requestId}` - Accept friend request
- `POST /api/friends/reject/{requestId}` - Reject friend request
- `GET /api/friends` - Get friends list

## Usage

1. Register a new account or login
2. Update your bio in the profile page
3. Browse users and send friend requests
4. Accept/reject friend requests in the friends page
5. Only friends can see each other's bio

## Project Structure

```
├── app/
│   ├── Http/Controllers/API/     # API Controllers
│   ├── Models/                   # Eloquent Models
│   └── Providers/                # Service Providers
├── database/
│   ├── migrations/               # Database migrations
│   └── factories/                # Model factories
├── resources/
│   └── js/
│       ├── components/           # React components
│       ├── contexts/             # React contexts
│       └── pages/                # React pages
├── routes/
│   ├── api.php                   # API routes
│   └── web.php                   # Web routes
└── README.md
```

## Database Schema

### users table
- id, name, email, password, bio, timestamps

### friend_requests table
- id, sender_id, receiver_id, status, timestamps

## Testing

Run the test suite:
```bash
php artisan test
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## License

This project is open-sourced software licensed under the MIT license.
