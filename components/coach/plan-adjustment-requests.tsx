'use client'

import { useState, useTransition } from 'react'
import { CalendarClock, Check, X } from 'lucide-react'
import { resolvePlanAdjustmentRequest } from '@/app/(app)/coach/dashboard/actions'

export type CoachPlanRequest = {
  id: string
  athleteName: string
  requestedDate: string
  createdAt: string
}

export function PlanAdjustmentRequests({ initialRequests }: { initialRequests: CoachPlanRequest[] }) {
  const [requests, setRequests] = useState(initialRequests)
  const [error, setError] = useState<string | null>(null)
  const [pendingId, startTransition] = useTransition()

  function resolve(request: CoachPlanRequest, accept: boolean) {
    setError(null)
    startTransition(async () => {
      const result = await resolvePlanAdjustmentRequest(request.id, accept)
      if (result.error) setError(result.error)
      else setRequests(current => current.filter(item => item.id !== request.id))
    })
  }

  if (requests.length === 0 && !error) return null
  return <section aria-labelledby="plan-requests-title" className="mb-6 overflow-hidden rounded-2xl border border-blue-500/20 bg-surface-card shadow-card">
    <div className="flex items-center justify-between gap-4 border-b border-border-default px-4 py-4 sm:px-5"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-300"><CalendarClock className="h-5 w-5" /></span><div><p className="text-sm font-semibold text-blue-600 dark:text-blue-300">Requiere tu decisión</p><h2 id="plan-requests-title" className="text-lg font-bold text-text-primary">Cambios solicitados en el plan</h2></div></div><span className="rounded-full bg-blue-500/10 px-3 py-1 text-sm font-bold tabular-nums text-blue-700 dark:text-blue-200">{requests.length}</span></div>
    <div className="divide-y divide-border-default">
      {requests.map(request => <div key={request.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:px-5"><div className="min-w-0 flex-1"><p className="font-semibold text-text-primary">{request.athleteName}</p><p className="mt-1 text-sm text-text-secondary">Propone mover la sesión al <span className="font-medium text-text-primary">{request.requestedDate}</span></p></div><div className="flex gap-2"><button type="button" onClick={() => resolve(request, false)} disabled={pendingId} className="min-h-11 rounded-xl border border-border-default px-4 text-sm font-semibold text-text-secondary transition active:scale-[0.98] disabled:opacity-60"><X className="mr-1.5 inline h-4 w-4" />Rechazar</button><button type="button" onClick={() => resolve(request, true)} disabled={pendingId} className="min-h-11 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition active:scale-[0.98] disabled:opacity-60"><Check className="mr-1.5 inline h-4 w-4" />Aprobar</button></div></div>)}
    </div>
    {error && <p role="alert" className="border-t border-danger/20 bg-danger/5 px-5 py-3 text-sm font-medium text-danger">{error}</p>}
  </section>
}
