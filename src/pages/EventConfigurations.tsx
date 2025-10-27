import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useApp } from '../contexts/AppContext'
import { supabase } from '../lib/supabase'
import html2canvas from 'html2canvas'

const tabs = [
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'sms', label: 'SMS' }
]

// Fields available for mapping
const EVENT_FIELDS = [
  { value: 'event.name', label: 'Event Name' },
  { value: 'event.date', label: 'Event Date' },
  { value: 'event.time', label: 'Event Time' },
  { value: 'event.venue', label: 'Event Venue' },
  { value: 'event.dress_code', label: 'Event Dress Code' },
]
const GUEST_FIELDS = [
  { value: 'guest.name', label: 'Guest Name' },
  { value: 'guest.phone', label: 'Guest Phone' },
  { value: 'guest.email', label: 'Guest Email' },
]
const CARD_FIELDS = [
  { value: 'card_url', label: 'Card URL (Generated Image)' },
]
const ALL_FIELDS = [...EVENT_FIELDS, ...GUEST_FIELDS, ...CARD_FIELDS]

const EventConfigurations: React.FC = () => {
  const { id: eventId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { userConfig, effectiveConfig, events, smsTemplates, getEventSmsConfig, setEventSmsConfig } = useApp()
  const [activeTab, setActiveTab] = useState('whatsapp')
  const [waTemplates, setWaTemplates] = useState<any[]>([])
  const [waLoading, setWaLoading] = useState(false)
  const [waError, setWaError] = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [mappingStep, setMappingStep] = useState(false)
  const [templateParams, setTemplateParams] = useState<any[]>([])
  const [paramMapping, setParamMapping] = useState<{ [key: string]: string }>({})
  const [preview, setPreview] = useState('')
  const [showJson, setShowJson] = useState(false)
  const [templateJson, setTemplateJson] = useState<any>(null)
  const [search, setSearch] = useState('');
  const [languageFilter, setLanguageFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // New state for existing configurations
  const [existingConfig, setExistingConfig] = useState<any>(null)
  const [configLoading, setConfigLoading] = useState(false)

  // Move all hooks to the top level
  const [selectedInvitationTemplate, setSelectedInvitationTemplate] = useState<string>('');
  const [selectedReminderTemplate, setSelectedReminderTemplate] = useState<string>('');
  const [saving, setSaving] = useState(false);

  // Get event name
  const event = events.find(e => e.id === eventId)
  const eventName = event ? event.name : 'Event'

  // On mount or when eventId changes, set local state to current config
  useEffect(() => {
    if (!eventId) return;
    const invitationConfig = getEventSmsConfig(eventId, 'invitation');
    const reminderConfig = getEventSmsConfig(eventId, 'reminder');
    setSelectedInvitationTemplate(invitationConfig?.sms_template_id || '');
    setSelectedReminderTemplate(reminderConfig?.sms_template_id || '');
  }, [eventId, getEventSmsConfig]);

  const handleSaveSmsConfig = async () => {
    if (!eventId) return;
    setSaving(true);
    try {
      if (selectedInvitationTemplate) {
        await setEventSmsConfig(eventId, 'invitation', selectedInvitationTemplate);
      }
      if (selectedReminderTemplate) {
        await setEventSmsConfig(eventId, 'reminder', selectedReminderTemplate);
      }
      alert('SMS configuration saved!');
    } catch (err) {
      alert('Failed to save SMS configuration.');
    } finally {
      setSaving(false);
    }
  };

  // Load existing configuration
  useEffect(() => {
    const loadExistingConfig = async () => {
      if (!eventId) {
        setConfigLoading(false)
        return
      }
      setConfigLoading(true)
      console.log('Loading config for event:', eventId, 'channel:', activeTab)
      console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'Not set')
      console.log('Supabase Key:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Not set')
      
      // Add timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        console.log('Config loading timeout - setting loading to false')
        setConfigLoading(false)
      }, 5000) // 5 second timeout - reduced for better UX
      
      try {
        // First test if Supabase is working
        console.log('Testing Supabase connection...')
        const { data: testData, error: testError } = await supabase
          .from('events')
          .select('id, name')
          .eq('id', eventId)
          .limit(1)
        
        console.log('Supabase test result:', { testData, testError })
        
        if (testError) {
          console.error('Supabase connection failed:', testError)
          throw new Error('Database connection failed')
        }
        
        const { data, error } = await supabase
          .from('event_message_configurations')
          .select('*')
          .eq('event_id', eventId)
          .eq('channel', activeTab)
          .single()
        
        clearTimeout(timeoutId)
        console.log('Config query result:', { data, error })
        
        if (error) {
          if (error.code === 'PGRST116') { // PGRST116 is "not found"
            console.log('No configuration found for this event/channel')
            setExistingConfig(null)
          } else {
            console.error('Error loading config:', error)
          }
        } else if (data) {
          console.log('Configuration found:', data)
          setExistingConfig(data)
          setSelectedTemplate(data.template_name)
        }
      } catch (err) {
        clearTimeout(timeoutId)
        console.error('Failed to load configuration:', err)
      } finally {
        setConfigLoading(false)
      }
    }

    loadExistingConfig()
  }, [eventId, activeTab])

  // Fetch WhatsApp templates
  useEffect(() => {
    const fetchTemplates = async () => {
      if (!effectiveConfig?.whatsapp_api_key || !effectiveConfig?.whatsapp_business_account_id) {
        setWaError('WhatsApp API Key or Business Account ID not configured.');
        return;
      }
      setWaLoading(true)
      setWaError(null)
      try {
        const res = await fetch(
          `https://graph.facebook.com/v19.0/${effectiveConfig.whatsapp_business_account_id}/message_templates`,
          {
            headers: {
              Authorization: `Bearer ${effectiveConfig.whatsapp_api_key}`,
            },
          }
        )
        const data = await res.json()
        if (res.ok && data.data) {
          setWaTemplates(data.data)
        } else {
          setWaError(data.error?.message || 'Failed to fetch templates')
        }
      } catch (err) {
        setWaError('Failed to fetch templates')
      } finally {
        setWaLoading(false)
      }
    }
    if (activeTab === 'whatsapp') fetchTemplates()
    // eslint-disable-next-line
  }, [activeTab, effectiveConfig])

  // Fetch template parameters after selection
  useEffect(() => {
    const fetchTemplateParams = async () => {
      if (!selectedTemplate || !effectiveConfig?.whatsapp_api_key || !effectiveConfig?.whatsapp_business_account_id) return
      setWaLoading(true)
      setWaError(null)
      try {
        const res = await fetch(
          `https://graph.facebook.com/v19.0/${effectiveConfig.whatsapp_business_account_id}/message_templates?name=${selectedTemplate}`,
          {
            headers: {
              Authorization: `Bearer ${effectiveConfig.whatsapp_api_key}`,
            },
          }
        )
        const data = await res.json()
        if (res.ok && data.data && data.data.length > 0) {
          // Find the selected template
          const tpl = data.data[0]
          // Find the first body component (most common)
          const body = tpl.components?.find((c: any) => c.type === 'BODY')
          const params = body?.parameters || []
          setTemplateParams(params)
          setTemplateJson(tpl)
          // Initialize mapping
          setParamMapping(params.reduce((acc: any, p: any, i: number) => ({ ...acc, [i]: '' }), {}))
        } else {
          setWaError('Could not fetch template parameters')
          setTemplateJson(null)
        }
      } catch (err) {
        setWaError('Could not fetch template parameters')
        setTemplateJson(null)
      } finally {
        setWaLoading(false)
      }
    }
    if (mappingStep) fetchTemplateParams()
    // eslint-disable-next-line
  }, [mappingStep, selectedTemplate, effectiveConfig])

  // Update preview when mapping changes
  useEffect(() => {
    if (!templateParams.length) return
    let msg = templateParams.reduce((acc, p, i) => {
      const mapped = paramMapping[i] ? `{{${paramMapping[i]}}}` : `{${i+1}}`
      return acc.replace(`{{${i}}}`, mapped)
    }, templateParams.reduce((acc, _p, i) => acc + `{{${i}}} `, '').trim())
    setPreview(msg)
  }, [paramMapping, templateParams])

  // Compute unique languages and categories for filters
  const languages = Array.from(new Set(waTemplates.map(t => t.language))).filter(Boolean);
  const categories = Array.from(new Set(waTemplates.map(t => t.category))).filter(Boolean);

  // Filtered templates
  const filteredTemplates = waTemplates.filter(tpl => {
    const matchesSearch = tpl.name.toLowerCase().includes(search.toLowerCase());
    const matchesLanguage = languageFilter === 'all' || tpl.language === languageFilter;
    const matchesCategory = categoryFilter === 'all' || tpl.category === categoryFilter;
    return matchesSearch && matchesLanguage && matchesCategory;
  });

  // Helper: parse numbered placeholders from text (e.g., {{1}}, {{2}})
  function extractNumberedPlaceholders(text: string) {
    const matches = text.match(/\{\{(\d+)\}\}/g) || [];
    // Return unique numbers as variable objects
    return Array.from(new Set(matches.map(m => m.replace(/\{\{|\}\}/g, '')))).map(num => ({
      type: 'numbered',
      index: parseInt(num, 10) - 1, // WhatsApp uses 1-based, arrays are 0-based
      label: `Variable ${num}`
    }));
  }

  // Enhanced template variable extraction
  const [headerVars, setHeaderVars] = useState<any[]>([]);
  const [bodyVars, setBodyVars] = useState<any[]>([]);
  const [footerVars, setFooterVars] = useState<any[]>([]);
  const [headerType, setHeaderType] = useState<string>('');

  useEffect(() => {
    if (!templateJson) {
      setHeaderVars([]); setBodyVars([]); setFooterVars([]); setHeaderType('');
      return;
    }
    const components = templateJson.components || [];
    // HEADER
    const header = components.find((c: any) => c.type === 'HEADER');
    if (header) {
      setHeaderType(header.format || header.type);
      if (header.format === 'TEXT' && header.parameters && header.parameters.length > 0) {
        setHeaderVars(header.parameters.map((p: any, i: number) => ({
          ...p,
          label: p.text || `Header Variable ${i+1}`
        })));
      } else if (header.format === 'IMAGE') {
        setHeaderVars([{ type: 'image', label: 'Header Image', index: 0 }]);
      } else {
        setHeaderVars([]);
      }
    } else {
      setHeaderVars([]);
      setHeaderType('');
    }
    // BODY
    const body = components.find((c: any) => c.type === 'BODY');
    if (body) {
      if (body.parameters && body.parameters.length > 0) {
        setBodyVars(body.parameters.map((p: any, i: number) => ({
          ...p,
          label: p.text || `Body Variable ${i+1}`
        })));
      } else if (body.text) {
        setBodyVars(extractNumberedPlaceholders(body.text));
      } else {
        setBodyVars([]);
      }
    } else {
      setBodyVars([]);
    }
    // FOOTER (rare, but possible)
    const footer = components.find((c: any) => c.type === 'FOOTER');
    if (footer && footer.parameters && footer.parameters.length > 0) {
      setFooterVars(footer.parameters.map((p: any, i: number) => ({
        ...p,
        label: p.text || `Footer Variable ${i+1}`
      })));
    } else {
      setFooterVars([]);
    }
  }, [templateJson]);

  // Unified mapping state for all variables
  const allVars = [
    ...headerVars.map((v, i) => ({ ...v, section: 'HEADER', key: `header-${i}` })),
    ...bodyVars.map((v, i) => ({ ...v, section: 'BODY', key: `body-${i}` })),
    ...footerVars.map((v, i) => ({ ...v, section: 'FOOTER', key: `footer-${i}` })),
  ];

  // Use a single mapping object: key -> field
  const [unifiedMapping, setUnifiedMapping] = useState<{ [key: string]: string }>({});
  useEffect(() => {
    // Reset mapping when variables change
    if (existingConfig && mappingStep) {
      // Load existing mapping when editing
      setUnifiedMapping(existingConfig.variable_mapping || {});
    } else {
      // Reset mapping when variables change
      setUnifiedMapping(allVars.reduce((acc, v) => ({ ...acc, [v.key]: '' }), {}));
    }
  }, [templateJson, existingConfig, mappingStep]);

  // Save logic: convert unifiedMapping to the expected format (by section)
  const handleSaveConfigUnified = async () => {
    console.log('handleSaveConfigUnified called', { eventId, selectedTemplate, allVars, unifiedMapping });
    if (!eventId || !selectedTemplate || allVars.length === 0) {
      console.log('Early return due to missing data:', { eventId, selectedTemplate, allVarsLength: allVars.length });
      return;
    }
    const template = waTemplates.find(t => t.name === selectedTemplate);
    console.log('Found template:', template);
    const mapping = unifiedMapping;
    console.log('Saving mapping:', mapping);
    
    // Check if supabase is available
    if (!supabase) {
      console.error('Supabase client is not available');
      alert('Database connection error');
      return;
    }
    
    try {
      console.log('About to call Supabase upsert...');
      
      // First check if user is authenticated
      console.log('Checking authentication...');
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log('Auth check result:', { user: user?.id, error: authError });
      
      if (authError || !user) {
        alert('Authentication error: ' + (authError?.message || 'Not logged in') + '\n\nPlease refresh the page and log in again.');
        setSaving(false);
        return;
      }
      
      console.log('User authenticated:', user.id);
      console.log('Proceeding to insert...');
      
      // Add timeout to prevent hanging (longer for remote Supabase)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Insert timeout after 30 seconds. This might be due to network latency with remote Supabase.')), 30000)
      );
      
      // Try insert first, if it fails due to conflict, then try update
      console.log('8. Attempting insert into event_message_configurations...');
      const insertPromise = supabase
        .from('event_message_configurations')
        .insert([
          {
            event_id: eventId,
            channel: 'whatsapp',
            template_name: selectedTemplate,
            template_language: template.language,
            variable_mapping: mapping,
            updated_at: new Date().toISOString(),
          }
        ]);
      
      let { data, error } = await Promise.race([insertPromise, timeoutPromise]) as any;
      
      // If insert fails due to unique constraint violation, try update
      if (error && error.code === '23505') { // Unique violation error code
        console.log('Insert failed due to existing record, trying update...');
        const updatePromise = supabase
          .from('event_message_configurations')
          .update({
            template_name: selectedTemplate,
            template_language: template.language,
            variable_mapping: mapping,
            updated_at: new Date().toISOString(),
          })
          .eq('event_id', eventId)
          .eq('channel', 'whatsapp');
        
        ({ data, error } = await Promise.race([updatePromise, timeoutPromise]) as any);
      }
      
      console.log('Supabase response:', { data, error });
      
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Configuration saved successfully!');
      alert('Configuration saved!');
      setMappingStep(false);
    } catch (err) {
      console.error('Failed to save configuration', err);
      alert(`Failed to save configuration: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-white dark:bg-gray-900 min-h-screen w-full overflow-auto lg:ml-64">
      <div className="w-full flex flex-col items-center pt-8 pb-2 bg-white dark:bg-gray-900">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Configurations</h1>
      </div>
      <div className="flex items-center px-8 py-6 border-b border-gray-200 dark:border-gray-700">
        <button onClick={() => navigate(-1)} className="mr-4 text-gray-500 hover:text-gray-700">← Back</button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{eventName} Configurations</h1>
      </div>
      <div className="px-8 pt-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <nav className="flex space-x-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                activeTab === tab.id
                  ? 'border-orange-500 text-orange-600 dark:text-orange-400' 
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="flex-1 flex flex-col p-4 sm:p-8 overflow-auto">
        {activeTab === 'whatsapp' && (
          <div className="w-full max-w-7xl bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-4 sm:p-6 min-h-[400px] flex flex-col">
            {/* Existing Configuration Display */}
            {!configLoading && existingConfig && !mappingStep && (
              <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Configuration Active
                  </h3>
                  <button
                    onClick={() => setMappingStep(true)}
                    className="px-3 py-1.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm font-medium"
                  >
                    Edit Configuration
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-green-700 dark:text-green-300">Template:</span>
                    <span className="ml-2 text-green-600 dark:text-green-400">{existingConfig.template_name}</span>
                  </div>
                  <div>
                    <span className="font-medium text-green-700 dark:text-green-300">Language:</span>
                    <span className="ml-2 text-green-600 dark:text-green-400">{existingConfig.template_language}</span>
                  </div>
                  <div className="md:col-span-2">
                    <span className="font-medium text-green-700 dark:text-green-300">Variable Mappings:</span>
                    <div className="mt-1 p-2 bg-white dark:bg-gray-800 rounded border text-xs">
                      <pre className="text-green-600 dark:text-green-400 overflow-x-auto">
                        {JSON.stringify(existingConfig.variable_mapping, null, 2)}
                      </pre>
                    </div>
                  </div>
                  <div className="md:col-span-2 text-xs text-green-600 dark:text-green-400">
                    Last updated: {new Date(existingConfig.updated_at).toLocaleString()}
                  </div>
                </div>
              </div>
            )}
            {!configLoading && !existingConfig && !mappingStep && (
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    No configuration set yet. Click below to add your first configuration.
                  </div>
                  <button
                    onClick={() => setMappingStep(true)}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 text-sm font-medium"
                  >
                    Add Configuration
                  </button>
                </div>
              </div>
            )}
            {configLoading && (
              <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading configuration... (This may take a moment)
                  </div>
                  <button
                    onClick={() => {
                      setConfigLoading(false)
                      setExistingConfig(null) // Force "no configuration" state
                    }}
                    className="text-xs text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-200 underline"
                  >
                    Skip
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">WhatsApp Template Configuration</h2>
              {!waLoading && !waError && !mappingStep && waTemplates.length > 0 && !existingConfig && selectedTemplate && (
                <button
                  className="px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg hover:from-orange-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => setMappingStep(true)}
                >
                  Assign Template & Map Variables
                </button>
              )}
            </div>
            {waLoading && <p className="text-gray-500 dark:text-gray-400">Loading templates...</p>}
            {waError && <p className="text-red-500 mb-2">{waError}</p>}
            {!waLoading && !waError && !mappingStep && waTemplates.length === 0 && !existingConfig && (
              <p className="text-gray-500 dark:text-gray-400">No templates found for this WhatsApp Business Account.</p>
            )}
            {!waLoading && !waError && !mappingStep && waTemplates.length > 0 && !existingConfig && (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Click "Add Configuration" above to select a WhatsApp template and configure your message settings.
                </p>
              </div>
            )}
            {/* Template Selection for New Configuration */}
            {!waLoading && !waError && mappingStep && !existingConfig && !selectedTemplate && (
              <>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Select WhatsApp Template</h3>
                  <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
                    <input
                      type="text"
                      placeholder="Search templates..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white w-full md:w-1/3"
                    />
                    <select
                      value={languageFilter}
                      onChange={e => setLanguageFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white w-full md:w-40"
                    >
                      <option value="all">All Languages</option>
                      {languages.map(lang => (
                        <option key={lang} value={lang}>{lang}</option>
                      ))}
                    </select>
                    <select
                      value={categoryFilter}
                      onChange={e => setCategoryFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white w-full md:w-40"
                    >
                      <option value="all">All Categories</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full">
                    {filteredTemplates.map((tpl) => (
                      <label key={tpl.id || tpl.name} className={`flex flex-col p-4 border rounded-lg cursor-pointer transition-all ${selectedTemplate === tpl.name ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-orange-400'}`}>
                        <div className="flex items-center mb-2">
                          <input
                            type="radio"
                            name="wa-template"
                            value={tpl.name}
                            checked={selectedTemplate === tpl.name}
                            onChange={() => setSelectedTemplate(tpl.name)}
                            className="mr-3 accent-orange-500"
                          />
                          <span className="font-medium text-gray-900 dark:text-white">{tpl.name}</span>
                          <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">({tpl.language})</span>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Status: {tpl.status}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">Category: {tpl.category || 'N/A'}</div>
                      </label>
                    ))}
                                         {filteredTemplates.length === 0 && (
                       <div className="col-span-full text-center text-gray-500 dark:text-gray-400 py-8">No templates found.</div>
                     )}
                   </div>

                 </div>
               </>
             )}

            {/* Mapping UI */}
            {!waLoading && !waError && mappingStep && selectedTemplate && allVars.length > 0 && (
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <h3 className="text-md font-semibold mb-4 text-white">Map Template Variables</h3>
                    {templateJson && (
                      <button
                        type="button"
                        className="px-3 py-1.5 bg-gray-800 text-white rounded hover:bg-gray-700 text-sm"
                        onClick={() => setShowJson(show => !show)}
                      >
                        {showJson ? 'Hide JSON' : 'Show JSON'}
                      </button>
                    )}
                  </div>
                  {showJson && templateJson && (
                    <pre className="bg-gray-900 text-white text-xs rounded p-4 mb-4 max-h-96 overflow-auto border border-gray-700">
                      {JSON.stringify(templateJson, null, 2)}
                    </pre>
                  )}
                  <div className="flex flex-col md:flex-row gap-8">
                    <div className="flex-1 min-w-0">
                      <h2 className="text-xl font-bold text-white mb-6">WhatsApp Template Configuration: <span className="text-orange-400">{selectedTemplate}</span></h2>
                      {/* HEADER Section */}
                      {headerVars.length > 0 && (
                        <div className="mb-6">
                          <div className="font-semibold text-orange-600 dark:text-orange-400 mb-2 flex items-center gap-2">
                            Header {headerType === 'IMAGE' && <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded">Image</span>}
                            {headerType === 'TEXT' && <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded">Text</span>}
                          </div>
                          {headerVars.map((v, i) => (
                            <div key={v.key || `header-${i}`} className="flex items-center gap-4 mb-2">
                              <span className="w-48 text-gray-900 dark:text-white font-medium">{v.label}</span>
                              <select
                                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                value={unifiedMapping[`header-${i}`] || ''}
                                onChange={e => setUnifiedMapping(prev => ({ ...prev, [`header-${i}`]: e.target.value }))}
                              >
                                <option value="">Select field...</option>
                                {ALL_FIELDS.map(f => (
                                  <option key={f.value} value={f.value}>{f.label}</option>
                                ))}
                              </select>
                            </div>
                          ))}
                        </div>
                      )}
                      {/* BODY Section */}
                      {bodyVars.length > 0 && (
                        <div className="mb-6">
                          <div className="font-semibold text-blue-600 dark:text-blue-400 mb-2">Body</div>
                          {bodyVars.map((v, i) => (
                            <div key={v.key || `body-${i}`} className="flex items-center gap-4 mb-2">
                              <span className="w-48 text-gray-900 dark:text-white font-medium">{v.label}</span>
                              <select
                                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                value={unifiedMapping[`body-${i}`] || ''}
                                onChange={e => setUnifiedMapping(prev => ({ ...prev, [`body-${i}`]: e.target.value }))}
                              >
                                <option value="">Select field...</option>
                                {ALL_FIELDS.map(f => (
                                  <option key={f.value} value={f.value}>{f.label}</option>
                                ))}
                              </select>
                            </div>
                          ))}
                        </div>
                      )}
                      {/* FOOTER Section */}
                      {footerVars.length > 0 && (
                        <div className="mb-6">
                          <div className="font-semibold text-green-600 dark:text-green-400 mb-2">Footer</div>
                          {footerVars.map((v, i) => (
                            <div key={v.key || `footer-${i}`} className="flex items-center gap-4 mb-2">
                              <span className="w-48 text-gray-900 dark:text-white font-medium">{v.label}</span>
                              <select
                                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                value={unifiedMapping[`footer-${i}`] || ''}
                                onChange={e => setUnifiedMapping(prev => ({ ...prev, [`footer-${i}`]: e.target.value }))}
                              >
                                <option value="">Select field...</option>
                                {ALL_FIELDS.map(f => (
                                  <option key={f.value} value={f.value}>{f.label}</option>
                                ))}
                              </select>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-3 mt-6">
                        <button
                          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                          onClick={() => setMappingStep(false)}
                        >
                          Back
                        </button>
                        <button
                          className="px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg hover:from-orange-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          // Allow partial fill: always enabled
                          disabled={false}
                          onClick={e => { e.preventDefault(); handleSaveConfigUnified(); }}
                        >
                          Save Configuration
                        </button>
                      </div>
                    </div>
                    {/* WhatsApp Message Preview */}
                    <div className="flex-1 min-w-0 flex flex-col items-center justify-start pt-8 md:pt-0">
                      <div className="w-full max-w-md bg-[#ece5dd] rounded-xl shadow-lg p-4 border border-[#dadada] relative">
                        <div className="flex flex-col items-center mb-3">
                          {/* Header image preview if mapped or from template default */}
                          {headerType === 'IMAGE' && (
                            (() => {
                              // Try to get the default image URL from the template JSON
                              let imageUrl = '';
                              if (templateJson) {
                                const header = (templateJson.components || []).find((c: any) => c.type === 'HEADER');
                                if (header && header.example && header.example.header_handle) {
                                  imageUrl = header.example.header_handle;
                                } else if (header && header.example && header.example.media_url) {
                                  imageUrl = header.example.media_url;
                                }
                              }
                              return imageUrl ? (
                                <img src={imageUrl} alt="Header" className="rounded-t-lg w-full max-h-40 object-cover mb-2" />
                              ) : null;
                            })()
                          )}
                        </div>
                        <div className="bg-white rounded-lg p-4 shadow-inner">
                          <div className="text-xs text-gray-500 mb-1">SAVE THE DATE</div>
                          <div className="text-2xl font-bold text-purple-700 mb-2">Penina</div>
                          <div className="text-gray-900 text-sm whitespace-pre-line">
                            {/* Render a preview of the template body, replacing variables with {field} */}
                            {(() => {
                              if (!templateJson) return null;
                              const body = (templateJson.components || []).find((c: any) => c.type === 'BODY');
                              let text = body?.text || '';
                              // Replace {{1}}, {{2}}, ... with mapped field names
                              if (bodyVars.length > 0) {
                                bodyVars.forEach((v, i) => {
                                  text = text.replace(new RegExp(`\{\{${i+1}\}\}`, 'g'), unifiedMapping[`body-${i}`] ? `{${unifiedMapping[`body-${i}`]}}` : `{{${i+1}}}`);
                                });
                              }
                              return text;
                            })()}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 mt-2">Powered by Sherevo App</div>
                        <div className="absolute bottom-2 right-4 text-xs text-gray-400">8:59 PM</div>
                      </div>
                    </div>
                  </div>
                </div>
            )}
            {!waLoading && !waError && mappingStep && selectedTemplate && allVars.length === 0 && (
              <div className="flex flex-col items-center justify-center min-h-[200px]">
                <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">This template has no variables to map.</p>
                <button
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  onClick={() => setMappingStep(false)}
                >
                  Back
                </button>
              </div>
            )}
          </div>
        )}
        {activeTab === 'sms' && (
          <div className="w-full max-w-3xl bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-4 sm:p-6 min-h-[300px] flex flex-col">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">SMS Template Configuration</h2>
            {configLoading ? (
              <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading templates...
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-8">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Invitation SMS Template</h4>
                    <select
                      value={selectedInvitationTemplate}
                      onChange={e => setSelectedInvitationTemplate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white mb-2"
                    >
                      <option value="">Select a template</option>
                      {smsTemplates.filter((tpl: any) => tpl.purpose === 'invitation').map((tpl: any) => (
                        <option key={tpl.id} value={tpl.id}>{tpl.name}</option>
                      ))}
                    </select>
                    {selectedInvitationTemplate && (
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-sm text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700">
                        {smsTemplates.find((t: any) => t.id === selectedInvitationTemplate)?.body}
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Reminder SMS Template</h4>
                    <select
                      value={selectedReminderTemplate}
                      onChange={e => setSelectedReminderTemplate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white mb-2"
                    >
                      <option value="">Select a template</option>
                      {smsTemplates.filter((tpl: any) => tpl.purpose === 'reminder').map((tpl: any) => (
                        <option key={tpl.id} value={tpl.id}>{tpl.name}</option>
                      ))}
                    </select>
                    {selectedReminderTemplate && (
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-sm text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700">
                        {smsTemplates.find((t: any) => t.id === selectedReminderTemplate)?.body}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleSaveSmsConfig}
                  disabled={saving}
                  className="mt-8 px-6 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg hover:from-orange-600 hover:to-pink-600 font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed self-end"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default EventConfigurations 