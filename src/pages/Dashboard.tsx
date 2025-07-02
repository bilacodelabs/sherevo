import React from 'react'
import { Link } from 'react-router-dom'
import { 
  Calendar, 
  Users, 
  Mail, 
  CheckCircle, 
  Plus, 
  TrendingUp,
  Clock,
  MapPin,
  ExternalLink
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useApp } from '../contexts/AppContext'
import { format } from 'date-fns'

export const Dashboard: React.FC = () => {
  const { user } = useAuth()
  const { events, guests, activities, loading } = useApp()

  const stats = [
    {
      name: 'Total Events',
      value: events.length,
      icon: Calendar,
      color: 'from-blue-500 to-blue-600',
      href: '/events'
    },
    {
      name: 'Total Guests',
      value: guests.length,
      icon: Users,
      color: 'from-green-500 to-green-600',
      href: '/guests'
    },
    {
      name: 'Invitations Sent',
      value: events.reduce((sum, event) => sum + event.invitations_sent, 0),
      icon: Mail,
      color: 'from-purple-500 to-purple-600',
      href: '/invitations'
    },
    {
      name: 'RSVPs Received',
      value: events.reduce((sum, event) => sum + event.rsvp_count, 0),
      icon: CheckCircle,
      color: 'from-orange-500 to-pink-500',
      href: '/analytics'
    }
  ]

  const quickActions = [
    { name: 'Create Event', href: '/events', icon: Calendar, color: 'from-blue-500 to-blue-600' },
    { name: 'Add Guests', href: '/guests', icon: Users, color: 'from-green-500 to-green-600' },
    { name: 'Design Card', href: '/card-builder', icon: Mail, color: 'from-purple-500 to-purple-600' },
    { name: 'Send Invitations', href: '/invitations', icon: Mail, color: 'from-orange-500 to-pink-500' }
  ]

  const upcomingEvents = events
    .filter(event => new Date(event.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3)

  const getEventTypeEmoji = (type: string) => {
    const emojis = {
      wedding: '💒',
      birthday: '🎂',
      anniversary: '💝',
      'send-off': '🎉',
      other: '🎊'
    }
    return emojis[type as keyof typeof emojis] || '🎊'
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-orange-500 to-pink-500 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {user?.name || 'User'}! 👋
            </h1>
            <p className="text-orange-100 text-lg">
              Ready to create memorable events and beautiful invitations?
            </p>
          </div>
          <div className="hidden md:block">
            <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center">
              <Calendar className="w-16 h-16 text-white/80" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Link
              key={stat.name}
              to={stat.href}
              className="group bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-200 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.name}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                    {stat.value}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${stat.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Quick Actions
          </h2>
          <TrendingUp className="w-5 h-5 text-orange-500" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <Link
                key={action.name}
                to={action.href}
                className="group flex flex-col items-center p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-orange-200 dark:hover:border-orange-800 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all duration-200"
              >
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${action.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center">
                  {action.name}
                </span>
              </Link>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upcoming Events */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Upcoming Events
            </h2>
            <Link
              to="/events"
              className="text-orange-600 dark:text-orange-400 hover:text-orange-500 dark:hover:text-orange-300 text-sm font-medium flex items-center"
            >
              View All
              <ExternalLink className="w-4 h-4 ml-1" />
            </Link>
          </div>
          
          {upcomingEvents.length > 0 ? (
            <div className="space-y-4">
              {upcomingEvents.map((event) => (
                <Link
                  key={event.id}
                  to={`/events/${event.id}`}
                  className="block p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-orange-200 dark:hover:border-orange-800 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">
                        {getEventTypeEmoji(event.type)}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {event.name}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mt-1">
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {format(new Date(event.date), 'MMM d, yyyy')}
                          </div>
                          {event.venue && (
                            <div className="flex items-center">
                              <MapPin className="w-4 h-4 mr-1" />
                              {event.venue}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {event.guest_count} guests
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                        {event.status}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                No upcoming events
              </p>
              <Link
                to="/events"
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg hover:from-orange-600 hover:to-pink-600 transition-all duration-200"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Event
              </Link>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Recent Activity
            </h2>
            <Link
              to="/analytics"
              className="text-orange-600 dark:text-orange-400 hover:text-orange-500 dark:hover:text-orange-300 text-sm font-medium flex items-center"
            >
              View All
              <ExternalLink className="w-4 h-4 ml-1" />
            </Link>
          </div>
          
          {activities.length > 0 ? (
            <div className="space-y-4">
              {activities.slice(0, 5).map((activity) => (
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
          ) : (
            <div className="text-center py-8">
              <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                No recent activity
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}