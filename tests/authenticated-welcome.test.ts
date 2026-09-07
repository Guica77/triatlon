// @vitest-environment jsdom
import * as React from 'react'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { AuthenticatedWelcomeProvider, WelcomeReady, WelcomeRedirect, WelcomeLoading, useAuthenticatedWelcome } from '@/components/brand/authenticated-welcome'
import { welcomeDestination } from '@/lib/auth/welcome'

const { replace, route } = vi.hoisted(() => ({ replace: vi.fn(), route: { pathname: '/login' } }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace }), usePathname: () => route.pathname }))
vi.mock('next/image', () => ({ default: ({ priority: _priority, ...props }: Record<string, unknown>) => React.createElement('img', props) }))
let root: Root
let container: HTMLDivElement
let controls: ReturnType<typeof useAuthenticatedWelcome>
let reduced = false
function Controls() { const value = useAuthenticatedWelcome(); React.useLayoutEffect(() => { controls = value }, [value]); return null }
function render(child?: React.ReactNode) {
  act(() => root.render(React.createElement(React.StrictMode, null,
    React.createElement(AuthenticatedWelcomeProvider, null, React.createElement(Controls), child))))
}
const screen = () => container.querySelector('section[aria-label="TriWaveX"]')

beforeEach(() => {
  vi.useFakeTimers(); replace.mockClear(); reduced = false; route.pathname = '/login'
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  window.matchMedia = vi.fn().mockImplementation(() => ({ matches: reduced }))
  container = document.createElement('div'); document.body.append(container); root = createRoot(container)
})
afterEach(() => { act(() => root.unmount()); container.remove(); vi.useRealTimers() })

describe('authenticated welcome', () => {
  it('navigates immediately once, even with duplicate submissions, and keeps the exact copy while data loads', () => {
    render()
    act(() => { controls.start('/dashboard'); controls.start('/coach/dashboard') })
    expect(replace.mock.calls).toEqual([['/dashboard']])
    expect(screen()?.querySelector('h1')?.textContent).toBe('Train with clarity.')
    expect(screen()?.querySelector('p')?.textContent).toBe('Entrena con claridad.')
    act(() => vi.advanceTimersByTime(1400))
    expect(screen()?.getAttribute('data-leaving')).toBe('false')
    expect(container.querySelector('[inert]')).not.toBeNull()
  })
  it('reveals early-ready data without an artificial 800ms delay and does not replay on refresh', () => {
    render(); act(() => controls.start('/dashboard'))
    render(React.createElement(WelcomeReady))
    expect(screen()?.getAttribute('data-leaving')).toBe('true')
    act(() => vi.advanceTimersByTime(220))
    expect(screen()).toBeNull()
    render(React.createElement(WelcomeReady))
    act(() => { window.dispatchEvent(new Event('focus')); document.dispatchEvent(new Event('visibilitychange')) })
    expect(screen()).toBeNull(); expect(replace).toHaveBeenCalledTimes(1)
    expect(container.querySelector('[inert]')).toBeNull()
  })
  it('uses an 80ms crossfade with Reduce Motion and disables CSS motion and stagger', () => {
    reduced = true; render(); act(() => controls.start('/dashboard')); render(React.createElement(WelcomeReady))
    act(() => vi.advanceTimersByTime(80)); expect(screen()).toBeNull()
    const css = readFileSync('components/brand/authenticated-welcome.module.css','utf8')
    expect(css).toContain('@media (prefers-reduced-motion: reduce)')
    expect(css).toContain('.progress span { animation: none; }')
  })
  it('handles restored-session loading once without navigating or replaying on later loading', () => {
    render(React.createElement(WelcomeLoading)); expect(screen()).not.toBeNull(); expect(screen()?.getAttribute('data-animate')).toBe('false'); expect(replace).not.toHaveBeenCalled()
    render(React.createElement(WelcomeReady)); act(() => vi.advanceTimersByTime(220))
    render(React.createElement(WelcomeLoading)); expect(screen()).toBeNull(); expect(replace).not.toHaveBeenCalled()
  })
  it('reveals authentication or destination errors immediately and allows a subsequent real login', () => {
    render(); act(() => controls.start('/dashboard'))
    render(React.createElement(WelcomeReady, { immediate: true })); expect(screen()).toBeNull()
    act(() => controls.start('/coach/dashboard')); expect(replace).toHaveBeenCalledTimes(2)
  })
  it('keeps the OAuth loading cover mounted through its verified handoff', () => {
    route.pathname = '/welcome'; render(React.createElement(WelcomeLoading))
    const original = screen(); expect(original?.getAttribute('data-animate')).toBe('true')
    render(React.createElement(WelcomeRedirect, { destination: '/dashboard' }))
    expect(screen()).toBe(original); expect(replace).toHaveBeenCalledTimes(1)
  })
  it('does not duplicate the OAuth handoff in Strict Mode', () => {
    render(React.createElement(WelcomeRedirect, { destination: '/onboarding' }))
    expect(replace.mock.calls).toEqual([['/onboarding']])
  })
  it('dismisses the welcome when an invalid invitation redirects to a public page', () => {
    render(); act(() => controls.start('/invite/INVITE-C'))
    route.pathname = '/'; render(); expect(screen()).toBeNull()
  })
  it('keeps slow loads branded and offers recovery without claiming data is ready', () => {
    render(); act(() => controls.start('/dashboard')); act(() => vi.advanceTimersByTime(10000))
    expect(screen()?.getAttribute('aria-busy')).toBe('true')
    expect(screen()?.querySelector('button')?.textContent).toBe('Reintentar carga')
  })
  it('accepts only existing post-login destinations, including invitation consent', () => {
    for (const target of ['https://evil.test','//evil.test','/welcome','/dashboard?next=evil','javascript:alert(1)']) expect(welcomeDestination(target)).toBe('/dashboard')
    expect(welcomeDestination('/invite/INVITE-C')).toBe('/invite/INVITE-C')
    expect(welcomeDestination('/coach/dashboard')).toBe('/coach/dashboard')
  })
  it('preserves the original logo geometry, palette and 84px artboard', () => {
    const mark = readFileSync('public/brand/triwavex-mark.svg','utf8')
    const source = readFileSync('public/brand/triwavex-simple-visual.svg','utf8')
    const original = source.match(/<g transform="translate\(92 92\)">([\s\S]*?)<\/g>/)?.[1]
    expect(original).toBeTruthy(); expect(mark).toContain(original!.trim())
    expect(mark).toContain('viewBox="0 0 84 84"')
    expect(mark).toContain('#B7F36B'); expect(mark).toContain('#0B1117')
  })
})
