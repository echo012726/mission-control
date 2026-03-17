'use client'
import { useState } from 'react'
import { Repeat, X } from 'lucide-react'

const RECURRENCE_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
]

export default function RecurringTaskModal({ isOpen, onClose, onSet }: { isOpen: boolean; onClose: () => void; onSet: (recurrence: string, count: number) => void }) {
  const [recurrence, setRecurrence] = useState('weekly')
  const [count, setCount] = useState(4)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2"><Repeat className="w-5 h-5" /> Make Recurring</h2>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Repeat</label>
            <div className="flex gap-2">
              {RECURRENCE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setRecurrence(opt.value)}
                  className={`px-3 py-2 rounded-lg text-sm ${recurrence === opt.value ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Times</label>
            <input
              type="number"
              min="1"
              max="52"
              value={count}
              onChange={e => setCount(parseInt(e.target.value) || 1)}
              className="w-full p-3 border rounded-lg"
            />
          </div>
          <button onClick={() => onSet(recurrence, count)} className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium">
            Create {count} Tasks
          </button>
        </div>
      </div>
    </div>
  )
}
