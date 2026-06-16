import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { PageLoader } from '../components/LoadingSpinner'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import api from '../services/api'

export default function MoveInsPage() {
  const [moveIns, setMoveIns] = useState([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const { success, error: showError } = useToast()

  useEffect(() => {
    fetchMoveIns()
  }, [])

  const fetchMoveIns = async () => {
    try {
      const response = await api.get('/move-ins')
      if (response.data.success) {
        setMoveIns(response.data.data.moveIns)
      }
    } catch (error) {
      console.error('Failed to fetch move-ins:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      scheduled: { bg: 'bg-blue-100', text: 'text-blue-700', icon: Calendar },
      completed: { bg: 'bg-secondary-100', text: 'text-secondary-700', icon: CheckCircle },
      cancelled: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle }
    }
    const badge = badges[status] || badges.scheduled
    const Icon = badge.icon

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString([], {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-neutral-900">Move-ins</h1>
          <p className="text-neutral-500">Track your scheduled and completed move-ins</p>
        </div>

        {loading ? (
          <PageLoader />
        ) : moveIns.length > 0 ? (
          <div className="space-y-4">
            {moveIns.map(moveIn => (
              <div key={moveIn.id} className="card p-6">
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    <img
                      src={moveIn.roomImages?.[0] || '/placeholder.jpg'}
                      alt={moveIn.roomTitle}
                      className="w-24 h-24 object-cover rounded-xl bg-neutral-200"
                    />
                    <div>
                      <h3 className="font-semibold text-neutral-900">{moveIn.roomTitle}</h3>
                      <p className="text-sm text-neutral-500">Unit {moveIn.unitNumber}</p>
                      <div className="flex items-center gap-2 mt-2 text-sm text-neutral-600">
                        <Calendar className="w-4 h-4" />
                        {formatDate(moveIn.moveInDate)}
                      </div>
                      {moveIn.comments && (
                        <p className="text-sm text-neutral-500 mt-2">{moveIn.comments}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    {getStatusBadge(moveIn.status)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl">
            <div className="w-16 h-16 mx-auto mb-4 bg-neutral-100 rounded-full flex items-center justify-center">
              <Calendar className="w-8 h-8 text-neutral-400" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
              No move-ins scheduled
            </h3>
            <p className="text-neutral-500 mb-6">
              Once you have a confirmed reservation, you can schedule your move-in date.
            </p>
            <Link to="/search" className="btn btn-primary">
              Browse Rooms
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}