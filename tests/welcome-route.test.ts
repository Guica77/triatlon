import { AuthSessionMissingError } from '@supabase/supabase-js'
import { beforeEach, expect, it, vi } from 'vitest'
import WelcomePage from '@/app/welcome/page'
const { getUser } = vi.hoisted(() => ({ getUser: vi.fn() }))
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ auth: { getUser } }) }))
vi.mock('next/navigation', () => ({ redirect: (path: string) => { throw new Error(`REDIRECT:${path}`) } }))
beforeEach(() => { getUser.mockResolvedValue({ data: { user: { id: 'test-user' } }, error: null }) })
it('requires a verified session for the authenticated welcome route', async () => {
  getUser.mockResolvedValue({ data: { user: null }, error: null })
  await expect(WelcomePage({ searchParams: Promise.resolve({}) })).rejects.toThrow('REDIRECT:/login')
})
it('surfaces a session-verification failure instead of pretending authentication succeeded', async () => {
  getUser.mockResolvedValue({ data: { user: null }, error: new Error('unavailable') })
  await expect(WelcomePage({ searchParams: Promise.resolve({}) })).rejects.toThrow('No se ha podido verificar la sesión')
})
it('preserves restored-session destinations and invitation acceptance', async () => {
  for (const next of ['/dashboard','/coach/dashboard','/onboarding','/invite/INVITE-C']) {
    const view = await WelcomePage({ searchParams: Promise.resolve({ next }) })
    expect(view.props.destination).toBe(next)
  }
})
it('does not forward an external redirect target', async () => {
  const view = await WelcomePage({ searchParams: Promise.resolve({next:'https://evil.test'}) })
  expect(view.props.destination).toBe('/dashboard')
})

it('treats the SDK missing-session error as signed out, not a service outage', async () => {
  getUser.mockResolvedValue({ data: { user: null }, error: new AuthSessionMissingError() })
  await expect(WelcomePage({ searchParams: Promise.resolve({}) })).rejects.toThrow('REDIRECT:/login')
})
