import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  User,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  Eye,
  Plus,
  MessageSquare,
  Settings,
  Pencil,
  Loader2,
  MinusCircle
} from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { format } from 'date-fns'
import { getPledgesByGuest, createPledge, updatePledge, deletePledge, Pledge } from '../lib/supabase'

export const GuestDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { guests, events, loading, deleteGuest, updateGuest } = useApp()
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [pledges, setPledges] = useState<Pledge[]>([])
  const [pledgesLoading, setPledgesLoading] = useState(true)
  const [showPledgeModal, setShowPledgeModal] = useState(false)
  const [editingPledge, setEditingPledge] = useState<Pledge | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentPledge, setPaymentPledge] = useState<Pledge | null>(null)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentLoading, setPaymentLoading] = useState(false)

  const guest = guests.find(g => g.id === id)
  const event = guest ? events.find(e => e.id === guest.event_id) : null

  useEffect(() => {
    if (!loading && !guest) {
      navigate('/guests')
    }
  }, [guest, loading, navigate])

  useEffect(() => {
    if (!guest) return
    setPledgesLoading(true)
    getPledgesByGuest(guest.id)
      .then(setPledges)
      .catch(console.error)
      .finally(() => setPledgesLoading(false))
  }, [guest])

  if (loading || !guest || !event) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64"></div>
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    )
  }

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

  const handleDeleteGuest = async () => {
    try {
      await deleteGuest(guest.id)
      navigate('/guests')
    } catch (error) {
      console.error('Error deleting guest:', error)
    }
  }

  const handleRsvpUpdate = async (newStatus: string) => {
    try {
      await updateGuest(guest.id, { 
        rsvp_status: newStatus as any,
        responded_at: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error updating RSVP:', error)
    }
  }

  const handlePledgeSave = async (pledge: Partial<Pledge>) => {
    setPledgesLoading(true)
    try {
      if (editingPledge) {
        await updatePledge(editingPledge.id, pledge)
      } else {
        await createPledge({
          ...pledge,
          guest_id: guest.id,
          event_id: event.id,
          status: 'pending',
        } as any)
      }
      const updated = await getPledgesByGuest(guest.id)
      setPledges(updated)
      setShowPledgeModal(false)
      setEditingPledge(null)
    } catch (e) {
      alert('Error saving pledge')
    } finally {
      setPledgesLoading(false)
    }
  }

  const handlePledgeDelete = async (pledgeId: string) => {
    if (!window.confirm('Delete this pledge?')) return
    setPledgesLoading(true)
    try {
      await deletePledge(pledgeId)
      setPledges(await getPledgesByGuest(guest.id))
    } catch (e) {
      alert('Error deleting pledge')
    } finally {
      setPledgesLoading(false)
    }
  }

  const handleAddPayment = async () => {
    if (!paymentPledge || !paymentAmount) return
    setPaymentLoading(true)
    try {
      const paid = Number(paymentPledge.paid_amount || 0) + Number(paymentAmount)
      await updatePledge(paymentPledge.id, { paid_amount: paid })
      setPledges(await getPledgesByGuest(guest.id))
      setShowPaymentModal(false)
      setPaymentPledge(null)
      setPaymentAmount('')
    } catch (e) {
      alert('Error recording payment')
    } finally {
      setPaymentLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/guests')}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl">
              {guest.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{guest.name}</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Guest for {event.name}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowNoteModal(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Add Note
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
            Remove
          </button>
        </div>
      </div>

      {/* Guest Information */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Guest Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="flex items-center space-x-3">
              <Mail className="w-5 h-5 text-gray-400" />
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Email</div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {guest.email || 'Not provided'}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Phone className="w-5 h-5 text-gray-400" />
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Phone</div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {guest.phone || 'Not provided'}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <User className="w-5 h-5 text-gray-400" />
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Category</div>
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(guest.category)}`}>
                  {guest.category}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RSVP Status */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">RSVP Status</h3>
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${getRsvpStatusColor(guest.rsvp_status)}`}>
              {guest.rsvp_status}
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => handleRsvpUpdate('accepted')}
              className={`p-4 rounded-lg border-2 transition-all ${
                guest.rsvp_status === 'accepted'
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                  : 'border-gray-200 dark:border-gray-600 hover:border-green-300'
              }`}
            >
              <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <div className="font-medium text-gray-900 dark:text-white">Accepted</div>
            </button>
            
            <button
              onClick={() => handleRsvpUpdate('declined')}
              className={`p-4 rounded-lg border-2 transition-all ${
                guest.rsvp_status === 'declined'
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                  : 'border-gray-200 dark:border-gray-600 hover:border-red-300'
              }`}
            >
              <XCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <div className="font-medium text-gray-900 dark:text-white">Declined</div>
            </button>
            
            <button
              onClick={() => handleRsvpUpdate('pending')}
              className={`p-4 rounded-lg border-2 transition-all ${
                guest.rsvp_status === 'pending'
                  ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                  : 'border-gray-200 dark:border-gray-600 hover:border-yellow-300'
              }`}
            >
              <Clock className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
              <div className="font-medium text-gray-900 dark:text-white">Pending</div>
            </button>
          </div>
          
          {guest.responded_at && (
            <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              Responded on {format(new Date(guest.responded_at), 'MMMM d, yyyy at h:mm a')}
            </div>
          )}
        </div>
      </div>

      {/* Plus One Information */}
      {guest.plus_one_allowed && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Plus One</h3>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {guest.plus_one_name || 'No plus one specified'}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Plus one is allowed for this guest
                </div>
              </div>
              {!guest.plus_one_name && (
                <button
                  onClick={() => setShowEditModal(true)}
                  className="text-orange-600 dark:text-orange-400 hover:text-orange-500 dark:hover:text-orange-300 font-medium"
                >
                  Add Plus One
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Event Information */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Event Details</h3>
            <Link
              to={`/events/${event.id}`}
              className="text-orange-600 dark:text-orange-400 hover:text-orange-500 dark:hover:text-orange-300 font-medium"
            >
              View Event
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Date & Time</div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {format(new Date(event.date), 'MMMM d, yyyy')} at {event.time}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <MapPin className="w-5 h-5 text-gray-400" />
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Venue</div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {event.venue}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Information */}
      {guest.dietary_restrictions && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Dietary Restrictions</h3>
            <p className="text-gray-600 dark:text-gray-400">{guest.dietary_restrictions}</p>
          </div>
        </div>
      )}

      {/* Pledges Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Pledges</h3>
            <button
              onClick={() => { setEditingPledge(null); setShowPledgeModal(true) }}
              className="inline-flex items-center px-3 py-1.5 text-sm bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg hover:from-orange-600 hover:to-pink-600 transition-all duration-200"
            >
              <Plus className="w-4 h-4 mr-1" /> Add Pledge
            </button>
          </div>
          {pledgesLoading ? (
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400"><Loader2 className="animate-spin w-4 h-4" /> Loading...</div>
          ) : pledges.length === 0 ? (
            <div className="text-gray-500 dark:text-gray-400">No pledges yet.</div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {pledges.map(pledge => {
                const paid = Number(pledge.paid_amount || 0)
                const total = Number(pledge.amount)
                const remaining = total - paid
                return (
                  <div key={pledge.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">{pledge.type} - {total.toLocaleString()} TZS</div>
                      <div className="flex gap-4 text-xs mt-1">
                        <span className="text-gray-500 dark:text-gray-300">Pledge Amount: <span className="font-semibold text-gray-900 dark:text-white">{total.toLocaleString()} TZS</span></span>
                        <span className="text-gray-500 dark:text-gray-300">Paid: <span className="font-semibold text-green-600">{paid.toLocaleString()} TZS</span></span>
                        <span className="text-gray-500 dark:text-gray-300">Remaining: <span className={`font-semibold ${remaining > 0 ? 'text-red-500' : 'text-gray-700 dark:text-gray-200'}`}>{remaining.toLocaleString()} TZS</span></span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{pledge.status} {pledge.notes && <>| {pledge.notes}</>}</div>
                    </div>
                    <div className="flex gap-2 items-center">
                      <button
                        onClick={() => { setPaymentPledge(pledge); setShowPaymentModal(true) }}
                        className="p-2 text-blue-500 hover:text-blue-700"
                        title="Record Payment"
                      >
                        <MinusCircle className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => { setEditingPledge(pledge); setShowPledgeModal(true) }}
                        className="p-2 text-blue-500 hover:text-blue-700"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handlePledgeDelete(pledge.id)}
                        className="p-2 text-red-500 hover:text-red-700"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Edit Guest Modal */}
      <EditGuestModal
        guest={guest}
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setShowDeleteConfirm(false)} />
            <div className="relative bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Remove Guest
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to remove {guest.name} from the guest list? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteGuest}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Remove Guest
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pledge Modal */}
      {showPledgeModal && (
        <PledgeModal
          open={showPledgeModal}
          onClose={() => { setShowPledgeModal(false); setEditingPledge(null) }}
          onSave={handlePledgeSave}
          initial={editingPledge}
        />
      )}

      {/* Payment Modal */}
      {showPaymentModal && paymentPledge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 w-full max-w-md shadow-lg border border-gray-200 dark:border-gray-700 relative">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" onClick={() => setShowPaymentModal(false)}>&times;</button>
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Record Payment</h2>
            <div className="mb-2 text-gray-700 dark:text-gray-200">Pledge: <span className="font-semibold">{paymentPledge.type} - {Number(paymentPledge.amount).toLocaleString()} TZS</span></div>
            <form onSubmit={e => { e.preventDefault(); handleAddPayment() }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Amount Paid (TZS)</label>
                <input
                  type="number"
                  min="1"
                  max={Number(paymentPledge.amount) - Number(paymentPledge.paid_amount || 0)}
                  required
                  className="w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                  disabled={paymentLoading}
                >
                  {paymentLoading ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg"
                  onClick={() => setShowPaymentModal(false)}
                  disabled={paymentLoading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// Edit Guest Modal Component
const EditGuestModal: React.FC<{ 
  guest: any; 
  open: boolean; 
  onClose: () => void 
}> = ({ guest, open, onClose }) => {
  const { updateGuest, events } = useApp()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: guest.name,
    email: guest.email || '',
    phone: guest.phone || '',
    category: guest.category,
    plus_one_allowed: guest.plus_one_allowed,
    plus_one_name: guest.plus_one_name || '',
    dietary_restrictions: guest.dietary_restrictions || ''
  })

  const categories = ['General', 'Family', 'Friends', 'Colleagues', 'VIP']

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await updateGuest(guest.id, formData)
      onClose()
    } catch (error) {
      console.error('Error updating guest:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Edit Guest
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

            {formData.plus_one_allowed && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Plus One Name
                </label>
                <input
                  type="text"
                  value={formData.plus_one_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, plus_one_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Plus one's name"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Dietary Restrictions
              </label>
              <textarea
                value={formData.dietary_restrictions}
                onChange={(e) => setFormData(prev => ({ ...prev, dietary_restrictions: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Any dietary restrictions or allergies"
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

// Pledge Modal Component
const PledgeModal: React.FC<{
  open: boolean;
  onClose: () => void;
  onSave: (pledge: Partial<Pledge>) => void;
  initial?: Pledge | null;
}> = ({ open, onClose, onSave, initial }) => {
  const [form, setForm] = useState({
    amount: initial?.amount || '',
    type: initial?.type || '',
    notes: initial?.notes || '',
    status: initial?.status || 'pending',
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (initial) {
      setForm({
        amount: initial.amount,
        type: initial.type,
        notes: initial.notes || '',
        status: initial.status,
      })
    } else {
      setForm({ amount: '', type: '', notes: '', status: 'pending' })
    }
  }, [initial])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSave({
        ...form,
        amount: Number(form.amount),
      })
      onClose()
    } catch (e) {
      alert('Error saving pledge')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 w-full max-w-md shadow-lg border border-gray-200 dark:border-gray-700 relative">
        <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" onClick={onClose}>&times;</button>
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">{initial ? 'Edit Pledge' : 'Add Pledge'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Amount (TZS)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm font-medium">TZS</span>
              <input
                type="number"
                min="0"
                required
                className="w-full py-2 pl-12 pr-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                placeholder="0"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Type</label>
            <input
              type="text"
              required
              className="w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              value={form.type}
              onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Status</label>
            <select
              className="w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              value={form.status}
              onChange={e => setForm(f => ({ ...f, status: e.target.value as 'pending' | 'fulfilled' | 'cancelled' }))}
            >
              <option value="pending">Pending</option>
              <option value="fulfilled">Fulfilled</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Notes</label>
            <textarea
              className="w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={2}
            />
          </div>
          <div className="flex gap-2 mt-2">
            <button
              type="submit"
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}