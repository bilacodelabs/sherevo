import { UserConfiguration } from './supabase'

// Admin configuration from environment variables
const ADMIN_CONFIG = {
  whatsapp_api_key: import.meta.env.VITE_ADMIN_WHATSAPP_API_KEY || '',
  whatsapp_phone_number: import.meta.env.VITE_ADMIN_WHATSAPP_PHONE_NUMBER || '',
  whatsapp_phone_number_id: import.meta.env.VITE_ADMIN_WHATSAPP_PHONE_NUMBER_ID || '',
  whatsapp_business_account_id: import.meta.env.VITE_ADMIN_WHATSAPP_BUSINESS_ACCOUNT_ID || '',
  whatsapp_enabled: import.meta.env.VITE_ADMIN_WHATSAPP_ENABLED === 'true',
  sms_api_key: import.meta.env.VITE_ADMIN_SMS_API_KEY || '',
  sms_api_secret: import.meta.env.VITE_ADMIN_SMS_API_SECRET || '',
  sms_provider: import.meta.env.VITE_ADMIN_SMS_PROVIDER || 'kilakona',
  sms_phone_number: import.meta.env.VITE_ADMIN_SMS_PHONE_NUMBER || '',
  sms_sender_id: import.meta.env.VITE_ADMIN_SMS_SENDER_ID || '',
  sms_webhook_url: import.meta.env.VITE_ADMIN_SMS_WEBHOOK_URL || '',
  sms_enabled: import.meta.env.VITE_ADMIN_SMS_ENABLED === 'true',
  email_notifications: true,
  push_notifications: false,
  use_custom_config: false
}

/**
 * Get configuration value based on user's custom config preference
 * @param userConfig - User configuration from database
 * @param key - Configuration key to retrieve
 * @returns Configuration value from either database or environment
 */
export function getConfigValue(userConfig: UserConfiguration | null, key: keyof typeof ADMIN_CONFIG): any {
  if (!userConfig) {
    return ADMIN_CONFIG[key]
  }

  // If user has custom config enabled, use their database values
  if (userConfig.use_custom_config) {
    return userConfig[key]
  }

  // Otherwise, use admin configuration from environment
  return ADMIN_CONFIG[key]
}

/**
 * Get the effective configuration object based on user's preference
 * @param userConfig - User configuration from database
 * @returns Complete configuration object
 */
export function getEffectiveConfig(userConfig: UserConfiguration | null): Partial<UserConfiguration> {
  if (!userConfig) {
    return ADMIN_CONFIG
  }

  if (userConfig.use_custom_config) {
    return userConfig
  }

  // Return admin config but preserve user's custom config preference
  return {
    ...ADMIN_CONFIG,
    use_custom_config: userConfig.use_custom_config,
    id: userConfig.id,
    user_id: userConfig.user_id,
    created_at: userConfig.created_at,
    updated_at: userConfig.updated_at
  }
}

/**
 * Check if admin configuration is properly set up
 * @returns Object with status and missing variables
 */
export function checkAdminConfig(): { isValid: boolean; missing: string[] } {
  const required = [
    'VITE_ADMIN_WHATSAPP_API_KEY',
    'VITE_ADMIN_WHATSAPP_PHONE_NUMBER',
    'VITE_ADMIN_WHATSAPP_PHONE_NUMBER_ID',
    'VITE_ADMIN_WHATSAPP_BUSINESS_ACCOUNT_ID',
    'VITE_ADMIN_SMS_API_KEY',
    'VITE_ADMIN_SMS_PHONE_NUMBER'
  ]

  const missing = required.filter(key => !import.meta.env[key])

  return {
    isValid: missing.length === 0,
    missing
  }
} 