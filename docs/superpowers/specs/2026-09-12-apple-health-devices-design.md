# Apple Health y dispositivos conectados

## Objetivo

TriWaveX leerá las métricas de recuperación directamente de Apple Health en el iPhone, incluidas las registradas por Apple Watch. El atleta no introducirá cifras de ejemplo ni formularios manuales para sueño, VFC o frecuencia cardiaca en reposo.

Perfil incluirá una pantalla nativa de **Dispositivos** que explica las conexiones y el tipo de dato que aporta cada una. La web enseña el estado sincronizado, pero la autorización de Salud ocurre solo dentro de la app iOS.

## Decisiones

- La primera integración es Apple Health/Apple Watch; Garmin y otros proveedores se mantienen como conexiones futuras o existentes, sin fingir que proporcionan datos de Salud.
- TriWaveX solicita solo lectura de: sueño, variabilidad de frecuencia cardiaca (VFC/HRV SDNN), frecuencia cardiaca en reposo y entrenamientos.
- Nunca solicita permisos de escritura en Salud ni conserva muestras crudas de HealthKit en el servidor.
- Strava sigue mostrando actividades y rutas. No marca un dispositivo como fuente de recuperación.
- La fuente de las métricas se conserva por día: `apple_health` y hora de actualización. Las métricas manuales actuales dejan de ser la vía de recuperación de la pantalla principal.

## Experiencia

### Perfil

En **Perfil > Dispositivos conectados** habrá una lista al estilo Ajustes:

1. **Salud**: estado Conectado / Requiere permiso / Sin datos recientes.
2. **Apple Watch**: visible si HealthKit identifica una fuente Apple Watch; explica que aporta entrenos, pulso, sueño y VFC.
3. **Pulsómetro**: solo aparece como conectado si una lectura de Salud identifica ese accesorio; de lo contrario se muestra como no conectado.
4. **Strava**: aparece de forma independiente y solo describe actividades y rutas.

La fila Salud abre una hoja SwiftUI con la explicación de privacidad y un único botón, **Conectar Salud** o **Actualizar ahora**. El estado se expresa con texto y SF Symbols estándar; no hay insignias decorativas, gradientes ni métricas de ejemplo.

### Recuperación

Al abrir la aplicación, la app intenta actualizar HealthKit si ya tiene permiso. La tarjeta de recuperación muestra las métricas de hoy cuando hay muestras válidas. Si falta alguna métrica, muestra “Esperando datos de Salud” y un enlace a Dispositivos; no muestra campos ni valores de relleno.

La recomendación solo se calcula cuando están presentes todas las entradas necesarias para el cálculo. Si Salud aún no ha escrito sueño o VFC para el día, el entrenamiento permanece disponible sin presentar una recomendación de recuperación como si fuera real.

## Arquitectura

### iOS

- Añadir la capacidad HealthKit y las explicaciones de privacidad de lectura a `TriWaveX.entitlements` e `TriWaveX-Info.plist`.
- Crear `HealthKitService`, aislado del WebView, que comprueba disponibilidad, solicita autorización y consulta datos recientes.
- El servicio obtiene el intervalo de sueño de la última noche, la muestra diaria más reciente de VFC SDNN y frecuencia cardiaca en reposo, y entrenamientos desde la última sincronización. Identifica la fuente de cada muestra para distinguir Apple Watch y accesorios.
- Después de una lectura válida, `ProductView` transmite un resumen mínimo y validado a la sesión web existente mediante el mismo patrón de petición nativa que Strava. No expone cookies, tokens ni muestras completas a SwiftUI o JavaScript.
- La actualización ocurre al autorizar, al entrar en la app y al pulsar “Actualizar ahora”. HealthKit no garantiza entrega en segundo plano; el diseño no promete sincronización instantánea si el usuario no abre la app.

### Entrenamientos con pulso en directo

La lectura histórica de Salud y la frecuencia en directo son flujos distintos. TriWaveX añadirá una única sesión nativa en directo con dos posibles fuentes:

1. **Apple Watch**: un objetivo watchOS compañero inicia una `HKWorkoutSession` y usa `HKLiveWorkoutBuilder` para recibir la frecuencia cardiaca durante un entrenamiento activo. WatchConnectivity entrega las muestras al iPhone.
2. **Pulsómetro Bluetooth**: un gestor CoreBluetooth en el iPhone busca el servicio estándar Heart Rate, se vincula al accesorio elegido y recibe las notificaciones de frecuencia cardiaca.

La banda Bluetooth tiene prioridad sobre Apple Watch cuando ambas fuentes están disponibles, porque es la fuente elegida explícitamente para ese entrenamiento. La pantalla muestra una sola fuente activa, su estado de conexión y la lectura actual; nunca mezcla las dos curvas ni presenta dos valores de pulso.

La vista de entrenamiento nativa muestra pulso actual, zona de pulso objetivo y el nombre de la fuente. Al salir de la zona se muestra una indicación visual discreta y accesible. Al terminar, se guarda un resumen de la sesión y sus muestras se asocian al entrenamiento; no se transmite una secuencia en directo al servidor para cada latido.

Si el Apple Watch no está disponible o la banda pierde conexión, TriWaveX intenta el otro origen permitido y comunica el cambio. Si no hay otra fuente, mantiene el último valor claramente marcado como no actualizado y ofrece reconectar, sin inventar pulso.

### Backend y datos

- Añadir `POST /api/native/health/sync`, limitado a llamadas con `X-TriWaveX-Native: 1`, mismo origen y sesión de atleta autenticada.
- El endpoint valida rangos, recibe solo fecha local, sueño agregado, VFC, FC en reposo, identificadores de fuente no sensibles y momento de lectura.
- Una migración añade a `user_biometrics` `source` y `source_updated_at`, y permite distinguir `apple_health` de datos anteriores sin crear otra tabla de salud.
- Otra migración permite que `user_connected_devices` guarde `apple_health` como conexión local sin token OAuth, conservando las reglas de seguridad de la tabla. Solo la ruta nativa verificada puede crear o actualizar esa fila para el usuario autenticado.
- La ruta recalcula readiness en servidor solo con las métricas recibidas y los valores subjetivos ya existentes del atleta; si faltan datos subjetivos, deja readiness sin calcular en lugar de inventarlos.
- Las pantallas web consultan la misma biometría y el estado de dispositivo persistido, por lo que muestran la última sincronización real aun cuando se abran fuera de iOS.

## Estados y errores

- HealthKit no disponible: la fila explica que requiere iPhone; no ofrece un flujo de conexión falso.
- Permiso denegado: muestra “Permiso necesario” y abre Ajustes de Salud cuando iOS lo permite.
- Apple Watch no emparejado o sin muestras: Salud puede estar conectada pero la app muestra “Esperando datos recientes”.
- Error de red tras leer el reloj: los datos siguen en el teléfono y la interfaz ofrece “Reintentar”; no borra la última sincronización válida.
- Una respuesta o sesión no autorizada no escribe biometría ni crea una conexión.
- Durante un entrenamiento, si ambas fuentes están disponibles, la banda Bluetooth conserva prioridad. Un cambio de fuente queda marcado en el resumen de la sesión.

## Verificación

- Pruebas unitarias de normalización y validación de muestras HealthKit, incluyendo datos ausentes y rangos inválidos.
- Pruebas de la ruta nativa: rechaza web/no autenticado, escribe únicamente para el atleta de la sesión y no acepta campos ajenos.
- Pruebas de la pantalla de recuperación: sin Salud no hay números ni recomendación inventada; con resumen válido muestra la fuente y hora.
- `swiftc -parse` para las fuentes iOS y una compilación de Xcode con la capacidad HealthKit.
- Prueba manual en un iPhone físico con Apple Watch y datos de Salud. El simulador no valida datos de reloj.
- Prueba manual con una banda Bluetooth compatible con el perfil estándar Heart Rate: conexión, pérdida de señal, reconexión y prioridad frente al Apple Watch.
