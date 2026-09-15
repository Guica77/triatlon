# Perfil nativo SwiftUI

## Objetivo

Sustituir el menú de Perfil nativo por un centro de control SwiftUI útil y completo. Ningún elemento interactivo abrirá una pantalla vacía ni cambiará a WebKit para consultar o editar ajustes del atleta.

## Resultado para la persona usuaria

La pestaña Perfil mostrará, de arriba abajo:

1. Identidad del atleta (nombre, nivel y objetivo activo).
2. Un resumen de preparación actual: readiness, HRV, sueño y fatiga, con estado sin datos cuando no haya métricas.
3. Acciones rápidas para editar los datos personales, el objetivo y los dispositivos.
4. Secciones de ajustes agrupadas y navegables.

Cada pantalla de detalle será SwiftUI y tendrá estados de carga, vacío, error y guardado. Las integraciones aún no disponibles (Garmin) se verán como no disponibles, sin un control que sugiera una acción inexistente.

## Arquitectura

### Contrato nativo

Se añadirá `/api/native/athlete/profile` protegido igual que el endpoint nativo de progreso:

- Requiere `X-TriWaveX-Native: 1` y la sesión autenticada de cookies de WebKit.
- Solo permite el rol `athlete`.
- `GET` devuelve un DTO exclusivo de la app: identidad, objetivo, fisiología, lesiones, nutrición, conexiones, preferencias de notificaciones y el último estado de recuperación.
- `PATCH` acepta una actualización parcial con campos permitidos por sección. Valida tipos, límites y listas antes de escribir únicamente el perfil del usuario autenticado.
- No devuelve datos sensibles, credenciales de proveedores ni payloads de salud sin procesar.

El cliente Swift reutilizará la estrategia de cookies, origen permitido y errores de `AthleteProgressClient`. Un `NativeProfileModel` central cargará el DTO, expondrá guardado por sección y actualizará el estado local solo después de una respuesta correcta.

### Vistas SwiftUI

`NativeProfileView` reemplazará el actual menú de filas. Usará `NavigationStack` y pantallas pequeñas, cada una con una responsabilidad:

- `ProfileOverviewView`: cabecera, preparación y acciones rápidas.
- `PersonalProfileView`: nombre, nivel y objetivo visible.
- `PlanGoalView`: prueba objetivo, fecha y tiempos objetivo.
- `PhysiologyView`: FTP, ritmos y horas base; muestra zonas calculadas a partir de esos datos.
- `InjuryHistoryView`: lista, alta y baja de lesiones.
- `NutritionSettingsView`: tasa de sudor y carbohidratos por hora.
- `ConnectionsView`: estado de Salud, Apple Watch, pulsómetro y Strava. Reutiliza el selector de dispositivos existente; Garmin se presenta como “Próximamente”.
- `WeatherAndNotificationsView`: ubicación, tiempo local y un interruptor para avisos. El tiempo de una sesión sigue viéndose también en la tarjeta del entrenamiento.
- `DataAndAccountView`: exportación, privacidad, ayuda y cuenta. Las acciones destructivas permanecen protegidas por confirmación explícita.

## Navegación

La pestaña Perfil muestra siempre `NativeProfileView`, no `ProfileMenuView` ni WebKit. Las subpantallas se apilan dentro de la navegación nativa y el botón Atrás devuelve al perfil. La pestaña conserva el estado cargado durante la sesión; al volver a Perfil se refresca si los datos tienen más de cinco minutos o tras guardar.

Los destinos que dependen de una acción fuera del perfil (chat, autorización de Strava, correo de soporte) se abren mediante los mecanismos nativos existentes, con texto que explica qué ocurrirá antes de salir de la pantalla.

## Estados y errores

- Carga inicial: esqueleto de cabecera y filas.
- Sin preparación: “Aún no hay datos de recuperación” y enlace a Dispositivos.
- Sin objetivo: llamada a definir una prueba, no una tarjeta vacía.
- Fallo de red o sesión: mensaje claro y botón Reintentar; una sesión caducada dirige a inicio de sesión.
- Guardado: botón desactivado mientras se procesa y confirmación accesible al terminar.

## Pruebas

- Pruebas de ruta para autorización, validación, filtrado de campos y aislamiento por usuario de `GET` y `PATCH`.
- Pruebas de decodificación Swift para el DTO, errores HTTP y actualizaciones parciales.
- Pruebas de navegación/estado de `NativeProfileModel` para carga, vacío, error y guardado.
- Verificación manual en simulador: abrir Perfil desde Hoy, editar cada sección, volver y comprobar el dato actualizado; confirmar que ninguna fila abre una vista vacía.

## Fuera de alcance

- No se implementará la integración directa con Garmin ni se activará sin su aprobación.
- No se modificará el onboarding web ni se duplicarán sus flujos de pago.
- No se guardarán datos nuevos de HealthKit desde Perfil: solo se visualizará la última sincronización y se enlazará al flujo de dispositivos ya existente.
