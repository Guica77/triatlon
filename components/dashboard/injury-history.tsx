'use client'

import * as React from 'react'
import { AlertTriangle, Plus, X, Save } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface InjuryHistoryProps {
  injuries: string[]
  onSave: (injuries: string[]) => Promise<{ success?: boolean; error?: string }>
}

export function InjuryHistory({ injuries: initialInjuries, onSave }: InjuryHistoryProps) {
  const [injuries, setInjuries] = React.useState<string[]>(initialInjuries || [])
  const [newInjury, setNewInjury] = React.useState('')
  const [isEditing, setIsEditing] = React.useState(false)
  const [saving, setSaving] = React.useState(false)

  const addInjury = () => {
    if (!newInjury.trim()) return
    setInjuries([...injuries, newInjury.trim()])
    setNewInjury('')
  }

  const removeInjury = (index: number) => {
    setInjuries(injuries.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    setSaving(true)
    await onSave(injuries)
    setSaving(false)
    setIsEditing(false)
  }

  return (
    <div className="bg-surface-card border border-border-subtle rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary">Historial de Lesiones</h3>
            <p className="text-[10px] text-text-secondary font-medium">{injuries.length} registradas</p>
          </div>
        </div>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="text-[10px] font-bold text-text-secondary hover:text-text-primary transition-colors uppercase tracking-wider"
        >
          {isEditing ? 'Cancelar' : 'Editar'}
        </button>
      </div>

      {injuries.length === 0 && !isEditing ? (
        <div className="text-center py-4">
          <p className="text-xs text-text-secondary font-medium">Sin lesiones registradas</p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {injuries.map((injury, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 p-2.5 rounded-lg bg-surface-hover/50 border border-border-subtle/50"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                <span className="text-xs text-text-primary font-medium flex-1">{injury}</span>
                {isEditing && (
                  <button onClick={() => removeInjury(i)} className="text-text-muted hover:text-danger transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {isEditing && (
            <div className="flex gap-2 mt-3">
              <input
                type="text"
                value={newInjury}
                onChange={e => setNewInjury(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addInjury()}
                placeholder="Nueva lesión (ej: 'Lumbalgia Diciembre 2024')"
                className="flex-1 bg-surface-hover/50 border border-border-subtle/50 rounded-lg px-3 py-2 text-xs text-text-primary placeholder:text-text-muted outline-none focus:border-danger/50 transition-all"
              />
              <button
                onClick={addInjury}
                className="p-2 rounded-lg bg-surface-hover border border-border-subtle text-text-muted hover:text-text-primary hover:bg-border-default transition-all"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          )}

          {isEditing && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full mt-2 py-2 rounded-lg text-xs font-bold text-white bg-red-500/20 hover:bg-red-500/30 border border-red-500/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}