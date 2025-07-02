import React, { useState, useEffect } from 'react'
import { 
  User, 
  Lock, 
  Bell, 
  Palette, 
  Download, 
  Trash2,
  Save,
  Upload,
  Eye,
  EyeOff,
  Shield,
  Database,
  Moon,
  Sun,
  Monitor,
  MessageSquare,
  Phone,
  Settings as SettingsIcon,
  Plus,
  Edit
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { useApp } from '../contexts/AppContext'

export const Settings: React.FC = () => {
  const { user, updateProfile } = useAuth()
  const { theme, setTheme } = useTheme()
  const { userConfig, updateUserConfig, smsTemplates, createSmsTemplate, updateSmsTemplate, deleteSmsTemplate, getEventAttributes, events } = useApp()
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // SMS Templates Section State (moved to top level)
  const [showSmsForm, setShowSmsForm] = useState(false);
  const [editingSmsId, setEditingSmsId] = useState<string | null>(null);
  const [smsForm, setSmsForm] = useState({ name: '', body: '', purpose: 'invitation' });
  const [selectedEventForVars, setSelectedEventForVars] = useState(events[0]?.id || '');
  const { eventAttributes } = useApp();
  // Get all unique attribute keys across all events
  const uniqueAttributeKeys = Array.from(new Set(eventAttributes.map(attr => attr.attribute_key)));
  const baseVariables = [
    '{{guest_name}}',
    '{{event_name}}',
    '{{event_date}}',
    '{{event_time}}',
    '{{event_venue}}',
    '{{plus_one_name}}',
    '{{card_type}}',
    '{{qr_code}}',
    '{{card_url}}',
    ...uniqueAttributeKeys.map(key => `{{${key}}}`)
  ];
  const handleSmsFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smsForm.name.trim() || !smsForm.body.trim()) {
      alert('Please provide a template name and body.');
      return;
    }
    try {
      if (editingSmsId) {
        await updateSmsTemplate(editingSmsId, { ...smsForm, purpose: smsForm.purpose as 'reminder' | 'invitation' });
        setEditingSmsId(null);
      } else {
        if (!user) { alert('User not authenticated'); return; }
        await createSmsTemplate({ ...smsForm, user_id: user.id, purpose: smsForm.purpose as 'reminder' | 'invitation' });
      }
      setSmsForm({ name: '', body: '', purpose: 'invitation' });
      setShowSmsForm(false);
    } catch (err) {
      alert('Error saving SMS template.');
    }
  };
  const handleEditSms = (tpl: any) => {
    setEditingSmsId(tpl.id);
    setSmsForm({ name: tpl.name, body: tpl.body, purpose: tpl.purpose || 'invitation' });
    setShowSmsForm(true);
  };
  const handleDeleteSms = async (tpl: any) => {
    if (window.confirm(`Delete template "${tpl.name}"?`)) {
      await deleteSmsTemplate(tpl.id);
    }
  };
  const handleInsertVariable = (variable: string) => {
    setSmsForm(prev => ({ ...prev, body: prev.body + ' ' + variable }));
  };

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    avatar: user?.avatar || ''
  })

  // Security form state
  const [securityForm, setSecurityForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    showCurrentPassword: false,
    showNewPassword: false,
    showConfirmPassword: false
  })

  // Notification settings
  const [notifications, setNotifications] = useState({
    emailNotifications: userConfig?.email_notifications ?? true,
    pushNotifications: userConfig?.push_notifications ?? false,
    rsvpUpdates: true,
    eventReminders: true,
    weeklyReports: false
  })

  // Configuration settings
  const [useCustomConfig, setUseCustomConfig] = useState(false)
  const [configForm, setConfigForm] = useState({
    whatsapp_api_key: userConfig?.whatsapp_api_key || '',
    whatsapp_phone_number: userConfig?.whatsapp_phone_number || '',
    whatsapp_phone_number_id: userConfig?.whatsapp_phone_number_id || '',
    whatsapp_business_account_id: userConfig?.whatsapp_business_account_id || '',
    whatsapp_enabled: userConfig?.whatsapp_enabled || false,
    sms_api_key: userConfig?.sms_api_key || '',
    sms_provider: userConfig?.sms_provider || 'twilio',
    sms_phone_number: userConfig?.sms_phone_number || '',
    sms_enabled: userConfig?.sms_enabled || false
  })

  useEffect(() => {
    if (userConfig) {
      setNotifications(prev => ({
        ...prev,
        emailNotifications: userConfig.email_notifications,
        pushNotifications: userConfig.push_notifications
      }))
      setConfigForm({
        whatsapp_api_key: userConfig.whatsapp_api_key || '',
        whatsapp_phone_number: userConfig.whatsapp_phone_number || '',
        whatsapp_phone_number_id: userConfig.whatsapp_phone_number_id || '',
        whatsapp_business_account_id: userConfig.whatsapp_business_account_id || '',
        whatsapp_enabled: userConfig.whatsapp_enabled || false,
        sms_api_key: userConfig.sms_api_key || '',
        sms_provider: userConfig.sms_provider || 'twilio',
        sms_phone_number: userConfig.sms_phone_number || '',
        sms_enabled: userConfig.sms_enabled || false
      })
      setUseCustomConfig(userConfig.use_custom_config || false)
    }
  }, [userConfig])

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'security', name: 'Security', icon: Lock },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'configurations', name: 'Configurations', icon: SettingsIcon },
    { id: 'appearance', name: 'Appearance', icon: Palette },
    { id: 'data', name: 'Data & Privacy', icon: Database }
  ]

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      await updateProfile({
        name: profileForm.name,
        avatar: profileForm.avatar
      })
      alert('Profile updated successfully!')
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (securityForm.newPassword !== securityForm.confirmPassword) {
      alert('New passwords do not match')
      return
    }
    
    if (securityForm.newPassword.length < 6) {
      alert('Password must be at least 6 characters long')
      return
    }

    setLoading(true)
    
    try {
      // In a real app, you would call Supabase auth.updateUser
      alert('Password updated successfully!')
      setSecurityForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        showCurrentPassword: false,
        showNewPassword: false,
        showConfirmPassword: false
      })
    } catch (error) {
      console.error('Error updating password:', error)
      alert('Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  const handleNotificationUpdate = async () => {
    setLoading(true)
    try {
      await updateUserConfig({
        email_notifications: notifications.emailNotifications,
        push_notifications: notifications.pushNotifications
      })
      alert('Notification settings updated successfully!')
    } catch (error) {
      console.error('Error updating notifications:', error)
      alert('Failed to update notification settings')
    } finally {
      setLoading(false)
    }
  }

  const handleCustomConfigToggle = async () => {
    setLoading(true)
    try {
      await updateUserConfig({ use_custom_config: !useCustomConfig })
      setUseCustomConfig(!useCustomConfig)
      alert(`Configuration mode ${!useCustomConfig ? 'enabled' : 'disabled'} successfully!`)
    } catch (error) {
      console.error('Error updating configuration mode:', error)
      alert('Failed to update configuration mode')
    } finally {
      setLoading(false)
    }
  }

  const handleConfigUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      await updateUserConfig(configForm)
      alert('Configuration settings updated successfully!')
    } catch (error) {
      console.error('Error updating configuration:', error)
      alert('Failed to update configuration settings')
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setProfileForm(prev => ({
          ...prev,
          avatar: e.target?.result as string
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const exportData = () => {
    // In a real app, this would export user data
    alert('Data export functionality would be implemented here')
  }

  const deleteAccount = () => {
    // In a real app, this would delete the user account
    alert('Account deletion functionality would be implemented here')
    setShowDeleteConfirm(false)
  }

  const renderProfileTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Profile Information
        </h3>
        <form onSubmit={handleProfileUpdate} className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center space-x-6">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-r from-orange-500 to-pink-500 flex items-center justify-center">
              {profileForm.avatar ? (
                <img
                  src={profileForm.avatar}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white font-bold text-2xl">
                  {profileForm.name.charAt(0) || user?.email?.charAt(0)}
                </span>
              )}
            </div>
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
                id="avatar-upload"
              />
              <label
                htmlFor="avatar-upload"
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
              >
                <Upload className="w-4 h-4 mr-2" />
                Change Avatar
              </label>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={profileForm.name}
              onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={profileForm.email}
              disabled
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Email cannot be changed. Contact support if needed.
            </p>
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Account Type
            </label>
            <div className="flex items-center">
              <Shield className="w-5 h-5 text-gray-400 mr-2" />
              <span className="text-gray-900 dark:text-white capitalize">
                {user?.role}
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg hover:from-orange-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  )

  const renderSecurityTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Change Password
        </h3>
        <form onSubmit={handlePasswordChange} className="space-y-6">
          {/* Current Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Current Password
            </label>
            <div className="relative">
              <input
                type={securityForm.showCurrentPassword ? 'text' : 'password'}
                value={securityForm.currentPassword}
                onChange={(e) => setSecurityForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
              />
              <button
                type="button"
                onClick={() => setSecurityForm(prev => ({ ...prev, showCurrentPassword: !prev.showCurrentPassword }))}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {securityForm.showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              New Password
            </label>
            <div className="relative">
              <input
                type={securityForm.showNewPassword ? 'text' : 'password'}
                value={securityForm.newPassword}
                onChange={(e) => setSecurityForm(prev => ({ ...prev, newPassword: e.target.value }))}
                className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
              />
              <button
                type="button"
                onClick={() => setSecurityForm(prev => ({ ...prev, showNewPassword: !prev.showNewPassword }))}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {securityForm.showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={securityForm.showConfirmPassword ? 'text' : 'password'}
                value={securityForm.confirmPassword}
                onChange={(e) => setSecurityForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
              />
              <button
                type="button"
                onClick={() => setSecurityForm(prev => ({ ...prev, showConfirmPassword: !prev.showConfirmPassword }))}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {securityForm.showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg hover:from-orange-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            <Lock className="w-4 h-4 mr-2" />
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  )

  const renderNotificationsTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Notification Preferences
        </h3>
        <div className="space-y-4">
          {Object.entries(notifications).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {key === 'emailNotifications' && 'Receive notifications via email'}
                  {key === 'pushNotifications' && 'Receive push notifications in browser'}
                  {key === 'rsvpUpdates' && 'Get notified when guests respond to invitations'}
                  {key === 'eventReminders' && 'Receive reminders about upcoming events'}
                  {key === 'weeklyReports' && 'Get weekly analytics reports'}
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => setNotifications(prev => ({ ...prev, [key]: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 dark:peer-focus:ring-orange-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-orange-600"></div>
              </label>
            </div>
          ))}
        </div>
        <button
          onClick={handleNotificationUpdate}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg hover:from-orange-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          <Save className="w-4 h-4 mr-2" />
          {loading ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </div>
  )

  const renderConfigurationsTab = () => (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Communication Settings
        </h3>
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-600 dark:text-gray-400">Use my configuration</span>
            <button
              type="button"
              onClick={handleCustomConfigToggle}
              disabled={loading}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
                useCustomConfig 
                  ? 'bg-orange-500' 
                  : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  useCustomConfig ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
        
        {!useCustomConfig && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
            <div className="flex items-center">
              <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Using admin configuration. Toggle the switch above to use your own configuration settings.
              </p>
            </div>
          </div>
        )}
        
        <form onSubmit={handleConfigUpdate} className="space-y-6">
          {/* WhatsApp Configuration */}
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <MessageSquare className="w-6 h-6 text-green-600 dark:text-green-400 mr-3" />
              <h4 className="text-lg font-medium text-gray-900 dark:text-white">WhatsApp Configuration</h4>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="whatsapp_enabled"
                  checked={configForm.whatsapp_enabled}
                  onChange={(e) => setConfigForm(prev => ({ ...prev, whatsapp_enabled: e.target.checked }))}
                  disabled={!useCustomConfig}
                  className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <label htmlFor="whatsapp_enabled" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Enable WhatsApp notifications
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    WhatsApp API Key (Access Token)
                  </label>
                  <input
                    type="password"
                    value={useCustomConfig ? configForm.whatsapp_api_key : '••••••••••••••••••••••••••••••••'}
                    onChange={(e) => setConfigForm(prev => ({ ...prev, whatsapp_api_key: e.target.value }))}
                    disabled={!useCustomConfig}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Enter your WhatsApp API key"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Your Permanent Access Token from Meta Developer Console
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    WhatsApp Phone Number
                  </label>
                  <input
                    type="tel"
                    value={useCustomConfig ? configForm.whatsapp_phone_number : '+1••• ••• ••••'}
                    onChange={(e) => setConfigForm(prev => ({ ...prev, whatsapp_phone_number: e.target.value }))}
                    disabled={!useCustomConfig}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="+1234567890"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Your WhatsApp Business phone number
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    WhatsApp Phone Number ID
                  </label>
                  <input
                    type="text"
                    value={useCustomConfig ? configForm.whatsapp_phone_number_id : '•••••••••••••••'}
                    onChange={(e) => setConfigForm(prev => ({ ...prev, whatsapp_phone_number_id: e.target.value }))}
                    disabled={!useCustomConfig}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="123456789012345"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Phone Number ID from Meta Developer Console
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    WhatsApp Business Account ID
                  </label>
                  <input
                    type="text"
                    value={useCustomConfig ? configForm.whatsapp_business_account_id : '•••••••••••••••'}
                    onChange={(e) => setConfigForm(prev => ({ ...prev, whatsapp_business_account_id: e.target.value }))}
                    disabled={!useCustomConfig}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="123456789012345"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Business Account ID from Meta Developer Console
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* SMS Configuration */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <Phone className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-3" />
              <h4 className="text-lg font-medium text-gray-900 dark:text-white">SMS Configuration</h4>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="sms_enabled"
                  checked={configForm.sms_enabled}
                  onChange={(e) => setConfigForm(prev => ({ ...prev, sms_enabled: e.target.checked }))}
                  disabled={!useCustomConfig}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <label htmlFor="sms_enabled" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Enable SMS notifications
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    SMS Provider
                  </label>
                  <select
                    value={useCustomConfig ? configForm.sms_provider : ''}
                    onChange={(e) => setConfigForm(prev => ({ ...prev, sms_provider: e.target.value }))}
                    disabled={!useCustomConfig}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {!useCustomConfig && <option value="">••••••••••••••••••••••••••••••••</option>}
                    <option value="twilio">Twilio</option>
                    <option value="aws_sns">AWS SNS</option>
                    <option value="nexmo">Nexmo</option>
                    <option value="messagebird">MessageBird</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    SMS API Key
                  </label>
                  <input
                    type="password"
                    value={useCustomConfig ? configForm.sms_api_key : '••••••••••••••••••••••••••••••••'}
                    onChange={(e) => setConfigForm(prev => ({ ...prev, sms_api_key: e.target.value }))}
                    disabled={!useCustomConfig}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Enter your SMS API key"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    SMS Phone Number
                  </label>
                  <input
                    type="tel"
                    value={useCustomConfig ? configForm.sms_phone_number : '+1••• ••• ••••'}
                    onChange={(e) => setConfigForm(prev => ({ ...prev, sms_phone_number: e.target.value }))}
                    disabled={!useCustomConfig}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="+1••• ••• ••••"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SMS Templates Section */}
          <div className="mt-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">SMS Templates</h3>
              {!showSmsForm && (
                <button
                  onClick={() => { setShowSmsForm(true); setEditingSmsId(null); setSmsForm({ name: '', body: '', purpose: 'invitation' }); }}
                  className="inline-flex items-center px-3 py-1.5 text-sm bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg hover:from-orange-600 hover:to-pink-600 transition-all duration-200"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  New Template
                </button>
              )}
            </div>
            {showSmsForm && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6 flex flex-col md:flex-row gap-6">
                {/* Variables Sidebar */}
                <div className="w-full md:w-1/3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Available Variables</label>
                  <div className="space-y-2">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Guest & Event Variables:</div>
                    {baseVariables.slice(0, 8).map(variable => (
                      <button
                        key={variable}
                        type="button"
                        onClick={() => handleInsertVariable(variable)}
                        className="w-full px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-left mb-1"
                      >
                        {variable}
                      </button>
                    ))}
                    {uniqueAttributeKeys.length > 0 && (
                      <>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-2 mt-4">Event Attributes:</div>
                        {uniqueAttributeKeys.map(key => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => handleInsertVariable(`{{${key}}}`)}
                            className="w-full px-3 py-2 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors text-left mb-1"
                          >
                            {`{{${key}}}`}
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                </div>
                {/* Template Form */}
                <div className="w-full md:w-2/3 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Purpose</label>
                    <select
                      value={smsForm.purpose}
                      onChange={e => setSmsForm(prev => ({ ...prev, purpose: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      required
                    >
                      <option value="invitation">Invitation</option>
                      <option value="reminder">Reminder</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Template Name</label>
                    <input
                      type="text"
                      value={smsForm.name}
                      onChange={e => setSmsForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Body</label>
                    <textarea
                      value={smsForm.body}
                      onChange={e => setSmsForm(prev => ({ ...prev, body: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      rows={5}
                      required
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => { setShowSmsForm(false); setEditingSmsId(null); setSmsForm({ name: '', body: '', purpose: 'invitation' }); }}
                      className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSmsFormSubmit}
                      className="inline-flex items-center px-4 py-2 text-sm bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg hover:from-orange-600 hover:to-pink-600 transition-all duration-200"
                    >
                      <Save className="w-4 h-4 mr-1" />
                      {editingSmsId ? 'Update' : 'Save'}
                    </button>
                  </div>
                </div>
              </div>
            )}
            {/* List of Templates */}
            <div className="space-y-2">
              {smsTemplates.length > 0 ? smsTemplates.map(tpl => (
                <div key={tpl.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{tpl.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{tpl.body}</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button onClick={() => handleEditSms(tpl)} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => handleDeleteSms(tpl)} className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">No SMS templates yet. Create one to get started.</div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !useCustomConfig}
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg hover:from-orange-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Saving...' : 'Save Configuration'}
          </button>
        </form>
      </div>
    </div>
  )

  const renderAppearanceTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Theme Preferences
        </h3>
        <div className="space-y-4">
          {[
            { value: 'light', label: 'Light', icon: Sun, description: 'Light mode' },
            { value: 'dark', label: 'Dark', icon: Moon, description: 'Dark mode' },
            { value: 'system', label: 'System', icon: Monitor, description: 'Follow system preference' }
          ].map(({ value, label, icon: Icon, description }) => (
            <div
              key={value}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                theme === value
                  ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
              }`}
              onClick={() => setTheme(value as any)}
            >
              <div className="flex items-center">
                <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400 mr-3" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {label}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {description}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderDataTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Data Management
        </h3>
        <div className="space-y-4">
          <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  Export Your Data
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Download all your events, guests, and analytics data
                </div>
              </div>
              <button
                onClick={exportData}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </button>
            </div>
          </div>

          <div className="p-4 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/20">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-red-900 dark:text-red-200">
                  Delete Account
                </div>
                <div className="text-sm text-red-700 dark:text-red-300">
                  Permanently delete your account and all associated data
                </div>
              </div>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <nav className="space-y-1 p-4">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="mr-3 h-4 w-4" />
                    {tab.name}
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            {activeTab === 'profile' && renderProfileTab()}
            {activeTab === 'security' && renderSecurityTab()}
            {activeTab === 'notifications' && renderNotificationsTab()}
            {activeTab === 'configurations' && renderConfigurationsTab()}
            {activeTab === 'appearance' && renderAppearanceTab()}
            {activeTab === 'data' && renderDataTab()}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setShowDeleteConfirm(false)} />
            <div className="relative bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Delete Account
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your events, guests, and data.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={deleteAccount}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}