import ImportPanel from '@/components/ImportPanel'

export default function ImportPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <a href="/" className="text-purple-400 hover:text-purple-300 text-sm">← Back to Board</a>
        </div>
        <ImportPanel />
      </div>
    </div>
  )
}
