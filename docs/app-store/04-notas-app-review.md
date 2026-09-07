# Notas para App Review

Plantilla en inglés para completar tras cerrar bloqueos. No enviar con campos pendientes ni credenciales de producción. Introducir contraseñas solo en el apartado privado de App Store Connect; no guardarlas en Git.

## Review contact

First name: PENDIENTE
Last name: PENDIENTE
Email: PENDIENTE
Phone, including country code: PENDIENTE

## Sign-in information

Sign-in required: Yes.

Athlete review account: PENDIENTE — enter credentials in App Store Connect.
Coach review account: PENDIENTE — include only if the submitted build offers coach features.
Both accounts must contain synthetic information and be linked to each other before submission. Keep the review environment available throughout the review period.

## Notes to paste after validation

Triatlón Pro helps athletes organize swimming, cycling and running sessions and follow their training progress. The interface is in Spanish.

To review the athlete flow:
1. Sign in using the supplied athlete account.
2. Open the training calendar and select a scheduled workout.
3. Review workout details and record completion/feedback using the synthetic test session.
4. Open analytics and recovery to review the test account's available data.
5. Open Chat to view the conversation with the linked coach review account.
6. Open Perfil y ajustes to review profile settings and data export.

Account deletion is located in Perfil y ajustes → Eliminar cuenta. Enter ELIMINAR and confirm. Use the additional disposable review account supplied in the private review information to test deletion.

Network access is required for server-backed features. External sports accounts are optional unless explicitly indicated in the final build scope below. No physical sports device should be required to explore the preloaded synthetic workout data.

Final build scope and limitations: PENDIENTE — list the features actually included, supported sign-in methods, integrations and device requirements.

Business model: PENDIENTE — explain free access or the exact in-app purchases, restoration path and included features.

Third-party AI: PENDIENTE — state whether enabled. If enabled, explain where users see the provider/data disclosure, grant explicit permission, and withdraw it. Do not claim this is implemented until tested.

## Antes de copiar

- Confirmar rutas con el cliente iOS final; actualmente corresponden a la web.
- Crear una tercera cuenta desechable si se facilita la prueba de borrado.
- No proporcionar la cuenta personal del titular ni datos de atletas reales.
- No afirmar que existe Sign in with Apple operativo por el mero hecho de tener un botón.
- Si Apple necesita un paso especial, describirlo exactamente; evitar puertas traseras que oculten fallos.
