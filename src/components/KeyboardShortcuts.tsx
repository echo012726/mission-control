'use client'
import { X, Command, Plus, Search, Calendar, Check, Trash2 } from 'lucide-react'

const shortcuts = [
  { key: 'n', desc: 'Quick add task' },
  { key: '/', desc: 'Search tasks' },
  { key: 'c', desc: 'Toggle calendar' },
  { key: 'd', desc: 'Mark done' },
  { key: 'del', desc: 'Delete task' },
  { key: 'esc', desc: 'Close modal' },
  { key: '?', desc: 'Show shortcuts' },
  { key: 'm', desc: 'Toggle dark mode' },
]

export default function KeyboardShortcuts({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Command className="w-5 h-5" /> Keyboard Shortcuts
          </h2>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {shortcuts.map(s => (
            <div key={s.key} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm">{s.desc}</span>
              <kbd className="px-2 py-1 bg-white border rounded text-sm font-mono">{s.key}</kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
