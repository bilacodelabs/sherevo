import React, { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase, ServiceProvider, EventServiceProvider, Event } from '../lib/supabase'
import { Calendar, Briefcase, Mail, Phone, MapPin } from 'lucide-react'
import { format } from 'date-fns'
import ServiceProviderLayout from '../components/ServiceProviderLayout'

const providerTypeLabels: Record<string, string> = {
  caterer: 'Caterer',
  social_hall: 'Social Hall',
  mc: 'MC',
  photographer: 'Photographer',
  videographer: 'Videographer',
  other: 'Other'
}

export const ServiceProviderDashboard: React.FC = () => {
  const { user } = useAuth()
  const [profile, setProfile] = useState<ServiceProvider | null>(null)
  const [bookings, setBookings] = useState<(EventServiceProvider & { event: Event })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const fetchData = async () => {
      setLoading(true)
      // Fetch provider profile
      const { data: provider, error: providerError } = await supabase
        .from('service_providers')
        .select('*')
        .eq('user_id', user.id)
        .single()
      if (providerError) {
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
      if (!bookingsError && assignments) {
        setBookings(assignments)
      }
      setLoading(false)
    }
    fetchData()
  }, [user])

  if (loading) {
    return <ServiceProviderLayout><div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading...</div></ServiceProviderLayout>
  }

  if (!profile) {
    return <ServiceProviderLayout><div className="p-8 text-center text-red-500 dark:text-red-400">Profile not found.</div></ServiceProviderLayout>
  }

  return (
    <ServiceProviderLayout>
      <div className="space-y-8">
        {/* Profile Section */}
        <div className="bg-gradient-to-r from-orange-500 to-pink-500 rounded-2xl p-8 text-white flex flex-col md:flex-row items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 flex items-center justify-center">
                <span className="text-white font-medium text-lg">{profile.name?.charAt(0)}</span>
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-white">{profile.name}</p>
                <p className="text-xs text-orange-100 capitalize">{providerTypeLabels[profile.type] || profile.type}</p>
              </div>
            </div>
            <div className="flex flex-col gap-1 text-white/90">
              <span className="flex items-center gap-2"><Mail className="w-4 h-4" /> {profile.contact_email}</span>
              <span className="flex items-center gap-2"><Phone className="w-4 h-4" /> {profile.contact_phone}</span>
            </div>
          </div>
          <div className="mt-4 md:mt-0 md:text-right">
            <div className="bg-white/10 rounded-xl p-4">
              <div className="font-semibold">Description</div>
              <div className="text-sm mt-1">{profile.description || 'No description provided.'}</div>
            </div>
          </div>
        </div>

        {/* Bookings Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-500" /> Bookings & Event Assignments
            </h2>
          </div>
          {bookings.length === 0 ? (
            <div className="text-gray-500 dark:text-gray-400">No bookings yet.</div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
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

export default ServiceProviderDashboard 