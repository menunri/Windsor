import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Star, MapPin, Bed, Bath, Square, ArrowLeft, Loader2, Calendar, MessageSquare } from 'lucide-react'
import { PageLoader } from '../components/LoadingSpinner'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import api from '../services/api'

export default function RoomDetailPage() {
  const { id } = useParams()
  const { isAuthenticated } = useAuth()
  const { success, error: showError } = useToast()
  const navigate = useNavigate()

  const [room, setRoom] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [showReservationForm, setShowReservationForm] = useState(false)
  const [reserving, setReserving] = useState(false)
  const [reservationData, setReservationData] = useState({
    checkInDate: '',
    checkOutDate: '',
    guestCount: 1
  })

  useEffect(() => {
    fetchRoom()
  }, [id])

  const fetchRoom = async () => {
    try {
      const response = await api.get(`/rooms/${id}`)
      if (response.data.success) {
        setRoom(response.data.data)
      }
    } catch (error) {
      showError('Failed to load room details')
    } finally {
      setLoading(false)
    }
  }

  const handleReserve = async (e) => {
    e.preventDefault()
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/rooms/${id}` } })
      return
    }

    setReserving(true)
    try {
      const response = await api.post('/reservations', {
        roomId: id,
        ...reservationData
      })
      if (response.data.success) {
        success('Reservation created successfully!')
        navigate('/reserve')
      }
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to create reservation')
    } finally {
      setReserving(false)
    }
  }

  const today = new Date().toISOString().split('T')[0]

  const handleContactOwner = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/rooms/${id}` } })
      return
    }

    if (!room.ownerId || room.ownerId === user?.id) {
      showError('You cannot message yourself')
      return
    }

    try {
      const response = await api.post('/threads', {
        recipientId: room.ownerId,
        roomId: id,
        initialMessage: `Hi, I'm interested in the room "${room.title}" you listed on Windsor.`
      })
      if (response.data.success) {
        navigate(`/threads/${response.data.data.threadId}`)
      }
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to start conversation')
    }
  }

  if (loading) {
    return <PageLoader />
  }

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-neutral-900 mb-2">Room not found</h2>
          <Link to="/search" className="btn btn-primary">Browse Rooms</Link>
        </div>
      </div>
    )
  }

  const images = room.images?.length > 0 ? room.images : ['/placeholder.jpg']

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Back Button */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            to="/search"
            className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to search
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Image Gallery */}
            <div className="bg-white rounded-xl overflow-hidden mb-6">
              <div className="aspect-[16/9] bg-neutral-200">
                <img
                  src={images[activeImageIndex]}
                  alt={room.title}
                  className="w-full h-full object-cover"
                />
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 p-4 overflow-x-auto scrollbar-hide">
                  {images.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveImageIndex(index)}
                      className={`w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${
                        index === activeImageIndex ? 'border-primary-500' : 'border-transparent'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Room Info */}
            <div className="bg-white rounded-xl p-6 mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-neutral-900">{room.title}</h1>
                  {room.location && (
                    <div className="flex items-center gap-1 text-neutral-500 mt-1">
                      <MapPin className="w-4 h-4" />
                      {room.location}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary-600">
                    ₱{room.price.toLocaleString()}
                  </p>
                  <p className="text-sm text-neutral-500">per month</p>
                </div>
              </div>

              {/* Rating */}
              {room.reviewCount > 0 && (
                <div className="flex items-center gap-2 mb-6">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i < Math.round(room.avgRating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-neutral-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="font-medium text-neutral-700">{room.avgRating.toFixed(1)}</span>
                  <span className="text-neutral-500">({room.reviewCount} reviews)</span>
                </div>
              )}

              {/* Features */}
              <div className="grid grid-cols-3 gap-4 py-6 border-t border-b border-neutral-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Bed className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm text-neutral-500">Bedrooms</p>
                    <p className="font-semibold text-neutral-900">{room.bedrooms}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-secondary-100 rounded-lg flex items-center justify-center">
                    <Bath className="w-5 h-5 text-secondary-600" />
                  </div>
                  <div>
                    <p className="text-sm text-neutral-500">Bathrooms</p>
                    <p className="font-semibold text-neutral-900">{room.bathrooms}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Square className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-neutral-500">Area</p>
                    <p className="font-semibold text-neutral-900">{room.area || 'N/A'} sqm</p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="py-6">
                <h2 className="text-lg font-semibold text-neutral-900 mb-3">Description</h2>
                <p className="text-neutral-600 whitespace-pre-wrap">{room.description}</p>
              </div>

              {/* Amenities */}
              {room.amenities?.length > 0 && (
                <div className="py-6 border-t border-neutral-200">
                  <h2 className="text-lg font-semibold text-neutral-900 mb-3">Amenities</h2>
                  <div className="flex flex-wrap gap-2">
                    {room.amenities.map((amenity, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-neutral-100 text-neutral-700 rounded-full text-sm"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Reservation Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-6 shadow-card sticky top-24">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">Reserve This Room</h3>
              
              <div className="mb-4">
                <p className="text-2xl font-bold text-primary-600">
                  ₱{room.price.toLocaleString()}
                  <span className="text-sm font-normal text-neutral-500">/month</span>
                </p>
              </div>

              {showReservationForm ? (
                <form onSubmit={handleReserve} className="space-y-4">
                  <div>
                    <label className="label">Check-in Date</label>
                    <input
                      type="date"
                      value={reservationData.checkInDate}
                      onChange={(e) => setReservationData(prev => ({ ...prev, checkInDate: e.target.value }))}
                      min={today}
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Check-out Date</label>
                    <input
                      type="date"
                      value={reservationData.checkOutDate}
                      onChange={(e) => setReservationData(prev => ({ ...prev, checkOutDate: e.target.value }))}
                      min={reservationData.checkInDate || today}
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Number of Guests</label>
                    <select
                      value={reservationData.guestCount}
                      onChange={(e) => setReservationData(prev => ({ ...prev, guestCount: parseInt(e.target.value) }))}
                      className="input"
                    >
                      <option value="1">1 Guest</option>
                      <option value="2">2 Guests</option>
                      <option value="3">3 Guests</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={reserving}
                    className="btn btn-primary w-full flex items-center justify-center gap-2"
                  >
                    {reserving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {reserving ? 'Reserving...' : 'Reserve Now'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowReservationForm(false)}
                    className="btn btn-ghost w-full"
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setShowReservationForm(true)}
                  className="btn btn-primary w-full flex items-center justify-center gap-2"
                >
                  <Calendar className="w-5 h-5" />
                  Reserve Room
                </button>
              )}

              {/* Contact Owner Button */}
              {room.ownerId && room.ownerId !== user?.id && (
                <button
                  onClick={handleContactOwner}
                  className="btn btn-secondary w-full flex items-center justify-center gap-2 mt-3"
                >
                  <MessageSquare className="w-5 h-5" />
                  Contact Owner
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}