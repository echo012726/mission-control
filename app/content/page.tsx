'use client'
import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'

interface ContentItem {
  _id: string
  title: string
  stage: 'idea' | 'scripting' | 'thumbnail' | 'filming' | 'editing' | 'published' | 'archived'
  notes: string
  project: string
  createdAt: number
}

const STAGES = ['idea', 'scripting', 'thumbnail', 'filming', 'editing', 'published'] as const

export default function ContentPage() {
  const items = useQuery(api.content.getContent) || []
  const createContent = useMutation(api.content.createContent)
  const updateContentStage = useMutation(api.content.updateContentStage)
  
  const [newTitle, setNewTitle] = useState('')
  const [newProject, setNewProject] = useState('')

  async function handleCreateItem() {
    if (!newTitle.trim()) return
    await createContent({
      title: newTitle,
      stage: 'idea',
      notes: '',
      project: newProject || 'General',
    })
    setNewTitle('')
    setNewProject('')
  }

  async function handleMoveItem(id: string, direction: 'left' | 'right') {
    const item = items.find((i: ContentItem) => i._id === id)
    if (!item) return
    const stageIdx = STAGES.indexOf(item.stage)
    
    if (direction === 'left' && stageIdx > 0) {
      await updateContentStage({ id, stage: STAGES[stageIdx - 1] })
    } else if (direction === 'right' && stageIdx < STAGES.length - 1) {
      await updateContentStage({ id, stage: STAGES[stageIdx + 1] })
    }
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
          onKeyDown={(e) => e.key === 'Enter' && handleCreateItem()}
        />
        <input
          type="text"
          value={newProject}
          onChange={(e) => setNewProject(e.target.value)}
          placeholder="Project (e.g., AdSense Site 1)"
          className="border rounded px-3 py-1 w-48"
        />
        <button onClick={handleCreateItem} className="bg-blue-500 text-white px-4 py-1 rounded">Add</button>
      </div>

      <div className="grid grid-cols-6 gap-2">
        {STAGES.map(stage => (
          <div key={stage} className="border rounded-lg p-2 bg-gray-50 min-h-[200px]">
            <h3 className="font-semibold text-sm capitalize mb-2 text-center">{stage}</h3>
            {items.filter((i: ContentItem) => i.stage === stage).map((item: ContentItem) => (
              <div key={item._id} className="bg-white p-2 rounded shadow-sm mb-2 text-sm">
                <div className="font-medium">{item.title}</div>
                <div className="text-xs text-gray-500">{item.project}</div>
                <div className="flex gap-1 mt-1 justify-center">
                  <button onClick={() => handleMoveItem(item._id, 'left')} className="text-xs text-gray-400 hover:text-gray-700">←</button>
                  <button onClick={() => handleMoveItem(item._id, 'right')} className="text-xs text-gray-400 hover:text-gray-700">→</button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
