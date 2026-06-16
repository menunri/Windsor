import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AdminAuthContext = createContext(null)

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // Check for stored token and validate on mount
    const token = localStorage.getItem('adminAccessToken')
    if (token) {
      fetchAdmin()
    } else {
      setLoading(false)
    }
  }, [])

  const fetchAdmin = async () => {
    try {
      const response = await api.get('/admin/auth/me')
      if (response.data.success) {
        setAdmin(response.data.data)
        setIsAuthenticated(true)
      }
    } catch (error) {
      console.error('Admin auth check failed:', error)
      localStorage.removeItem('adminAccessToken')
      localStorage.removeItem('adminRefreshToken')
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    const response = await api.post('/admin/auth/login', { email, password })
    const { admin: adminData, accessToken, refreshToken } = response.data.data

    localStorage.setItem('adminAccessToken', accessToken)
    localStorage.setItem('adminRefreshToken', refreshToken)

    setAdmin(adminData)
    setIsAuthenticated(true)

    return response.data
  }

  const logout = () => {
    localStorage.removeItem('adminAccessToken')
    localStorage.removeItem('adminRefreshToken')
    setAdmin(null)
    setIsAuthenticated(false)
  }

  const value = {
    admin,
    loading,
    isAuthenticated,
    login,
    logout,
    fetchAdmin
  }

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext)
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider')
  }
  return context
}

export default AdminAuthContext
