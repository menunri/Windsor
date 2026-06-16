import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Edit2, Trash2, Loader2, Eye } from 'lucide-react'
import { PageLoader, CardSkeleton } from '../components/LoadingSpinner'
import { useToast } from '../contexts/ToastContext'
import api from '../services/api'

export default function MyPostsPage() {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)

  const { success, error: showError } = useToast()

  useEffect(() => {
    fetchMyRooms()
  }, [])

  const fetchMyRooms = async () => {
    try {
      const response = await api.get('/users/me/rooms')
      if (response.data.success) {
        setRooms(response.data.data.rooms)
      }
    } catch (error) {
      console.error('Failed to fetch rooms:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (roomId) => {
    if (!confirm('Are you sure you want to delete this room?')) return

    setDeletingId(roomId)
    try {
      await api.delete(`/rooms/${roomId}`)
      setRooms(prev => prev.filter(r => r.id !== roomId))
      success('Room deleted successfully')
    } catch (error) {
      showError('Failed to delete room')
    } finally {
      setDeletingId(null)
    }
  }

  const toggleActive = async (room) => {
    try {
      const response = await api.put(`/rooms/${room.id}`, { isActive: !room.isActive })
      if (response.data.success) {
        setRooms(prev => prev.map(r => r.id === room.id ? response.data.data : r))
        success(`Room ${room.isActive ? 'deactivated' : 'activated'} successfully`)
      }
    } catch (error) {
      showError('Failed to update room status')
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">My Posts</h1>
            <p className="text-neutral-500">Manage your room listings</p>
          </div>
          <Link to="/rooms/new" className="btn btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add New Room
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : rooms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {rooms.map(room => (
              <div key={room.id} className="card p-4 flex gap-4">
                <img
                  src={room.images?.[0] || '/placeholder.jpg'}
                  alt={room.title}
                  className="w-32 h-24 object-cover rounded-lg bg-neutral-200"
                />
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-neutral-900 line-clamp-1">
                        {room.title}
                      </h3>
                      <p className="text-sm text-neutral-500">
                        ₱{room.price.toLocaleString()}/month
                      </p>
                      <span className={`badge mt-2 ${room.isActive ? 'badge-secondary' : 'bg-neutral-100 text-neutral-500'}`}>
                        {room.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleActive(room)}
                        className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                        title={room.isActive ? 'Deactivate' : 'Activate'}
                      >
                        <Eye className="w-4 h-4 text-neutral-600" />
                      </button>
                      <Link
                        to={`/rooms/${room.id}/edit`}
                        className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4 text-neutral-600" />
                      </Link>
                      <button
                        onClick={() => handleDelete(room.id)}
                        disabled={deletingId === room.id}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        {deletingId === room.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                        ) : (
                          <Trash2 className="w-4 h-4 text-red-500" />
                        )}
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-neutral-400 mt-2">
                    {room.bedrooms} bed • {room.bathrooms} bath • {room.area} sqm
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl">
            <div className="w-16 h-16 mx-auto mb-4 bg-neutral-100 rounded-full flex items-center justify-center">
              <Plus className="w-8 h-8 text-neutral-400" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
              No rooms yet
            </h3>
            <p className="text-neutral-500 mb-6">
              Start listing your rooms to attract potential tenants.
            </p>
            <Link to="/rooms/new" className="btn btn-primary">
              Create Your First Room
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}