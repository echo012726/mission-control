'use client'

import { useState, useEffect, useCallback } from 'react'
import { Users, Phone, MessageSquare, Video, MapPin, Clock, AlertCircle, CheckCircle, Plus, X, Calendar } from 'lucide-react'

interface Person {
  id: string
  name: string
  relationship: string
  lastSeen: string | null
  targetFrequencyDays: number
  notes: string
  daysSince: number | null
  needsContact: boolean
  status: 'good' | 'due' | 'overdue'
}

interface LogEntry {
  id: string
  personId: string
  timestamp: string
  method: string
  notes?: string
}

type ContactMethod = 'call' | 'text' | 'in-person' | 'video' | 'other'

const METHOD_ICONS: Record<ContactMethod, React.ReactNode> = {
  call: <Phone size={14} />,
  text: <MessageSquare size={14} />,
  'in-person': <MapPin size={14} />,
  video: <Video size={14} />,
  other: <Calendar size={14} />
}

const METHOD_LABELS: Record<ContactMethod, string> = {
  call: 'Call',
  text: 'Text',
  'in-person': 'In Person',
  video: 'Video Chat',
  other: 'Other'
}

function StatusBadge({ status, daysSince, targetDays }: { status: string; daysSince: number | null; targetDays: number }) {
  if (status === 'overdue') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
        <AlertCircle size={12} />
        {daysSince === null ? 'Never' : `${daysSince}d overdue`}
      </span>
    )
  }
  if (status === 'due') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
        <Clock size={12} />
        Due now
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
      <CheckCircle size={12} />
      Good
    </span>
  )
}

export default function FamilyTrackerWidget() {
  const [people, setPeople] = useState<Person[]>([])
  const [log, setLog] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [loggingContact, setLoggingContact] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newPerson, setNewPerson] = useState({ name: '', relationship: '', targetFrequencyDays: 7, notes: '' })

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/...?token=marcus2026&&family-tracker', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setPeople(data.people)
        setLog(data.log)
      }
    } catch (e) {
      console.error('Failed to fetch family tracker data', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleLogContact = async (personId: string, method: ContactMethod) => {
    setLoggingContact(personId)
    try {
      const res = await fetch('/api/...?token=marcus2026&&family-tracker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personId, method }),
        credentials: 'include'
      })
      if (res.ok) {
        fetchData()
      }
    } catch (e) {
      console.error('Failed to log contact', e)
    } finally {
      setLoggingContact(null)
    }
  }

  const handleAddPerson = async () => {
    if (!newPerson.name || !newPerson.relationship) return
    
    try {
      const res = await fetch('/api/...?token=marcus2026&&family-tracker', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPerson),
        credentials: 'include'
      })
      if (res.ok) {
        setNewPerson({ name: '', relationship: '', targetFrequencyDays: 7, notes: '' })
        setShowAddForm(false)
        fetchData()
      }
    } catch (e) {
      console.error('Failed to add person', e)
    }
  }

  const overdueCount = people.filter(p => p.status === 'overdue').length
  const dueCount = people.filter(p => p.status === 'due').length

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-20 bg-slate-200 rounded-lg"></div>
        <div className="h-20 bg-slate-200 rounded-lg"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users size={18} className="text-blue-500" />
          <span className="font-semibold text-slate-700">Family & Friends</span>
        </div>
        <div className="flex items-center gap-2">
          {overdueCount > 0 && (
            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium">
              {overdueCount} overdue
            </span>
          )}
          {dueCount > 0 && (
            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full font-medium">
              {dueCount} due
            </span>
          )}
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
            title="Add person to track"
          >
            {showAddForm ? <X size={16} /> : <Plus size={16} />}
          </button>
        </div>
      </div>

      {/* Add Person Form */}
      {showAddForm && (
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
          <input
            type="text"
            placeholder="Name"
            value={newPerson.name}
            onChange={(e) => setNewPerson({ ...newPerson, name: e.target.value })}
            className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="Relationship (e.g., Mother, Friend)"
            value={newPerson.relationship}
            onChange={(e) => setNewPerson({ ...newPerson, relationship: e.target.value })}
            className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Days between contact"
              value={newPerson.targetFrequencyDays}
              onChange={(e) => setNewPerson({ ...newPerson, targetFrequencyDays: parseInt(e.target.value) || 7 })}
              className="flex-1 px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleAddPerson}
              className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
            >
              Add
            </button>
          </div>
        </div>
      )}

      {/* People List */}
      <div className="space-y-2">
        {people.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-4">No one to track yet. Add someone!</p>
        ) : (
          people.map((person) => (
            <div
              key={person.id}
              className={`p-3 rounded-lg border transition-all ${
                person.status === 'overdue' 
                  ? 'bg-red-50 border-red-200' 
                  : person.status === 'due'
                  ? 'bg-yellow-50 border-yellow-200'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-medium text-slate-800">{person.name}</h4>
                  <p className="text-xs text-slate-500">{person.relationship}</p>
                </div>
                <StatusBadge 
                  status={person.status} 
                  daysSince={person.daysSince} 
                  targetDays={person.targetFrequencyDays} 
                />
              </div>
              
              {person.lastSeen && (
                <p className="text-xs text-slate-500 mb-2">
                  Last contact: {new Date(person.lastSeen).toLocaleDateString()}
                </p>
              )}
              
              {person.notes && (
                <p className="text-xs text-slate-600 mb-2 italic">{person.notes}</p>
              )}

              {/* Quick Log Buttons */}
              <div className="flex gap-1 mt-2">
                {(['call', 'text', 'video', 'in-person'] as ContactMethod[]).map((method) => (
                  <button
                    key={method}
                    onClick={() => handleLogContact(person.id, method)}
                    disabled={loggingContact === person.id}
                    className={`flex items-center gap-1 px-2 py-1 text-xs rounded-lg transition-colors ${
                      person.status === 'overdue'
                        ? 'bg-red-100 hover:bg-red-200 text-red-700'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    } disabled:opacity-50`}
                    title={`Log ${METHOD_LABELS[method]}`}
                  >
                    {METHOD_ICONS[method]}
                    <span className="hidden sm:inline">{METHOD_LABELS[method]}</span>
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Recent Activity Log */}
      {log.length > 0 && (
        <div className="pt-3 border-t border-slate-200">
          <h5 className="text-xs font-semibold text-slate-500 uppercase mb-2">Recent Activity</h5>
          <div className="space-y-1 max-h-24 overflow-y-auto">
            {log.slice(0, 5).map((entry) => {
              const person = people.find(p => p.id === entry.personId)
              return (
                <div key={entry.id} className="flex items-center gap-2 text-xs text-slate-600">
                  <span className="text-slate-400">
                    {METHOD_ICONS[entry.method as ContactMethod] || <Calendar size={14} />}
                  </span>
                  <span>{person?.name || entry.personId}</span>
                  <span className="text-slate-400">
                    {new Date(entry.timestamp).toLocaleDateString()}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
