import { beforeEach, describe, expect, it } from 'vitest'
import { isAuthorizedCronRequest } from '@/lib/cron-auth'

const environment = process.env as Record<string, string | undefined>

describe('isAuthorizedCronRequest', () => {
  beforeEach(() => {
    environment.NODE_ENV = 'production'
    delete environment.CRON_SECRET
  })

  it('allows local development without a secret', () => {
    environment.NODE_ENV = 'development'

    expect(isAuthorizedCronRequest(new Request('http://localhost'))).toBe(true)
  })

  it('rejects production requests when the secret is missing', () => {
    expect(isAuthorizedCronRequest(new Request('http://localhost'))).toBe(false)
  })

  it('requires the exact production bearer token', () => {
    environment.CRON_SECRET = 'test-secret'

    expect(isAuthorizedCronRequest(new Request('http://localhost'))).toBe(false)
    expect(
      isAuthorizedCronRequest(new Request('http://localhost', {
        headers: { authorization: 'Bearer test-secret' },
      })),
    ).toBe(true)
  })
})
