'use client'

import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, Cloud, Edit3, Eye, Layers3, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { saveCoachWorkout, updateCoachWorkoutDetails, getWorkoutComments } from '@/app/(app)/coach/athlete/[id]/actions'
import { createClient } from '@/lib/supabase/client'
import { WorkoutComments, WorkoutComment } from './workout-comments'
import { VisualWorkoutBuilder } from './visual-workout-builder'
import { WorkoutPreview } from '@/components/workouts/workout-preview'
import { getWorkoutDuration, validateWorkoutBlocks, WorkoutBlock } from '@/lib/workout-structure'

export interface EditWorkoutData {
  id: string; session_id: string; sport_type: string; duration_min: number; title: string
  warmup: string; main: string; cooldown: string; scheduled_date?: string; status?: string | null
  telemetry?: any | null; structured_blocks?: WorkoutBlock[]
}

const steps = [{ label: 'Datos', icon: Edit3 }, { label: 'Bloques', icon: Layers3 }, { label: 'Revisar', icon: Eye }]

function legacyBlocks(workout: EditWorkoutData): WorkoutBlock[] {
  if (workout.structured_blocks?.length) return workout.structured_blocks
  const duration = Math.max(15, workout.duration_min || 60)
  return [
    { id: crypto.randomUUID(), type: 'warmup', targetType: 'time', duration: Math.max(5, Math.round(duration * .15)), zone: 2, notes: workout.warmup },
    { id: crypto.randomUUID(), type: 'active', targetType: 'time', duration: Math.max(5, Math.round(duration * .7)), zone: 3, notes: workout.main },
    { id: crypto.randomUUID(), type: 'cooldown', targetType: 'time', duration: Math.max(5, Math.round(duration * .15)), zone: 1, notes: workout.cooldown },
  ]
}

export function EditWorkoutModal({ athleteId, workout, isOpen, onClose }: { athleteId: string; workout: EditWorkoutData | null; isOpen: boolean; onClose: () => void }) {
  const router = useRouter()
  const [userId, setUserId] = React.useState<string | null>(null)
  const [step, setStep] = React.useState(0)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState(false)
  const [comments, setComments] = React.useState<WorkoutComment[]>([])
  const [formData, setFormData] = React.useState({ sportType: 'ciclismo', scheduledDate: new Date().toISOString().slice(0, 10), title: '', objective: '', blocks: [] as WorkoutBlock[] })

  React.useEffect(() => { createClient().auth.getUser().then(({ data }) => setUserId(data.user?.id || null)) }, [])
  React.useEffect(() => {
    if (!workout || !isOpen) return
    setStep(0); setError(null); setSuccess(false)
    setFormData({ sportType: workout.sport_type || 'ciclismo', scheduledDate: workout.scheduled_date || new Date().toISOString().slice(0, 10), title: workout.title || '', objective: workout.main || '', blocks: legacyBlocks(workout) })
    if (workout.id !== 'new') getWorkoutComments(workout.id).then((result) => setComments(result.data || []))
    else setComments([])
  }, [workout, isOpen])

  if (!workout) return null
  const durationMin = getWorkoutDuration(formData.blocks)
  const basicsError = !formData.title.trim() ? 'Escribe un título claro para el entrenamiento.' : !formData.scheduledDate ? 'Selecciona una fecha.' : null
  const blocksError = validateWorkoutBlocks(formData.blocks)

  function goNext() {
    const nextError = step === 0 ? basicsError : step === 1 ? blocksError : null
    if (nextError) return setError(nextError)
    setError(null); setStep((current) => Math.min(2, current + 1))
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const currentWorkout = workout
    if (!currentWorkout) return
    const validationError = basicsError || blocksError
    if (validationError) return setError(validationError)
    setLoading(true); setError(null)
    const payload = { sportType: formData.sportType, durationMin, title: formData.title.trim(), warmup: '', main: formData.objective.trim(), cooldown: '', structured_blocks: formData.blocks }
    try {
      const result = currentWorkout.id === 'new' ? await saveCoachWorkout(athleteId, { ...payload, scheduledDate: formData.scheduledDate }) : await updateCoachWorkoutDetails(athleteId, currentWorkout.id, currentWorkout.session_id, payload)
      if (result.error) return setError(result.error)
      setSuccess(true)
      window.setTimeout(() => { router.refresh(); onClose() }, 900)
    } catch { setError('No se pudo guardar. Tus cambios siguen en pantalla para que puedas reintentarlo.') }
    finally { setLoading(false) }
  }

  return <AnimatePresence>{isOpen && (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4">
      <motion.button type="button" aria-label="Cerrar editor" className="absolute inset-0 cursor-default bg-black/75 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !loading && onClose()} />
      <motion.div role="dialog" aria-modal="true" aria-labelledby="workout-editor-title" initial={{ opacity: 0, y: 24, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 18, scale: .98 }} className="relative z-10 flex h-[96dvh] w-full max-w-6xl flex-col overflow-hidden rounded-t-2xl border border-border-default bg-bg-app shadow-elevated sm:h-[92dvh] sm:rounded-2xl">
        <header className="flex items-center justify-between gap-4 border-b border-border-subtle bg-surface-elevated px-4 py-3 sm:px-6">
          <div className="min-w-0"><div className="flex items-center gap-2 text-xs font-semibold text-bike"><Cloud className="h-4 w-4" /> Cambios protegidos</div><h2 id="workout-editor-title" className="truncate text-lg font-bold">{workout.id === 'new' ? 'Crear entrenamiento' : 'Editar entrenamiento'}</h2></div>
          <button type="button" onClick={onClose} disabled={loading} className="flex h-11 w-11 items-center justify-center rounded-xl border border-border-default text-text-secondary hover:bg-surface-hover hover:text-text-primary" aria-label="Cerrar"><X className="h-5 w-5" /></button>
        </header>
        <nav aria-label="Progreso" className="border-b border-border-subtle bg-surface-card px-4 py-3 sm:px-6"><ol className="mx-auto flex max-w-xl items-center justify-between gap-2">{steps.map((item, index) => { const Icon = item.icon; return <li key={item.label} className="flex flex-1"><button type="button" onClick={() => index <= step && setStep(index)} className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold ${index === step ? 'bg-coral-500 text-bg-deep' : index < step ? 'bg-bike/10 text-bike' : 'text-text-muted'}`}><Icon className="h-4 w-4" />{item.label}</button></li> })}</ol></nav>
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto p-4 pb-28 sm:p-6 sm:pb-6">
            {error && <div role="alert" className="mx-auto mb-4 max-w-3xl rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm font-semibold text-danger">{error}</div>}
            {success ? <SuccessState /> : step === 0 ? <BasicsStep formData={formData} setFormData={setFormData} /> : step === 1 ? (
              <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,.75fr)]">
                <div className="space-y-4"><StepHeading title="Construye los bloques" subtitle="Ordena la sesión tal como debe ejecutarse." /><VisualWorkoutBuilder blocks={formData.blocks} sportType={formData.sportType} onChange={(blocks) => setFormData((data) => ({ ...data, blocks }))} /></div>
                <aside className="lg:sticky lg:top-0 lg:self-start"><p className="mb-3 text-sm font-semibold text-text-secondary">Vista del deportista</p><WorkoutPreview title={formData.title} sportType={formData.sportType} blocks={formData.blocks} durationMin={durationMin} compact /></aside>
              </div>
            ) : <div className="mx-auto max-w-3xl space-y-4"><StepHeading title="Revisa antes de publicar" subtitle="Esta es exactamente la lectura que tendrá el deportista." /><WorkoutPreview title={formData.title} sportType={formData.sportType} blocks={formData.blocks} durationMin={durationMin} description={formData.objective} /></div>}
            {step === 2 && workout.id !== 'new' && userId && <div className="mx-auto mt-8 max-w-3xl border-t border-border-subtle pt-6"><WorkoutComments workoutId={workout.id} athleteId={athleteId} currentUserId={userId} initialComments={comments} /></div>}
          </div>
          {!success && <footer className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-between gap-3 border-t border-border-default bg-surface-elevated/95 p-3 pb-[max(.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:static sm:px-6 sm:py-4">
            <button type="button" onClick={() => step === 0 ? onClose() : setStep((current) => current - 1)} className="flex min-h-12 items-center gap-2 rounded-xl px-4 text-sm font-semibold text-text-secondary hover:bg-surface-hover"><ArrowLeft className="h-4 w-4" />{step === 0 ? 'Cancelar' : 'Atrás'}</button>
            {step < 2 ? <button type="button" onClick={goNext} className="flex min-h-12 items-center gap-2 rounded-xl bg-coral-500 px-5 text-sm font-bold text-bg-deep hover:bg-coral-400">Continuar<ArrowRight className="h-4 w-4" /></button> : <button type="submit" disabled={loading} className="min-h-12 rounded-xl bg-coral-500 px-6 text-sm font-bold text-bg-deep hover:bg-coral-400 disabled:opacity-50">{loading ? 'Publicando…' : workout.id === 'new' ? 'Publicar entrenamiento' : 'Guardar y publicar'}</button>}
          </footer>}
        </form>
      </motion.div>
    </div>
  )}</AnimatePresence>
}

function StepHeading({ title, subtitle }: { title: string; subtitle: string }) { return <div><h3 className="text-2xl font-bold">{title}</h3><p className="mt-1 text-sm text-text-secondary">{subtitle}</p></div> }

function SuccessState() { return <div className="flex min-h-80 flex-col items-center justify-center gap-3 text-center"><div className="flex h-16 w-16 items-center justify-center rounded-full bg-bike/15 text-bike"><Check className="h-8 w-8" /></div><h3 className="text-xl font-bold">Entrenamiento publicado</h3><p className="text-sm text-text-secondary">El deportista ya puede consultar la sesión.</p></div> }

type FormState = { sportType: string; scheduledDate: string; title: string; objective: string; blocks: WorkoutBlock[] }
function BasicsStep({ formData, setFormData }: { formData: FormState; setFormData: React.Dispatch<React.SetStateAction<FormState>> }) {
  return <div className="mx-auto max-w-3xl space-y-6"><StepHeading title="Define la sesión" subtitle="Lo esencial primero. Después construirás cada bloque." />
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="space-y-2 text-sm font-semibold">Deporte<select value={formData.sportType} onChange={(e) => setFormData((data) => ({ ...data, sportType: e.target.value }))} className="min-h-12 w-full rounded-xl border border-border-default bg-surface-elevated px-4 text-base"><option value="ciclismo">Ciclismo</option><option value="carrera">Carrera</option><option value="natacion">Natación</option><option value="fuerza">Fuerza</option></select></label>
      <label className="space-y-2 text-sm font-semibold">Fecha<input type="date" value={formData.scheduledDate} onChange={(e) => setFormData((data) => ({ ...data, scheduledDate: e.target.value }))} className="min-h-12 w-full rounded-xl border border-border-default bg-surface-elevated px-4 text-base" /></label>
    </div>
    <label className="block space-y-2 text-sm font-semibold">Título<input autoFocus value={formData.title} onChange={(e) => setFormData((data) => ({ ...data, title: e.target.value }))} placeholder="Ej. Series de umbral en bicicleta" className="min-h-12 w-full rounded-xl border border-border-default bg-surface-elevated px-4 text-base" /></label>
    <label className="block space-y-2 text-sm font-semibold">Objetivo de la sesión<textarea value={formData.objective} onChange={(e) => setFormData((data) => ({ ...data, objective: e.target.value }))} placeholder="Qué debe conseguir el deportista y cómo debe sentirse" rows={4} className="w-full rounded-xl border border-border-default bg-surface-elevated p-4 text-base leading-relaxed" /></label>
  </div>
}
