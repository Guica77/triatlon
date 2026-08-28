/**
 * fetchWithTimeout — evita que llamadas a APIs externas cuelguen la app.
 *
 * Sin timeout, un fetch a una API lenta o caída puede bloquear la
 * renderización del servidor (páginas RSC) o una acción de usuario
 * indefinidamente. Este helper aborta la petición tras `timeoutMs`.
 */
export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit,
  timeoutMs = 8000
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}
