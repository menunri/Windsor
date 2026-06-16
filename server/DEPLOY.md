# Windsor API Deployment Configuration

## Render (Backend)

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Configure the following:

### Settings

- **Name:** windsor-api
- **Environment:** Node
- **Build Command:** npm install
- **Start Command:** npm start

### Environment Variables

Add the following in Render's dashboard:

```
PORT=3000
NODE_ENV=production
SUPABASE_URL=your_supabase_url
SUPABASE_DB_PORT=5432
SUPABASE_DB_USER=postgres
SUPABASE_DB_PASSWORD=your_db_password
SUPABASE_DB_NAME=postgres
JWT_SECRET=your_super_secret_jwt_key_at_least_32_chars
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
CLIENT_URL=https://your-frontend.vercel.app
```

## Vercel (Frontend)

1. Create a new project on Vercel
2. Connect your GitHub repository
3. Configure the following:

### Settings

- **Framework:** Vite
- **Root Directory:** ./client
- **Build Command:** npm run build
- **Output Directory:** dist

### Environment Variables

Add in Vercel dashboard:

```
VITE_API_URL=https://windsor-api.onrender.com/api
```

### Rewrite Rules (vercel.json)

The vercel.json already includes proxy to backend for local dev.

For production, update VITE_API_URL to point to your Render backend.

## Database Setup (Supabase)

1. Go to Supabase SQL Editor
2. Run the migration from: `server/migrations/001_initial_schema.sql`
3. This creates all necessary tables:
   - users
   - rooms
   - amenities
   - room_amenities
   - room_reviews
   - reservations
   - move_ins
   - threads
   - messages
   - refresh_tokens
   - password_reset_tokens

## API Endpoints

Base URL: `https://windsor-api.onrender.com/api`

### Authentication

- POST /api/auth/register - Register new user
- POST /api/auth/login - Login user
- POST /api/auth/refresh - Refresh token
- POST /api/auth/logout - Logout user
- POST /api/auth/forgot-password - Request password reset
- POST /api/auth/reset-password - Reset password

### Users

- GET /api/users/me - Get current user
- PUT /api/users/me - Update current user
- PUT /api/users/me/avatar - Update avatar
- GET /api/users/:id - Get user by ID

### Rooms

- GET /api/rooms - List all rooms (with filters)
- GET /api/rooms/:id - Get room details
- POST /api/rooms - Create room (auth required)
- PUT /api/rooms/:id - Update room
- DELETE /api/rooms/:id - Delete room
- GET /api/rooms/:id/availability - Check availability

### Reservations

- GET /api/reservations - List user's reservations
- GET /api/reservations/:id - Get reservation details
- POST /api/reservations - Create reservation
- PUT /api/reservations/:id/cancel - Cancel reservation
- PUT /api/reservations/:id/confirm - Confirm reservation (owner)

### Move-ins

- GET /api/move-ins - List user's move-ins
- GET /api/move-ins/:id - Get move-in details
- POST /api/move-ins - Create move-in
- PUT /api/move-ins/:id - Update move-in

### Threads & Messages

- GET /api/threads - List user's threads
- GET /api/threads/:id - Get thread with messages
- POST /api/threads - Create thread
- PUT /api/threads/:id/read - Mark as read
- GET /api/messages/thread/:threadId - Get messages
- POST /api/messages - Send message
- PUT /api/messages/:id/read - Mark as read
- DELETE /api/messages/:id - Delete message
