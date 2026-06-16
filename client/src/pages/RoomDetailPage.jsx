import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { MapPin, Bed, Bath, Square, ArrowLeft, Loader2, MessageSquare, Send } from 'lucide-react'
import { PageLoader } from '../components/LoadingSpinner'
import { useToast } from '../contexts/ToastContext'
import AIChatWidget from '../components/AIChatWidget'
import api from '../services/api'

export default function RoomDetailPage() {
  const { id } = useParams()
  const { showToast } = useToast()

  const [room, setRoom] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [showInquiryForm, setShowInquiryForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [inquiryData, setInquiryData] = useState({
    inquirerName: '',
    inquirerEmail: '',
    inquirerPhone: '',
    message: ''
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
      showToast('Failed to load room details', 'error')
    } finally {
      setLoading(false)
    }
  }

  const validateInquiryForm = () => {
    const errors = []
    if (!inquiryData.inquirerName || inquiryData.inquirerName.trim().length < 2) {
      errors.push('Name must be at least 2 characters')
    }
    if (!inquiryData.inquirerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inquiryData.inquirerEmail)) {
      errors.push('Please enter a valid email address')
    }
    if (!inquiryData.message || inquiryData.message.trim().length < 10) {
      errors.push('Message must be at least 10 characters')
    }
    return errors
  }

  const handleSubmitInquiry = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    // Client-side validation
    const validationErrors = validateInquiryForm()
    if (validationErrors.length > 0) {
      showToast(validationErrors.join('. '), 'error')
      setSubmitting(false)
      return
    }

    try {
      const response = await api.post('/inquiries', {
        roomId: id,
        ...inquiryData
      })

      if (response.data.success) {
        showToast('Inquiry submitted successfully! We will get back to you soon.', 'success')
        setShowInquiryForm(false)
        setInquiryData({
          inquirerName: '',
          inquirerEmail: '',
          inquirerPhone: '',
          message: ''
        })
      }
    } catch (error) {
      const details = error.response?.data?.details
      if (details && details.length > 0) {
        showToast(details.join('. '), 'error')
      } else {
        showToast(error.response?.data?.error || 'Failed to submit inquiry', 'error')
      }
    } finally {
      setSubmitting(false)
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
            Back to rooms
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
                  {room.unitNumber && (
                    <div className="flex items-center gap-1 text-neutral-500 mt-1">
                      <MapPin className="w-4 h-4" />
                      Unit {room.unitNumber}
                      {room.floor && ` • Floor ${room.floor}`}
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

          {/* Sidebar - Inquiry Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-6 shadow-card sticky top-24">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">Interested in this room?</h3>
              
              <div className="mb-4">
                <p className="text-2xl font-bold text-primary-600">
                  ₱{room.price.toLocaleString()}
                  <span className="text-sm font-normal text-neutral-500">/month</span>
                </p>
              </div>

              <p className="text-neutral-600 text-sm mb-4">
                Have questions or want to schedule a viewing? Send us an inquiry and we'll get back to you shortly.
              </p>

              {showInquiryForm ? (
                <form onSubmit={handleSubmitInquiry} className="space-y-4">
                  <div>
                    <label className="label">Your Name *</label>
                    <input
                      type="text"
                      value={inquiryData.inquirerName}
                      onChange={(e) => setInquiryData(prev => ({ ...prev, inquirerName: e.target.value }))}
                      placeholder="Juan Dela Cruz"
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Email Address *</label>
                    <input
                      type="email"
                      value={inquiryData.inquirerEmail}
                      onChange={(e) => setInquiryData(prev => ({ ...prev, inquirerEmail: e.target.value }))}
                      placeholder="juan@email.com"
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Phone Number</label>
                    <input
                      type="tel"
                      value={inquiryData.inquirerPhone}
                      onChange={(e) => setInquiryData(prev => ({ ...prev, inquirerPhone: e.target.value }))}
                      placeholder="09123456789"
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">Your Message *</label>
                    <textarea
                      value={inquiryData.message}
                      onChange={(e) => setInquiryData(prev => ({ ...prev, message: e.target.value }))}
                      placeholder="I'm interested in this room and would like to schedule a viewing..."
                      rows={4}
                      className="input"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn btn-primary w-full flex items-center justify-center gap-2"
                  >
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    {submitting ? 'Sending...' : 'Send Inquiry'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowInquiryForm(false)}
                    className="btn btn-ghost w-full"
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setShowInquiryForm(true)}
                  className="btn btn-primary w-full flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-5 h-5" />
                  Send Inquiry
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* AI Chat Widget */}
      {room && <AIChatWidget room={room} />}
    </div>
  )
}
