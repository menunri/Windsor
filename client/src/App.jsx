import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import SearchPage from './pages/SearchPage'
import RoomDetailPage from './pages/RoomDetailPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ProfilePage from './pages/ProfilePage'
import MyPostsPage from './pages/MyPostsPage'
import InboxPage from './pages/InboxPage'
import ThreadsPage from './pages/ThreadsPage'
import PostsPage from './pages/PostsPage'
import ReservePage from './pages/ReservePage'
import MoveInsPage from './pages/MoveInsPage'
import AboutPage from './pages/AboutPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import ProtectedRoute from './components/ProtectedRoute'

export default function App() {
  return (
    <Routes>
      {/* Public routes with layout */}
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="rooms/:id" element={<RoomDetailPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="reset-password" element={<ResetPasswordPage />} />

        {/* Protected routes */}
        <Route path="profile" element={
          <ProtectedRoute><ProfilePage /></ProtectedRoute>
        } />
        <Route path="my-posts" element={
          <ProtectedRoute><MyPostsPage /></ProtectedRoute>
        } />
        <Route path="inbox" element={
          <ProtectedRoute><InboxPage /></ProtectedRoute>
        } />
        <Route path="threads/:id" element={
          <ProtectedRoute><ThreadsPage /></ProtectedRoute>
        } />
        <Route path="posts" element={
          <ProtectedRoute><PostsPage /></ProtectedRoute>
        } />
        <Route path="reserve" element={
          <ProtectedRoute><ReservePage /></ProtectedRoute>
        } />
        <Route path="move-ins" element={
          <ProtectedRoute><MoveInsPage /></ProtectedRoute>
        } />
      </Route>
    </Routes>
  )
}