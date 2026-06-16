import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})

// Helper function to get auth header
const getAuthHeader = () => {
  const adminToken = localStorage.getItem('adminAccessToken')
  if (adminToken) {
    return { Authorization: `Bearer ${adminToken}` }
  }
  const token = localStorage.getItem('accessToken')
  if (token) {
    return { Authorization: `Bearer ${token}` }
  }
  return {}
}

// Upload a single image file
export const uploadImage = async (file) => {
  const formData = new FormData()
  formData.append('image', file)
  
  const response = await axios.post(`${API_BASE_URL}/upload/image`, formData, {
    headers: {
      ...getAuthHeader(),
      'Content-Type': 'multipart/form-data',
    },
    timeout: 30000,
  })
  
  return response.data
}

// Upload multiple image files
export const uploadImages = async (files) => {
  const formData = new FormData()
  files.forEach((file) => {
    formData.append('images', file)
  })
  
  const response = await axios.post(`${API_BASE_URL}/upload/images`, formData, {
    headers: {
      ...getAuthHeader(),
      'Content-Type': 'multipart/form-data',
    },
    timeout: 60000,
  })
  
  return response.data
}

// Request interceptor - add auth token (checks admin first, then user)
api.interceptors.request.use(
  (config) => {
    // Check for admin token first
    const adminToken = localStorage.getItem('adminAccessToken')
    if (adminToken) {
      config.headers.Authorization = `Bearer ${adminToken}`
      return config
    }
    
    // Fall back to user token
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor - handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // If 401 and haven't tried refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        // Check for admin refresh token first
        const adminRefreshToken = localStorage.getItem('adminRefreshToken')
        if (adminRefreshToken) {
          const response = await axios.post(`${API_BASE_URL}/admin/auth/refresh`, {
            refreshToken: adminRefreshToken,
          })

          const { accessToken } = response.data.data
          localStorage.setItem('adminAccessToken', accessToken)

          originalRequest.headers.Authorization = `Bearer ${accessToken}`
          return api(originalRequest)
        }

        // Fall back to user refresh token
        const refreshToken = localStorage.getItem('refreshToken')
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          })

          const { accessToken } = response.data.data
          localStorage.setItem('accessToken', accessToken)

          originalRequest.headers.Authorization = `Bearer ${accessToken}`
          return api(originalRequest)
        }
      } catch (refreshError) {
        // Refresh failed, logout both admin and user
        localStorage.removeItem('adminAccessToken')
        localStorage.removeItem('adminRefreshToken')
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/admin/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default api
