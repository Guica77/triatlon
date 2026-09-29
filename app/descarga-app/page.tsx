import Link from 'next/link'
import { Apple, Users } from 'lucide-react'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { createClient } from '@/lib/supabase/server'
import { LANDING_URL } from '@/lib/web-access'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Descarga la app | TriWaveX',
  description: 'El entrenamiento de atleta de TriWaveX se usa desde la app de iPhone.',
}

function appStoreURL() {
  const candidate = process.env.NEXT_PUBLIC_APP_STORE_URL?.trim()
  return candidate && /^https:\/\/apps\.apple\.com\//.test(candidate) ? candidate : null
}

export default async function AthleteAppPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }))
  const storeURL = appStoreURL()

  return (
    <AuthLayout title="TriWaveX" subtitle="Tu entrenamiento vive en el iPhone.">
      <div className="space-y-5">
        <div className="space-y-3 rounded-2xl border border-white/10 bg-surface-card/80 p-5">
          <h1 className="text-lg font-semibold text-text-primary">Usa TriWaveX desde la app</h1>
          <p className="text-sm leading-relaxed text-text-secondary">
            Tu plan, tus sesiones, el chat con tu entrenador y tu progreso están en la app de iPhone.
            Entra con la misma cuenta y lo encontrarás todo como lo dejaste.
          </p>
          {storeURL ? (
            <a
              href={storeURL}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              <Apple className="h-4 w-4" aria-hidden />
              Descargar en App Store
            </a>
          ) : (
            <p role="status" className="rounded-xl border border-white/10 px-4 py-3 text-center text-sm font-medium text-text-secondary">
              Muy pronto en App Store
            </p>
          )}
        </div>

        <Link
          href="/login?role=coach"
          className="flex items-center gap-3 rounded-2xl border border-white/10 p-4 text-sm text-text-secondary transition-colors hover:text-text-primary"
        >
          <Users className="h-4 w-4 shrink-0" aria-hidden />
          <span>¿Eres entrenador? <span className="font-semibold text-text-primary">Entra al panel web</span></span>
        </Link>

        <div className="flex items-center justify-between text-xs text-text-secondary">
          <a href={LANDING_URL} className="underline underline-offset-4 hover:text-text-primary">Conoce TriWaveX</a>
          {user && (
            <form action="/auth/signout" method="post">
              <button type="submit" className="underline underline-offset-4 hover:text-text-primary">Cerrar sesión</button>
            </form>
          )}
        </div>
      </div>
    </AuthLayout>
  )
}
