import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MessageSquare, ChevronRight, Loader2 } from 'lucide-react'
import { PageLoader } from '../components/LoadingSpinner'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

export default function InboxPage() {
  const [threads, setThreads] = useState([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    fetchThreads()
  }, [])

  const fetchThreads = async () => {
    try {
      const response = await api.get('/threads')
      if (response.data.success) {
        setThreads(response.data.data.threads)
      }
    } catch (error) {
      console.error('Failed to fetch threads:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const now = new Date()
    const diff = now - date
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (days === 1) {
      return 'Yesterday'
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: 'short' })
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-neutral-900">Inbox</h1>
          <p className="text-neutral-500">Your conversations and messages</p>
        </div>

        {loading ? (
          <PageLoader />
        ) : threads.length > 0 ? (
          <div className="bg-white rounded-xl shadow-card overflow-hidden">
            {threads.map((thread, index) => (
              <Link
                key={thread.id}
                to={`/threads/${thread.id}`}
                className={`flex items-center gap-4 p-4 hover:bg-neutral-50 transition-colors ${
                  index !== threads.length - 1 ? 'border-b border-neutral-100' : ''
                }`}
              >
                {/* Avatar */}
                <div className="avatar avatar-md bg-primary-100 text-primary-700">
                  {thread.participant?.firstName?.[0]}{thread.participant?.lastName?.[0]}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-neutral-900 truncate">
                      {thread.participant?.firstName} {thread.participant?.lastName}
                    </h3>
                    <span className="text-xs text-neutral-400">
                      {formatTime(thread.lastMessageAt)}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-500 truncate">
                    {thread.roomTitle ? `[${thread.roomTitle}] ` : ''}
                    {thread.lastMessage || 'No messages yet'}
                  </p>
                </div>

                {/* Unread badge */}
                {thread.unreadCount > 0 && (
                  <span className="w-5 h-5 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center">
                    {thread.unreadCount}
                  </span>
                )}

                <ChevronRight className="w-5 h-5 text-neutral-400" />
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl">
            <div className="w-16 h-16 mx-auto mb-4 bg-neutral-100 rounded-full flex items-center justify-center">
              <MessageSquare className="w-8 h-8 text-neutral-400" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
              No messages yet
            </h3>
            <p className="text-neutral-500 mb-6">
              Start a conversation by contacting a room owner.
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