import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom'
import { Home, Building, MessageSquare, LogOut, Menu, X, BarChart3 } from 'lucide-react'
import { useState } from 'react'
import { useAdminAuth } from '../contexts/AdminAuthContext'
import { useToast } from '../contexts/ToastContext'

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { logout, admin } = useAdminAuth()
  const { showToast } = useToast()

  const handleLogout = () => {
    logout()
    showToast('Logged out successfully', 'success')
    navigate('/admin/login')
  }

  const navItems = [
    { path: '/admin', icon: Home, label: 'Dashboard' },
    { path: '/admin/rooms', icon: Building, label: 'Rooms' },
    { path: '/admin/inquiries', icon: MessageSquare, label: 'Inquiries' },
  ]

  const isActive = (path) => {
    if (path === '/admin') {
      return location.pathname === '/admin'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <div className="min-h-screen bg-neutral-100">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-neutral-900 text-white transform transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-800">
          <Link to="/admin" className="flex items-center gap-2">
            <img src="/w-icon.svg" alt="Windsor" className="w-8 h-8" />
            <span className="font-bold text-lg">Windsor Admin</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 hover:bg-neutral-800 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Admin info */}
        <div className="p-4 border-b border-neutral-800">
          <p className="text-sm text-neutral-400">Logged in as</p>
          <p className="font-medium truncate">{admin?.name || 'Admin'}</p>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive(item.path)
                  ? 'bg-primary-600 text-white'
                  : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
              }`}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Bottom actions */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-neutral-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-neutral-300 hover:bg-neutral-800 hover:text-white rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white border-b px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 hover:bg-neutral-100 rounded-lg"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-2">
            <Link
              to="/"
              target="_blank"
              className="text-sm text-neutral-500 hover:text-neutral-700"
            >
              View Site
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6"><Outlet /></main>
      </div>
    </div>
  )
}
