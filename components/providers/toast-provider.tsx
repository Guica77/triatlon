'use client'

import * as React from 'react'

export type ToastVariant = 'success' | 'error' | 'info'

interface ToastItem {
  id: number
  message: string
  variant: ToastVariant
}

interface ToastContextType {
  showToast: (message: string, variant?: ToastVariant) => void
}

const ToastContext = React.createContext<ToastContextType>({ showToast: () => {} })

export function useToast() {
  return React.useContext(ToastContext)
}

let toastId = 0

const variantStyles: Record<ToastVariant, string> = {
  success: 'bg-success/12 text-success border-success/30',
  error: 'bg-danger/12 text-danger border-danger/30',
  info: 'bg-info/12 text-info border-info/30',
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([])

  const showToast = React.useCallback((message: string, variant: ToastVariant = 'success') => {
    const id = ++toastId
    setToasts(prev => [...prev, { id, message, variant }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 4000)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none sm:max-w-sm" role="status" aria-live="polite">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border shadow-elevated backdrop-blur-sm font-medium text-sm animate-slide-down ${variantStyles[toast.variant]} bg-surface-elevated/95`}
          >
            <span className="shrink-0">{toastIcons[toast.variant]}</span>
            <span className="leading-snug text-text-primary">{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

const toastIcons: Record<ToastVariant, React.ReactNode> = {
  success: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
}