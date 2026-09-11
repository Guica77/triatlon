# Diseño: experiencia Apple clara para TriWaveX

## Objetivo

Reparar la compilación de la aplicación iOS y unificar la aplicación SwiftUI y la web pública bajo una interfaz clara, sobria y familiar para usuarios de Apple. La experiencia debe priorizar los controles y convenciones de cada plataforma, sin alterar autenticación, navegación ni datos existentes.

## Alcance

### Aplicación iOS

- Eliminar el bloque duplicado que empieza después del cierre de `RootView`. Ese código al nivel superior es la causa de los errores de llaves, miembros sin contexto y valores fuera de ámbito.
- Usar fondos semánticos del sistema (`systemBackground` y `systemGroupedBackground`), superficies blancas, separadores suaves y el azul del sistema como tinte principal.
- Conservar `NavigationStack`, `Form`, `Picker`, `TextField`, `SecureField`, `ContentUnavailableView` y la barra de pestañas nativos.
- Usar SF Symbols coherentes para credenciales, ayuda, progreso y navegación.
- Mantener el control oficial `SignInWithAppleButton`, en su variante negra sobre una pantalla clara, sin crear una imitación del inicio de sesión de Apple.
- Quitar el aviso no accionable de que Google no está disponible.

### Web pública

- Sustituir la identidad visual de dorsal y alto contraste por una paleta clara basada en blanco del sistema, grises de iOS y azul de Apple; los colores de las disciplinas se reservan para información deportiva.
- Adoptar tipografía del sistema como base, radios y bordes discretos, y jerarquía de tarjetas similar a las superficies iOS.
- Mantener el contenido, rutas, CTAs, accesibilidad, diseño adaptable y las animaciones que respetan `prefers-reduced-motion`.
- Usar iconos de la familia existente en la web con trazo y tamaños consistentes; SF Symbols se limitan a la app, donde son nativos.

## Decisiones

1. La app no se forzará a modo claro: empleará colores semánticos de SwiftUI para mantener contraste correcto y adaptación futura, con una apariencia luminosa por defecto.
2. La web se rediseñará desde los tokens globales y componentes compartidos antes de ajustar las secciones; así no se mezclan identidades visuales.
3. La autenticación y las llamadas al servidor no cambiarán. Solo se modifica presentación y se repara la estructura sintáctica de `RootView`.

## Flujo y errores

- El acceso por correo y Apple conserva sus validaciones, estados de carga y mensajes existentes.
- El botón Apple se deshabilita durante una petición, como ahora.
- Las pantallas de carga y fallo siguen ofreciendo reintento y alternativa web.

## Verificación

- Compilar el objetivo iOS y confirmar que desaparecen los errores de nivel superior y de ámbito de `RootView`.
- Ejecutar las comprobaciones disponibles de la web y confirmar que no hay errores de tipos o lint.
- Revisar la interfaz en tamaños compactos y amplios, con texto grande y reducción de movimiento.
