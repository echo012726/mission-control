'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useQuery } from 'convex/react'
import { api } from '../convex/_generated/api'
import SystemStatus from './components/SystemStatus'
import QuickActions from './components/QuickActions'
import WeatherWidget from './components/WeatherWidget'
import EmailWidget from './components/EmailWidget'
import CronWidget from './components/CronWidget'
import LinksWidget from './components/LinksWidget'

export default function Home() {
  const tasks = useQuery(api.tasks.getTasks) || []
  const content = useQuery(api.content.getContent) || []
  
  const [eventCount, setEventCount] = useState(0)

  useEffect(() => {
    const events = localStorage.getItem('mc_events')
    if (events) setEventCount(JSON.parse(events).length)
  }, [])

  const taskCount = tasks.length
  const contentCount = content.length

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Welcome to Mission Control</h2>
      <p className="text-muted-foreground mb-6">Your OpenClaw command center</p>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <Link href="/tasks" className="block">
              <div className="p-4 border rounded-lg hover:border-blue-500 transition-colors">
                <div className="text-3xl font-bold">{taskCount}</div>
                <div className="text-sm text-gray-500">Active Tasks</div>
              </div>
            </Link>
            <Link href="/content" className="block">
              <div className="p-4 border rounded-lg hover:border-blue-500 transition-colors">
                <div className="text-3xl font-bold">{contentCount}</div>
                <div className="text-sm text-gray-500">Content Items</div>
              </div>
            </Link>
            <Link href="/calendar" className="block">
              <div className="p-4 border rounded-lg hover:border-blue-500 transition-colors">
                <div className="text-3xl font-bold">{eventCount}</div>
                <div className="text-sm text-gray-500">Scheduled Events</div>
              </div>
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Link href="/tasks" className="block">
              <div className="p-4 border rounded-md hover:bg-gray-50 transition-colors">
                <div className="font-semibold">Tasks Board</div>
                <div className="text-sm text-gray-500">Track and manage tasks</div>
              </div>
            </Link>
            <Link href="/content" className="block">
              <div className="p-4 border rounded-md hover:bg-gray-50 transition-colors">
                <div className="font-semibold">Content Pipeline</div>
                <div className="text-sm text-gray-500">Content production stages</div>
              </div>
            </Link>
            <Link href="/calendar" className="block">
              <div className="p-4 border rounded-md hover:bg-gray-50 transition-colors">
                <div className="font-semibold">Calendar</div>
                <div className="text-sm text-gray-500">Events and schedules</div>
              </div>
            </Link>
            <Link href="/memory" className="block">
              <div className="p-4 border rounded-md hover:bg-gray-50 transition-colors">
                <div className="font-semibold">Memory Browser</div>
                <div className="text-sm text-gray-500">Search memories</div>
              </div>
            </Link>
            <Link href="/team" className="block">
              <div className="p-4 border rounded-md hover:bg-gray-50 transition-colors">
                <div className="font-semibold">Team</div>
                <div className="text-sm text-gray-500">Agent roster</div>
              </div>
            </Link>
            <Link href="/office" className="block">
              <div className="p-4 border rounded-md hover:bg-gray-50 transition-colors">
                <div className="font-semibold">Digital Office</div>
                <div className="text-sm text-gray-500">Visual agent status</div>
              </div>
            </Link>
          </div>
        </div>

        <div className="space-y-4">
          <WeatherWidget />
          <EmailWidget />
          <CronWidget />
          <LinksWidget />
          <QuickActions />
          <SystemStatus />
        </div>
      </div>
    </div>
  )
}
