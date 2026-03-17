'use client'
import { useState, useEffect } from 'react'
import { Bell, AlertCircle, Clock, X, Trash2, Eye, Calendar, Link, Mail, MessageSquare } from 'lucide-react'
interface Task { id: string; title: string; status: string; dueDate?: string | null; dueDateStr?: string | null; priority: string; tags?: string[]; isSnoozed?: boolean; snoozedUntil?: string | null; }
interface Notification { id: string; type: 'overdue' | 'due_soon' | 'snoozed' | 'integration' | 'reminder'; title: string; message: string; taskId?: string; timestamp: string; read: boolean; source?: 'gmail' | 'slack' | 'calendar' | 'system'; }
interface NotificationCenterProps { tasks: Task[]; onClose?: () => void; onNavigateToTask?: (taskId: string) => void; }
export function NotificationCenter({ tasks, onClose, onNavigateToTask }: NotificationCenterProps) {
const [notifications, setNotifications] = useState<Notification[]>([])
const [filter, setFilter] = useState<'all' | 'overdue' | 'due_soon' | 'snoozed'>('all')
useEffect(() => { generateNotifications() }, [tasks])

  const generateNotifications = () => {
    const now = new Date()
    const newNotifications: Notification[] = []
    tasks.forEach(task => {
      if (task.status === 'done') return
      if (task.isSnoozed && task.snoozedUntil) {
        const snoozedUntil = new Date(task.snoozedUntil)
        if (snoozedUntil <= now) {
          newNotifications.push({ id: `snoozed-${task.id}`, type: 'snoozed', title: 'Snooze Ended', message: task.title, taskId: task.id, timestamp: snoozedUntil.toISOString(), read: false })
        }
      }
      const hasDueDate = ((!task.isSnoozed || (task.snoozedUntil && new Date(task.snoozedUntil) <= now)) && (task.dueDate || task.dueDateStr))
      if (hasDueDate) {
        const dueDate = task.dueDate ? new Date(task.dueDate) : task.dueDateStr ? new Date(task.dueDateStr) : null
        if (dueDate) {
          const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60)
          if (hoursUntilDue < 0) {
            newNotifications.push({ id: `overdue-${task.id}`, type: 'overdue', title: 'Overdue', message: `${task.title} was due ${formatRelativeTime(dueDate)}`, taskId: task.id, timestamp: dueDate.toISOString(), read: false })
          } else if (hoursUntilDue <= 24) {
            newNotifications.push({ id: `due-soon-${task.id}`, type: 'due_soon', title: hoursUntilDue <= 1 ? 'Due Within 1 Hour' : 'Due Soon', message: `${task.title} is due ${formatRelativeTime(dueDate)}`, taskId: task.id, timestamp: dueDate.toISOString(), read: false })
          }
        }
      }
    })
    const saved = JSON.parse(localStorage.getItem('mc_notifications') || '[]')
    const allNotifs = [...newNotifications, ...saved.filter((n: Notification) => n.source && !newNotifications.find(g => g.id === n.id))]
    allNotifs.sort((a: Notification, b: Notification) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    setNotifications(allNotifs)
  }

  const formatRelativeTime = (date: Date): string => {
    const diffMs = date.getTime() - new Date().getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    if (diffMs < 0) return diffDays !== 0 ? `${Math.abs(diffDays)} day${Math.abs(diffDays) > 1 ? 's' : ''} ago` : `${Math.abs(diffHours)} hour${Math.abs(diffHours) > 1 ? 's' : ''} ago`
    return diffDays > 0 ? `in ${diffDays} day${diffDays > 1 ? 's' : ''}` : diffHours > 0 ? `in ${diffHours} hour${diffHours > 1 ? 's' : ''}` : 'soon'
  }

  const filteredNotifications = filter === 'all' ? notifications : notifications.filter(n => n.type === filter)
  const markAsRead = (id: string) => setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n))
  const markAllAsRead = () => setNotifications(notifications.map(n => ({ ...n, read: true })))
  const deleteNotification = (id: string) => setNotifications(notifications.filter(n => n.id !== id))
  const clearAll = () => { setNotifications([]); localStorage.setItem('mc_notifications', '[]') }
  const unreadCount = notifications.filter(n => !n.read).length
  const overdueCount = notifications.filter(n => n.type === 'overdue').length
  const dueSoonCount = notifications.filter(n => n.type === 'due_soon').length
  const snoozedCount = notifications.filter(n => n.type === 'snoozed').length
  const getIcon = (type: string) => {
    switch (type) {
      case 'overdue': return <AlertCircle className="w-5 h-5 text-red-500" />
      case 'due_soon': return <Clock className="w-5 h-5 text-yellow-500" />
      case 'snoozed': return <Bell className="w-5 h-5 text-purple-500" />
      case 'integration': return <Link className="w-5 h-5 text-blue-500" />
      default: return <Bell className="w-5 h-5 text-gray-500" />
    }
  }
  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Notification Center</h2>
          {unreadCount > 0 && <span className="px-2 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-full">{unreadCount} new</span>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={markAllAsRead} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">Mark all read</button>
          {onClose && <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"><X className="w-5 h-5" /></button>}
        </div>
      </div>
      <div className="flex gap-1 p-2 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        {[['all', 'All', notifications.length], ['overdue', 'Overdue', overdueCount], ['due_soon', 'Due Soon', dueSoonCount], ['snoozed', 'Snoozed', snoozedCount]].map(([f, label, count]) => (
          <button key={f} onClick={() => setFilter(f as any)} className={`px-3 py-1.5 text-sm rounded-lg whitespace-nowrap ${filter === f ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>{label} ({count})</button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto">
        {filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400"><Bell className="w-12 h-12 mb-2 opacity-50" /><p>No notifications</p></div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {filteredNotifications.map(n => (
              <div key={n.id} className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 ${!n.read ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{getIcon(n.type)}</div>
                  <div className="flex-1 min-w-0">
                    <span className={`text-xs font-medium ${n.type === 'overdue' ? 'text-red-600' : n.type === 'due_soon' ? 'text-yellow-600' : n.type === 'snoozed' ? 'text-purple-600' : 'text-gray-500'}`}>{n.title}</span>
                    <p className="text-sm text-gray-900 dark:text-white mt-0.5 truncate">{n.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{new Date(n.timestamp).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {n.taskId && onNavigateToTask && <button onClick={() => onNavigateToTask(n.taskId!)} className="p-1.5 text-gray-400 hover:text-indigo-600 rounded"><Eye className="w-4 h-4" /></button>}
                    <button onClick={() => deleteNotification(n.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded"><X className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {notifications.length > 0 && <div className="p-3 border-t border-gray-200 dark:border-gray-700"><button onClick={clearAll} className="w-full py-2 text-sm text-gray-600 hover:text-red-600 flex items-center justify-center gap-2"><Trash2 className="w-4 h-4" />Clear All</button></div>}
    </div>
  )
}
export default NotificationCenter
