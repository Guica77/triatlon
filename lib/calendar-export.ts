/** Escapa texto para el formato iCalendar sin exponer helpers desde una ruta HTTP. */
export function escapeIcsText(value: unknown): string {
  return String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/\r\n|\r|\n/g, '\\n')
    .replace(/([,;])/g, '\\$1')
}
