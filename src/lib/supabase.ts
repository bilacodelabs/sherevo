import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface User {
  id: string
  email: string
  name: string
  role: 'customer' | 'super_admin'
  avatar: string
  created_at: string
  last_login: string
}

export interface Event {
  id: string
  name: string
  type: 'wedding' | 'send-off' | 'birthday' | 'anniversary' | 'other'
  date: string
  time: string
  venue: string
  dress_code: string
  cover_image: string
  description: string
  user_id: string
  status: 'draft' | 'published' | 'completed'
  guest_count: number
  rsvp_count: number
  invitations_sent: number
  default_card_design_id?: string
  created_at: string
  updated_at: string
}

export interface EventAttribute {
  id: string
  event_id: string
  attribute_key: string
  attribute_value: string
  attribute_type: 'text' | 'number' | 'date' | 'boolean'
  display_name: string
  is_required: boolean
  created_at: string
  updated_at: string
}

export interface Guest {
  id: string
  event_id: string
  name: string
  email: string
  phone: string
  category: string
  category_id?: string
  rsvp_status: 'pending' | 'accepted' | 'declined'
  invitation_sent: boolean
  qr_code: string
  delivery_status: 'not_sent' | 'sent' | 'delivered' | 'viewed'
  invited_at?: string
  responded_at?: string
  plus_one_allowed: boolean
  plus_one_name: string
  dietary_restrictions: string
  table_number?: number
  created_at: string
  updated_at: string
  card_url?: string
}

export interface GuestCategory {
  id: string
  event_id: string
  name: string
  color: string
  description: string
  created_at: string
}

export interface CardTemplate {
  id: string
  name: string
  type: string
  preview: string
  background_color: string
  text_color: string
  accent_color: string
  font_family: string
  is_popular: boolean
  usage_count: number
  created_at: string
}

export interface CardDesign {
  id: string
  name: string
  event_id: string
  user_id: string
  background_image: string
  canvas_width: number
  canvas_height: number
  text_elements: TextElement[]
  created_at: string
  updated_at: string
}

export interface TextElement {
  id: string
  text: string
  x: number
  y: number
  fontSize: number
  fontFamily: string
  color: string
  fontWeight: 'normal' | 'bold'
  fontStyle: 'normal' | 'italic'
  textDecoration: 'none' | 'underline'
  textAlign: 'left' | 'center' | 'right'
  isDragging: boolean
  type?: 'text' | 'qr_code'
  width?: number
  height?: number
}

export interface ActivityItem {
  id: string
  user_id: string
  type: string
  message: string
  event_id: string
  created_at: string
}

export interface EventAnalytics {
  id: string
  event_id: string
  total_invitations: number
  total_responses: number
  accepted_count: number
  declined_count: number
  pending_count: number
  view_count: number
  created_at: string
  updated_at: string
}

export interface UserConfiguration {
  id: string
  user_id: string
  whatsapp_api_key: string
  whatsapp_phone_number: string
  whatsapp_phone_number_id: string
  whatsapp_business_account_id: string
  whatsapp_enabled: boolean
  sms_api_key: string
  sms_provider: string
  sms_phone_number: string
  sms_enabled: boolean
  email_notifications: boolean
  push_notifications: boolean
  use_custom_config: boolean
  created_at: string
  updated_at: string
}

export interface SmsTemplate {
  id: string
  user_id: string
  name: string
  body: string
  created_at: string
  updated_at: string
  purpose: 'reminder' | 'invitation'
}

export interface EventSmsConfiguration {
  id: string
  event_id: string
  purpose: 'reminder' | 'invitation'
  sms_template_id: string
  created_at: string
  updated_at: string
}