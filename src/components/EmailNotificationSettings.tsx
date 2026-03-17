'use client'
import { Mail, Bell, BellOff } from 'lucide-react'

export default function EmailNotificationSettings({ 
  enabled, 
  onToggle,
  email 
}: { 
  enabled: boolean; 
  onToggle: () => void;
  email: string;
}) {
  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${enabled ? 'bg-green-100' : 'bg-gray-100'}`}>
          {enabled ? <Bell className="w-5 h-5 text-green-600" /> : <BellOff className="w-5 h-5 text-gray-400" />}
        </div>
        <div>
          <p className="font-medium">Email Notifications</p>
          <p className="text-sm text-gray-500">Send to {email}</p>
        </div>
      </div>
      <button
        onClick={onToggle}
        className={`px-4 py-2 rounded-lg text-sm ${enabled ? 'bg-green-600 text-white' : 'bg-gray-200'}`}
      >
        {enabled ? 'Enabled' : 'Disabled'}
      </button>
    </div>
  )
}
