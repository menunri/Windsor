import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Send, ArrowLeft, Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import api from '../services/api'

export default function ThreadsPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const { success, error: showError } = useToast()
  const messagesEndRef = useRef(null)
  const [thread, setThread] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (id) {
      fetchThread()
    }
  }, [id])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchThread = async () => {
    try {
      const response = await api.get(`/threads/${id}`)
      if (response.data.success) {
        setThread(response.data.data)
        setMessages(response.data.data.messages || [])
      }
    } catch (error) {
      showError('Failed to load conversation')
    } finally {
      setLoading(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSend = async (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    setSending(true)
    try {
      const response = await api.post('/messages', {
        threadId: id,
        content: newMessage.trim()
      })
      if (response.data.success) {
        setMessages(prev => [...prev, response.data.data])
        setNewMessage('')
      }
    } catch (error) {
      showError('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }
  }

  const groupMessagesByDate = (msgs) => {
    const groups = {}
    msgs.forEach(msg => {
      const date = new Date(msg.createdAt).toDateString()
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(msg)
    })
    return groups
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (!thread) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-neutral-900 mb-2">
            Conversation not found
          </h2>
          <Link to="/inbox" className="btn btn-primary">
            Back to Inbox
          </Link>
        </div>
      </div>
    )
  }

  const messageGroups = groupMessagesByDate(messages)

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b sticky top-16 z-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 py-4">
            <Link to="/inbox" className="p-2 hover:bg-neutral-100 rounded-lg">
              <ArrowLeft className="w-5 h-5 text-neutral-600" />
            </Link>
            <div className="avatar avatar-md bg-primary-100 text-primary-700">
              {thread.participant?.firstName?.[0]}{thread.participant?.lastName?.[0]}
            </div>
            <div>
              <h2 className="font-semibold text-neutral-900">
                {thread.participant?.firstName} {thread.participant?.lastName}
              </h2>
              {thread.roomTitle && (
                <p className="text-xs text-neutral-500">
                  Re: {thread.roomTitle}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {Object.entries(messageGroups).map(([date, msgs]) => (
            <div key={date} className="mb-6">
              <div className="text-center mb-4">
                <span className="text-xs text-neutral-400 bg-neutral-100 px-3 py-1 rounded-full">
                  {formatDate(date)}
                </span>
              </div>
              {msgs.map(msg => {
                const isOwn = msg.senderId === user?.id
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}
                  >
                    <div className={`max-w-[75%] ${isOwn ? 'order-2' : 'order-1'}`}>
                      <div className={`rounded-2xl px-4 py-2 ${
                        isOwn
                          ? 'bg-primary-600 text-white rounded-br-md'
                          : 'bg-white border border-neutral-200 text-neutral-900 rounded-bl-md'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      </div>
                      <p className={`text-xs text-neutral-400 mt-1 ${isOwn ? 'text-right' : 'text-left'}`}>
                        {formatTime(msg.createdAt)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <form onSubmit={handleSend} className="flex gap-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="input flex-1"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={sending || !newMessage.trim()}
              className="btn btn-primary px-4"
            >
              {sending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}