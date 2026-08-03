import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim(),
    (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
          })
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, {
              ...options,
              secure: process.env.NODE_ENV === 'production',
            })
          })
        },
      },
    }
  )

  // IMPORTANTE: Llamar a getUser() refrescará automáticamente el token
  // si está expirado, usando el setAll() de arriba para persistirlo.
  try {
    await supabase.auth.getUser()
  } catch (err) {
    // Si Supabase está momentáneamente caído/lento, no tumbamos TODA la app.
    // Dejamos pasar la request sin sesión; las páginas redirigirán a /login
    // y el próximo request reintentará.
    console.error('[proxy] updateSession getUser() failed:', err)
  }

  return supabaseResponse
}
