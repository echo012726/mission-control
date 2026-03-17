'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Send, Bot, User, Lightbulb, Trash2, Sparkles } from 'lucide-react'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

interface AIChatPanelProps {
  isOpen: boolean
  onClose: () => void
  initialMessage?: string
}

const SUGGESTIONS = [
  { label: 'Organize my tasks', prompt: 'Help me organize my tasks by priority' },
  { label: 'Productivity tips', prompt: 'Give me some productivity tips' },
  { label: 'Find overdue tasks', prompt: 'Show me my overdue tasks' },
  { label: 'Suggest next actions', prompt: 'What should I work on next?' },
  { label: 'Summarize tasks', prompt: 'Summarize my current task list' },
]

const AI_RESPONSES: Record<string, string> = {
  'organize': "I'd be happy to help organize your tasks! Here are some suggestions:\n\n1. **Use the Priority Matrix** - Check out the Priority Matrix tab to categorize tasks by urgency and importance\n\n2. **Set clear priorities** - Mark your most important tasks as 'high' priority\n\n3. **Break down big tasks** - Create subtasks for larger projects\n\n4. **Use labels** - Organize tasks with labels like 'work', 'personal', 'urgent'\n\nWould you like me to help with any of these?",
  'productivity': "Here are some productivity tips:\n\n1. **Time Blocking** - Use the time blocking feature to schedule focused work sessions\n\n2. **Two-minute rule** - If a task takes less than 2 minutes, do it immediately\n\n3. **Pomodoro Technique** - Try timer: 25 for focused work sessions\n\n4. **Weekly Review** - Set aside time each week to review and plan\n\n5. **Limit WIP** - Focus on finishing current tasks before starting new ones\n\n6. **Morning Priorities** - Identify your top 3 tasks each morning",
  'overdue': "To find overdue tasks:\n\n1. Go to the **Tasks** tab\n2. Use the search: `due:overdue`\n3. Or check the **Priority Matrix** - overdue tasks appear in the 'Do First' quadrant\n\nTip: You can also view all tasks sorted by due date in the calendar view.",
  'next': "Here are some suggestions for your next actions:\n\n1. Check your **Priority Matrix** for high-urgency, high-importance tasks\n\n2. Look for tasks marked as 'high' priority in your inbox\n\n3. Review any overdue tasks and complete them first\n\n4. Check your **Reminders** for time-sensitive items\n\n5. Look at your **Dashboard** for an overview of what's pending",
  'summarize': "I'd be happy to summarize your tasks! Here's a quick overview:\n\n- Check the **Dashboard** tab for a widget-based summary\n- Use **Priority Matrix** to see tasks by urgency/importance\n- The **Metrics** tab shows completion trends\n\nTo get a specific summary, try asking about:\n- Tasks by status (inbox, in progress, done)\n- Tasks by priority (high, medium, low)\n- Tasks due this week",
}

function generateAIResponse(userMessage: string): string {
  const lower = userMessage.toLowerCase()
  
  if (lower.includes('organize') || lower.includes('organize')) {
    return AI_RESPONSES['organize']
  }
  if (lower.includes('productivity') || lower.includes('tip') || lower.includes('help')) {
    return AI_RESPONSES['productivity']
  }
  if (lower.includes('overdue') || lower.includes('late') || lower.includes('past due')) {
    return AI_RESPONSES['overdue']
  }
  if (lower.includes('next') || lower.includes('should') || lower.includes('what to do') || lower.includes('prioritize')) {
    return AI_RESPONSES['next']
  }
  if (lower.includes('summarize') || lower.includes('summary') || lower.includes('overview')) {
    return AI_RESPONSES['summarize']
  }
  
  // Default helpful response
  return `I'm here to help you stay organized and productive! Here are some things I can help with:\n\n• **Task organization** - Organize tasks by priority, status, or labels\n• **Productivity tips** - Time management and workflow suggestions\n• **Finding tasks** - Locate overdue or priority tasks\n• **Next actions** - Suggest what to work on next\n• **Summaries** - Overview of your task list\n\nTry clicking one of the suggestion buttons below, or ask me anything!`
}

export default function AIChatPanel({ isOpen, onClose, initialMessage = '' }: AIChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState(initialMessage)
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load chat history from localStorage
  useEffect(() => {
    if (isOpen) {
      const saved = localStorage.getItem('mission-control-chat-history')
      if (saved) {
        try {
          setMessages(JSON.parse(saved))
        } catch {
          setMessages([])
        }
      } else {
        // Welcome message for new chats
        setMessages([{
          id: 'welcome',
          role: 'assistant',
          content: "Hi! I'm your AI assistant for Mission Control. I can help you:\n\n• Organize and prioritize your tasks\n• Find productivity tips\n• Locate overdue tasks\n• Suggest next actions\n• Summarize your workload\n\nHow can I help you today?",
          timestamp: Date.now()
        }])
      }
      
      // Focus input after opening
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Save chat history
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('mission-control-chat-history', JSON.stringify(messages))
    }
  }, [messages])

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Handle initial message from Quick Add
  useEffect(() => {
    if (initialMessage && isOpen) {
      setInput(initialMessage)
    }
  }, [initialMessage, isOpen])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: Date.now()
    }
    
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    
    // Simulate AI response delay
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: generateAIResponse(userMessage.content),
        timestamp: Date.now()
      }
      setMessages(prev => [...prev, aiResponse])
      setIsLoading(false)
    }, 500)
  }

  const handleSuggestion = (prompt: string) => {
    setInput(prompt)
    setTimeout(() => {
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: prompt,
        timestamp: Date.now()
      }
      setMessages(prev => [...prev, userMessage])
      setIsLoading(true)
      
      setTimeout(() => {
        const aiResponse: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: generateAIResponse(prompt),
          timestamp: Date.now()
        }
        setMessages(prev => [...prev, aiResponse])
        setIsLoading(false)
      }, 500)
    }, 100)
  }

  const handleClearHistory = () => {
    if (confirm('Clear chat history?')) {
      setMessages([])
      localStorage.removeItem('mission-control-chat-history')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
      />
      
      {/* Slide-out Panel */}
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-gray-900 shadow-2xl z-50 flex flex-col animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold dark:text-white flex items-center gap-2">
                AI Assistant <Sparkles className="w-4 h-4 text-yellow-500" />
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Task management helper</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleClearHistory}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              title="Clear chat history"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div 
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-md'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md'
                }`}
              >
                <div className="flex items-start gap-2">
                  {msg.role === 'assistant' && (
                    <Bot className="w-4 h-4 mt-0.5 text-purple-500 flex-shrink-0" />
                  )}
                  {msg.role === 'user' && (
                    <User className="w-4 h-4 mt-0.5 text-blue-200 flex-shrink-0" />
                  )}
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-purple-500" />
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions (shown when no messages or only welcome) */}
        {messages.length <= 1 && !isLoading && (
          <div className="px-4 pb-2">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Try asking:</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.label}
                  onClick={() => handleSuggestion(s.prompt)}
                  className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-gray-700 dark:text-gray-300 transition-colors flex items-center gap-1"
                >
                  <Lightbulb className="w-3 h-3" />
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything..."
              className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-full bg-gray-50 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-full transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">Press Enter to send</p>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slide-in {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </>
  )
}
