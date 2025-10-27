import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase, Event, Guest, CardTemplate, ActivityItem, EventAnalytics, CardDesign, UserConfiguration, EventAttribute, SmsTemplate, EventSmsConfiguration } from '../lib/supabase'
import { getEffectiveConfig } from '../lib/config'
import { useAuth } from './AuthContext'

interface AppContextType {
  events: Event[]
  guests: Guest[]
  templates: CardTemplate[]
  activities: ActivityItem[]
  analytics: EventAnalytics[]
  cardDesigns: CardDesign[]
  eventAttributes: EventAttribute[]
  userConfig: UserConfiguration | null
  effectiveConfig: Partial<UserConfiguration>
  loading: boolean
  refreshData: () => Promise<void>
  createEvent: (event: Omit<Event, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<Event>
  updateEvent: (id: string, updates: Partial<Event>) => Promise<void>
  deleteEvent: (id: string) => Promise<void>
  createGuest: (guest: Omit<Guest, 'id' | 'created_at' | 'updated_at'>) => Promise<Guest>
  updateGuest: (id: string, updates: Partial<Guest>) => Promise<void>
  deleteGuest: (id: string) => Promise<void>
  createCardDesign: (design: Omit<CardDesign, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<CardDesign>
  updateCardDesign: (id: string, updates: Partial<CardDesign>) => Promise<void>
  deleteCardDesign: (id: string) => Promise<void>
  setDefaultCardDesign: (eventId: string, designId: string) => Promise<void>
  createEventAttribute: (attribute: Omit<EventAttribute, 'id' | 'created_at' | 'updated_at'>) => Promise<EventAttribute>
  updateEventAttribute: (id: string, updates: Partial<EventAttribute>) => Promise<void>
  deleteEventAttribute: (id: string) => Promise<void>
  getEventAttributes: (eventId: string) => EventAttribute[]
  updateUserConfig: (config: Partial<UserConfiguration>) => Promise<void>
  addActivity: (type: string, message: string, eventId: string) => Promise<void>
  smsTemplates: SmsTemplate[]
  createSmsTemplate: (template: Omit<SmsTemplate, 'id' | 'created_at' | 'updated_at'>) => Promise<SmsTemplate>
  updateSmsTemplate: (id: string, updates: Partial<SmsTemplate>) => Promise<void>
  deleteSmsTemplate: (id: string) => Promise<void>
  eventSmsConfigs: EventSmsConfiguration[]
  getEventSmsConfig: (eventId: string, purpose: 'reminder' | 'invitation') => EventSmsConfiguration | undefined
  setEventSmsConfig: (eventId: string, purpose: 'reminder' | 'invitation', smsTemplateId: string) => Promise<void>
  deleteEventSmsConfig: (eventId: string, purpose: 'reminder' | 'invitation') => Promise<void>
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export const useApp = () => {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [guests, setGuests] = useState<Guest[]>([])
  const [templates, setTemplates] = useState<CardTemplate[]>([])
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [analytics, setAnalytics] = useState<EventAnalytics[]>([])
  const [cardDesigns, setCardDesigns] = useState<CardDesign[]>([])
  const [eventAttributes, setEventAttributes] = useState<EventAttribute[]>([])
  const [userConfig, setUserConfig] = useState<UserConfiguration | null>(null)
  const [loading, setLoading] = useState(true)
  const [smsTemplates, setSmsTemplates] = useState<SmsTemplate[]>([])
  const [eventSmsConfigs, setEventSmsConfigs] = useState<EventSmsConfiguration[]>([])

  useEffect(() => {
    if (user) {
      refreshData()
    }
  }, [user])

  const refreshData = async () => {
    if (!user) return

    try {
      setLoading(true)
      
      // Fetch events
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (eventsError) throw eventsError
      setEvents(eventsData || [])

      // Fetch guests
      const { data: guestsData, error: guestsError } = await supabase
        .from('guests')
        .select('*')
        .in('event_id', eventsData?.map(e => e.id) || [])
        .order('created_at', { ascending: false })

      if (guestsError) throw guestsError
      setGuests(guestsData || [])

      // Fetch event attributes
      const { data: attributesData, error: attributesError } = await supabase
        .from('event_attributes')
        .select('*')
        .in('event_id', eventsData?.map(e => e.id) || [])
        .order('created_at', { ascending: false })

      if (attributesError) throw attributesError
      setEventAttributes(attributesData || [])

      // Fetch templates
      const { data: templatesData, error: templatesError } = await supabase
        .from('card_templates')
        .select('*')
        .order('is_popular', { ascending: false })

      if (templatesError) throw templatesError
      setTemplates(templatesData || [])

      // Fetch activities
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('activity_items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (activitiesError) throw activitiesError
      setActivities(activitiesData || [])

      // Fetch analytics
      const { data: analyticsData, error: analyticsError } = await supabase
        .from('event_analytics')
        .select('*')
        .in('event_id', eventsData?.map(e => e.id) || [])

      if (analyticsError) throw analyticsError
      setAnalytics(analyticsData || [])

      // Fetch card designs
      const { data: cardDesignsData, error: cardDesignsError } = await supabase
        .from('card_designs')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

      if (cardDesignsError) throw cardDesignsError
      setCardDesigns(cardDesignsData || [])

      // Fetch user configuration
      const { data: configData, error: configError } = await supabase
        .from('user_configurations')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (configError && configError.code !== 'PGRST116') throw configError
      setUserConfig(configData || null)

      // Fetch SMS templates
      const { data: smsTemplatesData, error: smsTemplatesError } = await supabase
        .from('sms_templates')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (smsTemplatesError) throw smsTemplatesError
      setSmsTemplates(smsTemplatesData || [])

      // Fetch event SMS configs
      const { data: smsConfigData, error: smsConfigError } = await supabase
        .from('event_sms_configurations')
        .select('*')
        .in('event_id', eventsData?.map(e => e.id) || [])
      if (smsConfigError) throw smsConfigError
      setEventSmsConfigs(smsConfigData || [])

    } catch (error) {
      console.error('Error refreshing data:', error)
    } finally {
      setLoading(false)
    }
  }

  const createEvent = async (eventData: Omit<Event, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('events')
      .insert({
        ...eventData,
        user_id: user.id
      })
      .select()
      .single()

    if (error) throw error
    
    setEvents(prev => [data, ...prev])
    await addActivity('event_created', `Created event "${data.name}"`, data.id)
    
    return data
  }

  const updateEvent = async (id: string, updates: Partial<Event>) => {
    console.log('Updating event:', id, updates)
    
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Update timeout after 30 seconds')), 30000)
    )
    
    try {
      const updatePromise = supabase
        .from('events')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      const { data, error } = await Promise.race([updatePromise, timeoutPromise]) as any

      if (error) {
        console.error('Error updating event:', error)
        throw error
      }
      
      console.log('Event updated successfully:', data)
      setEvents(prev => prev.map(event => event.id === id ? data : event))
      
      // Don't wait for activity to complete - it can hang
      addActivity('event_updated', `Updated event "${data.name}"`, id).catch(err => console.error('Activity logging failed:', err))
    } catch (err) {
      console.error('Failed to update event:', err)
      throw err
    }
  }

  const deleteEvent = async (id: string) => {
    const event = events.find(e => e.id === id)
    
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id)

    if (error) throw error
    
    setEvents(prev => prev.filter(event => event.id !== id))
    setGuests(prev => prev.filter(guest => guest.event_id !== id))
    
    if (event) {
      await addActivity('event_deleted', `Deleted event "${event.name}"`, id)
    }
  }

  const createGuest = async (guestData: Omit<Guest, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase
      .from('guests')
      .insert(guestData)
      .select()
      .single()

    if (error) throw error
    
    setGuests(prev => [data, ...prev])
    await addActivity('guest_added', `Added guest "${data.name}"`, data.event_id)
    
    return data
  }

  const updateGuest = async (id: string, updates: Partial<Guest>) => {
    const { data, error } = await supabase
      .from('guests')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    
    setGuests(prev => prev.map(guest => guest.id === id ? data : guest))
    await addActivity('guest_updated', `Updated guest "${data.name}"`, data.event_id)
  }

  const deleteGuest = async (id: string) => {
    const guest = guests.find(g => g.id === id)
    
    const { error } = await supabase
      .from('guests')
      .delete()
      .eq('id', id)

    if (error) throw error
    
    setGuests(prev => prev.filter(g => g.id !== id))
    
    if (guest) {
      await addActivity('guest_removed', `Removed guest "${guest.name}"`, guest.event_id)
    }
  }

  const createCardDesign = async (designData: Omit<CardDesign, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('card_designs')
      .insert({
        ...designData,
        user_id: user.id
      })
      .select()
      .single()

    if (error) throw error
    
    setCardDesigns(prev => [data, ...prev])
    await addActivity('card_design_created', `Created card design "${data.name}"`, data.event_id || '')
    
    return data
  }

  const updateCardDesign = async (id: string, updates: Partial<CardDesign>) => {
    const { data, error } = await supabase
      .from('card_designs')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    
    setCardDesigns(prev => prev.map(design => design.id === id ? data : design))
    await addActivity('card_design_updated', `Updated card design "${data.name}"`, data.event_id || '')
  }

  const deleteCardDesign = async (id: string) => {
    const design = cardDesigns.find(d => d.id === id)
    
    const { error } = await supabase
      .from('card_designs')
      .delete()
      .eq('id', id)

    if (error) throw error
    
    setCardDesigns(prev => prev.filter(d => d.id !== id))
    
    if (design) {
      await addActivity('card_design_deleted', `Deleted card design "${design.name}"`, design.event_id || '')
    }
  }

  const setDefaultCardDesign = async (eventId: string, designId: string) => {
    const { error } = await supabase
      .from('events')
      .update({ default_card_design_id: designId })
      .eq('id', eventId)

    if (error) throw error
    
    setEvents(prev => prev.map(event => 
      event.id === eventId 
        ? { ...event, default_card_design_id: designId }
        : event
    ))
    
    const design = cardDesigns.find(d => d.id === designId)
    if (design) {
      await addActivity('default_card_set', `Set "${design.name}" as default card design`, eventId)
    }
  }

  const createEventAttribute = async (attributeData: Omit<EventAttribute, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase
      .from('event_attributes')
      .insert(attributeData)
      .select()
      .single()

    if (error) throw error
    
    setEventAttributes(prev => [data, ...prev])
    await addActivity('event_attribute_added', `Added attribute "${data.display_name}"`, data.event_id)
    
    return data
  }

  const updateEventAttribute = async (id: string, updates: Partial<EventAttribute>) => {
    const { data, error } = await supabase
      .from('event_attributes')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    
    setEventAttributes(prev => prev.map(attr => attr.id === id ? data : attr))
    await addActivity('event_attribute_updated', `Updated attribute "${data.display_name}"`, data.event_id)
  }

  const deleteEventAttribute = async (id: string) => {
    const attribute = eventAttributes.find(a => a.id === id)
    
    const { error } = await supabase
      .from('event_attributes')
      .delete()
      .eq('id', id)

    if (error) throw error
    
    setEventAttributes(prev => prev.filter(a => a.id !== id))
    
    if (attribute) {
      await addActivity('event_attribute_deleted', `Deleted attribute "${attribute.display_name}"`, attribute.event_id)
    }
  }

  const getEventAttributes = (eventId: string): EventAttribute[] => {
    return eventAttributes.filter(attr => attr.event_id === eventId)
  }

  const updateUserConfig = async (configUpdates: Partial<UserConfiguration>) => {
    if (!user) throw new Error('User not authenticated')

    try {
      // First, try to update existing configuration
      const { data: updateData, error: updateError } = await supabase
        .from('user_configurations')
        .update({
          ...configUpdates,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .select()
        .single()

      if (updateData) {
        setUserConfig(updateData)
        return
      }

      // If no existing configuration found, create a new one
      const { data: insertData, error: insertError } = await supabase
      .from('user_configurations')
        .insert({
        user_id: user.id,
        ...configUpdates,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

      if (insertError) throw insertError
      setUserConfig(insertData)
    
    } catch (error) {
      console.error('Error updating user configuration:', error)
      throw error
    }
  }

  const addActivity = async (type: string, message: string, eventId: string) => {
    if (!user) return

    const { data, error } = await supabase
      .from('activity_items')
      .insert({
        user_id: user.id,
        type,
        message,
        event_id: eventId
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding activity:', error)
      return
    }
    
    setActivities(prev => [data, ...prev.slice(0, 19)])
  }

  const createSmsTemplate = async (template: Omit<SmsTemplate, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase
      .from('sms_templates')
      .insert([{ ...template }])
      .select()
      .single()
    if (error) throw error
    setSmsTemplates(prev => [data, ...prev])
    return data
  }

  const updateSmsTemplate = async (id: string, updates: Partial<SmsTemplate>) => {
    const { data, error } = await supabase
      .from('sms_templates')
      .update({ ...updates })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    setSmsTemplates(prev => prev.map(t => t.id === id ? data : t))
  }

  const deleteSmsTemplate = async (id: string) => {
    const { error } = await supabase
      .from('sms_templates')
      .delete()
      .eq('id', id)
    if (error) throw error
    setSmsTemplates(prev => prev.filter(t => t.id !== id))
  }

  const getEventSmsConfig = (eventId: string, purpose: 'reminder' | 'invitation') => {
    return eventSmsConfigs.find(cfg => cfg.event_id === eventId && cfg.purpose === purpose)
  }

  const setEventSmsConfig = async (eventId: string, purpose: 'reminder' | 'invitation', smsTemplateId: string) => {
    console.log('Setting SMS config:', { eventId, purpose, smsTemplateId })
    
    try {
      // Direct upsert without race/timeout to see actual errors
      console.log('Calling Supabase upsert for event_sms_configurations...')
      
      const { data, error } = await supabase
        .from('event_sms_configurations')
        .upsert([{ event_id: eventId, purpose, sms_template_id: smsTemplateId }], { onConflict: 'event_id,purpose' })
        .select()
        .single()
      
      console.log('Supabase response:', { data, error })
      
      if (error) {
        console.error('SMS config error:', error)
        throw error
      }
      
      console.log('SMS config saved successfully:', data)
      
      setEventSmsConfigs(prev => {
        const filtered = prev.filter(cfg => !(cfg.event_id === eventId && cfg.purpose === purpose))
        return [data, ...filtered]
      })
    } catch (err) {
      console.error('Failed to save SMS config:', err)
      throw err
    }
  }

  const deleteEventSmsConfig = async (eventId: string, purpose: 'reminder' | 'invitation') => {
    const { error } = await supabase
      .from('event_sms_configurations')
      .delete()
      .eq('event_id', eventId)
      .eq('purpose', purpose)
    if (error) throw error
    setEventSmsConfigs(prev => prev.filter(cfg => !(cfg.event_id === eventId && cfg.purpose === purpose)))
  }

  const value = {
    events,
    guests,
    templates,
    activities,
    analytics,
    cardDesigns,
    eventAttributes,
    userConfig,
    effectiveConfig: getEffectiveConfig(userConfig),
    loading,
    refreshData,
    createEvent,
    updateEvent,
    deleteEvent,
    createGuest,
    updateGuest,
    deleteGuest,
    createCardDesign,
    updateCardDesign,
    deleteCardDesign,
    setDefaultCardDesign,
    createEventAttribute,
    updateEventAttribute,
    deleteEventAttribute,
    getEventAttributes,
    updateUserConfig,
    addActivity,
    smsTemplates,
    createSmsTemplate,
    updateSmsTemplate,
    deleteSmsTemplate,
    eventSmsConfigs,
    getEventSmsConfig,
    setEventSmsConfig,
    deleteEventSmsConfig
  }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}