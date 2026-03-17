'use client'

import { useState, useEffect } from 'react'
import { Download, X } from 'lucide-react'

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Check if already dismissed
    const wasDismissed = localStorage.getItem('pwa-install-dismissed')
    if (wasDismissed) {
      setDismissed(true)
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      // Show prompt after a short delay to not interrupt initial load
      setTimeout(() => setShowPrompt(true), 3000)
    }

    window.addEventListener('beforeinstallprompt', handler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    
    const promptEvent = deferredPrompt as any
    promptEvent.prompt()
    
    const { outcome } = await promptEvent.userChoice
    
    if (outcome === 'accepted') {
      setShowPrompt(false)
    }
    
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    setDismissed(true)
    localStorage.setItem('pwa-install-dismissed', 'true')
  }

  if (dismissed || !showPrompt || !deferredPrompt) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-slate-800 dark:bg-slate-900 text-white rounded-lg shadow-xl p-4 max-w-sm border border-slate-700">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1 hover:bg-slate-700 rounded"
      >
        <X className="w-4 h-4" />
      </button>
      
      <div className="flex items-start gap-3">
        <div className="p-2 bg-indigo-600 rounded-lg">
          <Download className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-semibold text-sm">Install Mission Control</h3>
          <p className="text-xs text-slate-300 mt-1">
            Add to your home screen for quick access and offline support
          </p>
          <button
            onClick={handleInstall}
            className="mt-3 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors"
          >
            Install App
          </button>
        </div>
      </div>
    </div>
  )
}
