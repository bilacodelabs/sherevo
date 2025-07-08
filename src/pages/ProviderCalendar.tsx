import React, { useEffect, useState, useMemo } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import { useAuth } from '../contexts/AuthContext'
import { supabase, ServiceProvider, EventServiceProvider, Event } from '../lib/supabase'
import ServiceProviderLayout from '../components/ServiceProviderLayout'
import { format } from 'date-fns'
import { Calendar, Search, Plus, ChevronLeft, ChevronRight } from 'lucide-react'

const TABS = [
  { label: 'All events', value: 'all' },
  { label: 'Upcoming', value: 'upcoming' },
  { label: 'Past', value: 'past' },
]

const ProviderCalendar: React.FC = () => {
  const { user } = useAuth()
  const [profile, setProfile] = useState<ServiceProvider | null>(null)
  const [bookings, setBookings] = useState<(EventServiceProvider & { event: Event })[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState('all')
  const [search, setSearch] = useState('')
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null)

  useEffect(() => {
    if (!user) return
    const fetchData = async () => {
      setLoading(true)
      setError(null)
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

  // Filter bookings for calendar events
  const filteredBookings = useMemo(() => {
    let filtered = bookings
    if (tab === 'upcoming') {
      filtered = filtered.filter(b => new Date(b.event?.date) >= new Date())
    } else if (tab === 'past') {
      filtered = filtered.filter(b => new Date(b.event?.date) < new Date())
    }
    if (search) {
      filtered = filtered.filter(b =>
        b.event?.name?.toLowerCase().includes(search.toLowerCase()) ||
        b.event?.venue?.toLowerCase().includes(search.toLowerCase())
      )
    }
    return filtered
  }, [bookings, tab, search])

  // Map bookings to FullCalendar events
  const calendarEvents = filteredBookings.map(b => ({
    id: b.id,
    title: b.event?.name || 'Event',
    start: b.event?.date,
    extendedProps: { ...b },
    backgroundColor: '#fbbf24', // orange-400
    borderColor: '#f59e42', // orange-500
  }))

  return (
    <ServiceProviderLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Calendar</h1>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                className="pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="Search events..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <button className="ml-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg flex items-center gap-2 hover:from-orange-600 hover:to-pink-600 transition-all duration-200">
              <Plus className="w-4 h-4" /> Add event
            </button>
          </div>
        </div>
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 mb-2">
          {TABS.map(t => (
            <button
              key={t.value}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg focus:outline-none transition-colors ${tab === t.value ? 'bg-white dark:bg-gray-800 border-x border-t border-b-0 border-gray-200 dark:border-gray-700 text-orange-600 dark:text-orange-400' : 'text-gray-500 dark:text-gray-400 hover:text-orange-500'}`}
              onClick={() => setTab(t.value)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          {loading ? (
            <div className="text-center text-gray-500 dark:text-gray-400">Loading...</div>
          ) : error ? (
            <div className="text-center text-red-500 dark:text-red-400">{error}</div>
          ) : (
            <FullCalendar
              plugins={[dayGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: ''
              }}
              events={calendarEvents}
              eventClick={info => setSelectedEvent(info.event.extendedProps)}
              height="auto"
              dayMaxEventRows={3}
              eventDisplay="block"
              fixedWeekCount={false}
              aspectRatio={2}
              eventContent={renderEventContent}
            />
          )}
        </div>
        {/* Event Details Modal/Popover */}
        {selectedEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setSelectedEvent(null)}>
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 w-full max-w-md shadow-lg border border-gray-200 dark:border-gray-700 relative" onClick={e => e.stopPropagation()}>
              <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" onClick={() => setSelectedEvent(null)}>&times;</button>
              <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">{selectedEvent.event?.name}</h2>
              <div className="mb-2 text-gray-600 dark:text-gray-300">{selectedEvent.event?.description}</div>
              <div className="mb-2 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Calendar className="w-4 h-4" /> {selectedEvent.event?.date ? format(new Date(selectedEvent.event.date), 'PPP') : ''}
              </div>
              <div className="mb-2 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <span className="font-medium">Venue:</span> {selectedEvent.event?.venue}
              </div>
              <div className="mb-2 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <span className="font-medium">Role:</span> {selectedEvent.role}
              </div>
              {selectedEvent.notes && (
                <div className="mb-2 text-sm text-gray-600 dark:text-gray-300">Notes: {selectedEvent.notes}</div>
              )}
              <div className="mt-4 text-xs text-gray-400">Assigned: {format(new Date(selectedEvent.created_at), 'PPP')}</div>
            </div>
          </div>
        )}
      </div>
    </ServiceProviderLayout>
  )
}

function renderEventContent(eventInfo: any) {
  return (
    <div className="truncate text-xs font-medium" title={eventInfo.event.title}>
      {eventInfo.event.title}
    </div>
  )
}

export default ProviderCalendar 