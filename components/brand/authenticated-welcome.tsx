'use client'

import * as React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { TriWaveXMark } from './triwavex-mark'
import { welcomeDestination, welcomePhase, type WelcomePhase } from '@/lib/auth/welcome'
import styles from './authenticated-welcome.module.css'

const WelcomeContext = React.createContext<{
  active: boolean
  isCold: () => boolean
  start: (destination: string) => void
  retain: () => void
  ready: (immediate?: boolean) => void
} | null>(null)

export function useAuthenticatedWelcome() {
  const value = React.useContext(WelcomeContext)
  if (!value) throw new Error('AuthenticatedWelcomeProvider is missing')
  return value
}

export function WelcomeView({ leaving = false, animate = false }: { leaving?: boolean; animate?: boolean }) {
  const [slow, setSlow] = React.useState(false)
  React.useEffect(() => {
    const timeout = window.setTimeout(() => setSlow(true), 10000)
    return () => window.clearTimeout(timeout)
  }, [])
  return <section className={styles.screen} data-leaving={leaving} data-animate={animate} aria-label="TriWaveX" aria-busy={!leaving}>
    <div className={styles.content}>
      <div className={styles.identity}>
        <TriWaveXMark className={styles.mark} />
        <span className={styles.wordmark}>TRIWAVEX</span>
      </div>
      <h1 className={styles.primary} lang="en">Train with clarity.</h1>
      <p className={styles.translation} lang="es">Entrena con claridad.</p>
      <div className={styles.progress} role="status" aria-label="Preparando tu espacio de entrenamiento">
        <span aria-hidden="true" />
      </div>
      {slow && <button className={styles.retry} onClick={() => window.location.reload()}>Reintentar carga</button>}
    </div>
  </section>
}

/** Persists across App Router navigation; neither token refresh nor visibility events start it. */
export function AuthenticatedWelcomeProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const previousPath = React.useRef(pathname)
  const initialPhase = pathname === '/welcome' ? 'waiting' : 'idle'
  const [phase, setPhase] = React.useState<WelcomePhase>(initialPhase)
  const phaseRef = React.useRef<WelcomePhase>(initialPhase)
  const [animateEntrance, setAnimateEntrance] = React.useState(pathname === '/welcome')
  const navigating = React.useRef(false)
  const coldLaunch = React.useRef(true)
  const change = React.useCallback((event: 'start' | 'ready' | 'finish' | 'error') => {
    phaseRef.current = welcomePhase(phaseRef.current, event)
    setPhase(phaseRef.current)
  }, [])
  const start = React.useCallback((destination: string) => {
    if (navigating.current) return
    navigating.current = true
    coldLaunch.current = false
    if (phaseRef.current === 'idle') setAnimateEntrance(true)
    change('start')
    React.startTransition(() => router.replace(welcomeDestination(destination)))
  }, [router, change])
  const retain = React.useCallback(() => {
    if (coldLaunch.current) {
      // The server loading fallback is already visible: do not fade its logo out and back in.
      if (phaseRef.current === 'idle') setAnimateEntrance(false)
      change('start')
    }
  }, [change])
  const ready = React.useCallback((immediate = false) => {
    coldLaunch.current = false
    change(immediate ? 'error' : 'ready')
    if (immediate) navigating.current = false
  }, [change])
  React.useLayoutEffect(() => {
    // Invalid invitations and other server redirects must never leave a cover over a public page.
    if (pathname !== previousPath.current && pathname !== '/welcome' && welcomeDestination(pathname) !== pathname) ready(true)
    previousPath.current = pathname
  }, [pathname, ready])
  React.useEffect(() => {
    if (phase !== 'leaving') return
    // No minimum dwell: reveal ready data immediately through a short crossfade.
    const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 80 : 220
    const timer = window.setTimeout(() => {
      change('finish')
      navigating.current = false
      const heading = document.querySelector<HTMLElement>('main h1, [data-welcome-destination] h1')
      if (heading) { heading.setAttribute('tabindex', '-1'); heading.focus({ preventScroll: true }) }
    }, duration)
    return () => window.clearTimeout(timer)
  }, [phase, change])
  const isCold = React.useCallback(() => coldLaunch.current, [])
  const active = phase !== 'idle'
  const value = React.useMemo(() => ({ active, start, retain, ready, isCold }), [active, start, retain, ready, isCold])
  return <WelcomeContext.Provider value={value}>
    <div className={styles.app} inert={active} aria-hidden={active || undefined}>{children}</div>
    {active && <WelcomeView animate={animateEntrance} leaving={phase === 'leaving'} />}
  </WelcomeContext.Provider>
}

/** Render only after the destination's server-side auth and initial data have resolved. */
export function WelcomeReady({ immediate = false }: { immediate?: boolean }) {
  const { ready } = useAuthenticatedWelcome()
  React.useLayoutEffect(() => ready(immediate), [ready, immediate])
  return null
}

export function WelcomeRedirect({ destination }: { destination: string }) {
  const { start, active } = useAuthenticatedWelcome()
  React.useLayoutEffect(() => start(destination), [start, destination])
  return active ? null : <WelcomeView />
}

export function WelcomeLoading({ fallback }: { fallback?: React.ReactNode } = {}) {
  const { retain, active, isCold } = useAuthenticatedWelcome()
  React.useLayoutEffect(() => retain(), [retain])
  return active ? null : isCold() ? <WelcomeView /> : fallback ?? <div className="p-6 text-text-muted" role="status">Cargando…</div>
}
