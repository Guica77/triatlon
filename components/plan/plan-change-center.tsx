'use client'

import { useMemo, useState, useTransition } from 'react'
import { CalendarClock, CheckCircle2, Sparkles, TriangleAlert, X } from 'lucide-react'
import { confirmOwnPlanChange, previewOwnWorkoutMove, submitOwnPlanRequest, undoOwnPlanChange } from '@/app/(app)/plan/actions'

type Slot = 'morning' | 'evening' | 'flexible'
type Workout = { id: string; scheduled_date: string; scheduled_slot?: Slot | null; status?: string; adjustment_reason?: string | null; training_sessions?: { description?: string; sport_type?: string } | null }
type Change = { explanation: string; improvement: string; watchOut: string; eventId?: string }
type Proposal = {
  proposalId: string
  decision: string
  proposedIntent: { workoutId: string; targetDate: string; targetSlot: Slot }
  presentation: { title: string; summary: string; improvement: string; watchOut: string; primaryAction: string | null }
}

export function PlanChangeCenter({ workouts, readOnly }: { workouts: Workout[]; readOnly: boolean }) {
  const [items, setItems] = useState(workouts)
  const [draftDates, setDraftDates] = useState<Record<string, string>>({})
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [change, setChange] = useState<Change | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const upcoming = useMemo(() => items.filter(item => item.status !== 'completed').slice(0, 4), [items])

  function preview(workout: Workout, date: string) {
    if (date === workout.scheduled_date) return
    setDraftDates(current => ({ ...current, [workout.id]: date }))
    setError(null)
    startTransition(async () => {
      const result = await previewOwnWorkoutMove(workout.id, date, workout.scheduled_slot || 'flexible', crypto.randomUUID())
      if ('error' in result) {
        setDraftDates(current => ({ ...current, [workout.id]: workout.scheduled_date }))
        setError(result.error)
      } else {
        setProposal(result as Proposal)
      }
    })
  }

  function closeProposal() {
    setProposal(null)
    setDraftDates({})
  }

  function applyProposal() {
    if (!proposal?.presentation.primaryAction) return
    setError(null)
    startTransition(async () => {
      const result = proposal.decision === 'coach_review'
        ? await submitOwnPlanRequest(proposal.proposalId)
        : await confirmOwnPlanChange(proposal.proposalId)
      if (result.error) {
        setError(result.error)
        return
      }
      if (proposal.decision !== 'coach_review') {
        setItems(current => current.map(item => item.id === proposal.proposedIntent.workoutId
          ? { ...item, scheduled_date: proposal.proposedIntent.targetDate, scheduled_slot: proposal.proposedIntent.targetSlot }
          : item))
      }
      setChange({
        explanation: proposal.presentation.summary,
        improvement: proposal.presentation.improvement,
        watchOut: proposal.presentation.watchOut,
        eventId: proposal.decision === 'coach_review' ? undefined : eventIdFrom(result.result),
      })
      setProposal(null)
      setDraftDates({})
    })
  }

  function undo(changeToUndo: Change) {
    if (!changeToUndo.eventId) return
    setError(null)
    startTransition(async () => {
      const result = await undoOwnPlanChange(changeToUndo.eventId!)
      if (result.error) {
        setError(result.error)
        return
      }
      const workout = workoutFrom(result.result)
      if (workout) {
        setItems(current => current.map(item => item.id === workout.id
          ? { ...item, scheduled_date: workout.date, scheduled_slot: workout.slot }
          : item))
      }
      setChange(null)
    })
  }

  return <section id="cambios-del-plan" className="mb-6 scroll-mt-6 overflow-hidden rounded-[22px] border border-border-default bg-surface-card shadow-sm">
    <div className="border-b border-border-default px-5 py-4"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-accent/12 text-accent"><CalendarClock className="h-5 w-5" /></span><div><h2 className="font-semibold text-text-primary">Cambios del plan</h2><p className="text-xs text-text-secondary">Mueve una sesión y entiende el impacto antes de continuar.</p></div></div></div>
    <div className="divide-y divide-border-default">
      {upcoming.map(workout => <div key={workout.id} className="flex items-center gap-3 px-5 py-3.5"><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-text-primary">{workout.training_sessions?.description || 'Entrenamiento'}</p><p className="mt-0.5 text-xs capitalize text-text-secondary">{workout.training_sessions?.sport_type || 'Sesión'}</p></div><input type="date" value={draftDates[workout.id] || workout.scheduled_date} disabled={pending} onChange={event => preview(workout, event.target.value)} aria-label={readOnly ? 'Proponer nueva fecha al entrenador' : 'Proponer nueva fecha'} className="min-h-11 rounded-xl border border-border-default bg-surface-elevated px-3 text-sm font-medium text-text-primary outline-none transition active:scale-[0.98] focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:opacity-60" /></div>)}
    </div>
    {readOnly && <p className="border-t border-border-default px-5 py-3 text-xs text-text-secondary">Tu entrenador tiene el control total. Aquí puedes preparar y enviarle una solicitud.</p>}
    {error && <p role="alert" className="border-t border-danger/20 bg-danger/5 px-5 py-3 text-sm font-medium text-danger">{error}</p>}
    {change && <div className="border-t border-border-default bg-surface-hover/50 p-5"><div className="grid gap-3 sm:grid-cols-3"><Insight icon={<CalendarClock />} title="Qué cambió" text={change.explanation} /><Insight icon={<CheckCircle2 />} title="Mejora" text={change.improvement} positive /><Insight icon={<TriangleAlert />} title="A vigilar" text={change.watchOut} /></div>{change.eventId && <button type="button" onClick={() => undo(change)} disabled={pending} className="mt-4 min-h-11 rounded-xl px-3 text-sm font-semibold text-accent transition active:scale-[0.98] disabled:opacity-60">Deshacer cambio</button>}</div>}
    {proposal && <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/35 p-3 backdrop-blur-[2px] sm:items-center" role="presentation" onMouseDown={event => { if (event.currentTarget === event.target && !pending) closeProposal() }}>
      <section role="dialog" aria-modal="true" aria-labelledby="plan-proposal-title" className="w-full max-w-lg rounded-[28px] border border-white/40 bg-white/95 p-5 text-slate-950 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-zinc-900/95 dark:text-white">
        <div className="mb-4 flex items-start justify-between gap-4"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200"><Sparkles className="h-6 w-6" /></span><button type="button" onClick={closeProposal} disabled={pending} className="grid h-11 w-11 place-items-center rounded-full bg-black/5 text-slate-600 transition active:scale-95 dark:bg-white/10 dark:text-zinc-300" aria-label="Cerrar"><X className="h-5 w-5" /></button></div>
        <h3 id="plan-proposal-title" className="text-2xl font-bold tracking-tight">{proposal.presentation.title}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-zinc-300">{proposal.presentation.summary}</p>
        <div className="mt-4 rounded-2xl bg-blue-50 p-4 dark:bg-blue-400/10"><p className="text-xs font-bold uppercase tracking-wide text-blue-700 dark:text-blue-300">Mejora prevista</p><p className="mt-1 text-sm leading-6">{proposal.presentation.improvement}</p></div>
        <div className="mt-3 rounded-2xl bg-slate-100 p-4 dark:bg-white/5"><p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-zinc-400">A vigilar</p><p className="mt-1 text-sm leading-6">{proposal.presentation.watchOut}</p></div>
        {proposal.presentation.primaryAction && <button type="button" onClick={applyProposal} disabled={pending} className="mt-5 min-h-12 w-full rounded-2xl bg-blue-600 px-5 font-semibold text-white shadow-sm transition active:scale-[0.98] disabled:opacity-60">{pending ? 'Procesando…' : proposal.presentation.primaryAction}</button>}
        <button type="button" onClick={closeProposal} disabled={pending} className="mt-1 min-h-11 w-full rounded-2xl font-semibold text-blue-600 transition active:scale-[0.98] dark:text-blue-400">{proposal.presentation.primaryAction ? 'Ahora no' : 'Elegir otra fecha'}</button>
      </section>
    </div>}
  </section>
}

function eventIdFrom(value: unknown) {
  return value && typeof value === 'object' && 'eventId' in value && typeof value.eventId === 'string' ? value.eventId : undefined
}

function workoutFrom(value: unknown): { id: string; date: string; slot: Slot } | null {
  if (!value || typeof value !== 'object' || !('workoutId' in value) || !('workout' in value)) return null
  const id = value.workoutId
  const workout = value.workout
  if (!workout || typeof id !== 'string' || typeof workout !== 'object' || !('date' in workout) || !('slot' in workout)) return null
  return typeof workout.date === 'string' && (workout.slot === 'morning' || workout.slot === 'evening' || workout.slot === 'flexible') ? { id, date: workout.date, slot: workout.slot } : null
}

function Insight({ icon, title, text, positive = false }: { icon: React.ReactNode; title: string; text: string; positive?: boolean }) {
  return <div className="rounded-2xl border border-border-default bg-surface-card p-4"><div className={`mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide ${positive ? 'text-emerald-700 dark:text-emerald-300' : 'text-text-secondary'}`}><span className="[&>svg]:h-4 [&>svg]:w-4">{icon}</span>{title}</div><p className="text-xs leading-relaxed text-text-primary">{text}</p></div>
}
