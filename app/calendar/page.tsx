'use client'
import { useState, useEffect } from 'react'

interface CalendarEvent {
  id: string
  title: string
  type: 'cron_job' | 'scheduled_task' | 'reminder' | 'meeting'
  scheduledAt: number
  status: 'scheduled' | 'completed' | 'cancelled'
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [newTitle, setNewTitle] = useState('')
  const [newType, setNewType] = useState<CalendarEvent['type']>('reminder')
  const [newDate, setNewDate] = useState('')
  const [newTime, setNewTime] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('mc_events')
    if (saved) {
      setEvents(JSON.parse(saved))
    } else {
      // Default events
      setEvents([
        { id: '1', title: 'Daily Usage Report', type: 'cron_job', scheduledAt: Date.now() + 86400000, status: 'scheduled' },
        { id: '2', title: 'Weekly Summary', type: 'cron_job', scheduledAt: Date.now() + 86400000 * 3, status: 'scheduled' },
        { id: '3', title: 'PolyBot Scan', type: 'cron_job', scheduledAt: Date.now() + 60000 * 5, status: 'scheduled' },
      ])
    }
  }, [])

  function save(newEvents: CalendarEvent[]) {
    setEvents(newEvents)
    localStorage.setItem('mc_events', JSON.stringify(newEvents))
  }

  function createEvent() {
    if (!newTitle.trim() || !newDate || !newTime) return
    const dateTime = new Date(`${newDate}T${newTime}`).getTime()
    if (isNaN(dateTime)) return
    
    const event: CalendarEvent = {
      id: Date.now().toString(),
      title: newTitle,
      type: newType,
      scheduledAt: dateTime,
      status: 'scheduled'
    }
    save([...events, event])
    setNewTitle('')
  }

  function deleteEvent(id: string) {
    save(events.filter(e => e.id !== id))
  }

  function toggleStatus(id: string) {
    save(events.map(e => {
      if (e.id === id) {
        return { ...e, status: e.status === 'completed' ? 'scheduled' : 'completed' }
      }
      return e
    }))
  }

  const sortedEvents = [...events].sort((a, b) => a.scheduledAt - b.scheduledAt)
  const upcomingEvents = sortedEvents.filter(e => e.status === 'scheduled' && e.scheduledAt > Date.now())
  const pastEvents = sortedEvents.filter(e => e.status === 'completed' || e.scheduledAt <= Date.now())

  const formatDate = (ts: number) => {
    const d = new Date(ts)
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'cron_job': return 'bg-purple-100 text-purple-700'
      case 'meeting': return 'bg-blue-100 text-blue-700'
      case 'reminder': return 'bg-yellow-100 text-yellow-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Calendar</h2>
      <p className="text-sm text-muted-foreground mb-4">Scheduled tasks, cron jobs, and reminders</p>

      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <div className="flex gap-2 flex-wrap">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Event title..."
            className="border rounded px-3 py-1 flex-1 min-w-[200px]"
          />
          <select
            value={newType}
            onChange={(e) => setNewType(e.target.value as CalendarEvent['type'])}
            className="border rounded px-3 py-1"
          >
            <option value="cron_job">Cron Job</option>
            <option value="scheduled_task">Scheduled Task</option>
            <option value="reminder">Reminder</option>
            <option value="meeting">Meeting</option>
          </select>
          <input
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            className="border rounded px-3 py-1"
          />
          <input
            type="time"
            value={newTime}
            onChange={(e) => setNewTime(e.target.value)}
            className="border rounded px-3 py-1"
          />
          <button onClick={createEvent} className="bg-blue-500 text-white px-4 py-1 rounded">Add</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold mb-3">Upcoming ({upcomingEvents.length})</h3>
          {upcomingEvents.length === 0 ? (
            <p className="text-gray-500 text-sm">No upcoming events</p>
          ) : (
            upcomingEvents.map(event => (
              <div key={event.id} className="flex items-center gap-2 p-3 bg-white border rounded mb-2">
                <span className={`text-xs px-2 py-0.5 rounded ${getTypeColor(event.type)}`}>
                  {event.type.replace('_', ' ')}
                </span>
                <div className="flex-1">
                  <div className="font-medium">{event.title}</div>
                  <div className="text-xs text-gray-500">{formatDate(event.scheduledAt)}</div>
                </div>
                <button onClick={() => toggleStatus(event.id)} className="text-green-500 text-xs">✓</button>
                <button onClick={() => deleteEvent(event.id)} className="text-red-500 text-xs">×</button>
              </div>
            ))
          )}
        </div>

        <div>
          <h3 className="font-semibold mb-3">Past / Completed ({pastEvents.length})</h3>
          {pastEvents.length === 0 ? (
            <p className="text-gray-500 text-sm">No past events</p>
          ) : (
            pastEvents.map(event => (
              <div key={event.id} className="flex items-center gap-2 p-3 bg-gray-50 border rounded mb-2 opacity-60">
                <span className={`text-xs px-2 py-0.5 rounded ${getTypeColor(event.type)}`}>
                  {event.type.replace('_', ' ')}
                </span>
                <div className="flex-1">
                  <div className="font-medium line-through">{event.title}</div>
                  <div className="text-xs text-gray-500">{formatDate(event.scheduledAt)}</div>
                </div>
                <button onClick={() => toggleStatus(event.id)} className="text-gray-400 text-xs">↺</button>
                <button onClick={() => deleteEvent(event.id)} className="text-red-400 text-xs">×</button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
