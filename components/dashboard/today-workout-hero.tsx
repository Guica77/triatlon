'use client'

import * as React from 'react'
import { Clock, CheckCircle2, Circle, Waves, Bike, Footprints, Activity, Dumbbell, CloudSun, ChevronRight, Wind } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface TodayWorkoutHeroProps {
  workouts?: any[]
}

/* The hero session styled as a race timing slip: a discipline left-rail,
   big condensed numerals, and a flat status chip. No glows. */
const SPORT_CONFIG: Record<string, { icon: any; color: string; rail: string; label: string }> = {
  natacion: { icon: Waves, color: 'text-swim', rail: 'bg-swim', label: 'Natación' },
  ciclismo: { icon: Bike, color: 'text-bike', rail: 'bg-bike', label: 'Ciclismo' },
  carrera: { icon: Footprints, color: 'text-run', rail: 'bg-run', label: 'Carrera' },
  brick: { icon: Activity, color: 'text-warning', rail: 'bg-warning', label: 'Brick' },
  fuerza: { icon: Dumbbell, color: 'text-accent', rail: 'bg-accent', label: 'Fuerza' },
}

export function TodayWorkoutHero({ workouts = [] }: TodayWorkoutHeroProps) {
  const workout = workouts[0] ?? null
  const session = workout?.training_sessions
  const sport = session?.sport_type || workout?.sport_type || 'descanso'
  const cfg = SPORT_CONFIG[sport] || { icon: Activity, color: 'text-text-muted', rail: 'bg-border-default', label: sport }

  const durationMin = session?.duration_min || session?.duration_minutes || 0
  const isCompleted = workout?.status === 'completed'
  const Icon = cfg.icon
  const [weather, setWeather] = React.useState<{ temperature: number; humidity: number; wind: number } | null>(null)
  const [weatherLoading, setWeatherLoading] = React.useState(false)
  const outdoorSession = ['ciclismo', 'carrera', 'brick'].includes(sport)

  React.useEffect(() => {
    if (!outdoorSession) return
    let cancelled = false
    async function loadWeather(latitude = 40.4168, longitude = -3.7038) {
      setWeatherLoading(true)
      try {
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m&timezone=auto`)
        const data = await response.json()
        if (!cancelled && data.current) setWeather({ temperature: data.current.temperature_2m, humidity: data.current.relative_humidity_2m, wind: data.current.wind_speed_10m })
      } catch { /* The detailed workout screen keeps the retry control. */ }
      finally { if (!cancelled) setWeatherLoading(false) }
    }
    if (navigator.geolocation) navigator.geolocation.getCurrentPosition(position => loadWeather(position.coords.latitude, position.coords.longitude), () => loadWeather(), { timeout: 5000, maximumAge: 300000 })
    else loadWeather()
    return () => { cancelled = true }
  }, [outdoorSession, workout?.id])

  // Nothing scheduled today
  if (!workout && !session) {
    return (
      <div className="rounded-2xl border border-border-default bg-surface-card p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border-subtle bg-surface-hover">
            <Activity className="h-5 w-5 text-text-muted" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="font-display text-lg font-bold leading-none tracking-tight text-text-primary">Día de descanso</p>
            <p className="mt-1 text-sm leading-relaxed text-text-muted">No hay entrenamiento programado. Prioriza descanso, movilidad y recuperación.</p>
          </div>
        </div>
      </div>
    )
  }

  const statusLabel = isCompleted ? 'Entrenamiento completado' : 'Entrenamiento pendiente'

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border-default bg-surface-card">
      {/* Discipline left-rail */}
      <span className={cn('absolute inset-y-0 left-0 w-1', cfg.rail)} aria-hidden="true" />

      <div className="relative space-y-4 p-5 pl-5 sm:pl-6">
        {/* Top row: icon + label + status */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border-subtle bg-surface-hover">
              <Icon className={cn('h-5 w-5', cfg.color)} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className={cn('font-display text-xs font-semibold', cfg.color)}>
                Sesión de hoy · {cfg.label}
              </p>
              <h2 className="truncate font-display text-xl font-bold leading-tight tracking-tight text-text-primary">
                {session?.name || 'Entrenamiento'}
              </h2>
            </div>
          </div>

          <span
            className={cn(
              'flex min-h-8 shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-bold',
              isCompleted ? 'border-bike/30 bg-bike/10 text-bike' : 'border-warning/30 bg-warning/10 text-warning',
            )}
            aria-label={statusLabel}
          >
            {isCompleted ? <CheckCircle2 className="h-3 w-3" aria-hidden="true" /> : <Circle className="h-3 w-3" aria-hidden="true" />}
            <span className="hidden sm:inline">{isCompleted ? 'Completado' : 'Pendiente'}</span>
            <span className="sm:hidden">{isCompleted ? 'Hecho' : 'Pendiente'}</span>
          </span>
        </div>

        {/* Split readouts — big condensed numerals */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-border-subtle pt-4 sm:flex sm:items-end sm:gap-10">
          {durationMin > 0 && (
            <div>
              <p className={cn('font-display text-5xl font-black leading-none tracking-tight tabular-nums', cfg.color)}>{durationMin}</p>
              <p className="mt-1 text-xs font-medium text-text-muted">minutos</p>
            </div>
          )}
          {workout?.target_distance && (
            <div>
              <p className="font-display text-5xl font-black leading-none tracking-tight tabular-nums text-text-primary">{workout.target_distance}</p>
              <p className="mt-1 text-xs font-medium text-text-muted">kilómetros</p>
            </div>
          )}
          {workout?.actual_tss ? (
            <div>
              <p className="font-display text-5xl font-black leading-none tracking-tight tabular-nums text-text-primary">{workout.actual_tss}</p>
              <p className="mt-1 text-xs font-medium text-text-muted">TSS</p>
            </div>
          ) : workout?.target_tss ? (
            <div>
              <p className="font-display text-5xl font-black leading-none tracking-tight tabular-nums text-text-primary">{workout.target_tss}</p>
              <p className="mt-1 text-xs font-medium text-text-muted">TSS objetivo</p>
            </div>
          ) : null}
          {durationMin > 0 && (
            <div className="hidden items-center gap-1.5 text-xs text-text-muted sm:ml-auto sm:flex">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="font-mono">{durationMin}:00</span>
            </div>
          )}
        </div>

        {/* Description */}
        {session?.description && (
          <p className="line-clamp-3 max-w-2xl text-sm leading-relaxed text-text-secondary">{session.description}</p>
        )}
        {outdoorSession && workout?.id && (
          <Link href={`/dashboard/workout/${workout.id}#tiempo`} className="flex min-h-14 items-center gap-3 rounded-xl border border-border-default bg-surface-hover px-3.5 transition-colors hover:bg-bg-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-warning/10 text-warning"><CloudSun className="h-4.5 w-4.5" /></span>
            <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-text-primary">{weatherLoading ? 'Actualizando tiempo…' : weather ? `${Math.round(weather.temperature)} °C · Humedad ${weather.humidity}%` : 'Tiempo para tu entrenamiento'}</span><span className="mt-0.5 flex items-center gap-1 text-xs text-text-muted">En vivo · {weather ? <><Wind className="h-3 w-3" />{Math.round(weather.wind)} km/h · Ver previsión</> : 'Toca para actualizar'}</span></span>
            <ChevronRight className="h-4 w-4 shrink-0 text-text-muted" />
          </Link>
        )}
        {workout?.id && (
          <Link
            href={`/dashboard/workout/${workout.id}`}
            className="flex min-h-12 w-full items-center justify-center rounded-xl bg-coral-500 px-5 text-sm font-bold text-bg-deep transition-[background-color,box-shadow] duration-150 ease-out hover:bg-coral-400 focus-visible:ring-2 focus-visible:ring-coral-300 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-card"
          >
            {isCompleted ? 'Consultar entrenamiento' : 'Abrir entrenamiento'}
          </Link>
        )}

        {workouts.length > 1 && (
          <div className="border-t border-border-subtle pt-3">
            <p className="text-xs font-medium text-text-muted">También hoy</p>
            <div className="mt-2 space-y-2">
              {workouts.slice(1).map((nextWorkout) => {
                const nextSession = nextWorkout.training_sessions
                const nextLabel = SPORT_CONFIG[nextSession?.sport_type]?.label || nextSession?.sport_type || 'Entrenamiento'
                const slot = nextWorkout.scheduled_slot === 'morning' ? 'Mañana' : nextWorkout.scheduled_slot === 'evening' ? 'Tarde' : 'Flexible'
                return (
                  <Link key={nextWorkout.id} href={`/dashboard/workout/${nextWorkout.id}`} className="flex min-h-11 items-center justify-between gap-3 rounded-xl bg-surface-hover px-3 text-sm transition-colors hover:bg-border-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                    <span className="min-w-0 truncate font-medium text-text-primary">{nextLabel} · {nextSession?.duration_min || 0} min</span>
                    <span className="shrink-0 text-xs text-text-muted">{slot}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
