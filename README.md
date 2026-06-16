# Windsor Residence - Inquiry Website

A modern inquiry-based website for Windsor Residence where public users can browse rooms and submit inquiries without registration, while administrators can manage rooms and respond to user inquiries.

## Tech Stack

| Layer              | Technology                                   |
| ------------------ | -------------------------------------------- |
| **Frontend**       | React 18, Vite, TailwindCSS, React Router v6 |
| **Backend**        | Express.js, Node.js 18+                      |
| **Database**       | Supabase PostgreSQL                          |
| **Authentication** | JWT + bcryptjs (Admin only)                  |
| **Deployment**     | Vercel (frontend), Render (backend)          |

## Project Structure

```
windsor/
├── client/                 # React frontend (Vite)
│   ├── src/
│   │   ├── components/     # Reusable React components
│   │   ├── contexts/        # AdminAuth & Toast context providers
│   │   ├── pages/           # Page components
│   │   │   └── admin/       # Admin panel pages
│   │   ├── services/        # API service layer
│   │   ├── utils/           # Utility functions
│   │   ├── App.jsx          # Route definitions
│   │   ├── main.jsx         # Entry point
│   │   └── index.css        # Global styles
│   ├── public/              # Static assets
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── server/                 # Express.js backend
│   ├── src/
│   │   ├── config/          # Database configuration
│   │   ├── middleware/       # Auth middleware
│   │   ├── routes/          # API routes
│   │   ├── utils/           # Helper utilities
│   │   └── index.js         # Server entry point
│   ├── migrations/           # Database migrations
│   ├── package.json
│   └── .env.example
│
├── plans/                  # Architecture & planning docs
│   └── inquiry-website-revamp-plan.md
```

## Key Changes (v2.0)

- **Public users**: No registration required - browse rooms and submit inquiries directly
- **Admin panel**: Separate admin dashboard for managing rooms and inquiries
- **Inquiry system**: Users submit inquiries; admins reply through the dashboard

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase account (for PostgreSQL)
- npm or pnpm

### Database Setup

1. Create a new Supabase project or use existing one
2. Run the database migrations in Supabase SQL Editor:

   **Migration 1** (`server/migrations/001_initial_schema.sql`):
   - Creates `rooms`, `amenities`, `room_amenities`, and related tables

   **Migration 2** (`server/migrations/002_inquiry_schema.sql`):
   - Creates `admin_users`, `inquiries`, and `inquiry_replies` tables
   - Inserts a default admin user (change password in production!)

### Backend Setup

1. Navigate to server directory:

```bash
cd server
```

2. Install dependencies:

```bash
npm install
```

3. Configure environment:

```bash
cp .env.example .env
# Edit .env with your Supabase credentials and JWT secret
```

4. Start the server:

```bash
npm run dev    # Development with auto-reload
npm start      # Production
```

### Frontend Setup

1. Navigate to client directory:

```bash
cd client
```

2. Install dependencies:

```bash
npm install
```

3. Configure environment:

```bash
cp .env.example .env
# Set VITE_API_URL to your backend URL
```

4. Start the dev server:

```bash
npm run dev
```

5. Build for production:

```bash
npm run build
npm run preview
```

## Features

### Public Website (No Auth Required)

- **Home Page**: Hero section, featured rooms, quick links
- **Room Search**: Filter by price, bedrooms, bathrooms
- **Room Details**: Image gallery, amenities, inquiry form
- **About Page**: Company info, contact details

### Admin Panel (Auth Required)

- **Dashboard**: Statistics overview (rooms, inquiries)
- **Room Management**: Create, edit, delete, activate/deactivate rooms
- **Inquiry Management**: View inquiries, send replies, update status

## API Endpoints

### Public Endpoints (No Auth)

| Method | Endpoint   | Description       |
| ------ | ---------- | ----------------- |
| GET    | /rooms     | List active rooms |
| GET    | /rooms/:id | Room details      |
| POST   | /inquiries | Submit inquiry    |

### Admin Endpoints (Auth Required)

| Method | Endpoint                         | Description           |
| ------ | -------------------------------- | --------------------- |
| POST   | /admin/auth/login                | Admin login           |
| POST   | /admin/auth/logout               | Admin logout          |
| GET    | /admin/auth/me                   | Get current admin     |
| GET    | /rooms/admin/list                | List all rooms        |
| POST   | /rooms/admin                     | Create room           |
| PUT    | /rooms/admin/:id                 | Update room           |
| DELETE | /rooms/admin/:id                 | Delete room           |
| GET    | /inquiries/admin/list            | List all inquiries    |
| GET    | /inquiries/admin/:id             | Inquiry details       |
| PUT    | /inquiries/admin/:id             | Update inquiry status |
| POST   | /inquiries/admin/:id/reply       | Reply to inquiry      |
| GET    | /inquiries/admin/dashboard/stats | Dashboard stats       |

## Default Admin Credentials

After running migration 002, a default admin is created:

- **Email**: admin@windsor.com
- **Password**: admin123

⚠️ **IMPORTANT**: Change this password immediately in production!

## Deployment

See individual `DEPLOY.md` files in `client/` and `server/` directories for detailed deployment instructions.

### Quick Summary

**Backend (Render)**:

- Connect GitHub repo
- Set environment variables
- Deploy with `npm start`

**Frontend (Vercel)**:

- Connect GitHub repo
- Set `VITE_API_URL` environment variable
- Automatic deploys on push

## License

Private project - Windsor Residence
