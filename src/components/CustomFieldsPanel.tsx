'use client'

import { useState, useEffect } from 'react'
import { Plus, X, GripVertical } from 'lucide-react'

export interface CustomField {
  key: string
  value: string
  type: 'text' | 'number' | 'date' | 'select' | 'checkbox'
  options?: string[]
}

interface CustomFieldsPanelProps {
  customFields?: string
  onChange?: (fields: CustomField[]) => void
  readOnly?: boolean
}

export default function CustomFieldsPanel({ 
  customFields, 
  onChange,
  readOnly = false 
}: CustomFieldsPanelProps) {
  const [fields, setFields] = useState<CustomField[]>([])
  const [isExpanded, setIsExpanded] = useState(true)

  useEffect(() => {
    if (customFields) {
      try {
        const parsed = JSON.parse(customFields)
        setFields(parsed)
      } catch {
        setFields([])
      }
    }
  }, [customFields])

  const handleAddField = () => {
    const newField: CustomField = {
      key: `field_${fields.length + 1}`,
      value: '',
      type: 'text'
    }
    const updated = [...fields, newField]
    setFields(updated)
    onChange?.(updated)
  }

  const handleRemoveField = (index: number) => {
    const updated = fields.filter((_, i) => i !== index)
    setFields(updated)
    onChange?.(updated)
  }

  const handleUpdateField = (index: number, updates: Partial<CustomField>) => {
    const updated = fields.map((f, i) => i === index ? { ...f, ...updates } : f)
    setFields(updated)
    onChange?.(updated)
  }

  if (!isExpanded && fields.length === 0) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
      >
        <Plus className="w-4 h-4" />
        Add Custom Fields
      </button>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Custom Fields
        </h4>
        <div className="flex gap-2">
          {!readOnly && (
            <button
              onClick={handleAddField}
              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
              title="Add field"
            >
              <Plus className="w-4 h-4 text-slate-500" />
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </div>

      {isExpanded && fields.length > 0 && (
        <div className="space-y-2">
          {fields.map((field, index) => (
            <div 
              key={index} 
              className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded"
            >
              {!readOnly && (
                <GripVertical className="w-4 h-4 text-slate-400 cursor-grab" />
              )}
              
              <input
                type="text"
                value={field.key}
                onChange={(e) => handleUpdateField(index, { key: e.target.value })}
                placeholder="Field name"
                readOnly={readOnly}
                className="w-24 text-sm px-2 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded"
              />
              
              <select
                value={field.type}
                onChange={(e) => handleUpdateField(index, { type: e.target.value as CustomField['type'] })}
                disabled={readOnly}
                className="text-sm px-2 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded"
              >
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="date">Date</option>
                <option value="select">Select</option>
                <option value="checkbox">Checkbox</option>
              </select>

              {field.type === 'text' && (
                <input
                  type="text"
                  value={field.value}
                  onChange={(e) => handleUpdateField(index, { value: e.target.value })}
                  placeholder="Value"
                  readOnly={readOnly}
                  className="flex-1 text-sm px-2 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded"
                />
              )}

              {field.type === 'number' && (
                <input
                  type="number"
                  value={field.value}
                  onChange={(e) => handleUpdateField(index, { value: e.target.value })}
                  placeholder="0"
                  readOnly={readOnly}
                  className="flex-1 text-sm px-2 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded"
                />
              )}

              {field.type === 'date' && (
                <input
                  type="date"
                  value={field.value}
                  onChange={(e) => handleUpdateField(index, { value: e.target.value })}
                  readOnly={readOnly}
                  className="flex-1 text-sm px-2 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded"
                />
              )}

              {field.type === 'select' && (
                <input
                  type="text"
                  value={field.value}
                  onChange={(e) => handleUpdateField(index, { value: e.target.value })}
                  placeholder="Comma-separated options"
                  readOnly={readOnly}
                  className="flex-1 text-sm px-2 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded"
                />
              )}

              {field.type === 'checkbox' && (
                <input
                  type="checkbox"
                  checked={field.value === 'true'}
                  onChange={(e) => handleUpdateField(index, { value: e.target.checked ? 'true' : 'false' })}
                  disabled={readOnly}
                  className="w-4 h-4"
                />
              )}

              {!readOnly && (
                <button
                  onClick={() => handleRemoveField(index)}
                  className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30"
                >
                  <X className="w-4 h-4 text-red-500" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {isExpanded && fields.length === 0 && !readOnly && (
        <p className="text-sm text-slate-500 dark:text-slate-400 italic">
          No custom fields yet. Click + to add one.
        </p>
      )}
    </div>
  )
}
