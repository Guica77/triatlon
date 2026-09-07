# Fuentes y trazabilidad

Requisitos principales contrastados el 7 de septiembre de 2026. Volver a comprobarlos antes del envío, especialmente SDK, capturas, compras y cuestionarios.

| Tema | Referencia oficial |
| --- | --- |
| Criterios de revisión, permisos IA, compras y funcionalidad | [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/) |
| Preparación del envío | [Submitting](https://developer.apple.com/app-store/submitting/) |
| Requisito SDK desde abril de 2026 | [SDK minimum requirements](https://developer.apple.com/news/?id=ueeok6yw) |
| Inicio de borrado dentro de la app | [Offering account deletion](https://developer.apple.com/support/offering-account-deletion-in-your-app/) |
| Inventario y clasificación de datos | [App Privacy Details](https://developer.apple.com/app-store/app-privacy-details/) |
| Contacto comercial UE | [DSA trader requirements](https://developer.apple.com/help/app-store-connect/manage-compliance-information/manage-european-union-digital-services-act-trader-requirements/) |
| Nombre, subtítulo y campos de la app | [App information](https://developer.apple.com/help/app-store-connect/reference/app-information/app-information) |
| Tamaños de capturas | [Screenshot specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/) |
| Número y carga de capturas | [Upload screenshots](https://developer.apple.com/help/app-store-connect/manage-app-information/upload-app-previews-and-screenshots) |
| Cuestionario de cifrado | [Overview of export compliance](https://developer.apple.com/help/app-store-connect/manage-app-information/overview-of-export-compliance) |
| Cifrado del sistema | [Complying with encryption export regulations](https://developer.apple.com/documentation/Security/complying-with-encryption-export-regulations) |
| Bases de tratamiento, salud y transparencia | [RGPD](https://eur-lex.europa.eu/eli/reg/2016/679) |

Referencias complementarias para la fase de implementación: [manifiestos/SDK](https://developer.apple.com/support/third-party-SDK-requirements/) y [EULA estándar](https://www.apple.com/legal/internet-services/itunes/dev/stdeula/). Revisar su aplicación sobre el cliente definitivo.

## Evidencia local

Se conservaron resultados de pruebas, lint, builds, smoke HTTP y los dos informes JSON de vulnerabilidades. Las rutas y funciones de la auditoría remiten al código propio revisado. Los JSON de audit incluyen enlaces a cada aviso y sus rangos afectados; no deben interpretarse como una explotación demostrada.

Los resultados remotos citados por `docs/verification-2026-09-04.md` son históricos. Este paquete no certifica que los proveedores estén habilitados, que las migraciones coincidan con producción ni que las cuentas de revisión existan.
