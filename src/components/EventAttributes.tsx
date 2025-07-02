import React, { useState } from 'react'
import { Plus, Edit, Trash2, Save, X } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { EventAttribute } from '../lib/supabase'

interface EventAttributesProps {
  eventId: string
}

export const EventAttributes: React.FC<EventAttributesProps> = ({ eventId }) => {
  const { eventAttributes, createEventAttribute, updateEventAttribute, deleteEventAttribute, getEventAttributes } = useApp()
  const [editingAttribute, setEditingAttribute] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    attribute_key: '',
    attribute_value: '',
    attribute_type: 'text' as 'text' | 'number' | 'date' | 'boolean',
    display_name: '',
    is_required: false
  })

  const attributes = getEventAttributes(eventId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingAttribute) {
        await updateEventAttribute(editingAttribute, formData)
        setEditingAttribute(null)
      } else {
        await createEventAttribute({
          ...formData,
          event_id: eventId
        })
        setShowAddForm(false)
      }
      
      setFormData({
        attribute_key: '',
        attribute_value: '',
        attribute_type: 'text',
        display_name: '',
        is_required: false
      })
    } catch (error) {
      console.error('Error saving attribute:', error)
    }
  }

  const handleEdit = (attribute: EventAttribute) => {
    setEditingAttribute(attribute.id)
    setFormData({
      attribute_key: attribute.attribute_key,
      attribute_value: attribute.attribute_value,
      attribute_type: attribute.attribute_type,
      display_name: attribute.display_name,
      is_required: attribute.is_required
    })
  }

  const handleDelete = async (attribute: EventAttribute) => {
    if (window.confirm(`Are you sure you want to delete "${attribute.display_name}"?`)) {
      try {
        await deleteEventAttribute(attribute.id)
      } catch (error) {
        console.error('Error deleting attribute:', error)
      }
    }
  }

  const handleCancel = () => {
    setEditingAttribute(null)
    setShowAddForm(false)
    setFormData({
      attribute_key: '',
      attribute_value: '',
      attribute_type: 'text',
      display_name: '',
      is_required: false
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Event Attributes</h3>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center px-3 py-1.5 text-sm bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg hover:from-orange-600 hover:to-pink-600 transition-all duration-200"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Attribute
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {(showAddForm || editingAttribute) && (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={formData.display_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Attribute Key
                </label>
                <input
                  type="text"
                  value={formData.attribute_key}
                  onChange={(e) => setFormData(prev => ({ ...prev, attribute_key: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
                  placeholder="e.g., bride_name"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Type
                </label>
                <select
                  value={formData.attribute_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, attribute_type: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="date">Date</option>
                  <option value="boolean">Boolean</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Default Value
                </label>
                <input
                  type={formData.attribute_type === 'date' ? 'date' : formData.attribute_type === 'number' ? 'number' : 'text'}
                  value={formData.attribute_value}
                  onChange={(e) => setFormData(prev => ({ ...prev, attribute_value: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_required"
                checked={formData.is_required}
                onChange={(e) => setFormData(prev => ({ ...prev, is_required: e.target.checked }))}
                className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
              />
              <label htmlFor="is_required" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Required field
              </label>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 text-sm bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg hover:from-orange-600 hover:to-pink-600 transition-all duration-200"
              >
                <Save className="w-4 h-4 mr-1" />
                {editingAttribute ? 'Update' : 'Add'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Attributes List */}
      <div className="space-y-2">
        {attributes.length > 0 ? (
          attributes.map((attribute) => (
            <div
              key={attribute.id}
              className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {attribute.display_name}
                  </span>
                  {attribute.is_required && (
                    <span className="px-2 py-1 text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-full">
                      Required
                    </span>
                  )}
                  <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded-full">
                    {attribute.attribute_type}
                  </span>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Key: {attribute.attribute_key}
                  {attribute.attribute_value && (
                    <span className="ml-2">• Default: {attribute.attribute_value}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleEdit(attribute)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(attribute)}
                  className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No attributes added yet. Add some attributes to customize your event.
          </div>
        )}
      </div>
    </div>
  )
} 