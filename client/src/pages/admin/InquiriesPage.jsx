import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { MessageSquare, Clock, CheckCircle, Search, Filter } from 'lucide-react'
import api from '../../services/api'
import { formatDistanceToNow } from '../../utils/date'

export default function AdminInquiriesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [inquiries, setInquiries] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchInquiries()
  }, [statusFilter])

  const fetchInquiries = async () => {
    try {
      setLoading(true)
      const params = {}
      if (statusFilter) params.status = statusFilter

      const response = await api.get('/inquiries/admin/list', { params })
      if (response.data.success) {
        setInquiries(response.data.data.inquiries)
      }
    } catch (error) {
      console.error('Failed to fetch inquiries:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = (e) => {
    const value = e.target.value
    setStatusFilter(value)
    if (value) {
      setSearchParams({ status: value })
    } else {
      setSearchParams({})
    }
  }

  const filteredInquiries = inquiries.filter((inquiry) =>
    inquiry.inquirerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inquiry.inquirerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inquiry.message.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const statusCounts = {
    all: inquiries.length,
    pending: inquiries.filter((i) => i.status === 'pending').length,
    replied: inquiries.filter((i) => i.status === 'replied').length,
    closed: inquiries.filter((i) => i.status === 'closed').length,
  }

  const statusConfig = {
    pending: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
    replied: { icon: CheckCircle, color: 'text-secondary-600', bg: 'bg-secondary-50' },
    closed: { icon: MessageSquare, color: 'text-neutral-500', bg: 'bg-neutral-50' },
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-neutral-900">Inquiries</h2>
        <p className="text-neutral-500">Manage user inquiries and responses</p>
      </div>

      {/* Status tabs */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              setStatusFilter('')
              setSearchParams({})
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              !statusFilter
                ? 'bg-primary-100 text-primary-700'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            All ({statusCounts.all})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === 'pending'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            Pending ({statusCounts.pending})
          </button>
          <button
            onClick={() => setStatusFilter('replied')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === 'replied'
                ? 'bg-secondary-100 text-secondary-700'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            Replied ({statusCounts.replied})
          </button>
          <button
            onClick={() => setStatusFilter('closed')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === 'closed'
                ? 'bg-neutral-100 text-neutral-700'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            Closed ({statusCounts.closed})
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input
            type="text"
            placeholder="Search inquiries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>

      {/* Inquiries list */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-sm p-8">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-neutral-200 rounded-lg" />
            ))}
          </div>
        </div>
      ) : filteredInquiries.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <MessageSquare className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-neutral-900 mb-2">No inquiries found</h3>
          <p className="text-neutral-500">
            {statusFilter
              ? `No ${statusFilter} inquiries at the moment`
              : 'Inquiries from users will appear here'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredInquiries.map((inquiry) => {
            const config = statusConfig[inquiry.status] || statusConfig.pending
            const StatusIcon = config.icon

            return (
              <Link
                key={inquiry.id}
                to={`/admin/inquiries/${inquiry.id}`}
                className="block bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-neutral-900 truncate">
                        {inquiry.inquirerName}
                      </h3>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${config.bg} ${config.color}`}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {inquiry.status}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-500 mb-2">{inquiry.inquirerEmail}</p>
                    <p className="text-neutral-700 line-clamp-2">{inquiry.message}</p>
                    {inquiry.room && (
                      <p className="text-sm text-primary-600 mt-2">
                        Re: {inquiry.room.title}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-neutral-500">
                      {formatDistanceToNow(new Date(inquiry.createdAt))}
                    </p>
                    {inquiry.replies && inquiry.replies.length > 0 && (
                      <p className="text-xs text-neutral-400 mt-1">
                        {inquiry.replies.length} {inquiry.replies.length === 1 ? 'reply' : 'replies'}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
