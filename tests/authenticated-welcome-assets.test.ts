import { existsSync } from 'node:fs'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, it } from 'vitest'

it('ships every module imported by the authenticated welcome login', () => {
  for (const file of [
    'components/brand/authenticated-welcome.tsx',
    'components/brand/authenticated-welcome.module.css',
    'lib/auth/welcome.ts',
  ]) {
    expect(existsSync(resolve(process.cwd(), file)), `${file} must be present`).toBe(true)
  }
})

it('mounts the authenticated welcome provider around app pages', () => {
  const layout = readFileSync(resolve(process.cwd(), 'app/layout.tsx'), 'utf8')
  expect(layout).toContain("import { AuthenticatedWelcomeProvider } from '@/components/brand/authenticated-welcome'")
  expect(layout).toContain('<AuthenticatedWelcomeProvider>')
})
