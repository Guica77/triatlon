'use client'

import { useActionState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { submitRaceDiscountProof, type RaceProofActionState } from '@/app/(app)/descuento-carrera/actions'

const initialState: RaceProofActionState = {}

export function RaceProofForm() {
  const [state, formAction, pending] = useActionState(submitRaceDiscountProof, initialState)
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (!state.success) return
    formRef.current?.reset()
    router.refresh()
  }, [router, state.success])

  return <form ref={formRef} action={formAction} className="space-y-4">
    <label className="block text-sm font-medium text-text-primary">Competición
      <input required name="raceName" minLength={2} maxLength={120} autoComplete="off" placeholder="Ej.: Triatlón de Zarautz" className="mt-1.5 min-h-12 w-full rounded-xl border border-border-default bg-bg-app px-3 text-base text-text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/20" />
    </label>
    <label className="block text-sm font-medium text-text-primary">Fecha de la competición <span className="font-normal text-text-muted">(opcional)</span>
      <input name="raceDate" type="date" className="mt-1.5 min-h-12 w-full rounded-xl border border-border-default bg-bg-app px-3 text-base text-text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/20" />
    </label>
    <label className="block text-sm font-medium text-text-primary">Justificante de inscripción
      <input required name="proof" type="file" accept="image/jpeg,image/png,application/pdf" className="mt-1.5 block min-h-12 w-full rounded-xl border border-border-default bg-bg-app p-2 text-sm text-text-secondary file:mr-3 file:rounded-lg file:border-0 file:bg-accent file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white" />
      <span className="mt-1 block text-xs text-text-muted">JPG, PNG o PDF · máximo 4 MB. Puedes ocultar datos que no sean necesarios para verificar la inscripción.</span>
    </label>
    {state.error ? <p role="alert" className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">{state.error}</p> : null}
    {state.success ? <p role="status" className="rounded-xl bg-emerald-500/10 px-3 py-2 text-sm text-emerald-800 dark:text-emerald-300">Comprobante recibido. Revisaremos la inscripción y te avisaremos aquí del resultado.</p> : null}
    <button type="submit" disabled={pending} className="min-h-12 w-full rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white transition-opacity disabled:cursor-wait disabled:opacity-60">
      {pending ? 'Enviando comprobante…' : 'Enviar para revisión'}
    </button>
  </form>
}
