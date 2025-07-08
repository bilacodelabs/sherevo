import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Users, 
  Mail, 
  Calendar, 
  MapPin, 
  Clock,
  Eye,
  Send,
  Plus,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  AlertCircle,
  Share2,
  Download,
  Settings,
  CreditCard,
  Star,
  BarChart,
  BarChart3,
  Phone,
  Briefcase
} from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { format } from 'date-fns'
// @ts-ignore
import { QRCodeCanvas } from 'qrcode.react'
import { EventAttributes } from '../components/EventAttributes'
import { fillCardVariables } from '../lib/cardImage'
import { getEventProviders, linkProviderToEvent, unlinkProviderFromEvent, getServiceProviderByUser, getPledgesByEvent, Pledge } from '../lib/supabase'
import { supabase } from '../lib/supabase'

export const EventDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { events, guests, cardDesigns, loading, deleteEvent, updateEvent, setDefaultCardDesign, getEventAttributes } = useApp()
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showCardModal, setShowCardModal] = useState(false)
  const [previewCard, setPreviewCard] = useState<any | null>(null)
  const [previewGuest, setPreviewGuest] = useState<any | null>(null)
  const [eventProviders, setEventProviders] = useState<(any & { provider: any })[]>([])
  const [showAddProvider, setShowAddProvider] = useState(false)
  const [providerSearch, setProviderSearch] = useState('')
  const [providerResults, setProviderResults] = useState<any[]>([])
  const [selectedProvider, setSelectedProvider] = useState<any | null>(null)
  const [providerRole, setProviderRole] = useState('')
  const [providerNotes, setProviderNotes] = useState('')
  const [eventPledges, setEventPledges] = useState<Pledge[]>([])
  const [pledgesLoading, setPledgesLoading] = useState(true)

  const event = events.find(e => e.id === id)
  const eventGuests = guests.filter(g => g.event_id === id)
  const eventCardDesigns = cardDesigns.filter(d => d.event_id === id)

  useEffect(() => {
    if (!loading && !event) {
      navigate('/events')
    }
  }, [event, loading, navigate])

  useEffect(() => {
    if (!event) return
    getEventProviders(event.id).then(setEventProviders).catch(console.error)
  }, [event])

  useEffect(() => {
    if (!event) return
    setPledgesLoading(true)
    getPledgesByEvent(event.id)
      .then(setEventPledges)
      .catch(console.error)
      .finally(() => setPledgesLoading(false))
  }, [event])

  if (loading || !event) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64"></div>
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    )
  }

  const stats = [
    {
      name: 'Total Guests',
      value: eventGuests.length,
      icon: Users,
      color: 'from-blue-500 to-blue-600'
    },
    {
      name: 'Accepted',
      value: eventGuests.filter(g => g.rsvp_status === 'accepted').length,
      icon: CheckCircle,
      color: 'from-green-500 to-green-600'
    },
    {
      name: 'Declined',
      value: eventGuests.filter(g => g.rsvp_status === 'declined').length,
      icon: XCircle,
      color: 'from-red-500 to-red-600'
    },
    {
      name: 'Pending',
      value: eventGuests.filter(g => g.rsvp_status === 'pending').length,
      icon: AlertCircle,
      color: 'from-yellow-500 to-yellow-600'
    }
  ]

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

  const getStatusColor = (status: string) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
      published: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    }
    return colors[status as keyof typeof colors] || colors.draft
  }

  const handleDeleteEvent = async () => {
    try {
      await deleteEvent(event.id)
      navigate('/events')
    } catch (error) {
      console.error('Error deleting event:', error)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateEvent(event.id, { status: newStatus as any })
    } catch (error) {
      console.error('Error updating event status:', error)
    }
  }

  const handleSetDefaultCard = async (designId: string) => {
    try {
      await setDefaultCardDesign(event.id, designId)
      alert('Default card design set successfully!')
    } catch (error) {
      console.error('Error setting default card:', error)
      alert('Failed to set default card design')
    }
  }

  const handleAddProvider = async () => {
    if (!event || !selectedProvider) return
    await linkProviderToEvent(event.id, selectedProvider.id, providerRole, providerNotes)
    setShowAddProvider(false)
    setProviderSearch('')
    setSelectedProvider(null)
    setProviderRole('')
    setProviderNotes('')
    getEventProviders(event.id).then(setEventProviders).catch(console.error)
  }

  const handleRemoveProvider = async (espId: string) => {
    await unlinkProviderFromEvent(espId)
    getEventProviders(event.id).then(setEventProviders).catch(console.error)
  }

  const totalPledged = eventPledges.reduce((sum, p) => sum + (p.amount || 0), 0)
  const totalPaid = eventPledges.reduce((sum, p) => sum + (p.paid_amount || 0), 0)
  const totalRemaining = totalPledged - totalPaid

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/events')}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{event.name}</h1>
            <p className="text-gray-600 dark:text-gray-400 capitalize">
              {event.type} Event
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </button>
          <button
            onClick={() => setShowEditModal(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </button>
        </div>
      </div>

      {/* Event Cover and Details */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Cover Image */}
        <div className="h-64 bg-gradient-to-br from-orange-500 to-pink-500 relative">
          {event.cover_image ? (
            <img
              src={event.cover_image}
              alt={event.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-8xl">
                {getEventTypeEmoji(event.type)}
              </div>
            </div>
          )}
          <div className="absolute top-4 right-4">
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(event.status)}`}>
              {event.status}
            </span>
          </div>
        </div>

        {/* Event Info */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Date</div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {format(new Date(event.date), 'MMMM d, yyyy')}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-gray-400" />
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Time</div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {event.time}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <MapPin className="w-5 h-5 text-gray-400" />
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Venue</div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {event.venue || 'Not specified'}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Users className="w-5 h-5 text-gray-400" />
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Dress Code</div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {event.dress_code || 'Not specified'}
                </div>
              </div>
            </div>
          </div>

          {event.description && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Description</h3>
              <p className="text-gray-600 dark:text-gray-400">{event.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
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
                    {stat.value}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${stat.color} flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Pledge Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
          <Star className="w-5 h-5 text-orange-500" /> Pledge Summary
        </h3>
        {pledgesLoading ? (
          <div className="text-gray-500 dark:text-gray-400">Loading pledges...</div>
        ) : (
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Pledge Amount</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalPledged.toLocaleString()} <span className="text-base font-medium text-gray-500 dark:text-gray-400">TZS</span></div>
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Paid Amount</div>
              <div className="text-2xl font-bold text-green-600">{totalPaid.toLocaleString()} <span className="text-base font-medium text-green-600">TZS</span></div>
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Remaining Amount</div>
              <div className="text-2xl font-bold" style={{ color: totalRemaining > 0 ? '#ef4444' : undefined }}>{totalRemaining.toLocaleString()} <span className="text-base font-medium" style={{ color: totalRemaining > 0 ? '#ef4444' : undefined }}>TZS</span></div>
            </div>
          </div>
        )}
      </div>

      {/* Event Attributes */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <EventAttributes eventId={event.id} />
      </div>

      {/* Service Providers Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-orange-500" /> Service Providers
          </h2>
          <button
            className="inline-flex items-center px-3 py-1.5 text-sm bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg hover:from-orange-600 hover:to-pink-600 transition-all duration-200"
            onClick={() => setShowAddProvider(true)}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Provider
          </button>
        </div>
        {eventProviders.length === 0 ? (
          <div className="text-gray-500 dark:text-gray-400">No providers linked to this event.</div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {eventProviders.map((esp) => (
              <li key={esp.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">{esp.provider?.name}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{esp.role} | {esp.provider?.contact_email}</div>
                  {esp.notes && <div className="text-xs text-gray-400 mt-1">Notes: {esp.notes}</div>}
                </div>
                <button
                  className="text-red-500 hover:underline text-sm"
                  onClick={() => handleRemoveProvider(esp.id)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
        {showAddProvider && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="mb-2">
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Search Providers by Name or Email</label>
              <input
                type="text"
                value={providerSearch}
                onChange={async (e) => {
                  setProviderSearch(e.target.value)
                  // Simple search: fetch all providers and filter client-side (for demo)
                  const { data, error } = await supabase
                    .from('service_providers')
                    .select('*')
                    .ilike('name', `%${e.target.value}%`)
                  setProviderResults(data || [])
                }}
                className="w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="Type to search..."
              />
            </div>
            {providerResults.length > 0 && (
              <ul className="mb-2 divide-y divide-gray-200 dark:divide-gray-700">
                {providerResults.map((prov) => (
                  <li
                    key={prov.id}
                    className={`py-2 px-2 cursor-pointer rounded hover:bg-orange-100 dark:hover:bg-orange-900/20 ${selectedProvider?.id === prov.id ? 'bg-orange-200 dark:bg-orange-800' : ''}`}
                    onClick={() => setSelectedProvider(prov)}
                  >
                    <div className="font-medium text-gray-900 dark:text-white">{prov.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{prov.type} | {prov.contact_email}</div>
                  </li>
                ))}
              </ul>
            )}
            {selectedProvider && (
              <div className="mb-2">
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Role for this Event</label>
                <input
                  type="text"
                  value={providerRole}
                  onChange={e => setProviderRole(e.target.value)}
                  className="w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="e.g. Caterer, MC, Photographer"
                />
              </div>
            )}
            <div className="mb-2">
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Notes (optional)</label>
              <textarea
                value={providerNotes}
                onChange={e => setProviderNotes(e.target.value)}
                className="w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                rows={2}
              />
            </div>
            <div className="flex gap-2 mt-2">
              <button
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                onClick={handleAddProvider}
              >
                Link Provider
              </button>
              <button
                className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg"
                onClick={() => setShowAddProvider(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Card Designs Section */}
      {eventCardDesigns.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Saved Card Designs ({eventCardDesigns.length})
              </h3>
              <button
                onClick={() => setShowCardModal(true)}
                className="text-orange-600 dark:text-orange-400 hover:text-orange-500 dark:hover:text-orange-300 font-medium"
              >
                View All
              </button>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {eventCardDesigns.slice(0, 3).map((design) => (
                <div
                  key={design.id}
                  className={`border-2 rounded-lg p-4 transition-all ${
                    event.default_card_design_id === design.id
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-white">{design.name}</h4>
                    {event.default_card_design_id === design.id && (
                      <Star className="w-4 h-4 text-orange-500 fill-current" />
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                    {design.canvas_width} × {design.canvas_height}px
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {new Date(design.updated_at).toLocaleDateString()}
                    </span>
                    <div className="flex space-x-2">
                      <Link
                        to={`/card-builder?event=${event.id}&design=${design.id}`}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-500 text-sm font-medium"
                      >
                        Edit
                      </Link>
                      {eventGuests.length > 0 ? (
                        <button
                          onClick={() => {
                            const guest = eventGuests[Math.floor(Math.random() * eventGuests.length)]
                            setPreviewCard(design)
                            setPreviewGuest(guest)
                          }}
                          className="text-green-600 dark:text-green-400 hover:text-green-500 text-sm font-medium"
                        >
                          Preview
                        </button>
                      ) : (
                        <span className="text-green-300 dark:text-green-700 text-sm font-medium cursor-not-allowed opacity-50">Preview</span>
                      )}
                      <button
                        onClick={() => handleSetDefaultCard(design.id)}
                        className={`text-sm font-medium ${
                          event.default_card_design_id === design.id
                            ? 'text-orange-600 dark:text-orange-400'
                            : 'text-green-600 dark:text-green-400 hover:text-green-500'
                        }`}
                      >
                        {event.default_card_design_id === design.id ? 'Default' : 'Set Default'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Link
            to={`/guests?event=${event.id}`}
            className="flex flex-col items-center p-6 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors w-full"
          >
            <Users className="w-8 h-8 text-blue-500 mb-2" />
            <span className="text-base font-medium text-gray-900 dark:text-white">Manage Guests</span>
          </Link>
          <Link
            to={`/invitations?event=${event.id}`}
            className="flex flex-col items-center p-6 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors w-full"
          >
            <Send className="w-8 h-8 text-green-500 mb-2" />
            <span className="text-base font-medium text-gray-900 dark:text-white">Send Invitations</span>
          </Link>
          <Link
            to={`/card-builder?event=${event.id}`}
            className="flex flex-col items-center p-6 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors w-full"
          >
            <CreditCard className="w-8 h-8 text-purple-500 mb-2" />
            <span className="text-base font-medium text-gray-900 dark:text-white">Design Cards</span>
          </Link>
          <Link
            to={`/events/${event.id}/analytics`}
            className="flex flex-col items-center p-6 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors w-full"
          >
            <BarChart3 className="w-8 h-8 text-orange-500 mb-2" />
            <span className="text-base font-medium text-gray-900 dark:text-white">Analytics</span>
          </Link>
          <Link
            to={`/events/${event.id}/configurations`}
            className="flex flex-col items-center p-6 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors w-full"
          >
            <Settings className="w-8 h-8 text-green-500 mb-2" />
            <span className="text-base font-medium text-gray-900 dark:text-white">Configurations</span>
          </Link>
        </div>
      </div>

      {/* Guest List Preview */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Guests ({eventGuests.length})
            </h3>
            <Link
              to={`/guests?event=${event.id}`}
              className="text-orange-600 dark:text-orange-400 hover:text-orange-500 dark:hover:text-orange-300 font-medium"
            >
              View All
            </Link>
          </div>
        </div>
        
        {eventGuests.length > 0 ? (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {eventGuests.slice(0, 5).map((guest) => (
              <div key={guest.id} className="p-6 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 flex items-center justify-center text-white font-medium">
                    {guest.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{guest.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                      {guest.phone ? (
                        <>
                          <Phone className="w-3 h-3 mr-1" />
                          {guest.phone}
                        </>
                      ) : (
                        <span className="italic text-xs text-gray-400">No phone</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    guest.rsvp_status === 'accepted' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : guest.rsvp_status === 'declined'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  }`}>
                    {guest.rsvp_status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-4">No guests added yet</p>
            <Link
              to={`/guests?event=${event.id}`}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg hover:from-orange-600 hover:to-pink-600 transition-all duration-200"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Guests
            </Link>
          </div>
        )}
      </div>

      {/* Edit Event Modal */}
      <EditEventModal
        event={event}
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
      />

      {/* Card Designs Modal */}
      <CardDesignsModal
        event={event}
        designs={eventCardDesigns}
        open={showCardModal}
        onClose={() => setShowCardModal(false)}
        onSetDefault={handleSetDefaultCard}
        eventGuests={eventGuests}
        setPreviewCard={setPreviewCard}
        setPreviewGuest={setPreviewGuest}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setShowDeleteConfirm(false)} />
            <div className="relative bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Delete Event
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to delete "{event.name}"? This action cannot be undone and will also delete all associated guests and data.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteEvent}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete Event
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {previewCard && previewGuest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="relative bg-white dark:bg-gray-900 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            <button
              onClick={() => { setPreviewCard(null); setPreviewGuest(null); }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl"
            >
              ×
            </button>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Card Preview</h2>
            <CardPreview design={previewCard} guest={previewGuest} event={event} />
          </div>
        </div>
      )}
    </div>
  )
}

// Edit Event Modal Component
const EditEventModal: React.FC<{ 
  event: any; 
  open: boolean; 
  onClose: () => void 
}> = ({ event, open, onClose }) => {
  const { updateEvent } = useApp()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: event.name,
    type: event.type,
    date: event.date,
    time: event.time,
    venue: event.venue,
    dress_code: event.dress_code || '',
    description: event.description || '',
    status: event.status
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await updateEvent(event.id, formData)
      onClose()
    } catch (error) {
      console.error('Error updating event:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Edit Event
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Event Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Event Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="wedding">Wedding</option>
                  <option value="birthday">Birthday</option>
                  <option value="anniversary">Anniversary</option>
                  <option value="send-off">Send-off</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Time
                </label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Venue
              </label>
              <input
                type="text"
                value={formData.venue}
                onChange={(e) => setFormData(prev => ({ ...prev, venue: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Event location"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Dress Code
              </label>
              <input
                type="text"
                value={formData.dress_code}
                onChange={(e) => setFormData(prev => ({ ...prev, dress_code: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="e.g., Formal, Casual, Black Tie"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Event description..."
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg hover:from-orange-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// Card Designs Modal Component
const CardDesignsModal: React.FC<{ 
  event: any;
  designs: any[]; 
  open: boolean; 
  onClose: () => void;
  onSetDefault: (designId: string) => void;
  eventGuests: any[];
  setPreviewCard: (design: any) => void;
  setPreviewGuest: (guest: any) => void;
}> = ({ event, designs, open, onClose, onSetDefault, eventGuests, setPreviewCard, setPreviewGuest }) => {
  const { deleteCardDesign } = useApp()

  const handleDeleteDesign = async (designId: string) => {
    if (confirm('Delete this card design?')) {
      try {
        await deleteCardDesign(designId)
      } catch (error) {
        console.error('Error deleting design:', error)
      }
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Card Designs for this Event
            </h2>
            <Link
              to={`/card-builder?event=${event.id}`}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg hover:from-orange-600 hover:to-pink-600 transition-all duration-200"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New
            </Link>
          </div>
          
          {designs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {designs.map(design => (
                <div
                  key={design.id}
                  className={`border-2 rounded-lg p-4 transition-all ${
                    event.default_card_design_id === design.id
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-900 dark:text-white">{design.name}</h3>
                    <div className="flex items-center space-x-1">
                      {event.default_card_design_id === design.id && (
                        <Star className="w-4 h-4 text-orange-500 fill-current" />
                      )}
                      <button
                        onClick={() => handleDeleteDesign(design.id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-500 dark:hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                      Size: {design.canvas_width} × {design.canvas_height}px
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Elements: {design.text_elements?.length || 0}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {new Date(design.updated_at).toLocaleDateString()}
                    </span>
                    <div className="flex space-x-2">
                      <Link
                        to={`/card-builder?event=${event.id}&design=${design.id}`}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-500 text-sm font-medium"
                      >
                        Edit
                      </Link>
                      {eventGuests.length > 0 ? (
                        <button
                          onClick={() => {
                            const guest = eventGuests[Math.floor(Math.random() * eventGuests.length)]
                            setPreviewCard(design)
                            setPreviewGuest(guest)
                          }}
                          className="text-green-600 dark:text-green-400 hover:text-green-500 text-sm font-medium"
                        >
                          Preview
                        </button>
                      ) : (
                        <span className="text-green-300 dark:text-green-700 text-sm font-medium cursor-not-allowed opacity-50">Preview</span>
                      )}
                      <button
                        onClick={() => onSetDefault(design.id)}
                        className={`text-sm font-medium ${
                          event.default_card_design_id === design.id
                            ? 'text-orange-600 dark:text-orange-400'
                            : 'text-green-600 dark:text-green-400 hover:text-green-500'
                        }`}
                      >
                        {event.default_card_design_id === design.id ? 'Default' : 'Set Default'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No Card Designs Yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Create beautiful invitation cards for this event
              </p>
              <Link
                to={`/card-builder?event=${event.id}`}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg hover:from-orange-600 hover:to-pink-600 transition-all duration-200"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Design
              </Link>
            </div>
          )}

          <div className="flex justify-end pt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const CardPreview: React.FC<{ design: any; guest: any; event: any }> = ({ design, guest, event }) => {
  const { getEventAttributes } = useApp()
  const eventAttributes = getEventAttributes(event.id)

  // Helper to replace variables in text
  const fillVariables = (text: string) => {
    return fillCardVariables(text, guest, event, eventAttributes)
  }

  return (
    <div className="flex justify-center">
      <div
        className="relative border-2 border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-white"
        style={{
          width: design.canvas_width,
          height: design.canvas_height,
          backgroundImage: design.background_image ? `url(${design.background_image})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {design.text_elements.map((element: any) => (
          <div
            key={element.id}
            className="absolute select-none flex items-center justify-center"
            style={{
              left: element.x,
              top: element.y,
              fontSize: element.fontSize,
              fontFamily: element.fontFamily,
              color: element.color,
              fontWeight: element.fontWeight,
              fontStyle: element.fontStyle,
              textDecoration: element.textDecoration,
              textAlign: element.textAlign,
              minWidth: '100px',
              padding: '4px',
              width: element.width || (element.type === 'qr_code' ? 100 : undefined),
              height: element.height || (element.type === 'qr_code' ? 100 : undefined),
            }}
          >
            {element.type === 'qr_code' ? (
              <QRCodeCanvas value={guest.id} size={element.width || 100} />
            ) : (
              fillVariables(element.text)
            )}
          </div>
        ))}
      </div>
    </div>
  )
}