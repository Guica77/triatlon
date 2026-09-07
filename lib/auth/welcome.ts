/** Presentation destinations only; authentication remains server-owned. */
export function welcomeDestination(value: string | undefined) {
  if (value === '/coach/dashboard' || value === '/onboarding' || value === '/dashboard') return value
  if (value && /^\/invite\/[a-zA-Z0-9_-]{4,64}$/.test(value)) return value
  return '/dashboard'
}

export type WelcomePhase = 'idle' | 'waiting' | 'leaving'
export function welcomePhase(phase: WelcomePhase, event: 'start' | 'ready' | 'finish' | 'error'): WelcomePhase {
  if (event === 'error') return 'idle'
  if (event === 'start') return phase === 'idle' ? 'waiting' : phase
  if (event === 'ready') return phase === 'waiting' ? 'leaving' : phase
  return phase === 'leaving' ? 'idle' : phase
}
