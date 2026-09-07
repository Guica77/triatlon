import Link from 'next/link'
export default async function AccountDeleted({ searchParams }: { searchParams: Promise<{ apple?: string }> }) {
  const manual = (await searchParams).apple === 'manual'
  return <main className="mx-auto max-w-xl px-6 py-16 space-y-6">
    <h1 className="text-2xl font-bold">Tu cuenta se ha eliminado</h1>
    <p>Se ha eliminado tu cuenta de Triatlón Pro. Los plazos de conservación de copias y registros se describen en la política de privacidad.</p>
    {manual && <section className="rounded-xl border p-5 space-y-3">
      <h2 className="font-bold">Completa la desconexión de Apple</h2>
      <p>No hemos podido revocar automáticamente la autorización de Apple. En los ajustes de tu cuenta de Apple, abre Inicio de sesión y seguridad → Iniciar sesión con Apple, selecciona Triatlón Pro y deja de usar Iniciar sesión con Apple.</p>
      <a href="https://account.apple.com/" className="underline">Gestionar mi cuenta de Apple</a>
    </section>}
    <p>Si tienes una suscripción contratada en Apple, comprueba su cancelación también en la gestión de suscripciones.</p>
    <Link href="/login" className="inline-block underline">Volver al inicio de sesión</Link>
  </main>
}
