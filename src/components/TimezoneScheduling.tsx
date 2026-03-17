'use client'
import { useState } from 'react'
import { Globe, Clock, Sunrise, Sunset, Moon } from 'lucide-react'

const TIMEZONES = [
  { id: 'America/Los_Angeles', name: 'Pacific Time', offset: '-8', icon: '🌙' },
  { id: 'America/Denver', name: 'Mountain Time', offset: '-7', icon: '🌅' },
  { id: 'America/Chicago', name: 'Central Time', offset: '-6', icon: '🌤️' },
  { id: 'America/New_York', name: 'Eastern Time', offset: '-5', icon: '☀️' },
  { id: 'Europe/London', name: 'London', offset: '+0', icon: '🇬🇧' },
  { id: 'Europe/Paris', name: 'Paris', offset: '+1', icon: '🇫🇷' },
  { id: 'Asia/Tokyo', name: 'Tokyo', offset: '+9', icon: '🇯🇵' },
  { id: 'Australia/Sydney', name: 'Sydney', offset: '+11', icon: '🇦🇺' },
]

export default function TimezoneScheduling() {
  const [selected, setSelected] = useState('America/Los_Angeles')
  const [showAll, setShowAll] = useState(false)

  const tz = TIMEZONES.find(t => t.id === selected)
  const now = new Date()
  const localTime = now.toLocaleTimeString('en-US', { timeZone: selected, hour: '2-digit', minute: '2-digit' })

  const displayTz = showAll ? TIMEZONES : TIMEZONES.slice(0, 4)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
          <Globe className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <h3 className="font-medium">Timezone Scheduling</h3>
          <p className="text-sm text-gray-500">Schedule for different timezones</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Your Current Time</p>
          <p className="text-2xl font-bold font-mono flex items-center gap-2">
            <Clock className="w-5 h-5" /> {localTime}
          </p>
          <p className="text-sm text-gray-500 mt-1">{tz?.name} (UTC{tz?.offset})</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {displayTz.map(t => (
            <button
              key={t.id}
              onClick={() => setSelected(t.id)}
              className={`p-2 rounded-lg text-left text-sm transition-all ${
                selected === t.id 
                  ? 'bg-blue-600 text-white ring-2 ring-blue-300' 
                  : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              <span className="text-lg">{t.icon}</span>
              <span className="ml-2 font-medium">{t.name}</span>
            </button>
          ))}
        </div>

        {!showAll && (
          <button onClick={() => setShowAll(true)} className="text-sm text-blue-600 hover:underline">
            Show more timezones...
          </button>
        )}
      </div>
    </div>
  )
}
