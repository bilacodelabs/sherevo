import React, { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { 
  Plus, 
  Search, 
  Filter, 
  Users, 
  Mail, 
  Phone,
  Edit,
  Trash2,
  UserPlus,
  Download,
  Upload,
  Eye,
  ExternalLink
} from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { Guest } from '../lib/supabase'

export const Guests: React.FC = () => {
  const { guests, events, loading, createGuest, updateGuest, deleteGuest } = useApp()
  const [searchParams] = useSearchParams()
  const [searchQuery, setSearchQuery] = useState('')
  const [eventFilter, setEventFilter] = useState<string>(searchParams.get('event') || 'all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [rsvpFilter, setRsvpFilter] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    const eventParam = searchParams.get('event')
    if (eventParam) {
      setEventFilter(eventParam)
    }
  }, [searchParams])

  const filteredGuests = guests.filter(guest => {
    const matchesSearch = guest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (guest.email && guest.email.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesEvent = eventFilter === 'all' || guest.event_id === eventFilter
    const matchesCategory = categoryFilter === 'all' || guest.category === categoryFilter
    const matchesRsvp = rsvpFilter === 'all' || guest.rsvp_status === rsvpFilter
    
    return matchesSearch && matchesEvent && matchesCategory && matchesRsvp
  })

  const categories = ['General', 'Family', 'Friends', 'Colleagues', 'VIP']
  
  const getRsvpStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      accepted: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      declined: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    }
    return colors[status as keyof typeof colors] || colors.pending
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      'General': 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
      'Family': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'Friends': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'Colleagues': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'VIP': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
    }
    return colors[category as keyof typeof colors] || colors.General
  }

  const getEventName = (eventId: string) => {
    const event = events.find(e => e.id === eventId)
    return event?.name || 'Unknown Event'
  }

  const handleDeleteGuest = async (guest: Guest) => {
    if (window.confirm(`Are you sure you want to remove ${guest.name}?`)) {
      try {
        await deleteGuest(guest.id)
      } catch (error) {
        console.error('Error deleting guest:', error)
      }
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64"></div>
        <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Guests</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your guest lists and track RSVPs
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <Upload className="w-4 h-4 mr-2" />
            Import
          </button>
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
          <CreateGuestModal 
            open={showCreateModal} 
            onClose={() => setShowCreateModal(false)}
            preselectedEventId={eventFilter !== 'all' ? eventFilter : ''}
          />
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg hover:from-orange-600 hover:to-pink-600 transition-all duration-200"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Guest
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search guests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <select
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Events</option>
              {events.map(event => (
                <option key={event.id} value={event.id}>{event.name}</option>
              ))}
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <select
              value={rsvpFilter}
              onChange={(e) => setRsvpFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All RSVP Status</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="declined">Declined</option>
            </select>
          </div>
        </div>
      </div>

      {/* Guest List */}
      {filteredGuests.length > 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Guest
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Event
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    RSVP Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Plus One
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredGuests.map((guest) => (
                  <tr key={guest.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 flex items-center justify-center text-white font-medium">
                          {guest.name.charAt(0)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {guest.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center space-x-2">
                            {guest.phone ? (
                              <div className="flex items-center">
                                <Phone className="w-3 h-3 mr-1" />
                                {guest.phone}
                              </div>
                            ) : (
                              <span className="italic text-xs text-gray-400">No phone</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {getEventName(guest.event_id)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(guest.category)}`}>
                        {guest.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRsvpStatusColor(guest.rsvp_status)}`}>
                        {guest.rsvp_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {guest.plus_one_allowed ? (
                        guest.plus_one_name ? (
                          <div>
                            <div className="text-green-600 dark:text-green-400">Yes</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {guest.plus_one_name}
                            </div>
                          </div>
                        ) : (
                          <span className="text-yellow-600 dark:text-yellow-400">Allowed</span>
                        )
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400">No</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          to={`/guests/${guest.id}`}
                          className="text-gray-600 dark:text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteGuest(guest)}
                          className="text-red-600 dark:text-red-400 hover:text-red-500 dark:hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {searchQuery || eventFilter !== 'all' || categoryFilter !== 'all' || rsvpFilter !== 'all'
              ? 'No guests found'
              : 'No guests yet'
            }
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {searchQuery || eventFilter !== 'all' || categoryFilter !== 'all' || rsvpFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Add guests to your events to get started'
            }
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg hover:from-orange-600 hover:to-pink-600 transition-all duration-200"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Guest
          </button>
        </div>
      )}
    </div>
  )
}

// Create Guest Modal Component
const CreateGuestModal: React.FC<{ 
  open: boolean; 
  onClose: () => void;
  preselectedEventId?: string;
}> = ({ open, onClose, preselectedEventId = '' }) => {
  const { events, createGuest } = useApp()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    event_id: preselectedEventId,
    category: 'General',
    plus_one_allowed: false,
    dietary_restrictions: '',
    card_type: 'single' as 'single' | 'double' | 'multiple',
    card_count: 1
  })

  const categories = ['General', 'Family', 'Friends', 'Colleagues', 'VIP']

  useEffect(() => {
    if (preselectedEventId) {
      setFormData(prev => ({ ...prev, event_id: preselectedEventId }))
    }
  }, [preselectedEventId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Calculate card_count based on card_type
      let finalCardCount = 1
      if (formData.card_type === 'double') {
        finalCardCount = 2
      } else if (formData.card_type === 'multiple') {
        finalCardCount = formData.card_count
      }

      await createGuest({
        ...formData,
        rsvp_status: 'pending',
        invitation_sent: false,
        qr_code: '',
        delivery_status: 'not_sent',
        plus_one_name: '',
        card_count: finalCardCount
      })
      onClose()
      setFormData({
        name: '',
        email: '',
        phone: '',
        event_id: preselectedEventId,
        category: 'General',
        plus_one_allowed: false,
        dietary_restrictions: '',
        card_type: 'single',
        card_count: 1
      })
    } catch (error) {
      console.error('Error creating guest:', error)
      alert('Failed to create guest: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Add New Guest
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Event
              </label>
              <select
                value={formData.event_id}
                onChange={(e) => setFormData(prev => ({ ...prev, event_id: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
              >
                <option value="">Select an event</option>
                {events.map(event => (
                  <option key={event.id} value={event.id}>{event.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Card Type
              </label>
              <select
                value={formData.card_type}
                onChange={(e) => {
                  const newCardType = e.target.value as 'single' | 'double' | 'multiple'
                  let newCardCount = 1
                  if (newCardType === 'double') {
                    newCardCount = 2
                  } else if (newCardType === 'single') {
                    newCardCount = 1
                  } else if (newCardType === 'multiple') {
                    newCardCount = 3
                  }
                  setFormData(prev => ({ 
                    ...prev, 
                    card_type: newCardType,
                    card_count: newCardCount
                  }))
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="single">Single (1 card)</option>
                <option value="double">Double (2 cards)</option>
                <option value="multiple">Multiple</option>
              </select>
            </div>

            {formData.card_type === 'multiple' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Card Count
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.card_count}
                  onChange={(e) => {
                    const count = parseInt(e.target.value) || 1
                    setFormData(prev => ({ ...prev, card_count: count }))
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
            )}

            <div className="flex items-center">
              <input
                type="checkbox"
                id="plus_one_allowed"
                checked={formData.plus_one_allowed}
                onChange={(e) => setFormData(prev => ({ ...prev, plus_one_allowed: e.target.checked }))}
                className="h-4 w-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
              />
              <label htmlFor="plus_one_allowed" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Allow plus one
              </label>
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
                {loading ? 'Adding...' : 'Add Guest'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}