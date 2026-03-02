'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: string
  message: string
  type: ToastType
  duration?: number
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

const toastStyles: Record<ToastType, { bg: string; border: string; icon: typeof Info; iconColor: string }> = {
  success: {
    bg: 'bg-gradient-to-r from-green-600 to-green-500',
    border: 'border-green-400/30',
    icon: CheckCircle,
    iconColor: 'text-green-100'
  },
  error: {
    bg: 'bg-gradient-to-r from-red-600 to-red-500',
    border: 'border-red-400/30',
    icon: AlertCircle,
    iconColor: 'text-red-100'
  },
  warning: {
    bg: 'bg-gradient-to-r from-orange-500 to-orange-400',
    border: 'border-orange-400/30',
    icon: AlertTriangle,
    iconColor: 'text-orange-100'
  },
  info: {
    bg: 'bg-gradient-to-r from-blue-600 to-blue-500',
    border: 'border-blue-400/30',
    icon: Info,
    iconColor: 'text-blue-100'
  },
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, type: ToastType = 'info', duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 11)
    setToasts((prev) => [...prev, { id, message, type, duration }])
    
    // Auto-remove after specified duration
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, duration)
  }, [])

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full px-4 sm:px-0">
        {toasts.map((toast, index) => {
          const style = toastStyles[toast.type]
          const Icon = style.icon
          
          return (
            <div
              key={toast.id}
              className={`${style.bg} ${style.border} border backdrop-blur-sm flex items-center gap-3 px-4 py-3 rounded-lg shadow-2xl animate-slide-in`}
              style={{ animationDelay: `${index * 50}ms` }}
              role="alert"
            >
              <Icon size={18} className={style.iconColor} />
              <span className="text-white text-sm font-medium flex-1 leading-snug">{toast.message}</span>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-white/70 hover:text-white transition-colors p-0.5 rounded hover:bg-white/10"
                aria-label="Dismiss"
              >
                <X size={16} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
