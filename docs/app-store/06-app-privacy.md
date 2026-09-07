# Inventario para App Privacy

Documento interno. **No seleccionar «Data Not Collected».** Hay persistencia en servidor. Las etiquetas definitivas deben corresponder al binario y backend distribuidos, incluidos sus proveedores.

## Respuestas iniciales y pendientes

| Tipo de Apple | Evidencia del proyecto | Declaración provisional | Finalidad propuesta |
| --- | --- | --- | --- |
| Name / Email Address | Perfil y autenticación | Recopilados, vinculados a identidad | Funcionalidad |
| User ID | IDs de Supabase y plataformas deportivas | Recopilados, vinculados | Funcionalidad |
| Health | Lesiones, alergias, sueño y recuperación | Recopilados, vinculados | Funcionalidad / personalización según uso |
| Fitness | Entrenamientos, distancias, ritmos, potencia | Recopilados, vinculados | Funcionalidad / personalización |
| Emails or Text Messages | Chat individual y de grupo | Recopilados, vinculados | Funcionalidad |
| Other User Content | Feedback, preferencias y consultas IA | Revisar clasificación por cada campo; vinculados | Funcionalidad / personalización |
| Precise Location | Recorridos `summary_polyline` y `raw_payload` de Strava | Declarar si se conservan rutas precisas; vinculados | Funcionalidad |
| Coarse Location | Localización aproximada si se guarda separadamente | PENDIENTE de inventario | Según uso real |
| Customer Support | Consultas al soporte una vez operativo | PENDIENTE de canal y retención | Funcionalidad |
| Purchase History | Futuras transacciones verificadas | PENDIENTE; hoy hay estados simulados | Funcionalidad |
| Device ID | Endpoint de push y futuros identificadores nativos | Clasificar según lo que identifique y se conserve | Funcionalidad |
| Diagnostics / Usage Data | Logs y posibles métricas del despliegue | PENDIENTE de hosting/SDK | Seguridad, diagnóstico o analítica según uso |
| Photos, Video, Audio, Contacts | No se acreditó flujo de captura activo | No inferir recopilación por un botón; comprobar build final | PENDIENTE si se implementa |

No duplicar un mismo dato mecánicamente: revisar las definiciones y cada práctica. Una ruta importada desde Strava también puede ser ubicación aunque iOS nunca pida permiso GPS.

## Vinculación y tracking

Los datos guardados con el ID del perfil están vinculados al usuario; no declararlos anónimos por tener un UUID. No se encontró publicidad comportamental en los flujos revisados. **«No tracking» queda pendiente de comprobar hosting, SDK nativos, analítica y contratos de terceros.** Compartir datos con un proveedor no equivale automáticamente a tracking; evaluar el uso real.

## IA y consentimiento

Registrar por finalidad: proveedor activo, categorías enviadas, versión del aviso, fecha de permiso y retirada. Revisar por separado embeddings y generación, porque ambos pueden transmitir consultas. Impedir el envío cuando falte consentimiento y comprobar también datos de atletas consultados por entrenadores.

## Evidencia antes del envío

1. Inventariar tablas/campos, SDK, dominios de red y logs con datos sintéticos.
2. Confirmar finalidades y conservación de Supabase, hosting, Gemini/Anthropic, correo y deportes conectados.
3. Ajustar esta tabla y la política pública para que coincidan.
4. Revisar el privacy report del archivo iOS y sus SDK.
5. Completar en App Store Connect cada tipo, finalidad, vínculo y tracking; guardar captura interna de las respuestas.

Fuente: [App Privacy Details](https://developer.apple.com/app-store/app-privacy-details/). Este documento es una propuesta de clasificación, no una declaración ya enviada.
