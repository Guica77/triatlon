import Link from 'next/link';

export default function SupportPage() {
  const candidate = process.env.SUPPORT_EMAIL?.trim() || '';
  const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidate) && !/[\r\n]/.test(candidate) ? candidate : null;
  return <main className="mx-auto max-w-2xl px-6 py-16 space-y-6">
    <Link href="/" className="text-sm underline">Volver al inicio</Link>
    <h1 className="text-3xl font-bold">Soporte de TriWaveX</h1>
    <p>Para ayudarte, necesitamos una descripción del problema, la versión de la aplicación y tu dispositivo. No envíes contraseñas, códigos de acceso ni información médica innecesaria.</p>
    {email ? <a className="inline-block rounded-xl border px-5 py-3 font-semibold" href={`mailto:${email}?subject=Soporte%20TriWaveX`}>Escribir a {email}</a>
      : <p role="status">El canal de soporte público todavía no está habilitado. Esta versión no está abierta al lanzamiento comercial.</p>}
    <p>El enlace de contacto abre tu aplicación de correo: debes enviar el mensaje desde ella. Aquí no se registra ni se confirma el envío de una consulta.</p>
    <section className="space-y-3"><h2 className="text-xl font-bold">Eliminar tu cuenta</h2>
      <p>Dentro de la aplicación, abre Perfil y ajustes → Eliminar cuenta. Escribe ELIMINAR y confirma. Si utilizas Apple y hace falta una desconexión manual, te mostraremos los pasos después del borrado.</p>
      <p>Eliminar la cuenta no sustituye la gestión de una suscripción contratada en Apple.</p>
    </section>
    <Link href="/privacidad" className="underline">Política de privacidad</Link>
  </main>;
}
