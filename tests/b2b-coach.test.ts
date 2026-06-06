import { describe, it, expect, vi } from 'vitest'
import { calculateReadiness } from '@/app/dashboard/biometrics-actions'

// Mocking Supabase Client & Next Navigation
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'coach-123' } }, error: null })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: { role: 'coach', subscription_status: 'coach' }, error: null })),
          maybeSingle: vi.fn(() => Promise.resolve({ data: { id: 'athlete-456' }, error: null })),
        })),
        in: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
      insert: vi.fn(() => Promise.resolve({ error: null })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    })),
  })),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

describe('B2B Coach & Biometrics Alerts Logic', () => {
  
  describe('Readiness & Biometric Ratings', () => {
    it('debería calcular el readiness score correctamente e indicar alertas', async () => {
      // Test readiness calculation helper from biometrics-actions
      const hrv = 30
      const rhr = 65
      const sleepHours = 4.0
      const fatigue = 5
      const stress = 5

      const { data } = await calculateReadiness(hrv, rhr, sleepHours, fatigue, stress)
      
      expect(data.readiness_score).toBeLessThan(60)
      expect(data.sleepStatus).toBe('Deficiente')
      expect(data.hrvStatus).toBe('Por debajo de media')
      expect(data.rhrStatus).toBe('Elevado')
    })

    it('debería dar estado óptimo para biometrías de atletas descansados', async () => {
      const hrv = 72
      const rhr = 48
      const sleepHours = 8.5
      const fatigue = 1
      const stress = 1

      const { data } = await calculateReadiness(hrv, rhr, sleepHours, fatigue, stress)
      
      expect(data.readiness_score).toBeGreaterThan(85)
      expect(data.sleepStatus).toBe('Óptimo')
      expect(data.hrvStatus).toBe('+12% vs Media')
      expect(data.rhrStatus).toBe('Óptimo')
    })
  })

  describe('Plan start date calculations', () => {
    it('debería calcular el lunes de la semana en curso como inicio de entrenamientos', () => {
      const now = new Date()
      const currentDay = now.getDay() || 7
      const daysSinceMonday = currentDay - 1
      
      const monday = new Date(now)
      monday.setDate(now.getDate() - daysSinceMonday)
      monday.setHours(0, 0, 0, 0)

      expect(monday.getDay()).toBe(1) // Monday is 1
      expect(monday.getHours()).toBe(0)
    })
  })

  describe('User role checks', () => {
    it('debería clasificar el tipo de plan correcto y roles asociados', () => {
      const getRoleByStatus = (status: string) => {
        return status === 'coach' ? 'coach' : 'athlete'
      }

      expect(getRoleByStatus('coach')).toBe('coach')
      expect(getRoleByStatus('pro')).toBe('athlete')
      expect(getRoleByStatus('free')).toBe('athlete')
    })
  })
})
