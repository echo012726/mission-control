import KanbanBoard from '@/components/KanbanBoard'
import AgentStatusPanel from '@/components/AgentStatusPanel'
import ActivityFeed from '@/components/ActivityFeed'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-6 py-4">
        <h1 className="text-2xl font-bold">Mission Control</h1>
      </header>
      <main className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <h2 className="text-lg font-semibold mb-4">Tasks</h2>
            <KanbanBoard />
          </div>
          <div className="space-y-6">
            <AgentStatusPanel />
            <ActivityFeed />
          </div>
        </div>
      </main>
    </div>
  )
}
