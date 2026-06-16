import { useState, useEffect } from 'react'
import { Building, MessageSquare, Clock, CheckCircle, TrendingUp } from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import AIAnalyticsChat from '../../components/AIAnalyticsChat'
import AIReportCard from '../../components/AIReportCard'

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalInquiries: 0,
    pendingInquiries: 0,
    repliedInquiries: 0,
    activeRooms: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await api.get('/inquiries/admin/dashboard/stats')
      if (response.data.success) {
        setStats(response.data.data)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: 'Active Rooms',
      value: stats.activeRooms,
      icon: Building,
      color: 'bg-blue-500',
      link: '/admin/rooms',
    },
    {
      title: 'Total Inquiries',
      value: stats.totalInquiries,
      icon: MessageSquare,
      color: 'bg-purple-500',
      link: '/admin/inquiries',
    },
    {
      title: 'Pending Inquiries',
      value: stats.pendingInquiries,
      icon: Clock,
      color: 'bg-amber-500',
      link: '/admin/inquiries?status=pending',
    },
    {
      title: 'Replied Inquiries',
      value: stats.repliedInquiries,
      icon: CheckCircle,
      color: 'bg-secondary-600',
      link: '/admin/inquiries?status=replied',
    },
  ]

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-6 h-32" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Welcome section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-neutral-900">Dashboard</h2>
        <p className="text-neutral-500">Welcome to Windsor Admin Panel</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => (
          <Link
            key={stat.title}
            to={stat.link}
            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <TrendingUp className="w-5 h-5 text-neutral-400" />
            </div>
            <p className="text-3xl font-bold text-neutral-900">{stat.value}</p>
            <p className="text-neutral-500 text-sm">{stat.title}</p>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Link
              to="/admin/rooms/new"
              className="flex items-center gap-3 p-4 bg-neutral-50 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <Building className="w-5 h-5 text-primary-600" />
              <span className="font-medium text-neutral-700">Add New Room</span>
            </Link>
            <Link
              to="/admin/inquiries?status=pending"
              className="flex items-center gap-3 p-4 bg-neutral-50 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <Clock className="w-5 h-5 text-amber-500" />
              <span className="font-medium text-neutral-700">View Pending Inquiries</span>
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">System Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg">
              <span className="text-neutral-700">Database</span>
              <span className="text-secondary-700 font-medium">Connected</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg">
              <span className="text-neutral-700">API Status</span>
              <span className="text-secondary-700 font-medium">Operational</span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AIReportCard />
        <AIAnalyticsChat />
      </div>
    </div>
  )
}
