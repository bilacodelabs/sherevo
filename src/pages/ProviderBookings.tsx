import React, { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase, ServiceProvider, EventServiceProvider, Event } from '../lib/supabase'
import { Calendar, MapPin, Search, Download } from 'lucide-react'
import { format } from 'date-fns'
import ServiceProviderLayout from '../components/ServiceProviderLayout'

const ProviderBookings: React.FC = () => {
  const { user } = useAuth()
  const [profile, setProfile] = useState<ServiceProvider | null>(null)
  const [bookings, setBookings] = useState<(EventServiceProvider & { event: Event })[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // Actions state
  const [search, setSearch] = useState('')
  const [eventFilter, setEventFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('')

  useEffect(() => {
    if (!user) return
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      // Fetch provider profile
      const { data: provider, error: providerError } = await supabase
        .from('service_providers')
        .select('*')
        .eq('user_id', user.id)
        .single()
      if (providerError || !provider) {
        setError('Profile not found.')
        setLoading(false)
        return
      }
      setProfile(provider)
      // Fetch bookings (event assignments)
      const { data: assignments, error: bookingsError } = await supabase
        .from('event_service_providers')
        .select('*, event:events(*)')
        .eq('provider_id', provider.id)
        .order('created_at', { ascending: false })
      if (bookingsError) {
        setError('Failed to fetch bookings.')
        setLoading(false)
        return
      }
      setBookings(assignments || [])
      setLoading(false)
    }
    fetchData()
  }, [user])

  // Unique event names and roles for filters
  const eventOptions = Array.from(new Set(bookings.map(b => b.event?.name).filter(Boolean)))
  const roleOptions = Array.from(new Set(bookings.map(b => b.role).filter(Boolean)))

  // Filtered bookings
  const filteredBookings = bookings.filter(b => {
    const matchesSearch =
      !search ||
      b.event?.name?.toLowerCase().includes(search.toLowerCase()) ||
      b.event?.venue?.toLowerCase().includes(search.toLowerCase()) ||
      b.role?.toLowerCase().includes(search.toLowerCase())
    const matchesEvent = eventFilter === 'all' || b.event?.name === eventFilter
    const matchesRole = roleFilter === 'all' || b.role === roleFilter
    const matchesDate = !dateFilter || (b.event?.date && b.event.date === dateFilter)
    return matchesSearch && matchesEvent && matchesRole && matchesDate
  })

  // Export to CSV
  const exportCSV = () => {
    const rows = [
      ['Event', 'Venue', 'Date', 'Role', 'Notes', 'Assigned'],
      ...filteredBookings.map(b => [
        b.event?.name || '',
        b.event?.venue || '',
        b.event?.date ? format(new Date(b.event.date), 'yyyy-MM-dd') : '',
        b.role || '',
        b.notes || '',
        b.created_at ? format(new Date(b.created_at), 'yyyy-MM-dd') : ''
      ])
    ]
    const csv = rows.map(r => r.map(v => `"${(v || '').replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'bookings.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <ServiceProviderLayout>
      <div className="space-y-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Provider Bookings</h1>
        {/* Actions Toolbar */}
        <div className="flex flex-wrap gap-2 items-center mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              className="pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="Search bookings..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="py-2 px-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            value={eventFilter}
            onChange={e => setEventFilter(e.target.value)}
          >
            <option value="all">All Events</option>
            {eventOptions.map(ev => (
              <option key={ev} value={ev}>{ev}</option>
            ))}
          </select>
          <select
            className="py-2 px-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
          >
            <option value="all">All Roles</option>
            {roleOptions.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
          <input
            type="date"
            className="py-2 px-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
          />
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg hover:from-orange-600 hover:to-pink-600 transition-all duration-200"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          {loading ? (
            <div className="text-center text-gray-500 dark:text-gray-400">Loading...</div>
          ) : error ? (
            <div className="text-center text-red-500 dark:text-red-400">{error}</div>
          ) : filteredBookings.length === 0 ? (
            <div className="text-gray-500 dark:text-gray-400">No bookings found.</div>
          ) : (
            <div className="space-y-4">
              {filteredBookings.map((booking) => (
                <div key={booking.id} className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-orange-200 dark:hover:border-orange-800 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white text-lg flex items-center gap-2">
                        {booking.event?.name || 'Event'}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mt-1">
                        <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {booking.event?.venue}</span>
                        <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {booking.event?.date ? format(new Date(booking.event.date), 'PPP') : ''}</span>
                        <span className="flex items-center gap-1">Role: {booking.role}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-gray-400">Assigned: {format(new Date(booking.created_at), 'PPP')}</span>
                    </div>
                  </div>
                  {booking.notes && (
                    <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">Notes: {booking.notes}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ServiceProviderLayout>
  )
}

export default ProviderBookings 