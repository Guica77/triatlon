import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const h = vi.hoisted(() => ({
  user: null as { id: string } | null,
  workout: null as Record<string, unknown> | null,
  activeCoachLink: false,
}))

function query(table: string, state: Record<string, unknown> = {}): any {
  return {
    select: () => query(table, state),
    eq: () => query(table, state),
    maybeSingle: async () => table === 'coach_athletes'
      ? { data: h.activeCoachLink ? { athlete_id: 'athlete-1' } : null, error: null }
      : { data: h.workout, error: h.workout ? null : { code: 'PGRST116' } },
    single: async () => table === 'profiles'
      ? { data: { current_ftp: 200, current_swim_pace: '1:50', current_run_pace: '5:00', level: 'intermedio' }, error: null }
      : { data: h.workout, error: h.workout ? null : { code: 'PGRST116' } },
  }
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: h.user } }) },
    from: (table: string) => query(table),
  }),
}))

import { GET } from '@/app/api/workouts/export/route'

function request(id = 'workout-1') {
  return new NextRequest(`http://localhost/api/workouts/export?workoutId=${id}`)
}

function workout(userId: string) {
  return {
    id: 'workout-1',
    user_id: userId,
    scheduled_date: '2026-09-02',
    training_sessions: {
      sport_type: 'carrera',
      duration_min: 60,
      description: 'Rodaje suave',
      day_name: 'Martes',
    },
  }
}

describe('GET /api/workouts/export authorization', () => {
  beforeEach(() => {
    h.user = null
    h.workout = workout('athlete-1')
    h.activeCoachLink = false
  })

  it('rechaza la exportación sin sesión', async () => {
    expect((await GET(request())).status).toBe(401)
  })

  it('permite al atleta exportar su propio entrenamiento', async () => {
    h.user = { id: 'athlete-1' }
    const response = await GET(request())
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('application/vnd.garmin.tcx+xml')
  })

  it('permite a un entrenador vinculado y activo exportar el entrenamiento', async () => {
    h.user = { id: 'coach-1' }
    h.activeCoachLink = true
    expect((await GET(request())).status).toBe(200)
  })

  it('prohíbe exportar entrenamientos ajenos sin una relación activa', async () => {
    h.user = { id: 'other-user' }
    expect((await GET(request())).status).toBe(403)
  })
})
