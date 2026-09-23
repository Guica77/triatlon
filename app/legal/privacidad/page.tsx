import Link from 'next/link';

export const metadata = {
  title: 'Política de privacidad | TriWaveX',
  description: 'Qué datos utiliza TriWaveX, para qué, con quién se comparten y cómo ejercer tus derechos.',
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section>
    <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
    <div className="mt-2 space-y-3">{children}</div>
  </section>
);

const Item = ({ children }: { children: React.ReactNode }) => <li className="pl-1">{children}</li>;

export default function PublicPrivacyPage() {
  return (
    <main className="min-h-screen bg-bg-app px-5 py-12 text-text-primary">
      <article className="mx-auto max-w-3xl rounded-[28px] border border-border-default bg-surface-card p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:p-10">
        <p className="text-sm font-semibold text-accent">TriWaveX</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-[-0.045em]">Política de privacidad</h1>
        <p className="mt-4 text-sm text-text-secondary">Última actualización: 22 de septiembre de 2026</p>
        <p className="mt-5 leading-relaxed text-text-secondary">
          Esta política explica qué información trata TriWaveX cuando utilizas sus servicios web y la app iOS, para qué la usamos, cuándo se comparte y qué opciones tienes. Algunas funciones son opcionales: solo se activan si las usas y, cuando corresponde, das permiso.
        </p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-text-secondary">
          <Section title="1. Quién es responsable y cómo contactar">
            <p>El servicio se presenta con el nombre comercial TriWaveX. Para consultas sobre datos personales, solicitudes de derechos o privacidad, escribe a <a className="font-semibold text-accent underline underline-offset-4" href="mailto:privacy@triwavex.com">privacy@triwavex.com</a>.</p>
            <p>La identidad legal completa y el domicilio del responsable deben figurar aquí antes de considerar esta política definitiva para publicación y distribución. No se han podido verificar en el proyecto. Delegado de protección de datos: no consta uno designado.</p>
          </Section>

          <Section title="2. Datos que podemos tratar">
            <ul className="list-disc space-y-2 pl-5">
              <Item><strong className="text-text-primary">Cuenta e identidad:</strong> nombre, correo electrónico, identificador de cuenta, rol de atleta o entrenador, credenciales gestionadas por el proveedor de autenticación y estado de sesión. Puedes registrarte con correo y contraseña o con Apple, según la plataforma.</Item>
              <Item><strong className="text-text-primary">Perfil y planificación:</strong> objetivos, deporte, disponibilidad y horas de entrenamiento, carrera objetivo, preferencias, ritmos, zonas, umbrales y otros valores que introduzcas para adaptar el plan.</Item>
              <Item><strong className="text-text-primary">Entrenamiento y recuperación:</strong> sesiones previstas o completadas, duración, distancia, intensidad, comentarios, esfuerzo percibido, métricas de rendimiento y datos de recuperación. Las lesiones, alergias, peso, sueño, HRV y frecuencia cardiaca pueden revelar información de salud.</Item>
              <Item><strong className="text-text-primary">Apple Salud (HealthKit):</strong> la app solicita permiso de lectura para sueño, variabilidad de la frecuencia cardiaca (HRV), frecuencia cardiaca en reposo y entrenamientos. La sincronización implementada consulta y puede enviar al servicio TriWaveX horas de sueño, HRV y frecuencia cardiaca en reposo; no hemos verificado una lectura o sincronización de los entrenamientos de HealthKit. Estos datos no se usan para publicidad. Puedes retirar permisos en los ajustes de Salud de iOS.</Item>
              <Item><strong className="text-text-primary">Dispositivos y servicios deportivos:</strong> si conectas una cuenta compatible, recibimos los datos que autorices, como identificadores de conexión, actividades y métricas. Strava puede incluir rutas o recorridos geográficos. Desconectar impide nuevas sincronizaciones cuando el proveedor lo confirma, pero no elimina automáticamente actividades ya importadas.</Item>
              <Item><strong className="text-text-primary">Ubicación y clima:</strong> si solicitas la función de clima para entrenar, la ubicación elegida o disponible en el dispositivo se utiliza para pedir condiciones meteorológicas a WeatherKit de Apple. El código revisado no confirma que TriWaveX guarde un historial de ubicación GPS propio para esta función. Las rutas importadas desde una plataforma deportiva pueden contener ubicación.</Item>
              <Item><strong className="text-text-primary">Pulsómetro Bluetooth:</strong> al iniciar una conexión opcional, la app busca un pulsómetro Bluetooth compatible y muestra su frecuencia cardiaca para la sesión. La implementación revisada no la envía al servidor desde esa función.</Item>
              <Item><strong className="text-text-primary">Comunicaciones y contenido:</strong> mensajes privados entre atleta y entrenador, mensajes de grupo, comentarios, feedback de sesiones, solicitudes de soporte y contenido que escribas en formularios.</Item>
              <Item><strong className="text-text-primary">Asistente de IA:</strong> si activas la función y otorgas el permiso mostrado en la app, la consulta y el contexto mínimo necesario para responder pueden incluir datos de entrenamiento, recuperación, preferencias y nutrición. En consultas sobre otro atleta, el código exige también el permiso de esa persona. El proveedor activo se muestra en el aviso de consentimiento; puede variar según la configuración del servicio.</Item>
              <Item><strong className="text-text-primary">Compras y suscripciones:</strong> la plataforma de compra (Apple en iOS o Stripe en web) procesa el pago. TriWaveX recibe información necesaria para validar el producto, el estado de suscripción, renovaciones, cancelaciones o reembolsos y habilitar funciones. Los datos completos de la tarjeta los gestiona la plataforma de pago, no los almacenamos en TriWaveX.</Item>
              <Item><strong className="text-text-primary">Comprobantes de inscripción a carreras:</strong> si solicitas la promoción para atletas, puedes enviar el nombre y fecha de la competición y una imagen o PDF de hasta 4 MB. El archivo se guarda en almacenamiento privado de Supabase, se muestra temporalmente solo al equipo autorizado para revisión manual y se elimina al cerrar la revisión; no se publica ni se comparte con entrenadores.</Item>
              <Item><strong className="text-text-primary">Datos técnicos:</strong> información necesaria para iniciar sesión, seguridad, prevenir abuso, mantener el servicio y diagnosticar errores, como registros de solicitudes y datos técnicos del navegador o dispositivo que el proveedor de hosting pueda generar. No se utiliza esta política para afirmar que no existan registros técnicos de infraestructura.</Item>
            </ul>
          </Section>

          <Section title="3. Para qué los usamos y base del tratamiento">
            <ul className="list-disc space-y-2 pl-5">
              <Item>Crear y proteger tu cuenta, autenticarte y prestar las funciones que solicitas.</Item>
              <Item>Preparar calendarios y planes, mostrar tu progreso y permitir el seguimiento deportivo.</Item>
              <Item>Facilitar la relación que tú establezcas con un entrenador: este podrá ver los datos del plan y seguimiento que la app le muestra para atenderte. En grupos, los mensajes se muestran a sus participantes.</Item>
              <Item>Sincronizar integraciones que conectes y ofrecer funciones opcionales de salud, clima, pulsómetro, notificaciones e inteligencia artificial.</Item>
              <Item>Gestionar suscripciones, compras, soporte, solicitudes de privacidad, seguridad y obligaciones legales.</Item>
            </ul>
            <p>Para las funciones esenciales usamos los datos necesarios para prestarte el servicio solicitado y, cuando proceda, cumplir obligaciones legales. Las integraciones opcionales dependen de tus permisos y de la autorización de cada proveedor. El tratamiento de datos de salud y el uso de IA requieren los permisos o consentimientos específicos que solicite la app. Puedes retirarlos; la retirada no invalida el tratamiento realizado antes de retirarlos. La base jurídica concreta, en particular para ciertos datos de salud introducidos manualmente, debe ser confirmada por el responsable antes de la publicación definitiva.</p>
          </Section>

          <Section title="4. Con quién se comparten">
            <p>No vendemos datos personales ni usamos información de salud para publicidad. Compartimos información solo cuando es necesario para las funciones que utilizas:</p>
            <ul className="list-disc space-y-2 pl-5">
              <Item><strong className="text-text-primary">Entrenador o grupo:</strong> con el entrenador que hayas vinculado y con los miembros del grupo correspondiente, dentro de las vistas y conversaciones de esas funciones.</Item>
              <Item><strong className="text-text-primary">Proveedores de infraestructura:</strong> Supabase proporciona funciones de autenticación, base de datos y comunicación en tiempo real. El proveedor de hosting ejecuta la web y sus servicios de servidor.</Item>
              <Item><strong className="text-text-primary">Apple:</strong> Apple gestiona Sign in with Apple, HealthKit en el dispositivo, WeatherKit y compras de App Store cuando utilizas esas funciones.</Item>
              <Item><strong className="text-text-primary">Comprobantes:</strong> Supabase Storage aloja los documentos en un bucket privado con acceso restringido; el equipo de TriWaveX los consulta mediante enlaces de revisión temporales para decidir si procede una oferta.</Item>
              <Item><strong className="text-text-primary">Integraciones que conectas:</strong> Strava u otro proveedor compatible recibe o entrega los datos necesarios para autorizar la conexión y sincronizar actividades.</Item>
              <Item><strong className="text-text-primary">IA y pagos:</strong> el proveedor de IA indicado en el aviso vigente recibe las consultas autorizadas; Apple o Stripe procesan la compra según el canal utilizado.</Item>
              <Item><strong className="text-text-primary">Autoridades:</strong> solo cuando exista una obligación legal válida o sea necesario proteger derechos y seguridad, de acuerdo con la ley.</Item>
            </ul>
            <p>Los proveedores pueden tratar datos desde distintos países. Las regiones exactas, entidades contractuales y garantías de transferencia aplicables deben verificarse con las cuentas y contratos de producción; no afirmamos que todos los datos permanezcan en el Espacio Económico Europeo.</p>
          </Section>

          <Section title="5. Conservación y eliminación">
            <p>Conservamos los datos mientras mantengas una cuenta y sean necesarios para las funciones indicadas, y después durante el tiempo imprescindible para atender obligaciones legales, reclamaciones, seguridad y copias de respaldo. Los periodos concretos de cada categoría y el ciclo de expiración de las copias deben confirmarse con los proveedores; por eso no prometemos un plazo de borrado de backups que no esté verificado.</p>
            <p>Puedes solicitar la eliminación desde Perfil/Ajustes → Cuenta → Eliminar cuenta. Actualmente la solicitud programa la eliminación de la cuenta a los 30 días y puede cancelarse antes de la fecha indicada. La eliminación de la cuenta no cancela por sí sola una suscripción de Apple ni elimina necesariamente datos que deban conservarse legalmente o copias de seguridad aún dentro de su ciclo de retención. Gestiona la suscripción también desde los ajustes de tu Apple ID o desde el proveedor con el que pagaste.</p>
            <p>Desconectar una integración no equivale a eliminar los datos importados previamente. Puedes solicitar su eliminación junto con los demás datos de cuenta.</p>
          </Section>

          <Section title="6. Tus derechos y controles">
            <p>Puedes solicitar acceso, rectificación, supresión, limitación, oposición y portabilidad cuando sean aplicables; también retirar un consentimiento. Escribe a <a className="font-semibold text-accent underline underline-offset-4" href="mailto:privacy@triwavex.com">privacy@triwavex.com</a> indicando cómo podemos localizar tu cuenta. Podemos pedir información razonable para verificar que eres su titular.</p>
            <p>También puedes gestionar permisos de Salud, Bluetooth, ubicación y notificaciones desde iOS; desconectar proveedores y descargar entrenamientos desde los ajustes disponibles en la app; o reclamar ante la autoridad de protección de datos que corresponda. En España puedes acudir a la <a className="font-semibold text-accent underline underline-offset-4" href="https://www.aepd.es/" target="_blank" rel="noreferrer">Agencia Española de Protección de Datos (AEPD)</a>.</p>
          </Section>

          <Section title="7. Seguridad">
            <p>Aplicamos controles técnicos y organizativos destinados a proteger cuentas y datos, incluidos autenticación, permisos de acceso y medidas de seguridad de la infraestructura. Ningún servicio conectado a Internet puede garantizar seguridad absoluta. Si detectamos una brecha que legalmente deba comunicarse, lo haremos conforme a las obligaciones aplicables.</p>
          </Section>

          <Section title="8. Menores">
            <p>TriWaveX no está diseñado para que menores creen una cuenta sin la autorización que exija la legislación aplicable. La edad mínima y el procedimiento de autorización parental deben confirmarse con el responsable antes de distribuir la app; si crees que un menor nos ha facilitado datos sin la autorización necesaria, contacta con privacidad@triwavex.com.</p>
          </Section>

          <Section title="9. Cambios en esta política">
            <p>Actualizaremos esta página cuando cambien las funciones, los proveedores o las prácticas de tratamiento. En cambios importantes podremos avisarte dentro de la app o pedirte un nuevo consentimiento cuando sea necesario. La fecha de actualización aparece al principio de esta página.</p>
          </Section>

          <Section title="10. Uso deportivo, no médico">
            <p>Los planes, análisis y sugerencias, incluidas las respuestas automáticas, son orientativos para entrenamiento. No constituyen diagnóstico, tratamiento ni consejo médico y pueden ser inexactos. Ante lesión, enfermedad o una preocupación de salud, consulta con un profesional sanitario.</p>
          </Section>
        </div>

        <Link href="/legal/terminos" className="mt-10 inline-flex min-h-11 items-center font-semibold text-accent">Ver términos de uso →</Link>
      </article>
    </main>
  );
}
