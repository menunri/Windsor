import { useState } from 'react'
import { Calendar, Users, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import api from '../services/api'

export default function ReservePage() {
  const { user, isAuthenticated } = useAuth()
  const { success, error: showError } = useToast()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    roomId: '',
    checkInDate: '',
    checkOutDate: '',
    guestCount: 1,
    specialRequests: ''
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.roomId) newErrors.roomId = 'Please select a room'
    if (!formData.checkInDate) newErrors.checkInDate = 'Check-in date is required'
    if (!formData.checkOutDate) newErrors.checkOutDate = 'Check-out date is required'
    if (formData.checkInDate && formData.checkOutDate) {
      if (new Date(formData.checkOutDate) <= new Date(formData.checkInDate)) {
        newErrors.checkOutDate = 'Check-out must be after check-in'
      }
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/reserve' } })
      return
    }

    setLoading(true)
    try {
      const response = await api.post('/reservations', formData)
      if (response.data.success) {
        success('Reservation created successfully!')
        navigate('/reserve')
      }
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to create reservation')
    } finally {
      setLoading(false)
    }
  }

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-neutral-900">Reserve a Room</h1>
          <p className="text-neutral-500">Fill in the details to make a reservation</p>
        </div>

        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Room Selection */}
            <div>
              <label htmlFor="roomId" className="label">Select Room</label>
              <select
                id="roomId"
                name="roomId"
                value={formData.roomId}
                onChange={handleChange}
                className={`input ${errors.roomId ? 'input-error' : ''}`}
                disabled={loading}
              >
                <option value="">Choose a room...</option>
                <option value="room-1">Standard Room - ₱15,000/month</option>
                <option value="room-2">Deluxe Room - ₱20,000/month</option>
                <option value="room-3">Suite Room - ₱30,000/month</option>
              </select>
              {errors.roomId && (
                <p className="text-sm text-red-500 mt-1">{errors.roomId}</p>
              )}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="checkInDate" className="label">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Check-in Date
                </label>
                <input
                  id="checkInDate"
                  name="checkInDate"
                  type="date"
                  value={formData.checkInDate}
                  onChange={handleChange}
                  min={today}
                  className={`input ${errors.checkInDate ? 'input-error' : ''}`}
                  disabled={loading}
                />
                {errors.checkInDate && (
                  <p className="text-sm text-red-500 mt-1">{errors.checkInDate}</p>
                )}
              </div>
              <div>
                <label htmlFor="checkOutDate" className="label">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Check-out Date
                </label>
                <input
                  id="checkOutDate"
                  name="checkOutDate"
                  type="date"
                  value={formData.checkOutDate}
                  onChange={handleChange}
                  min={formData.checkInDate || today}
                  className={`input ${errors.checkOutDate ? 'input-error' : ''}`}
                  disabled={loading}
                />
                {errors.checkOutDate && (
                  <p className="text-sm text-red-500 mt-1">{errors.checkOutDate}</p>
                )}
              </div>
            </div>

            {/* Guest Count */}
            <div>
              <label htmlFor="guestCount" className="label">
                <Users className="w-4 h-4 inline mr-1" />
                Number of Guests
              </label>
              <select
                id="guestCount"
                name="guestCount"
                value={formData.guestCount}
                onChange={handleChange}
                className="input"
                disabled={loading}
              >
                <option value="1">1 Guest</option>
                <option value="2">2 Guests</option>
                <option value="3">3 Guests</option>
                <option value="4">4 Guests</option>
              </select>
            </div>

            {/* Special Requests */}
            <div>
              <label htmlFor="specialRequests" className="label">Special Requests (Optional)</label>
              <textarea
                id="specialRequests"
                name="specialRequests"
                value={formData.specialRequests}
                onChange={handleChange}
                placeholder="Any special requirements or requests..."
                rows="3"
                className="input resize-none"
                disabled={loading}
              />
            </div>

            {/* Submit */}
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary flex items-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? 'Reserving...' : 'Reserve Room'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}