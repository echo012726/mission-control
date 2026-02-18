'use client'
import { useState, useEffect } from 'react'

interface ContentItem {
  id: string
  title: string
  stage: 'idea' | 'scripting' | 'thumbnail' | 'filming' | 'editing' | 'published'
  notes: string
  project: string
  createdAt: number
}

const STAGES = ['idea', 'scripting', 'thumbnail', 'filming', 'editing', 'published'] as const

export default function ContentPage() {
  const [items, setItems] = useState<ContentItem[]>([])
  const [newTitle, setNewTitle] = useState('')
  const [newProject, setNewProject] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('mc_content')
    if (saved) setItems(JSON.parse(saved))
  }, [])

  function save(newItems: ContentItem[]) {
    setItems(newItems)
    localStorage.setItem('mc_content', JSON.stringify(newItems))
  }

  function createItem() {
    if (!newTitle.trim()) return
    const item: ContentItem = {
      id: Date.now().toString(),
      title: newTitle,
      stage: 'idea',
      notes: '',
      project: newProject || 'General',
      createdAt: Date.now()
    }
    save([...items, item])
    setNewTitle('')
    setNewProject('')
  }

  function moveItem(id: string, direction: 'left' | 'right') {
    const idx = items.findIndex(i => i.id === id)
    if (idx === -1) return
    const currentStage = items[idx].stage
    const stageIdx = STAGES.indexOf(currentStage)
    
    if (direction === 'left' && stageIdx > 0) {
      const newItems = [...items]
      newItems[idx] = { ...newItems[idx], stage: STAGES[stageIdx - 1] }
      save(newItems)
    } else if (direction === 'right' && stageIdx < STAGES.length - 1) {
      const newItems = [...items]
      newItems[idx] = { ...newItems[idx], stage: STAGES[stageIdx + 1] }
      save(newItems)
    }
  }

  function deleteItem(id: string) {
    save(items.filter(i => i.id !== id))
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Content Pipeline</h2>
      <p className="text-sm text-muted-foreground mb-4">Track content through production stages</p>

      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Content title..."
          className="border rounded px-3 py-1 flex-1"
          onKeyDown={(e) => e.key === 'Enter' && createItem()}
        />
        <input
          type="text"
          value={newProject}
          onChange={(e) => setNewProject(e.target.value)}
          placeholder="Project (e.g., AdSense Site 1)"
          className="border rounded px-3 py-1 w-48"
        />
        <button onClick={createItem} className="bg-blue-500 text-white px-4 py-1 rounded">Add</button>
      </div>

      <div className="grid grid-cols-6 gap-2">
        {STAGES.map(stage => (
          <div key={stage} className="border rounded-lg p-2 bg-gray-50 min-h-[200px]">
            <h3 className="font-semibold text-sm capitalize mb-2 text-center">{stage}</h3>
            {items.filter(i => i.stage === stage).map(item => (
              <div key={item.id} className="bg-white p-2 rounded shadow-sm mb-2 text-sm">
                <div className="font-medium">{item.title}</div>
                <div className="text-xs text-gray-500">{item.project}</div>
                <div className="flex gap-1 mt-1 justify-center">
                  <button onClick={() => moveItem(item.id, 'left')} className="text-xs text-gray-400 hover:text-gray-700">←</button>
                  <button onClick={() => moveItem(item.id, 'right')} className="text-xs text-gray-400 hover:text-gray-700">→</button>
                  <button onClick={() => deleteItem(item.id)} className="text-xs text-red-400 hover:text-red-600">×</button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
