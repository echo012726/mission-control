'use client'

import { useState, useRef } from 'react'

interface ImportResult {
  success: boolean
  summary: {
    imported: number
    skipped: number
    duplicates: number
    errors?: string[]
  }
}

export default function ImportPanel() {
  const [activeTab, setActiveTab] = useState<'asana' | 'trello'>('asana')
  const [file, setFile] = useState<File | null>(null)
  const [jsonData, setJsonData] = useState<any>(null)
  const [validating, setValidating] = useState(false)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [validation, setValidation] = useState<any>(null)
  const [options, setOptions] = useState({
    skipCompleted: activeTab === 'asana' ? false : true,
    defaultLane: 'planned'
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setResult(null)
    setValidation(null)

    try {
      const text = await selectedFile.text()
      const parsed = JSON.parse(text)
      setJsonData(parsed)
      
      // Auto-validate
      setValidating(true)
      const res = await fetch('/api/import/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: parsed, source: activeTab })
      })
      const validationResult = await res.json()
      setValidation(validationResult)
      setValidating(false)
    } catch (err) {
      setValidating(false)
      alert('Invalid JSON file')
    }
  }

  const handleImport = async () => {
    if (!jsonData) return

    setImporting(true)
    setResult(null)

    try {
      const endpoint = activeTab === 'asana' ? '/api/import/asana' : '/api/import/trello'
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          data: jsonData.data || jsonData, // Handle wrapped vs unwrapped
          options 
        })
      })
      const importResult = await res.json()
      setResult(importResult)
    } catch (err) {
      setResult({
        success: false,
        summary: { imported: 0, skipped: 0, duplicates: 0, errors: ['Import failed'] }
      })
    }

    setImporting(false)
  }

  const reset = () => {
    setFile(null)
    setJsonData(null)
    setResult(null)
    setValidation(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 text-gray-100">
      <h2 className="text-lg font-semibold mb-4">📥 Import from External Tools</h2>
      
      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => { setActiveTab('asana'); setOptions({ ...options, skipCompleted: false }); reset() }}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            activeTab === 'asana' 
              ? 'bg-purple-600 text-white' 
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          🟣 Asana
        </button>
        <button
          onClick={() => { setActiveTab('trello'); setOptions({ ...options, skipCompleted: true }); reset() }}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            activeTab === 'trello' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          🔵 Trello
        </button>
      </div>

      {/* Instructions */}
      <div className="bg-gray-800 rounded-lg p-3 mb-4 text-sm">
        <p className="text-gray-400 mb-2">
          {activeTab === 'asana' 
            ? 'Export your tasks from Asana (Data → Export → JSON) and upload here.'
            : 'Export your board from Trello (Settings → Backup/Export) and upload here.'}
        </p>
        <p className="text-gray-500 text-xs">
          Supported: {activeTab === 'asana' ? 'JSON export with task data' : 'JSON export with cards and lists'}
        </p>
      </div>

      {/* File Upload */}
      <div className="mb-4">
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full py-3 border-2 border-dashed border-gray-600 rounded-lg text-gray-400 hover:border-gray-500 hover:text-gray-300 transition"
        >
          {file ? `📄 ${file.name}` : '📁 Click to upload JSON file'}
        </button>
      </div>

      {/* Validation Status */}
      {validating && (
        <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-3 mb-4">
          <p className="text-blue-400">🔄 Validating file...</p>
        </div>
      )}

      {validation && (
        <div className={`border rounded-lg p-3 mb-4 ${validation.valid ? 'bg-green-900/30 border-green-700' : 'bg-red-900/30 border-red-700'}`}>
          <p className={validation.valid ? 'text-green-400' : 'text-red-400'}>
            {validation.valid ? '✅' : '❌'} {validation.details}
          </p>
          {validation.sampleItems && validation.sampleItems.length > 0 && (
            <div className="mt-2 text-sm text-gray-400">
              <p className="mb-1">Sample items:</p>
              <ul className="space-y-1">
                {validation.sampleItems.map((item: any, i: number) => (
                  <li key={i} className="truncate">• {item.name}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Options */}
      {jsonData && (
        <div className="bg-gray-800 rounded-lg p-3 mb-4">
          <p className="text-sm font-medium mb-2">Import Options</p>
          <label className="flex items-center gap-2 text-sm text-gray-300 mb-2">
            <input
              type="checkbox"
              checked={options.skipCompleted}
              onChange={(e) => setOptions({ ...options, skipCompleted: e.target.checked })}
              className="rounded"
            />
            Skip {activeTab === 'asana' ? 'completed tasks' : 'archived cards'}
          </label>
          <div className="text-sm">
            <label className="text-gray-400">Default lane:</label>
            <select
              value={options.defaultLane}
              onChange={(e) => setOptions({ ...options, defaultLane: e.target.value })}
              className="ml-2 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-200"
            >
              <option value="inbox">Inbox</option>
              <option value="planned">Planned</option>
              <option value="inProgress">In Progress</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>
        </div>
      )}

      {/* Import Button */}
      {jsonData && validation?.valid && (
        <button
          onClick={handleImport}
          disabled={importing}
          className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition"
        >
          {importing ? '⏳ Importing...' : '🚀 Import Tasks'}
        </button>
      )}

      {/* Result */}
      {result && (
        <div className={`mt-4 border rounded-lg p-3 ${result.success ? 'bg-green-900/30 border-green-700' : 'bg-red-900/30 border-red-700'}`}>
          <p className={`font-medium ${result.success ? 'text-green-400' : 'text-red-400'}`}>
            {result.success ? '✅ Import Complete!' : '❌ Import Failed'}
          </p>
          <div className="mt-2 text-sm text-gray-300">
            <p>📥 Imported: {result.summary.imported}</p>
            <p>⏭️ Skipped: {result.summary.skipped}</p>
            <p>🔄 Duplicates: {result.summary.duplicates}</p>
          </div>
          {result.summary.errors && result.summary.errors.length > 0 && (
            <details className="mt-2">
              <summary className="text-gray-400 cursor-pointer">Show errors</summary>
              <ul className="mt-1 text-xs text-red-400 space-y-1">
                {result.summary.errors.slice(0, 5).map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </div>
  )
}
