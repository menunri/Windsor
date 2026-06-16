import { Routes, Route } from 'react-router-dom'
import { AdminAuthProvider } from './contexts/AdminAuthContext'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import SearchPage from './pages/SearchPage'
import RoomDetailPage from './pages/RoomDetailPage'
import AboutPage from './pages/AboutPage'
import AdminLoginPage from './pages/admin/LoginPage'
import AdminDashboardPage from './pages/admin/DashboardPage'
import AdminRoomsPage from './pages/admin/RoomsPage'
import AdminRoomFormPage from './pages/admin/RoomFormPage'
import AdminInquiriesPage from './pages/admin/InquiriesPage'
import AdminInquiryDetailPage from './pages/admin/InquiryDetailPage'
import AdminLayout from './components/AdminLayout'
import AdminProtectedRoute from './components/AdminProtectedRoute'

export default function App() {
  return (
    <AdminAuthProvider>
      <Routes>
        {/* Public routes with layout */}
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="rooms/:id" element={<RoomDetailPage />} />
          <Route path="about" element={<AboutPage />} />
        </Route>

        {/* Admin routes */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route
          path="/admin"
          element={
            <AdminProtectedRoute>
              <AdminLayout />
            </AdminProtectedRoute>
          }
        >
          <Route index element={<AdminDashboardPage />} />
          <Route path="rooms" element={<AdminRoomsPage />} />
          <Route path="rooms/new" element={<AdminRoomFormPage />} />
          <Route path="rooms/:id/edit" element={<AdminRoomFormPage />} />
          <Route path="inquiries" element={<AdminInquiriesPage />} />
          <Route path="inquiries/:id" element={<AdminInquiryDetailPage />} />
        </Route>
      </Routes>
    </AdminAuthProvider>
  )
}
