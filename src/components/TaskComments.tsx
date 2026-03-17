'use client'
import { useState } from 'react'
import { MessageCircle, Send, User } from 'lucide-react'

type Comment = {
  id: string
  text: string
  author: string
  createdAt: string
}

export default function TaskComments({ comments, onAdd }: { comments: Comment[]; onAdd: (text: string) => void }) {
  const [newComment, setNewComment] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (newComment.trim()) {
      onAdd(newComment.trim())
      setNewComment('')
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="font-medium flex items-center gap-2">
        <MessageCircle className="w-4 h-4" /> Comments ({comments.length})
      </h3>
      
      <div className="space-y-3 max-h-60 overflow-y-auto">
        {comments.map(c => (
          <div key={c.id} className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <User className="w-3 h-3" />
              <span className="text-sm font-medium">{c.author}</span>
              <span className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleDateString()}</span>
            </div>
            <p className="text-sm">{c.text}</p>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="flex-1 p-2 border rounded-lg text-sm"
        />
        <button type="submit" className="p-2 bg-blue-600 text-white rounded-lg">
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  )
}
