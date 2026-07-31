'use client'

import * as React from 'react'
import { Share2, Globe, Download, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Badge } from '@/lib/badges'

interface ShareBadgeProps {
  badge: Badge
}

export function ShareBadge({ badge }: ShareBadgeProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  const shareText = `🏆 ¡Desbloqueé el logro "${badge.name}" en Triatlon Pro! ${badge.icon}\n\n${badge.description}\n\n#TriatlonPro #Triathlon #Training`

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Logro: ${badge.name}`,
          text: shareText,
          url: window.location.origin,
        })
      } catch { }
    } else {
      setIsOpen(true)
    }
  }

  const handleTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`
    window.open(url, '_blank', 'noopener,noreferrer')
    setIsOpen(false)
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText)
      alert('¡Copiado al portapapeles!')
      setIsOpen(false)
    } catch { }
  }

  return (
    <>
      <button
        onClick={handleShare}
        className="p-1.5 rounded-lg text-text-secondary hover:text-cyan-400 hover:bg-cyan-500/10 transition-all"
        title="Compartir logro"
      >
        <Share2 className="w-3.5 h-3.5" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface-elevated border border-border-subtle rounded-2xl p-6 max-w-sm w-full space-y-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-text-primary">Compartir Logro</h3>
                <button onClick={() => setIsOpen(false)} className="text-text-muted hover:text-text-primary">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="text-center py-4">
                <div className="text-4xl mb-2">{badge.icon}</div>
                <p className="text-sm font-bold text-text-primary">{badge.name}</p>
                <p className="text-xs text-text-muted mt-1">{badge.description}</p>
              </div>

              <div className="space-y-2">
                <button
                  onClick={handleTwitter}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-surface-hover border border-border-subtle hover:border-sky-500/30 transition-colors text-sm text-text-primary font-medium"
                >
                  <Globe className="w-4 h-4 text-sky-400" />
                  Compartir en X (Twitter)
                </button>
                <button
                  onClick={handleCopy}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-surface-hover border border-border-subtle hover:border-cyan-500/30 transition-colors text-sm text-text-primary font-medium"
                >
                  <Download className="w-4 h-4 text-cyan-400" />
                  Copiar texto
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}