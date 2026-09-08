import Link from 'next/link';

export default function SupportPage() {
  const candidate = process.env.SUPPORT_EMAIL?.trim() || 'support@triwave.com';
  const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidate) && !/[\r\n]/.test(candidate) ? candidate : null;
  return <main className="mx-auto max-w-2xl px-6 py-16 space-y-6">
    <Link href="/" className="text-sm underline">Volver al inicio</Link>
    <h1 className="text-3xl font-bold">Soporte de TriWaveX</h1>
    <p>Para ayudarte, necesitamos una descripción del problema, la versión de la aplicación y tu dispositivo. No envíes contraseñas, códigos de acceso ni información médica innecesaria.</p>
    {email ? <section className="rounded-2xl border border-border-default bg-surface-card p-5 space-y-3">
      <h2 className="text-lg font-bold">¿Necesitas ayuda adicional?</h2>
      <p>Si no podemos resolver el problema desde la app, escríbenos a <a className="font-semibold text-swim underline" href={`mailto:${email}?subject=Soporte%20TriWaveX`}>{email}</a>. Incluye una breve descripción, la versión de TriWaveX y tu dispositivo.</p>
      <a className="inline-block rounded-xl border border-swim/30 bg-swim/10 px-5 py-3 font-semibold text-swim" href={`mailto:${email}?subject=Soporte%20TriWaveX`}>Contactar con soporte</a>
    </section>
      : <p role="status">El canal de soporte público todavía no está habilitado. Esta versión no está abierta al lanzamiento comercial.</p>}
    <p>El enlace de contacto abre tu aplicación de correo: debes enviar el mensaje desde ella. Aquí no se registra ni se confirma el envío de una consulta.</p>
    <section className="space-y-3"><h2 className="text-xl font-bold">Eliminar tu cuenta</h2>
      <p>Dentro de la aplicación, abre Perfil y ajustes → Eliminar cuenta. Escribe ELIMINAR y confirma. Si utilizas Apple y hace falta una desconexión manual, te mostraremos los pasos después del borrado.</p>
      <p>Eliminar la cuenta no sustituye la gestión de una suscripción contratada en Apple.</p>
    </section>
    <Link href="/privacidad" className="underline">Política de privacidad</Link>
  </main>;
}
