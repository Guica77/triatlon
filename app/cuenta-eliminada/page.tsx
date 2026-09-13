import Link from 'next/link'
export default async function AccountDeleted({ searchParams }: { searchParams: Promise<{ programada?: string }> }) {
  const scheduled = (await searchParams).programada
  const date = scheduled && !Number.isNaN(new Date(scheduled).getTime())
    ? new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(scheduled))
    : 'dentro de 30 días'
  return <main className="mx-auto max-w-xl px-6 py-16 space-y-6">
    <h1 className="text-2xl font-bold">Eliminación programada</h1>
    <p>Tu cuenta se eliminará el {date}. Hasta entonces puedes recuperar el acceso iniciando sesión y cancelando la solicitud desde Ajustes.</p>
    <p>Si tienes una suscripción contratada en Apple, comprueba su cancelación también en la gestión de suscripciones.</p>
    <Link href="/login" className="inline-block underline">Iniciar sesión y cancelar eliminación</Link>
  </main>
}
