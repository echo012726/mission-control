'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, FileText, X, Loader2, Folder, CheckCircle, Circle, GripVertical } from 'lucide-react'

interface SubTaskTemplate {
  id: string
  title: string
}

interface TaskTemplate {
  id: string
  name: string
  description: string | null
  category: string
  taskData: string
  createdAt: string
  updatedAt: string
}

interface TaskTemplatesPanelProps {
  isOpen: boolean
  onClose: () => void
  onUseTemplate: (taskData: any) => void
  token: string
}

const CATEGORIES = [
  { id: 'all', name: 'All', icon: '📋' },
  { id: 'general', name: 'General', icon: '📁' },
  { id: 'work', name: 'Work', icon: '💼' },
  { id: 'personal', name: 'Personal', icon: '🏠' },
  { id: 'projects', name: 'Projects', icon: '🚀' },
]

export default function TaskTemplatesPanel({ isOpen, onClose, onUseTemplate, token }: TaskTemplatesPanelProps) {
  const [templates, setTemplates] = useState<TaskTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [newTemplateName, setNewTemplateName] = useState('')
  const [newTemplateDesc, setNewTemplateDesc] = useState('')
  const [newTemplateCategory, setNewTemplateCategory] = useState('general')
  const [newTemplateData, setNewTemplateData] = useState('{"title": "", "description": "", "priority": "medium", "tags": []}')
  const [newTemplateSubtasks, setNewTemplateSubtasks] = useState<SubTaskTemplate[]>([])

  useEffect(() => {
    if (isOpen) {
      fetchTemplates()
    }
  }, [isOpen, selectedCategory])

  const fetchTemplates = async () => {
    setLoading(true)
    try {
      const categoryParam = selectedCategory !== 'all' ? `&category=${selectedCategory}` : ''
      const res = await fetch(`/api/task-templates?token=${token}${categoryParam}`)
      const data = await res.json()
      setTemplates(data)
    } catch (err) {
      console.error('Failed to fetch templates:', err)
    }
    setLoading(false)
  }

  const createTemplate = async () => {
    if (!newTemplateName) return
    setSaving(true)
    try {
      const taskDataWithSubtasks = getTaskDataWithSubtasks()
      const res = await fetch(`/api/task-templates?token=${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTemplateName,
          description: newTemplateDesc,
          category: newTemplateCategory,
          taskData: taskDataWithSubtasks,
        }),
      })
      if (res.ok) {
        const template = await res.json()
        setTemplates([template, ...templates])
        setShowCreateForm(false)
        setNewTemplateName('')
        setNewTemplateDesc('')
        setNewTemplateCategory('general')
        setNewTemplateData('{"title": "", "description": "", "priority": "medium", "tags": []}')
        setNewTemplateSubtasks([])
      }
    } catch (err) {
      console.error('Failed to create template:', err)
    }
    setSaving(false)
  }

  const deleteTemplate = async (id: string) => {
    if (!confirm('Delete this template?')) return
    try {
      await fetch(`/api/task-templates/${id}?token=${token}`, { method: 'DELETE' })
      setTemplates(templates.filter(t => t.id !== id))
    } catch (err) {
      console.error('Failed to delete template:', err)
    }
  }

  const useTemplate = (template: TaskTemplate) => {
    try {
      const data = JSON.parse(template.taskData)
      onUseTemplate(data)
      onClose()
    } catch (err) {
      console.error('Failed to parse template data:', err)
    }
  }

  const addSubtask = () => {
    setNewTemplateSubtasks([...newTemplateSubtasks, { id: `st_${Date.now()}`, title: '' }])
  }

  const removeSubtask = (id: string) => {
    setNewTemplateSubtasks(newTemplateSubtasks.filter(st => st.id !== id))
  }

  const updateSubtaskTitle = (id: string, title: string) => {
    setNewTemplateSubtasks(newTemplateSubtasks.map(st => st.id === id ? { ...st, title } : st))
  }

  const getTaskDataWithSubtasks = () => {
    try {
      const baseData = JSON.parse(newTemplateData)
      const validSubtasks = newTemplateSubtasks.filter(st => st.title.trim() !== '')
      return JSON.stringify({
        ...baseData,
        subtasks: validSubtasks
      })
    } catch {
      return newTemplateData
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Task Templates
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-1 p-2 border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No templates in this category</p>
              <p className="text-sm">Create your first template to get started</p>
            </div>
          ) : (
            <div className="space-y-2">
              {templates.map(template => {
                let taskData: any = {}
                try {
                  taskData = JSON.parse(template.taskData)
                } catch {}
                const categoryInfo = CATEGORIES.find(c => c.id === template.category) || CATEGORIES[1]
                return (
                  <div
                    key={template.id}
                    className="p-3 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 cursor-pointer" onClick={() => useTemplate(template)}>
                        <h3 className="font-medium">{template.name}</h3>
                        {template.description && (
                          <p className="text-sm text-slate-500 dark:text-slate-400">{template.description}</p>
                        )}
                        <div className="flex gap-2 mt-2 flex-wrap">
                          <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-600 text-slate-600 dark:text-slate-300">
                            {categoryInfo.icon} {categoryInfo.name}
                          </span>
                          {taskData.priority && (
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              taskData.priority === 'high' ? 'bg-red-100 text-red-700' :
                              taskData.priority === 'medium' ? 'bg-blue-100 text-blue-700' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              {taskData.priority}
                            </span>
                          )}
                          {taskData.tags?.length > 0 && (
                            <span className="text-xs text-slate-400">
                              {taskData.tags.length} tags
                            </span>
                          )}
                          {taskData.subtasks?.length > 0 && (
                            <span className="text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                              {taskData.subtasks.length} subtask{taskData.subtasks.length !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteTemplate(template.id) }}
                        className="p-1 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
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

        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          {showCreateForm ? (
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Template name"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700"
                autoFocus
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={newTemplateDesc}
                onChange={(e) => setNewTemplateDesc(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700"
              />
              <div className="flex gap-2">
                <select
                  value={newTemplateCategory}
                  onChange={(e) => setNewTemplateCategory(e.target.value)}
                  className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700"
                >
                  {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                  ))}
                </select>
              </div>
              <textarea
                placeholder='Task JSON e.g. {"title": "", "priority": "high"}'
                value={newTemplateData}
                onChange={(e) => setNewTemplateData(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 text-sm font-mono"
                rows={3}
              />
              
              {/* Subtasks Section */}
              <div className="border border-slate-200 dark:border-slate-600 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Subtasks</span>
                  <button
                    type="button"
                    onClick={addSubtask}
                    className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Subtask
                  </button>
                </div>
                {newTemplateSubtasks.length === 0 ? (
                  <p className="text-xs text-slate-400">No subtasks added. Click "Add Subtask" to include predefined subtasks.</p>
                ) : (
                  <div className="space-y-2">
                    {newTemplateSubtasks.map((subtask, idx) => (
                      <div key={subtask.id} className="flex items-center gap-2">
                        <GripVertical className="w-4 h-4 text-slate-400 cursor-move" />
                        <input
                          type="text"
                          placeholder={`Subtask ${idx + 1}`}
                          value={subtask.title}
                          onChange={(e) => updateSubtaskTitle(subtask.id, e.target.value)}
                          className="flex-1 px-2 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded dark:bg-slate-700"
                        />
                        <button
                          type="button"
                          onClick={() => removeSubtask(subtask.id)}
                          className="text-red-400 hover:text-red-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={createTemplate}
                  disabled={saving || !newTemplateName}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Template
                </button>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowCreateForm(true)}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Template
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
