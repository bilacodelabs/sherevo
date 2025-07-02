import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { 
  Send, 
  Search, 
  Filter, 
  Mail, 
  CheckCircle, 
  Clock,
  AlertCircle,
  Eye,
  Download,
  Users,
  Calendar,
  BarChart3,
  MessageSquare,
  Phone
} from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { format } from 'date-fns'
import { supabase } from '../lib/supabase'
import { generateCardImageForGuest } from '../lib/cardImage'

function fetchWithTimeout(resource: RequestInfo, options: any = {}) {
  const { timeout = 15000 } = options;
  return Promise.race([
    fetch(resource, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timed out')), timeout)
    )
  ]);
}

export const Invitations: React.FC = () => {
  const { events, guests, loading, userConfig, updateGuest, getEventAttributes } = useApp()
  const [searchParams] = useSearchParams()
  const [selectedEvent, setSelectedEvent] = useState<string>(searchParams.get('event') || '')
  const [selectedGuests, setSelectedGuests] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showSendModal, setShowSendModal] = useState(false)
  const [sendViaWhatsApp, setSendViaWhatsApp] = useState(false)
  const [sendViaSMS, setSendViaSMS] = useState(false)
  const [showProgressDialog, setShowProgressDialog] = useState(false)
  const [progress, setProgress] = useState(0)
  const [total, setTotal] = useState(0)
  const [currentGuest, setCurrentGuest] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [results, setResults] = useState<string[]>([])

  // Function to check WhatsApp Business Account status
  const checkWhatsAppStatus = async () => {
    if (!userConfig?.whatsapp_api_key || !userConfig?.whatsapp_phone_number_id) {
      return { valid: false, error: 'Missing API key or Phone Number ID' }
    }

    try {
      const res = await fetch(`https://graph.facebook.com/v18.0/${userConfig.whatsapp_phone_number_id}`, {
        headers: {
          'Authorization': `Bearer ${userConfig.whatsapp_api_key}`,
        },
      })
      
      const data = await res.json()
      console.log('WhatsApp Phone Number Status:', data)
      
      if (res.ok) {
        return { 
          valid: true, 
          data,
          verified: data.verified_name !== undefined,
          qualityRating: data.quality_rating,
          codeVerificationStatus: data.code_verification_status
        }
      } else {
        return { valid: false, error: data.error?.message || 'Failed to fetch phone number status' }
      }
    } catch (err) {
      return { valid: false, error: err instanceof Error ? err.message : 'Network error' }
    }
  }

  // Function to show troubleshooting guide
  const showTroubleshootingGuide = () => {
    const guide = `
🔧 WhatsApp Cloud API Troubleshooting Guide

✅ COMMON ISSUES & SOLUTIONS:

1. **Phone Number Not Verified**
   - Go to Meta Developer Console → WhatsApp → Phone Numbers
   - Verify your phone number with the code sent via SMS
   - Wait for verification to complete (can take 24 hours)

2. **Business Account Not Approved**
   - Ensure your WhatsApp Business Account is approved
   - Check if you have a verified business name
   - Quality rating should be GREEN or YELLOW

3. **Phone Number Format**
   - Must be in international format WITHOUT + symbol
   - Example: 255753613628 (not +255753613628)
   - Must include country code

4. **Message Templates Required**
   - First message to a user must use a template
   - Free-form text only works after user replies
   - Create templates in Meta Developer Console

5. **API Permissions**
   - Ensure your app has "messages" permission
   - Check if your access token is valid and not expired
   - Verify the phone number ID matches your verified number

6. **Rate Limits**
   - Check if you've hit rate limits
   - Wait 24 hours if rate limited
   - Monitor your usage in Meta Developer Console

7. **Template Parameter Mismatch**
   - Template expects specific number of parameters
   - Check your template configuration in Event Configurations
   - Ensure variable mapping matches template requirements

📱 TESTING STEPS:
1. Click "Check WhatsApp Status" button above
2. Verify phone number is verified and approved
3. Try sending to your own verified phone number first
4. Check browser console for detailed error messages

📝 QUICK TEMPLATE SETUP:
1. Go to Meta Developer Console → WhatsApp → Message Templates
2. Click "Create Template"
3. Choose "Text" type
4. Name: "event_invitation"
5. Language: English
6. Category: Marketing
7. Body: "Hi {{1}}, you are invited to {{2}} on {{3}}!"
8. Variables: {{1}} = guest name, {{2}} = event name, {{3}} = event date
9. Submit for approval (usually takes 24-48 hours)

Need help? Check Meta's official documentation or contact support.
    `
    alert(guide)
  }

  // Function to debug template configuration
  const debugTemplateConfig = async () => {
    if (!selectedEvent) {
      alert('Please select an event first')
      return
    }

    try {
      const { data: eventConfig, error } = await supabase
        .from('event_message_configurations')
        .select('*')
        .eq('event_id', selectedEvent)
        .eq('channel', 'whatsapp')
        .single()

      if (error || !eventConfig) {
        alert('No WhatsApp template configuration found for this event')
        return
      }

      const paramCount = Object.keys(eventConfig.variable_mapping || {}).length
      const mappingDetails = Object.entries(eventConfig.variable_mapping || {}).map(([key, value]) => `${key}: ${value}`).join('\n')
      
      // Check for header configuration
      const hasHeaderConfig = Object.values(eventConfig.variable_mapping || {}).some(value => 
        typeof value === 'string' && value.startsWith('header_')
      )
      
      // Check for card URL mapping
      const hasCardUrlMapping = Object.values(eventConfig.variable_mapping || {}).some(value => 
        value === 'card_url'
      )
      
      let headerInfo = '✅ Template has no header configuration - card images can be used'
      if (hasCardUrlMapping) {
        headerInfo = '✅ Card URL is mapped - card images will be used as configured'
      } else if (hasHeaderConfig) {
        headerInfo = '⚠️  Template has header configuration - card images will be skipped'
      }

      const debugInfo = `
🔍 Template Configuration Debug:

Template Name: ${eventConfig.template_name}
Language: ${eventConfig.template_language}
Parameter Count: ${paramCount}
${headerInfo}

Variable Mapping:
${mappingDetails}

⚠️  If you're getting parameter mismatch errors:
1. Check your WhatsApp template in Meta Developer Console
2. Count the number of {{1}}, {{2}}, etc. in your template
3. Ensure your variable mapping has the same number of parameters
4. Update your template configuration if needed

💡 Quick Fix:
- Go to Event Configurations page
- Edit your WhatsApp template configuration
- Make sure parameter count matches your template
- Remove any header variables if you want to use card images
      `

      alert(debugInfo)
    } catch (error) {
      alert('Error debugging template configuration: ' + error)
    }
  }

  // Function 1: Generate card image with filled variables
  const generateCardImage = async (guest: any, event: any): Promise<string | null> => {
    try {
      // Get the default card design for this event
      const { data: cardDesign, error: designError } = await supabase
        .from('card_designs')
        .select('*')
        .eq('event_id', event.id)
        .single()

      if (designError || !cardDesign) {
        console.log('No card design found for event, skipping image generation')
        return null
      }

      // Get event attributes for variable replacement
      const eventAttributes = getEventAttributes(event.id)

      console.log('Generating card image for guest:', guest.name)
      const imageUrl = await generateCardImageForGuest(cardDesign, guest, event, eventAttributes)
      console.log('Card image generated:', imageUrl)
      return imageUrl
    } catch (error) {
      console.error('Error generating card image:', error)
      return null
    }
  }

  // Function 2: Send WhatsApp message with card image and template variables
  const sendWhatsAppWithCardImage = async (
    guest: any, 
    event: any, 
    cardImageUrl: string | null,
    templateConfig: any
  ): Promise<{ success: boolean; message: string }> => {
    try {
      // Format phone number
      let formattedPhone = guest.phone.replace(/^\+/, '').replace(/\s/g, '')
      if (!formattedPhone.startsWith('1') && formattedPhone.length === 10) {
        formattedPhone = '1' + formattedPhone
      }

      console.log('Sending WhatsApp to:', formattedPhone, 'with template:', templateConfig.template_name)

      // Prepare template parameters based on variable mapping
      const templateParams = Object.entries(templateConfig.variable_mapping || {}).map(([key, value]) => {
        let paramValue = ''
        let paramType = 'text'
        
        // Handle both dot notation (event.date) and underscore notation (event_date)
        const valueStr = String(value)
        const normalizedValue = valueStr.replace(/\./g, '_')
        
        switch (normalizedValue) {
          case 'guest_name':
            paramValue = guest.name
            break
          case 'event_name':
            paramValue = event.name
            break
          case 'event_date':
            paramValue = new Date(event.date).toLocaleDateString()
            break
          case 'event_time':
            paramValue = event.time || ''
            break
          case 'event_venue':
            paramValue = event.venue || ''
            break
          case 'event_dress_code':
            paramValue = event.dress_code || ''
            break
          case 'plus_one_name':
            paramValue = guest.plus_one_name || ''
            break
          case 'card_url':
            paramValue = cardImageUrl || ''
            paramType = 'image'
            break
          default:
            // If it's not a recognized variable, try to extract the value from the event/guest object
            if (valueStr.includes('.')) {
              const [objectName, propertyName] = valueStr.split('.')
              if (objectName === 'event' && event[propertyName as keyof typeof event]) {
                paramValue = String(event[propertyName as keyof typeof event])
              } else if (objectName === 'guest' && guest[propertyName as keyof typeof guest]) {
                paramValue = String(guest[propertyName as keyof typeof guest])
              } else {
                paramValue = valueStr
              }
            } else {
              paramValue = valueStr
            }
        }
        console.log(`Template parameter ${key} = ${value} -> ${paramValue} (type: ${paramType})`)
        
        if (paramType === 'image') {
          return {
            type: 'image',
            image: {
              link: paramValue
            }
          }
        } else {
          return {
            type: 'text',
            text: paramValue
          }
        }
      })

      console.log('Generated template parameters:', templateParams.length, 'parameters')
      console.log('Template parameters:', templateParams)

      // Build the message payload
      const messagePayload: any = {
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'template',
        template: {
          name: templateConfig.template_name,
          language: {
            code: templateConfig.template_language || 'en'
          },
          components: []
        }
      }

      // Separate image and text parameters
      const imageParams = templateParams.filter(param => param.type === 'image')
      const textParams = templateParams.filter(param => param.type === 'text')

      // Add header with image if available
      if (imageParams.length > 0) {
        console.log('Adding image to WhatsApp header:', imageParams[0])
        messagePayload.template.components.push({
          type: 'header',
          parameters: imageParams
        })
      } else if (cardImageUrl && !templateConfig.variable_mapping) {
        // Fallback: add card image as header if no mapping is configured
        console.log('Adding card image to WhatsApp header (fallback):', cardImageUrl)
        
        // Check if it's a data URL or a public URL
        const isDataUrl = cardImageUrl.startsWith('data:')
        
        if (!isDataUrl) {
          messagePayload.template.components.push({
            type: 'header',
            parameters: [
              {
                type: 'image',
                image: {
                  link: cardImageUrl
                }
              }
            ]
          })
        } else {
          console.log('Skipping image header due to data URL format')
        }
      } else {
        console.log('No image parameters configured, sending text-only message')
      }

      // Add body with text parameters
      if (textParams.length > 0) {
        messagePayload.template.components.push({
          type: 'body',
          parameters: textParams
        })
      }

      console.log('Sending WhatsApp message with payload:', JSON.stringify(messagePayload, null, 2))

      const waRes = await fetch(`https://graph.facebook.com/v18.0/${userConfig?.whatsapp_phone_number_id}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userConfig?.whatsapp_api_key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messagePayload),
      })

      const waData = await waRes.json()
      console.log('WhatsApp API Response:', waData)

      if (waRes.ok) {
        return { 
          success: true, 
          message: `WhatsApp sent to ${guest.name} (${formattedPhone})${cardImageUrl ? ' with card image' : ''}` 
        }
      } else {
        const errorMsg = waData.error?.message || 'Unknown error'
        console.error('WhatsApp API Error:', waData.error)
        
        // Handle parameter mismatch error
        if (waData.error?.code === 132000) {
          const details = waData.error?.error_data?.details
          console.error('Parameter mismatch details:', details)
          return { 
            success: false, 
            message: `WhatsApp failed for ${guest.name}: Template parameter mismatch. Expected 5 parameters, sent ${templateParams.length}. Please check your template configuration.` 
          }
        }
        
        return { 
          success: false, 
          message: `WhatsApp failed for ${guest.name}: ${errorMsg}` 
        }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      console.error('WhatsApp sending error:', error)
      return { 
        success: false, 
        message: `WhatsApp error for ${guest.name}: ${errorMsg}` 
      }
    }
  }

  useEffect(() => {
    const eventParam = searchParams.get('event')
    if (eventParam) {
      setSelectedEvent(eventParam)
    }
  }, [searchParams])

  const selectedEventData = events.find(e => e.id === selectedEvent)
  const eventGuests = guests.filter(g => g.event_id === selectedEvent)
  
  const filteredGuests = eventGuests.filter(guest => {
    const matchesSearch = guest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (guest.email && guest.email.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesStatus = statusFilter === 'all' || guest.delivery_status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getDeliveryStatusColor = (status: string) => {
    const colors = {
      not_sent: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
      sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      delivered: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      viewed: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
    }
    return colors[status as keyof typeof colors] || colors.not_sent
  }

  const getDeliveryStatusIcon = (status: string) => {
    switch (status) {
      case 'not_sent': return Clock
      case 'sent': return Mail
      case 'delivered': return CheckCircle
      case 'viewed': return Eye
      default: return AlertCircle
    }
  }

  const handleSelectAll = () => {
    if (selectedGuests.length === filteredGuests.length) {
      setSelectedGuests([])
    } else {
      setSelectedGuests(filteredGuests.map(g => g.id))
    }
  }

  const handleGuestSelect = (guestId: string) => {
    setSelectedGuests(prev =>
      prev.includes(guestId)
        ? prev.filter(id => id !== guestId)
        : [...prev, guestId]
    )
  }

  const handleSendInvitations = async () => {
    console.log('--- handleSendInvitations START ---')
    setShowSendModal(false)
    setShowProgressDialog(true)
    setDismissed(false)
    setIsSending(true)
    setProgress(0)
    setTotal(selectedGuests.length)
    setResults([])
    console.log('Selected guests:', selectedGuests)
    console.log('sendViaWhatsApp:', sendViaWhatsApp, 'sendViaSMS:', sendViaSMS)
    let localResults: string[] = []
    let sentCount = 0
    // Validate WhatsApp configuration
    if (sendViaWhatsApp) {
      console.log('WhatsApp sending enabled, checking config...')
      if (!userConfig?.whatsapp_enabled) {
        console.log('WhatsApp not enabled')
        alert('WhatsApp is not enabled. Please enable it in Settings → Configurations.')
        setShowProgressDialog(false)
        setIsSending(false)
        return
      }
      if (!userConfig.whatsapp_api_key) {
        console.log('WhatsApp API key missing')
        alert('WhatsApp API Key is missing. Please add it in Settings → Configurations.')
        setShowProgressDialog(false)
        setIsSending(false)
        return
      }
      if (!userConfig.whatsapp_phone_number_id) {
        console.log('WhatsApp phone number ID missing')
        alert('WhatsApp Phone Number ID is missing. Please add it in Settings → Configurations.')
        setShowProgressDialog(false)
        setIsSending(false)
        return
      }
      // Check WhatsApp Business Account status
      console.log('Checking WhatsApp Business Account status...')
      const waStatus = await checkWhatsAppStatus()
      if (!waStatus.valid) {
        console.log('WhatsApp config error:', waStatus.error)
        alert(`WhatsApp configuration error: ${waStatus.error}`)
        setShowProgressDialog(false)
        setIsSending(false)
        return
      }
      if (!waStatus.verified) {
        console.log('WhatsApp phone number not verified')
        alert('WhatsApp phone number is not verified. Please verify your phone number in Meta Developer Console.')
        setShowProgressDialog(false)
        setIsSending(false)
        return
      }
      console.log('WhatsApp status check passed:', waStatus)
    }
    // Validate SMS configuration
    if (sendViaSMS) {
      console.log('SMS sending enabled, checking config...')
      if (!userConfig?.sms_enabled) {
        console.log('SMS not enabled')
        alert('SMS is not enabled. Please enable it in Settings → Configurations.')
        setShowProgressDialog(false)
        setIsSending(false)
        return
      }
      if (!userConfig.sms_api_key) {
        console.log('SMS API key missing')
        alert('SMS API Key is missing. Please add it in Settings → Configurations.')
        setShowProgressDialog(false)
        setIsSending(false)
        return
      }
    }
    console.log('Entering guest loop...')
    for (const [i, guestId] of selectedGuests.entries()) {
      const guest = guests.find(g => g.id === guestId)
      if (!guest) {
        console.log('Guest not found for id:', guestId)
        continue
      }
      setCurrentGuest(guest.name)
      console.log(`Processing guest ${i + 1}/${selectedGuests.length}:`, guest.name)
      // SMS
      if (sendViaSMS && userConfig?.sms_enabled && selectedEventData) {
        console.log('Attempting SMS send for', guest.name)
        try {
          // 1. Get the event SMS config for 'invitation' and join with template
          const { data: smsConfig, error: smsConfigError } = await supabase
            .from('event_sms_configurations')
            .select('*, sms_templates: sms_template_id (*)')
            .eq('event_id', selectedEvent)
            .eq('purpose', 'invitation')
            .single()
          if (smsConfigError || !smsConfig?.sms_templates) {
            console.log('No SMS template config found for', guest.name)
            localResults.push(`SMS failed for ${guest.name}: No SMS template configured`)
            continue
          }
          // 2. Render the template body with variables
          let smsBody = smsConfig.sms_templates.body
          smsBody = smsBody
            .replace(/{{guest_name}}/g, guest.name)
            .replace(/{{event_name}}/g, selectedEventData.name)
            .replace(/{{event_date}}/g, selectedEventData.date)
            .replace(/{{event_time}}/g, selectedEventData.time || '')
            .replace(/{{event_venue}}/g, selectedEventData.venue || '')
            .replace(/{{plus_one_name}}/g, guest.plus_one_name || '')
            .replace(/{{card_type}}/g, (guest as any).card_type ? (guest as any).card_type : '')
            .replace(/{{qr_code}}/g, guest.qr_code || '')
          // Replace all event attributes
          const eventAttributes = getEventAttributes(selectedEventData.id)
          eventAttributes.forEach(attr => {
            smsBody = smsBody.replace(new RegExp(`{{${attr.attribute_key}}}`, 'g'), attr.attribute_value || '')
          })
          // Replace card_url with real value if available
          const cardUrl = (guest as any).card_url || ''
          smsBody = smsBody.replace(/{{card_url}}/g, cardUrl)
          console.log('Rendered SMS body for', guest.name, ':', smsBody)
          // 3. Send SMS
          const smsRes = await fetchWithTimeout('https://nialike-n8n.bilacodelabs.xyz/webhook/sms-invitation', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({
              from: import.meta.env.VITE_ADMIN_SMS_SENDER_ID,
              to: guest.phone,
              text: smsBody,
              reference: guest.id
            }),
            timeout: 15000
          }) as Response
          console.log('SMS API response for', guest.name, ':', smsRes)
          if (smsRes.ok) {
            localResults.push(`SMS sent to ${guest.name}`)
            await updateGuest(guest.id, { 
              delivery_status: 'sent',
              invited_at: new Date().toISOString()
            })
          } else {
            localResults.push(`SMS failed for ${guest.name}`)
            console.error('SMS failed for', guest.name, 'Status:', smsRes.status, smsRes.statusText)
          }
        } catch (err) {
          localResults.push(`SMS error for ${guest.name}`)
          console.error('SMS sending error for', guest.name, err)
        }
      } else {
        console.log('Skipping SMS for', guest.name)
      }
      // WhatsApp
      if (sendViaWhatsApp && userConfig?.whatsapp_enabled && userConfig.whatsapp_api_key && userConfig.whatsapp_phone_number_id && selectedEventData) {
        console.log('Attempting WhatsApp send for', guest.name)
        try {
          // Get event message configuration
          const { data: eventConfig, error: configError } = await supabase
            .from('event_message_configurations')
            .select('*')
            .eq('event_id', selectedEvent)
            .eq('channel', 'whatsapp')
            .single()
          if (configError || !eventConfig) {
            console.log('No WhatsApp template config found for', guest.name)
            localResults.push(`WhatsApp failed for ${guest.name}: No template configuration found`)
            continue
          }
          // Generate card image
          const cardImageUrl = (guest as any).card_url || await generateCardImage(guest, selectedEventData)
          // Prepare template parameters based on variable mapping
          const eventAttributes = getEventAttributes(selectedEventData.id)
          const templateParams = Object.entries(eventConfig.variable_mapping || {}).map(([key, value]) => {
            let paramValue = ''
            let paramType = 'text'
            const valueStr = String(value)
            const normalizedValue = valueStr.replace(/\./g, '_')
            switch (normalizedValue) {
              case 'guest_name':
                paramValue = guest.name
                break
              case 'event_name':
                paramValue = selectedEventData.name
                break
              case 'event_date':
                paramValue = new Date(selectedEventData.date).toLocaleDateString()
                break
              case 'event_time':
                paramValue = selectedEventData.time || ''
                break
              case 'event_venue':
                paramValue = selectedEventData.venue || ''
                break
              case 'event_dress_code':
                paramValue = selectedEventData.dress_code || ''
                break
              case 'plus_one_name':
                paramValue = guest.plus_one_name || ''
                break
              case 'card_url':
                paramValue = cardImageUrl || ''
                paramType = 'image'
                break
              default:
                // Check for event attribute
                const attr = eventAttributes.find(a => a.attribute_key === normalizedValue)
                if (attr) {
                  paramValue = attr.attribute_value || ''
                } else if (valueStr.includes('.')) {
                  const [objectName, propertyName] = valueStr.split('.')
                  if (objectName === 'event' && selectedEventData[propertyName as keyof typeof selectedEventData]) {
                    paramValue = String(selectedEventData[propertyName as keyof typeof selectedEventData])
                  } else if (objectName === 'guest' && guest[propertyName as keyof typeof guest]) {
                    paramValue = String(guest[propertyName as keyof typeof guest])
                  } else {
                    paramValue = valueStr
                  }
                } else {
                  paramValue = valueStr
                }
            }
            if (paramType === 'image') {
              return {
                type: 'image',
                image: {
                  link: paramValue
                }
              }
            } else {
              return {
                type: 'text',
                text: paramValue
              }
            }
          })
          // Send WhatsApp message with card image
          const waResult = await sendWhatsAppWithCardImage(guest, selectedEventData, cardImageUrl, eventConfig)
          if (waResult.success) {
            localResults.push(waResult.message)
            await updateGuest(guest.id, { 
              delivery_status: 'sent',
              invited_at: new Date().toISOString()
            })
          } else {
            localResults.push(waResult.message)
            console.error('WhatsApp sending error:', waResult.message)
          }
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : 'Unknown error'
          localResults.push(`WhatsApp error for ${guest.name}: ${errorMsg}`)
          console.error('WhatsApp sending error:', err)
        }
      } else {
        console.log('Skipping WhatsApp for', guest.name)
      }
      sentCount++
      setProgress(sentCount)
      setResults([...localResults])
    }
    setIsSending(false)
    setCurrentGuest(null)
    setSelectedGuests([])
    alert(localResults.join('\n'))
    console.log('--- handleSendInvitations END ---')
  }

  const stats = selectedEventData ? [
    {
      name: 'Total Guests',
      value: eventGuests.length,
      icon: Users,
      color: 'from-blue-500 to-blue-600'
    },
    {
      name: 'Invitations Sent',
      value: eventGuests.filter(g => g.delivery_status !== 'not_sent').length,
      icon: Mail,
      color: 'from-green-500 to-green-600'
    },
    {
      name: 'Delivered',
      value: eventGuests.filter(g => g.delivery_status === 'delivered' || g.delivery_status === 'viewed').length,
      icon: CheckCircle,
      color: 'from-purple-500 to-purple-600'
    },
    {
      name: 'Response Rate',
      value: eventGuests.length > 0 ? Math.round((eventGuests.filter(g => g.rsvp_status !== 'pending').length / eventGuests.length) * 100) : 0,
      icon: BarChart3,
      color: 'from-orange-500 to-pink-500',
      suffix: '%'
    }
  ] : []

  // Add SVGs for WhatsApp and SMS icons
  const WhatsAppIcon = () => (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 mb-2" style={{ display: 'block' }}>
      <circle cx="16" cy="16" r="16" fill="#25D366" />
      <path d="M23.5 18.5c-.3-.2-1.7-.8-2-1s-.5-.2-.7.1c-.2.3-.8 1-.9 1.1-.2.2-.3.2-.6.1-.3-.2-1.2-.4-2.3-1.3-.8-.7-1.3-1.5-1.5-1.8-.2-.3 0-.4.1-.6.1-.1.2-.3.3-.4.1-.1.1-.2.2-.3.1-.1.1-.2.2-.3.1-.2.1-.3 0-.5-.1-.2-.7-1.7-1-2.3-.2-.5-.4-.4-.6-.4-.2 0-.3 0-.5 0-.2 0-.4 0-.6.2-.2.2-.8.8-.8 2 0 1.2.8 2.4 1.1 2.8.3.4 1.6 2.5 4.1 3.3 2.5.8 2.5.5 3 .5.5 0 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2z" fill="#fff" />
    </svg>
  )
  const SMSIcon = () => (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 mb-2" style={{ display: 'block' }}>
      <rect x="4" y="8" width="24" height="16" rx="4" fill="#2563EB" />
      <rect x="8" y="12" width="16" height="2" rx="1" fill="#fff" />
      <rect x="8" y="16" width="10" height="2" rx="1" fill="#fff" />
      <circle cx="24" cy="20" r="2" fill="#fff" />
    </svg>
  )

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Invitations</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Send and track invitation delivery status
          </p>
        </div>
        <div className="flex gap-2">
          {userConfig?.whatsapp_enabled && (
            <>
              <button
                onClick={async () => {
                  const status = await checkWhatsAppStatus()
                  console.log('WhatsApp Status Check:', status)
                  alert(`WhatsApp Status: ${status.valid ? 'Valid' : 'Invalid'}\n${status.error || `Verified: ${status.verified}\nQuality Rating: ${status.qualityRating}\nCode Verification: ${status.codeVerificationStatus}`}`)
                }}
                className="inline-flex items-center px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200 text-sm"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Check WhatsApp Status
              </button>
              <button
                onClick={debugTemplateConfig}
                className="inline-flex items-center px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-all duration-200 text-sm"
              >
                <Search className="w-4 h-4 mr-2" />
                Debug Template
              </button>
              <button
                onClick={showTroubleshootingGuide}
                className="inline-flex items-center px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all duration-200 text-sm"
              >
                <AlertCircle className="w-4 h-4 mr-2" />
                Troubleshooting Guide
              </button>
            </>
          )}
        {selectedGuests.length > 0 && (
          <button
            onClick={() => setShowSendModal(true)}
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg hover:from-orange-600 hover:to-pink-600 transition-all duration-200"
          >
            <Send className="w-4 h-4 mr-2" />
            Send to {selectedGuests.length} guests
          </button>
        )}
        </div>
      </div>

      {/* Event Selection */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Event
            </label>
            <select
              value={selectedEvent}
              onChange={(e) => {
                setSelectedEvent(e.target.value)
                setSelectedGuests([])
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="">Choose an event</option>
              {events.map(event => (
                <option key={event.id} value={event.id}>
                  {event.name} - {format(new Date(event.date), 'MMM d, yyyy')}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {selectedEventData && (
        <>
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
                        {stat.value}{stat.suffix || ''}
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

          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row gap-4">
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
              <div className="flex gap-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="all">All Status</option>
                  <option value="not_sent">Not Sent</option>
                  <option value="sent">Sent</option>
                  <option value="delivered">Delivered</option>
                  <option value="viewed">Viewed</option>
                </select>
              </div>
            </div>
          </div>

          {/* Guest List */}
          {filteredGuests.length > 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Guest List ({filteredGuests.length})
                  </h3>
                  <button
                    onClick={handleSelectAll}
                    className="text-orange-600 dark:text-orange-400 hover:text-orange-500 dark:hover:text-orange-300 font-medium"
                  >
                    {selectedGuests.length === filteredGuests.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedGuests.length === filteredGuests.length && filteredGuests.length > 0}
                          onChange={handleSelectAll}
                          className="h-4 w-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Guest
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Delivery Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        RSVP Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Sent At
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredGuests.map((guest) => {
                      const StatusIcon = getDeliveryStatusIcon(guest.delivery_status)
                      return (
                        <tr key={guest.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedGuests.includes(guest.id)}
                              onChange={() => handleGuestSelect(guest.id)}
                              className="h-4 w-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 flex items-center justify-center text-white font-medium">
                                {guest.name.charAt(0)}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {guest.name}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {guest.phone}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <StatusIcon className="w-4 h-4 mr-2 text-gray-400" />
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getDeliveryStatusColor(guest.delivery_status)}`}>
                                {guest.delivery_status.replace('_', ' ')}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              guest.rsvp_status === 'accepted' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : guest.rsvp_status === 'declined'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            }`}>
                              {guest.rsvp_status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {guest.invited_at ? format(new Date(guest.invited_at), 'MMM d, h:mm a') : '-'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Mail className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {searchQuery || statusFilter !== 'all' ? 'No guests found' : 'No guests in this event'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Add guests to this event to send invitations'
                }
              </p>
            </div>
          )}
        </>
      )}

      {!selectedEventData && (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Select an Event
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Choose an event to manage invitations
          </p>
        </div>
      )}

      {/* Send Confirmation Modal */}
      {showSendModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setShowSendModal(false)} />
            <div className="relative bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Send Invitations
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to send invitations to {selectedGuests.length} selected guests?
              </p>
              <div className="mb-6 flex justify-center gap-8">
                {/* WhatsApp Option */}
                <label className={`w-32 h-32 flex flex-col items-center justify-center cursor-pointer p-4 rounded-lg border-2 transition-all ${sendViaWhatsApp ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-green-400'}` }>
                  <WhatsAppIcon />
                  <input
                    type="checkbox"
                    checked={sendViaWhatsApp}
                    onChange={e => setSendViaWhatsApp(e.target.checked)}
                    className="hidden"
                  />
                  <span className={`mt-1 text-sm font-medium ${sendViaWhatsApp ? 'text-green-700 dark:text-green-300' : 'text-gray-700 dark:text-gray-300'}`}>WhatsApp</span>
                  {!userConfig?.whatsapp_enabled && (
                    <span className="text-xs text-red-500 mt-1">Not configured</span>
                  )}
                </label>
                {/* SMS Option */}
                <label className={`w-32 h-32 flex flex-col items-center justify-center cursor-pointer p-4 rounded-lg border-2 transition-all ${sendViaSMS ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-blue-400'}` }>
                  <SMSIcon />
                  <input
                    type="checkbox"
                    checked={sendViaSMS}
                    onChange={e => setSendViaSMS(e.target.checked)}
                    className="hidden"
                  />
                  <span className={`mt-1 text-sm font-medium ${sendViaSMS ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>SMS</span>
                  {!userConfig?.sms_enabled && (
                    <span className="text-xs text-red-500 mt-1">Not configured</span>
                  )}
                </label>
              </div>
              
              {/* Configuration Help */}
              {(!userConfig?.whatsapp_enabled || !userConfig?.sms_enabled) && (
                <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>Configuration Required:</strong> To send invitations, you need to configure your messaging settings in 
                    <button 
                      onClick={() => window.location.href = '/settings?tab=configurations'}
                      className="text-blue-600 dark:text-blue-400 underline hover:text-blue-500"
                    >
                      Settings → Configurations
                    </button>
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowSendModal(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendInvitations}
                  disabled={!sendViaWhatsApp && !sendViaSMS}
                  className="px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg hover:from-orange-600 hover:to-pink-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send Invitations
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Progress Dialog */}
      {showProgressDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowProgressDialog(false)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-xl p-8 w-full max-w-md shadow-lg flex flex-col items-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Sending Invitations</h2>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 mb-4">
              <div
                className="bg-gradient-to-r from-orange-500 to-pink-500 h-4 rounded-full transition-all duration-300"
                style={{ width: `${total ? (progress / total) * 100 : 0}%` }}
              />
            </div>
            <div className="mb-4 text-gray-700 dark:text-gray-300 text-center">
              {isSending
                ? (<span>Sending to <b>{currentGuest || '...'}</b> ({progress}/{total})</span>)
                : (<span>Done! Sent to {progress} guests.</span>)}
            </div>
            <ul className="text-xs text-left max-h-32 overflow-y-auto w-full mb-4">
              {results.slice(-5).map((msg, i) => (
                <li key={i} className="mb-1">{msg}</li>
              ))}
            </ul>
            <div className="flex gap-3 w-full justify-end">
              <button
                onClick={() => { setShowProgressDialog(false); setDismissed(true) }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}