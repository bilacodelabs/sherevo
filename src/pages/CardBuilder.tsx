import React, { useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { 
  Upload, 
  Type, 
  Move, 
  Save, 
  Eye, 
  Download,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  RotateCcw,
  Trash2,
  Plus,
  Image as ImageIcon,
  QrCode,
  FolderOpen,
  Edit
} from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { TextElement } from '../lib/supabase'

interface CanvasSize {
  width: number
  height: number
}

export const CardBuilder: React.FC = () => {
  const { templates, events, guests, cardDesigns, createCardDesign, updateCardDesign, deleteCardDesign, getEventAttributes } = useApp()
  const [searchParams] = useSearchParams()
  const canvasRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [backgroundImage, setBackgroundImage] = useState<string>('')
  const [canvasSize, setCanvasSize] = useState<CanvasSize>({ width: 600, height: 400 })
  const [textElements, setTextElements] = useState<TextElement[]>([])
  const [selectedElement, setSelectedElement] = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [selectedEvent, setSelectedEvent] = useState<string>(searchParams.get('event') || '')
  const [showPreview, setShowPreview] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [currentDesign, setCurrentDesign] = useState<any>(null)
  const [designName, setDesignName] = useState('Untitled Design')
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [showLoadModal, setShowLoadModal] = useState(false)
  const [saving, setSaving] = useState(false)

  const fontFamilies = [
    'Arial, sans-serif',
    'Georgia, serif',
    'Times New Roman, serif',
    'Helvetica, sans-serif',
    'Verdana, sans-serif',
    'Courier New, monospace',
    'Impact, sans-serif',
    'Comic Sans MS, cursive'
  ]

  const selectedEventData = events.find(e => e.id === selectedEvent)
  const eventAttributes = selectedEvent ? getEventAttributes(selectedEvent) : []

  const guestVariables = [
    '{{guest_name}}',
    '{{event_name}}',
    '{{event_date}}',
    '{{event_time}}',
    '{{event_venue}}',
    '{{plus_one_name}}',
    '{{card_type}}',
    '{{qr_code}}',
    ...eventAttributes.map(attr => `{{${attr.attribute_key}}}`)
  ]

  useEffect(() => {
    const eventParam = searchParams.get('event')
    if (eventParam) {
      setSelectedEvent(eventParam)
    }
  }, [searchParams])

  useEffect(() => {
    if (selectedTemplate) {
      const template = templates.find(t => t.id === selectedTemplate)
      if (template) {
        setBackgroundImage(template.preview)
        // Add default text elements based on template
        setTextElements([
          {
            id: '1',
            text: 'You are invited to {{event_name}}',
            x: canvasSize.width / 2 - 150,
            y: 50,
            fontSize: 24,
            fontFamily: template.font_family,
            color: template.text_color,
            fontWeight: 'bold',
            fontStyle: 'normal',
            textDecoration: 'none',
            textAlign: 'center',
            isDragging: false,
            type: 'text'
          },
          {
            id: '2',
            text: 'Dear {{guest_name}},',
            x: 50,
            y: 120,
            fontSize: 18,
            fontFamily: template.font_family,
            color: template.text_color,
            fontWeight: 'normal',
            fontStyle: 'normal',
            textDecoration: 'none',
            textAlign: 'left',
            isDragging: false,
            type: 'text'
          }
        ])
      }
    }
  }, [selectedTemplate, templates, canvasSize])

  useEffect(() => {
    const designId = searchParams.get('design');
    if (designId && cardDesigns.length > 0) {
      const design = cardDesigns.find(d => d.id === designId);
      if (design) {
        loadDesign(design);
      }
    }
    // eslint-disable-next-line
  }, [searchParams, cardDesigns]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          // Calculate canvas size based on image aspect ratio
          const maxWidth = 800
          const maxHeight = 600
          let { width, height } = img
          
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }
          
          if (height > maxHeight) {
            width = (width * maxHeight) / height
            height = maxHeight
          }
          
          setCanvasSize({ width: Math.round(width), height: Math.round(height) })
          setBackgroundImage(e.target?.result as string)
        }
        img.src = e.target?.result as string
      }
      reader.readAsDataURL(file)
    }
  }

  const addTextElement = () => {
    const newElement: TextElement = {
      id: Date.now().toString(),
      text: 'New Text',
      x: canvasSize.width / 2 - 50,
      y: canvasSize.height / 2,
      fontSize: 16,
      fontFamily: 'Arial, sans-serif',
      color: '#000000',
      fontWeight: 'normal',
      fontStyle: 'normal',
      textDecoration: 'none',
      textAlign: 'left',
      isDragging: false,
      type: 'text'
    }
    setTextElements([...textElements, newElement])
    setSelectedElement(newElement.id)
  }

  const addQRCodeElement = () => {
    const newElement: TextElement = {
      id: Date.now().toString(),
      text: '{{qr_code}}',
      x: canvasSize.width - 120,
      y: canvasSize.height - 120,
      fontSize: 100,
      fontFamily: 'Arial, sans-serif',
      color: '#000000',
      fontWeight: 'normal',
      fontStyle: 'normal',
      textDecoration: 'none',
      textAlign: 'center',
      isDragging: false,
      type: 'qr_code',
      width: 100,
      height: 100
    }
    setTextElements([...textElements, newElement])
    setSelectedElement(newElement.id)
  }

  const updateTextElement = (id: string, updates: Partial<TextElement>) => {
    setTextElements(elements =>
      elements.map(el => el.id === id ? { ...el, ...updates } : el)
    )
  }

  const deleteTextElement = (id: string) => {
    setTextElements(elements => elements.filter(el => el.id !== id))
    if (selectedElement === id) {
      setSelectedElement(null)
    }
  }

  const handleMouseDown = (e: React.MouseEvent, elementId: string) => {
    e.preventDefault()
    const element = textElements.find(el => el.id === elementId)
    if (!element) return

    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const offsetX = e.clientX - rect.left - element.x
    const offsetY = e.clientY - rect.top - element.y

    setDragOffset({ x: offsetX, y: offsetY })
    setSelectedElement(elementId)
    updateTextElement(elementId, { isDragging: true })

    const handleMouseMove = (e: MouseEvent) => {
      const newX = e.clientX - rect.left - offsetX
      const newY = e.clientY - rect.top - offsetY
      
      updateTextElement(elementId, {
        x: Math.max(0, Math.min(canvasSize.width - (element.width || 100), newX)),
        y: Math.max(0, Math.min(canvasSize.height - (element.height || 30), newY))
      })
    }

    const handleMouseUp = () => {
      updateTextElement(elementId, { isDragging: false })
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const insertVariable = (variable: string) => {
    if (selectedElement) {
      const element = textElements.find(el => el.id === selectedElement)
      if (element && element.type === 'text') {
        updateTextElement(selectedElement, {
          text: element.text + ' ' + variable
        })
      }
    }
  }

  const saveDesign = async () => {
    setSaving(true)
    try {
      const designData = {
        name: designName,
        event_id: selectedEvent || '',
        background_image: backgroundImage,
        canvas_width: canvasSize.width,
        canvas_height: canvasSize.height,
        text_elements: textElements
      }

      if (currentDesign) {
        await updateCardDesign(currentDesign.id, designData)
      } else {
        const newDesign = await createCardDesign(designData)
        setCurrentDesign(newDesign)
      }
      
      setShowSaveModal(false)
      alert('Design saved successfully!')
    } catch (error) {
      console.error('Error saving design:', error)
      alert('Failed to save design')
    } finally {
      setSaving(false)
    }
  }

  const loadDesign = (design: any) => {
    setCurrentDesign(design)
    setDesignName(design.name)
    setSelectedEvent(design.event_id)
    setBackgroundImage(design.background_image)
    setCanvasSize({ width: design.canvas_width, height: design.canvas_height })
    setTextElements(design.text_elements || [])
    setShowLoadModal(false)
  }

  const newDesign = () => {
    setCurrentDesign(null)
    setDesignName('Untitled Design')
    setSelectedEvent(searchParams.get('event') || '')
    setBackgroundImage('')
    setCanvasSize({ width: 600, height: 400 })
    setTextElements([])
    setSelectedElement(null)
  }

  const renderElement = (element: TextElement) => {
    if (element.type === 'qr_code') {
      return (
        <div
          key={element.id}
          className={`absolute cursor-move select-none border-2 border-dashed border-gray-400 bg-gray-100 dark:bg-gray-700 flex items-center justify-center ${
            selectedElement === element.id ? 'ring-2 ring-orange-500' : ''
          } ${element.isDragging ? 'opacity-75' : ''}`}
          style={{
            left: element.x,
            top: element.y,
            width: element.width || 100,
            height: element.height || 100,
            fontSize: '12px',
            color: '#666'
          }}
          onMouseDown={(e) => handleMouseDown(e, element.id)}
          onClick={() => setSelectedElement(element.id)}
        >
          <div className="text-center">
            <QrCode className="w-8 h-8 mx-auto mb-1" />
            <div>QR Code</div>
            <div className="text-xs">Event + Guest</div>
          </div>
        </div>
      )
    }

    return (
      <div
        key={element.id}
        className={`absolute cursor-move select-none ${
          selectedElement === element.id ? 'ring-2 ring-orange-500' : ''
        } ${element.isDragging ? 'opacity-75' : ''}`}
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
          padding: '4px'
        }}
        onMouseDown={(e) => handleMouseDown(e, element.id)}
        onClick={() => setSelectedElement(element.id)}
      >
        {element.text}
      </div>
    )
  }

  const selectedElementData = textElements.find(el => el.id === selectedElement)

  const exportCanvas = () => {
    // In a real implementation, you would use html2canvas or similar
    alert('Export functionality would be implemented here')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Card Builder</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Design beautiful invitation cards with drag-and-drop interface
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowLoadModal(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <FolderOpen className="w-4 h-4 mr-2" />
            Load
          </button>
          <button
            onClick={() => setShowSaveModal(true)}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Save className="w-4 h-4 mr-2" />
            Save
          </button>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Eye className="w-4 h-4 mr-2" />
            {showPreview ? 'Edit' : 'Preview'}
          </button>
          <button
            onClick={exportCanvas}
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg hover:from-orange-600 hover:to-pink-600 transition-all duration-200"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Current Design Info */}
      {currentDesign && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-blue-900 dark:text-blue-200">
                Editing: {currentDesign.name}
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Last saved: {new Date(currentDesign.updated_at).toLocaleString()}
              </p>
            </div>
            <button
              onClick={newDesign}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 font-medium"
            >
              New Design
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Template Selection */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Templates</h3>
            <div className="space-y-3">
              {templates.slice(0, 5).map(template => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  className={`w-full p-3 rounded-lg border-2 transition-all ${
                    selectedTemplate === template.id
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <div className="text-left">
                    <div className="font-medium text-gray-900 dark:text-white">{template.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">{template.type}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Background Image */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Background</h3>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-orange-500 dark:hover:border-orange-400 transition-colors"
            >
              <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Click to upload background image
              </div>
            </button>
          </div>

          {/* Event Selection */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Event</h3>
            <select
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="">Select an event</option>
              {events.map(event => (
                <option key={event.id} value={event.id}>{event.name}</option>
              ))}
            </select>
          </div>

          {/* Guest Variables */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Variables</h3>
            <div className="space-y-2">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Guest & Event Variables:</div>
              {guestVariables.slice(0, 8).map(variable => (
                <button
                  key={variable}
                  onClick={() => insertVariable(variable)}
                  disabled={!selectedElement || selectedElementData?.type !== 'text'}
                  className="w-full px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-left"
                >
                  {variable}
                </button>
              ))}
              
              {eventAttributes.length > 0 && (
                <>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-2 mt-4">Event Attributes:</div>
                  {eventAttributes.map(attr => (
                    <button
                      key={attr.attribute_key}
                      onClick={() => insertVariable(`{{${attr.attribute_key}}}`)}
                      disabled={!selectedElement || selectedElementData?.type !== 'text'}
                      className="w-full px-3 py-2 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-left"
                      title={attr.display_name}
                    >
                      {`{{${attr.attribute_key}}}`}
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Canvas</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={addTextElement}
                  className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Text
                </button>
                <button
                  onClick={addQRCodeElement}
                  className="inline-flex items-center px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <QrCode className="w-4 h-4 mr-1" />
                  Add QR
                </button>
                <button
                  onClick={() => {
                    setTextElements([])
                    setSelectedElement(null)
                  }}
                  className="inline-flex items-center px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Reset
                </button>
              </div>
            </div>

            {/* Canvas */}
            <div className="flex justify-center">
              <div
                ref={canvasRef}
                className="relative border-2 border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-white"
                style={{
                  width: canvasSize.width,
                  height: canvasSize.height,
                  backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                {textElements.map(renderElement)}
              </div>
            </div>

            <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
              Canvas size: {canvasSize.width} × {canvasSize.height}px
            </div>
          </div>
        </div>

        {/* Properties Panel */}
        <div className="lg:col-span-1">
          {selectedElementData ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {selectedElementData.type === 'qr_code' ? 'QR Code Properties' : 'Text Properties'}
                </h3>
                <button
                  onClick={() => deleteTextElement(selectedElementData.id)}
                  className="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                {selectedElementData.type === 'text' ? (
                  <>
                    {/* Text Content */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Text
                      </label>
                      <textarea
                        value={selectedElementData.text}
                        onChange={(e) => updateTextElement(selectedElementData.id, { text: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        rows={3}
                      />
                    </div>

                    {/* Font Family */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Font Family
                      </label>
                      <select
                        value={selectedElementData.fontFamily}
                        onChange={(e) => updateTextElement(selectedElementData.id, { fontFamily: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      >
                        {fontFamilies.map(font => (
                          <option key={font} value={font}>{font.split(',')[0]}</option>
                        ))}
                      </select>
                    </div>

                    {/* Font Size */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Font Size
                      </label>
                      <input
                        type="range"
                        min="8"
                        max="72"
                        value={selectedElementData.fontSize}
                        onChange={(e) => updateTextElement(selectedElementData.id, { fontSize: parseInt(e.target.value) })}
                        className="w-full"
                      />
                      <div className="text-center text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {selectedElementData.fontSize}px
                      </div>
                    </div>

                    {/* Color */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Color
                      </label>
                      <input
                        type="color"
                        value={selectedElementData.color}
                        onChange={(e) => updateTextElement(selectedElementData.id, { color: e.target.value })}
                        className="w-full h-10 border border-gray-300 dark:border-gray-600 rounded-lg"
                      />
                    </div>

                    {/* Text Style */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Style
                      </label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateTextElement(selectedElementData.id, {
                            fontWeight: selectedElementData.fontWeight === 'bold' ? 'normal' : 'bold'
                          })}
                          className={`p-2 rounded-lg border ${
                            selectedElementData.fontWeight === 'bold'
                              ? 'bg-orange-100 border-orange-500 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
                              : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          <Bold className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => updateTextElement(selectedElementData.id, {
                            fontStyle: selectedElementData.fontStyle === 'italic' ? 'normal' : 'italic'
                          })}
                          className={`p-2 rounded-lg border ${
                            selectedElementData.fontStyle === 'italic'
                              ? 'bg-orange-100 border-orange-500 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
                              : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          <Italic className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => updateTextElement(selectedElementData.id, {
                            textDecoration: selectedElementData.textDecoration === 'underline' ? 'none' : 'underline'
                          })}
                          className={`p-2 rounded-lg border ${
                            selectedElementData.textDecoration === 'underline'
                              ? 'bg-orange-100 border-orange-500 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
                              : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          <Underline className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Text Alignment */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Alignment
                      </label>
                      <div className="flex gap-2">
                        {[
                          { value: 'left', icon: AlignLeft },
                          { value: 'center', icon: AlignCenter },
                          { value: 'right', icon: AlignRight }
                        ].map(({ value, icon: Icon }) => (
                          <button
                            key={value}
                            onClick={() => updateTextElement(selectedElementData.id, { textAlign: value as any })}
                            className={`p-2 rounded-lg border ${
                              selectedElementData.textAlign === value
                                ? 'bg-orange-100 border-orange-500 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
                                : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* QR Code Size */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Size
                      </label>
                      <input
                        type="range"
                        min="50"
                        max="200"
                        value={selectedElementData.width || 100}
                        onChange={(e) => {
                          const size = parseInt(e.target.value)
                          updateTextElement(selectedElementData.id, { width: size, height: size })
                        }}
                        className="w-full"
                      />
                      <div className="text-center text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {selectedElementData.width || 100}px
                      </div>
                    </div>
                  </>
                )}

                {/* Position */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      X Position
                    </label>
                    <input
                      type="number"
                      value={selectedElementData.x}
                      onChange={(e) => updateTextElement(selectedElementData.id, { x: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Y Position
                    </label>
                    <input
                      type="number"
                      value={selectedElementData.y}
                      onChange={(e) => updateTextElement(selectedElementData.id, { y: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="text-center py-8">
                <Type className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No Element Selected
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Click on a text element or QR code to edit its properties
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setShowSaveModal(false)} />
            <div className="relative bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Save Design
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Design Name
                  </label>
                  <input
                    type="text"
                    value={designName}
                    onChange={(e) => setDesignName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Enter design name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Associated Event (Optional)
                  </label>
                  <select
                    value={selectedEvent}
                    onChange={(e) => setSelectedEvent(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">No specific event</option>
                    {events.map(event => (
                      <option key={event.id} value={event.id}>{event.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6">
                <button
                  onClick={() => setShowSaveModal(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveDesign}
                  disabled={saving || !designName.trim()}
                  className="px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg hover:from-orange-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {saving ? 'Saving...' : 'Save Design'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Load Modal */}
      {showLoadModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setShowLoadModal(false)} />
            <div className="relative bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Load Design
              </h2>
              
              {cardDesigns.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {cardDesigns.map(design => (
                    <div
                      key={design.id}
                      className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                      onClick={() => loadDesign(design)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-900 dark:text-white">{design.name}</h3>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (confirm('Delete this design?')) {
                              deleteCardDesign(design.id)
                            }
                          }}
                          className="text-red-600 dark:text-red-400 hover:text-red-500 dark:hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                        {design.canvas_width} × {design.canvas_height}px
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {new Date(design.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No saved designs found</p>
                </div>
              )}

              <div className="flex justify-end pt-6">
                <button
                  onClick={() => setShowLoadModal(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}