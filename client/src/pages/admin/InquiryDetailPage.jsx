import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Send, Mail, Phone, Clock, MessageSquare, X, CheckCircle, Sparkles, Loader2 } from 'lucide-react'
import api from '../../services/api'
import { useToast } from '../../contexts/ToastContext'
import { formatDateTime } from '../../utils/date'

export default function AdminInquiryDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [inquiry, setInquiry] = useState(null)
  const [loading, setLoading] = useState(true)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  // AI reply suggestions state
  const [suggestions, setSuggestions] = useState([])
  const [suggestionCategory, setSuggestionCategory] = useState('')
  const [suggestionSentiment, setSuggestionSentiment] = useState('')
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)

  useEffect(() => {
    fetchInquiry()
  }, [id])

  // Fetch AI reply suggestions
  const fetchReplySuggestions = async () => {
    if (!inquiry) return
    
    setLoadingSuggestions(true)
    try {
      const response = await api.post('/ai/suggest-reply', {
        inquiryId: id,
        inquiryData: {
          inquirerName: inquiry.inquirerName,
          inquirerEmail: inquiry.inquirerEmail,
          subject: inquiry.subject,
          message: inquiry.message
        }
      })
      
      if (response.data.success) {
        setSuggestions(response.data.data.suggestions || [])
        setSuggestionCategory(response.data.data.category || '')
        setSuggestionSentiment(response.data.data.sentiment || '')
        setShowSuggestions(true)
      }
    } catch (error) {
      console.error('Failed to fetch reply suggestions:', error)
    } finally {
      setLoadingSuggestions(false)
    }
  }

  // Apply a suggestion to the reply textarea
  const applySuggestion = (text) => {
    // Replace placeholders with actual values
    let processedText = text
      .replace(/\[GUEST_NAME\]/g, inquiry.inquirerName || 'Guest')
      .replace(/\[ROOM_NAME\]/g, inquiry.room?.title || '')
      .replace(/\[ROOM_NUMBER\]/g, inquiry.room?.unitNumber || '')
    
    setReply(processedText)
  }

  const fetchInquiry = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/inquiries/admin/${id}`)
      if (response.data.success) {
        setInquiry(response.data.data)
      }
    } catch (error) {
      showToast('Failed to load inquiry', 'error')
      navigate('/admin/inquiries')
    } finally {
      setLoading(false)
    }
  }

  const handleSendReply = async (e) => {
    e.preventDefault()
    if (!reply.trim()) return

    setSending(true)
    try {
      const response = await api.post(`/inquiries/admin/${id}/reply`, {
        message: reply.trim(),
      })
      if (response.data.success) {
        showToast('Reply sent successfully', 'success')
        setReply('')
        fetchInquiry()
      }
    } catch (error) {
      showToast(error.response?.data?.error || 'Failed to send reply', 'error')
    } finally {
      setSending(false)
    }
  }

  const handleUpdateStatus = async (newStatus) => {
    setUpdatingStatus(true)
    try {
      const response = await api.put(`/inquiries/admin/${id}`, {
        status: newStatus,
      })
      if (response.data.success) {
        showToast('Status updated', 'success')
        fetchInquiry()
      }
    } catch (error) {
      showToast('Failed to update status', 'error')
    } finally {
      setUpdatingStatus(false)
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 w-48 bg-neutral-200 rounded mb-4" />
        <div className="h-96 bg-neutral-200 rounded-xl" />
      </div>
    )
  }

  if (!inquiry) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-500">Inquiry not found</p>
        <Link to="/admin/inquiries" className="text-primary-600 hover:underline mt-2 inline-block">
          Back to inquiries
        </Link>
      </div>
    )
  }

  const statusConfig = {
    pending: { color: 'text-amber-600 bg-amber-50', label: 'Pending' },
    replied: { color: 'text-secondary-700 bg-secondary-50', label: 'Replied' },
    closed: { color: 'text-neutral-600 bg-neutral-100', label: 'Closed' },
  }
  const currentStatus = statusConfig[inquiry.status] || statusConfig.pending

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/admin/inquiries"
          className="inline-flex items-center gap-2 text-neutral-500 hover:text-neutral-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Inquiries
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-neutral-900">Inquiry Details</h2>
            <p className="text-neutral-500">
              Received {formatDateTime(inquiry.createdAt)}
            </p>
          </div>
          <span
            className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${currentStatus.color}`}
          >
            {currentStatus.label}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Inquiry message */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">User Message</h3>
            <div className="bg-neutral-50 rounded-lg p-4">
              <p className="text-neutral-700 whitespace-pre-wrap">{inquiry.message}</p>
            </div>
          </div>

          {/* Replies */}
          {inquiry.replies && inquiry.replies.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                Replies ({inquiry.replies.length})
              </h3>
              <div className="space-y-4">
                {inquiry.replies.map((r) => (
                  <div key={r.id} className="bg-primary-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-primary-700">{r.adminName}</span>
                      <span className="text-sm text-neutral-500">
                        {formatDateTime(r.createdAt)}
                      </span>
                    </div>
                    <p className="text-neutral-700 whitespace-pre-wrap">{r.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reply form */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-neutral-900">Send Reply</h3>
              {!showSuggestions && (
                <button
                  type="button"
                  onClick={fetchReplySuggestions}
                  disabled={loadingSuggestions}
                  className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-primary-100 hover:bg-primary-200 text-primary-700 rounded-full transition-colors disabled:opacity-50"
                >
                  {loadingSuggestions ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3" />
                      Get AI Suggestions
                    </>
                  )}
                </button>
              )}
            </div>

            {/* AI Suggestions Panel */}
            {showSuggestions && (
              <div className="mb-4 bg-primary-50 border border-primary-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary-600" />
                    <span className="font-medium text-primary-800">AI Suggestions</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowSuggestions(false)}
                    className="text-primary-600 hover:text-primary-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="mb-2 text-sm text-primary-700">
                  <span className="font-medium">Category:</span> {suggestionCategory} |{' '}
                  <span className="font-medium">Sentiment:</span> {suggestionSentiment}
                </div>

                <div className="space-y-2">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => applySuggestion(suggestion.text)}
                      className="w-full text-left p-3 bg-white hover:bg-primary-100 rounded-lg border border-primary-200 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-primary-600 font-medium">
                          Confidence: {Math.round((suggestion.confidence || 0) * 100)}%
                        </span>
                      </div>
                      <p className="text-sm text-neutral-700 line-clamp-2">{suggestion.text}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSendReply}>
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Type your reply..."
                rows={4}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 mb-4"
              />
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleUpdateStatus('closed')}
                  disabled={updatingStatus || inquiry.status === 'closed'}
                  className="px-4 py-2 text-neutral-600 hover:text-neutral-800 disabled:opacity-50"
                >
                  Mark as Closed
                </button>
                <button
                  type="submit"
                  disabled={sending || !reply.trim()}
                  className="inline-flex items-center gap-2 px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {sending ? 'Sending...' : 'Send Reply'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Inquirer info */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">Inquirer Info</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-700 font-semibold">
                    {inquiry.inquirerName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-neutral-900">{inquiry.inquirerName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-neutral-600">
                <Mail className="w-5 h-5" />
                <a href={`mailto:${inquiry.inquirerEmail}`} className="hover:text-primary-600">
                  {inquiry.inquirerEmail}
                </a>
              </div>
              {inquiry.inquirerPhone && (
                <div className="flex items-center gap-3 text-neutral-600">
                  <Phone className="w-5 h-5" />
                  <a href={`tel:${inquiry.inquirerPhone}`} className="hover:text-primary-600">
                    {inquiry.inquirerPhone}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Room info */}
          {inquiry.room && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">Related Room</h3>
              <Link
                to={`/rooms/${inquiry.room.id}`}
                target="_blank"
                className="text-primary-600 hover:underline"
              >
                {inquiry.room.title}
              </Link>
            </div>
          )}

          {/* Status actions */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              {inquiry.status !== 'pending' && (
                <button
                  onClick={() => handleUpdateStatus('pending')}
                  disabled={updatingStatus}
                  className="w-full flex items-center gap-2 px-4 py-2 text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Clock className="w-4 h-4" />
                  Mark as Pending
                </button>
              )}
              {inquiry.status !== 'replied' && (
                <button
                  onClick={() => handleUpdateStatus('replied')}
                  disabled={updatingStatus}
                  className="w-full flex items-center gap-2 px-4 py-2 text-secondary-700 bg-secondary-50 hover:bg-secondary-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  Mark as Replied
                </button>
              )}
              {inquiry.status !== 'closed' && (
                <button
                  onClick={() => handleUpdateStatus('closed')}
                  disabled={updatingStatus}
                  className="w-full flex items-center gap-2 px-4 py-2 text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                  Mark as Closed
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
