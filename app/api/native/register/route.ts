import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const reply = (body: object, status = 200) => Response.json(body, {
  status,
  headers: { 'Cache-Control': 'no-store', 'Vary': 'Cookie' },
})

type RegistrationInput = {
  email: string
  password: string
  firstName: string
  lastName: string
  role: 'athlete' | 'coach'
}

function inputFrom(value: unknown): RegistrationInput | null {
  if (!value || typeof value !== 'object') return null
  const input = value as Record<string, unknown>
  const fields = ['email', 'password', 'firstName', 'lastName'] as const
  if (fields.some((field) => typeof input[field] !== 'string')) return null
  const role = input.role === 'coach' ? 'coach' : input.role === 'athlete' ? 'athlete' : null
  if (!role) return null

  const email = (input.email as string).trim().toLowerCase()
  const password = input.password as string
  const firstName = (input.firstName as string).trim()
  const lastName = (input.lastName as string).trim()
  if (!email || email.length > 320 || password.length < 8 || password.length > 128 ||
      firstName.length < 1 || firstName.length > 80 || lastName.length > 80) return null
  return { email, password, firstName, lastName, role }
}

export async function POST(request: Request) {
  const origin = request.headers.get('origin')
  if (request.headers.get('x-triwavex-native') !== '1' ||
      request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json' ||
      (origin !== null && origin !== new URL(request.url).origin)) {
    return reply({ error: 'Solicitud no permitida' }, 403)
  }

  try {
    const body = await request.text()
    if (body.length > 8192) return reply({ error: 'Solicitud demasiado grande' }, 413)
    let value: unknown
    try { value = JSON.parse(body) } catch { return reply({ error: 'Solicitud inválida' }, 400) }
    const input = inputFrom(value)
    if (!input) return reply({ error: 'Revisa tus datos. La contraseña debe tener al menos 8 caracteres.' }, 400)

    const supabase = await createClient()
    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: { data: { full_name: `${input.firstName} ${input.lastName}`.trim(), role: input.role } },
    })
    if (error) return reply({ error: 'No se ha podido crear la cuenta. Revisa el correo o inténtalo de nuevo.' }, 400)
    if (!data.user) return reply({ error: 'No se ha podido crear la cuenta.' }, 503)

    const { error: profileError } = await createAdminClient().from('profiles').upsert({
      id: data.user.id,
      first_name: input.firstName,
      last_name: input.lastName,
      email: input.email,
      level: 'intermedio',
      role: input.role,
    }, { onConflict: 'id' })
    if (profileError) return reply({ error: 'No se ha podido preparar tu perfil. Inténtalo de nuevo.' }, 503)

    if (!data.session) return reply({ emailConfirmRequired: true })
    return reply({ emailConfirmRequired: false, destination: input.role === 'coach' ? '/coach/dashboard' : '/onboarding' })
  } catch {
    return reply({ error: 'Servicio no disponible' }, 503)
  }
}
