import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Edit, Trash2, Building, Search } from 'lucide-react'
import api from '../../services/api'
import { useToast } from '../../contexts/ToastContext'

export default function AdminRoomsPage() {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('all')
  const { showToast } = useToast()

  useEffect(() => {
    fetchRooms()
  }, [filter])

  const fetchRooms = async () => {
    try {
      setLoading(true)
      const params = {}
      if (filter === 'active') params.isActive = 'true'
      if (filter === 'inactive') params.isActive = 'false'

      const response = await api.get('/rooms/admin/list', { params })
      if (response.data.success) {
        setRooms(response.data.data.rooms)
      }
    } catch (error) {
      console.error('Failed to fetch rooms:', error)
      showToast('Failed to load rooms', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this room?')) return

    try {
      const response = await api.delete(`/rooms/admin/${id}`)
      if (response.data.success) {
        showToast('Room deleted successfully', 'success')
        fetchRooms()
      }
    } catch (error) {
      showToast('Failed to delete room', 'error')
    }
  }

  const filteredRooms = rooms.filter((room) =>
    room.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Rooms</h2>
          <p className="text-neutral-500">Manage your property listings</p>
        </div>
        <Link
          to="/admin/rooms/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Room
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search rooms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">All Rooms</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Rooms list */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-sm p-8">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-neutral-200 rounded-lg" />
            ))}
          </div>
        </div>
      ) : filteredRooms.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <Building className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-neutral-900 mb-2">No rooms found</h3>
          <p className="text-neutral-500 mb-4">
            {searchTerm ? 'Try adjusting your search' : 'Get started by adding your first room'}
          </p>
          {!searchTerm && (
            <Link
              to="/admin/rooms/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Room
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Room
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {filteredRooms.map((room) => (
                  <tr key={room.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        {room.images && room.images.length > 0 ? (
                          <img
                            src={room.images[0]}
                            alt={room.title}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-neutral-200 rounded-lg flex items-center justify-center">
                            <Building className="w-8 h-8 text-neutral-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-neutral-900">{room.title}</p>
                          <p className="text-sm text-neutral-500 line-clamp-1">
                            {room.description}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-neutral-900">
                        ₱{room.price.toLocaleString()}
                      </p>
                      <p className="text-sm text-neutral-500">per month</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-neutral-600">
                        {room.bedrooms} bed • {room.bathrooms} bath
                      </p>
                      {room.area && (
                        <p className="text-sm text-neutral-500">{room.area} m²</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          room.isActive
                            ? 'bg-secondary-100 text-secondary-700'
                            : 'bg-neutral-100 text-neutral-700'
                        }`}
                      >
                        {room.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/admin/rooms/${room.id}/edit`}
                          className="p-2 text-neutral-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        >
                          <Edit className="w-5 h-5" />
                        </Link>
                        <button
                          onClick={() => handleDelete(room.id)}
                          className="p-2 text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
