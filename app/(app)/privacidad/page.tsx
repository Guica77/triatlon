import Link from 'next/link';

export default function PrivacidadPage() {
  return (
    <main className="mx-auto max-w-2xl space-y-8 px-6 py-16 text-text-primary">
      <Link href="/" className="text-sm underline">Volver al inicio</Link>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Política de privacidad</h1>
        <p className="text-text-secondary">Última actualización: 7 de septiembre de 2026</p>
      </div>
      <p>En <strong>TriWaveX</strong> nos tomamos muy en serio la seguridad y el tratamiento de tus datos personales y deportivos. Esta política detalla cómo recopilamos, utilizamos y protegemos tu información.</p>
      <section className="space-y-4">
        <h2 className="text-xl font-bold">1. Datos que recopilamos</h2>
        <p>Para estructurar y optimizar tus planes de entrenamiento de forma personalizada, procesamos la siguiente información:</p>
        <ul className="list-disc space-y-2 pl-5 text-text-secondary">
          <li><strong>Datos de perfil:</strong> nombre, correo electrónico, nivel de experiencia y marcas objetivo.</li>
          <li><strong>Datos fisiológicos:</strong> zonas de frecuencia cardíaca, FTP, ritmos de natación y carrera.</li>
          <li><strong>Datos de telemetría:</strong> actividades importadas desde Strava para analizar el volumen e intensidad de tus entrenamientos.</li>
          <li><strong>Preferencias nutricionales:</strong> alimentos, alergias e ingredientes no deseados.</li>
        </ul>
      </section>
      <section className="space-y-4">
        <h2 className="text-xl font-bold">2. Cómo usamos la información</h2>
        <p>Tu entrenador vinculado puede acceder a los datos necesarios para el seguimiento deportivo. El servicio utiliza tus datos para:</p>
        <ul className="list-disc space-y-2 pl-5 text-text-secondary">
          <li>Ofrecer orientación mediante IA solo si das permiso explícito en Ajustes. Se pueden enviar consultas, datos deportivos, lesiones y preferencias a Google Gemini y/o Anthropic Claude según la configuración.</li>
          <li>Importar actividades de Strava y actualizar las métricas disponibles. La conexión directa con Garmin y el envío al reloj no están disponibles.</li>
          <li>Enviarte alertas y notificaciones necesarias, como recordatorios de nutrición o mensajes de tu entrenador.</li>
        </ul>
      </section>
      <section className="space-y-4">
        <h2 className="text-xl font-bold">3. Notificaciones y ubicación</h2>
        <p>TriWaveX puede solicitar permiso para enviarte notificaciones sobre entrenamiento, nutrición o mensajes de tu entrenador. Puedes cambiar ese permiso desde los ajustes de tu dispositivo o navegador.</p>
      </section>
      <section className="space-y-4">
        <h2 className="text-xl font-bold">4. Tus derechos</h2>
        <p>Desde Ajustes puedes desconectar Strava, retirar permisos de IA, exportar entrenamientos e iniciar el borrado de tu cuenta. La exportación de entrenamientos no incluye todos tus datos personales. Si Apple requiere una desconexión manual, se muestran instrucciones tras el borrado. La eliminación de la cuenta no sustituye la gestión de una suscripción contratada con Apple.</p>
      </section>
      <section className="space-y-3 rounded-2xl border border-border-default bg-surface-card p-5">
        <h2 className="text-lg font-bold">Consultas sobre privacidad</h2>
        <p>Si tienes una consulta sobre tus datos personales o quieres ejercer tus derechos, escríbenos a <a className="font-semibold text-swim underline" href="mailto:privacy@triwavex.com?subject=Privacidad%20TriWaveX">privacy@triwavex.com</a>.</p>
        <a className="inline-block rounded-xl border border-swim/30 bg-swim/10 px-5 py-3 font-semibold text-swim" href="mailto:privacy@triwavex.com?subject=Privacidad%20TriWaveX">Contactar con privacidad</a>
      </section>
      <Link href="/soporte" className="text-sm underline">Soporte de TriWaveX</Link>
    </main>
  );
}
