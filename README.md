# Windsor Residence - Full Stack Revamp

A complete tech stack migration from vanilla HTML/CSS/JS to a modern React + Express full-stack application.

## Tech Stack

| Layer              | Technology                                   |
| ------------------ | -------------------------------------------- |
| **Frontend**       | React 18, Vite, TailwindCSS, React Router v6 |
| **Backend**        | Express.js, Node.js 18+                      |
| **Database**       | Supabase PostgreSQL                          |
| **Authentication** | JWT + bcryptjs                               |
| **Deployment**     | Vercel (frontend), Render (backend)          |

## Project Structure

```
windsor/
├── client/                 # React frontend (Vite)
│   ├── src/
│   │   ├── components/     # Reusable React components
│   │   ├── contexts/       # Auth & Toast context providers
│   │   ├── pages/          # Page components
│   │   ├── services/       # API service layer
│   │   ├── App.jsx         # Route definitions
│   │   ├── main.jsx        # Entry point
│   │   └── index.css       # Global styles
│   ├── public/             # Static assets
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── server/                 # Express.js backend
│   ├── src/
│   │   ├── config/         # Database configuration
│   │   ├── middleware/      # Auth middleware
│   │   ├── routes/         # API routes
│   │   ├── utils/          # Helper utilities
│   │   └── index.js        # Server entry point
│   ├── migrations/          # Database migrations
│   ├── package.json
│   └── .env.example
│
└── plans/                  # Architecture & planning docs
    └── full-stack-revamp-plan.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase account (for PostgreSQL)
- npm or pnpm

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

4. Run database migration in Supabase SQL Editor:

- Copy contents of `server/migrations/001_initial_schema.sql`
- Execute in Supabase SQL Editor

5. Start the server:

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

### Backend API

- **Authentication**: JWT with access/refresh token rotation
- **Users**: Profile management, avatar upload
- **Rooms**: CRUD operations with filtering and search
- **Reservations**: Create, cancel, confirm bookings
- **Move-ins**: Schedule and track move-in dates
- **Messaging**: Thread-based conversations

### Frontend

- **Responsive Design**: Mobile-first with TailwindCSS
- **Protected Routes**: Auth-gated pages
- **Toast Notifications**: User feedback system
- **Loading States**: Skeleton screens and spinners
- **Image Gallery**: Room photo gallery
- **Room Filtering**: Search by price, bedrooms, etc.

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

## API Endpoints

Base URL: `{your-backend-url}/api`

| Method | Endpoint       | Description            |
| ------ | -------------- | ---------------------- |
| POST   | /auth/register | Register new user      |
| POST   | /auth/login    | Login                  |
| POST   | /auth/refresh  | Refresh token          |
| GET    | /users/me      | Get current user       |
| PUT    | /users/me      | Update profile         |
| GET    | /rooms         | List rooms             |
| GET    | /rooms/:id     | Room details           |
| POST   | /rooms         | Create room            |
| GET    | /reservations  | User's reservations    |
| POST   | /reservations  | Create reservation     |
| GET    | /move-ins      | User's move-ins        |
| GET    | /threads       | User's message threads |
| POST   | /messages      | Send message           |

## License

Private project - Windsor Residence
