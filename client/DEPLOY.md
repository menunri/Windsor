# Windsor Client Deployment Configuration

## Vercel Deployment

1. **Connect Repository**
   - Go to [vercel.com](https://vercel.com)
   - Create a new project
   - Connect your GitHub repository

2. **Configure Project**
   - Framework: Vite
   - Root Directory: `client`
   - Build Command: `npm run build`
   - Output Directory: `dist`

3. **Environment Variables**
   Add in Vercel project settings:

   ```
   VITE_API_URL=https://your-windsor-api.onrender.com/api
   ```

4. **Deploy**
   - Vercel will automatically deploy on push to main branch
   - Custom domains can be configured in project settings

## Local Development

1. **Install dependencies**

   ```bash
   cd client
   npm install
   ```

2. **Setup environment**

   ```bash
   cp .env.example .env
   # Edit .env and set your API URL
   ```

3. **Start dev server**

   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   npm run preview
   ```

## Features

### Authentication

- JWT-based authentication with refresh token rotation
- Protected routes for authenticated users
- Persistent sessions

### Pages

- **Home** - Hero section, featured rooms carousel, CTA
- **Search** - Room listing with filters (price, bedrooms, etc.)
- **Room Detail** - Full room info, image gallery, reservation form
- **Auth** - Login, Register, Reset Password
- **Profile** - User profile management
- **My Posts** - Manage room listings
- **Inbox** - Message threads list
- **Threads** - Individual conversation view
- **Reserve** - Room reservation form
- **Move-ins** - Move-in schedule tracking
- **About** - Company info and contact

### Components

- Reusable: RoomCard, LoadingSpinner, ProtectedRoute
- Layout: Navbar, Footer
- Context: AuthContext, ToastContext

### API Integration

- Axios with interceptors for auth
- Automatic token refresh on 401
- Error handling with toast notifications
