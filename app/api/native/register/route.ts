import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { nativeAccessForUser } from '@/lib/native-access'

const reply = (body: object, status = 200) => Response.json(body, {
  status,
  headers: { 'Cache-Control': 'no-store', 'Vary': 'Cookie' },
})

type RegistrationInput = {
  email: string
  password: string
  firstName: string
  lastName: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function inputFrom(value: unknown): RegistrationInput | null {
  if (!isRecord(value)) return null
  const email = typeof value.email === 'string' ? value.email.trim().toLowerCase() : null
  const password = typeof value.password === 'string' ? value.password : null
  const firstName = typeof value.firstName === 'string' ? value.firstName.trim() : null
  const lastName = typeof value.lastName === 'string' ? value.lastName.trim() : null
  if (!email || !password || !firstName || !lastName) return null
  const emailParts = email.split('@')
  const validEmail = emailParts.length === 2 && emailParts[0].length > 0 &&
    emailParts[1].includes('.') && !/\s/.test(email)
  if (!validEmail || password.length < 8 || password.length > 128 ||
      firstName.length > 80 || lastName.length > 80) return null
  return { email, password, firstName, lastName }
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
      options: { data: { full_name: `${input.firstName} ${input.lastName}`.trim(), role: 'athlete' } },
    })
    if (error) return reply({ error: 'No se ha podido crear la cuenta. Revisa el correo o inténtalo de nuevo.' }, 400)
    if (!data.user) return reply({ error: 'No se ha podido crear la cuenta.' }, 503)

    const { error: profileError } = await createAdminClient().from('profiles').upsert({
      id: data.user.id,
      first_name: input.firstName,
      last_name: input.lastName,
      email: input.email,
      level: 'intermedio',
      role: 'athlete',
    }, { onConflict: 'id' })
    if (profileError) return reply({ error: 'No se ha podido preparar tu perfil. Inténtalo de nuevo.' }, 503)

    if (!data.session) return reply({ emailConfirmRequired: true, userID: data.user.id })
    const access = await nativeAccessForUser(supabase, data.user.id)
    return reply({
      emailConfirmRequired: false,
      destination: access.destination,
      userID: access.userID,
      role: access.role,
      entitled: access.entitled,
    })
  } catch {
    return reply({ error: 'Servicio no disponible' }, 503)
  }
}
