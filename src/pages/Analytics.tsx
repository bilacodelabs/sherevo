import React, { useState, useEffect } from 'react'
import { useSearchParams, useParams, useNavigate } from 'react-router-dom'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Mail, 
  Eye,
  Calendar,
  Clock,
  MapPin,
  Filter,
  Download
} from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { format, subDays, isAfter } from 'date-fns'

export const Analytics: React.FC = () => {
  const { events, guests, activities, analytics, loading } = useApp()
  const [searchParams] = useSearchParams()
  const { id: eventIdFromUrl } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const [selectedEvent, setSelectedEvent] = useState<string>(
    eventIdFromUrl || searchParams.get('event') || 'all'
  )
  const [dateRange, setDateRange] = useState<string>('30')

  useEffect(() => {
    if (eventIdFromUrl) {
      setSelectedEvent(eventIdFromUrl)
    } else {
    const eventParam = searchParams.get('event')
    if (eventParam) {
      setSelectedEvent(eventParam)
    }
    }
  }, [eventIdFromUrl, searchParams])

  useEffect(() => {
    if (eventIdFromUrl && selectedEvent !== eventIdFromUrl) {
      if (selectedEvent === 'all') {
        navigate('/analytics')
      } else {
        navigate(`/events/${selectedEvent}/analytics`)
      }
    }
    if (!eventIdFromUrl && selectedEvent !== (searchParams.get('event') || 'all')) {
      if (selectedEvent === 'all') {
        navigate('/analytics')
      } else {
        navigate(`/analytics?event=${selectedEvent}`)
      }
    }
  }, [selectedEvent])

  const filteredEvents = selectedEvent === 'all' 
    ? events 
    : events.filter(e => e.id === selectedEvent)

  const filteredGuests = selectedEvent === 'all'
    ? guests
    : guests.filter(g => g.event_id === selectedEvent)

  const filteredActivities = activities.filter(activity => {
    const activityDate = new Date(activity.created_at)
    const cutoffDate = subDays(new Date(), parseInt(dateRange))
    const matchesDate = isAfter(activityDate, cutoffDate)
    const matchesEvent = selectedEvent === 'all' || activity.event_id === selectedEvent
    return matchesDate && matchesEvent
  })

  const overallStats = [
    {
      name: 'Total Events',
      value: filteredEvents.length,
      change: '+12%',
      changeType: 'positive' as const,
      icon: Calendar,
      color: 'from-blue-500 to-blue-600'
    },
    {
      name: 'Total Guests',
      value: filteredGuests.length,
      change: '+8%',
      changeType: 'positive' as const,
      icon: Users,
      color: 'from-green-500 to-green-600'
    },
    {
      name: 'Invitations Sent',
      value: filteredEvents.reduce((sum, event) => sum + event.invitations_sent, 0),
      change: '+23%',
      changeType: 'positive' as const,
      icon: Mail,
      color: 'from-purple-500 to-purple-600'
    },
    {
      name: 'Response Rate',
      value: filteredGuests.length > 0 
        ? Math.round((filteredGuests.filter(g => g.rsvp_status !== 'pending').length / filteredGuests.length) * 100)
        : 0,
      change: '+5%',
      changeType: 'positive' as const,
      icon: TrendingUp,
      color: 'from-orange-500 to-pink-500',
      suffix: '%'
    }
  ]

  const rsvpData = [
    {
      status: 'Accepted',
      count: filteredGuests.filter(g => g.rsvp_status === 'accepted').length,
      color: 'bg-green-500',
      percentage: filteredGuests.length > 0 
        ? Math.round((filteredGuests.filter(g => g.rsvp_status === 'accepted').length / filteredGuests.length) * 100)
        : 0
    },
    {
      status: 'Declined',
      count: filteredGuests.filter(g => g.rsvp_status === 'declined').length,
      color: 'bg-red-500',
      percentage: filteredGuests.length > 0 
        ? Math.round((filteredGuests.filter(g => g.rsvp_status === 'declined').length / filteredGuests.length) * 100)
        : 0
    },
    {
      status: 'Pending',
      count: filteredGuests.filter(g => g.rsvp_status === 'pending').length,
      color: 'bg-yellow-500',
      percentage: filteredGuests.length > 0 
        ? Math.round((filteredGuests.filter(g => g.rsvp_status === 'pending').length / filteredGuests.length) * 100)
        : 0
    }
  ]

  const deliveryData = [
    {
      status: 'Delivered',
      count: filteredGuests.filter(g => g.delivery_status === 'delivered' || g.delivery_status === 'viewed').length,
      color: 'bg-green-500'
    },
    {
      status: 'Sent',
      count: filteredGuests.filter(g => g.delivery_status === 'sent').length,
      color: 'bg-blue-500'
    },
    {
      status: 'Not Sent',
      count: filteredGuests.filter(g => g.delivery_status === 'not_sent').length,
      color: 'bg-gray-500'
    }
  ]

  const topEvents = filteredEvents
    .map(event => ({
      ...event,
      responseRate: event.guest_count > 0 ? Math.round((event.rsvp_count / event.guest_count) * 100) : 0
    }))
    .sort((a, b) => b.responseRate - a.responseRate)
    .slice(0, 5)

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track your event performance and guest engagement
          </p>
        </div>
        <button className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Event
            </label>
            <select
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Events</option>
              {events.map(event => (
                <option key={event.id} value={event.id}>{event.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date Range
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Overall Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {overallStats.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.name}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.name}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                    {stat.value}{stat.suffix || ''}
                  </p>
                  <div className="flex items-center mt-2">
                    <span className={`text-sm font-medium ${
                      stat.changeType === 'positive' 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {stat.change}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
                      vs last period
                    </span>
                  </div>
                </div>
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${stat.color} flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* RSVP Status Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              RSVP Status
            </h3>
            <BarChart3 className="w-5 h-5 text-orange-500" />
          </div>
          
          <div className="space-y-4">
            {rsvpData.map((item) => (
              <div key={item.status}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {item.status}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {item.count} ({item.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`${item.color} h-2 rounded-full transition-all duration-300`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Delivery Status */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Delivery Status
            </h3>
            <Mail className="w-5 h-5 text-orange-500" />
          </div>
          
          <div className="space-y-4">
            {deliveryData.map((item) => (
              <div key={item.status} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full ${item.color} mr-3`} />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {item.status}
                  </span>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Events */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Top Performing Events
            </h3>
            <TrendingUp className="w-5 h-5 text-orange-500" />
          </div>
          
          <div className="space-y-4">
            {topEvents.map((event, index) => (
              <div key={event.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 flex items-center justify-center text-white font-medium text-sm mr-3">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {event.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {event.guest_count} guests
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {event.responseRate}%
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    response rate
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Activity
            </h3>
            <Clock className="w-5 h-5 text-orange-500" />
          </div>
          
          <div className="space-y-4">
            {filteredActivities.slice(0, 5).map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900 dark:text-white">
                    {activity.message}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {format(new Date(activity.created_at), 'MMM d, h:mm a')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Event Comparison Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Event Performance Comparison
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Event
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Guests
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Invitations
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  RSVPs
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Response Rate
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredEvents.map((event) => (
                <tr key={event.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {event.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                        {event.type}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {format(new Date(event.date), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {event.guest_count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {event.invitations_sent}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {event.rsvp_count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm text-gray-900 dark:text-white mr-2">
                        {event.guest_count > 0 ? Math.round((event.rsvp_count / event.guest_count) * 100) : 0}%
                      </span>
                      <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-orange-500 to-pink-500 h-2 rounded-full"
                          style={{
                            width: `${event.guest_count > 0 ? (event.rsvp_count / event.guest_count) * 100 : 0}%`
                          }}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}