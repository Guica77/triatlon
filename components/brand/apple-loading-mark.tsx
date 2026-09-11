/** A quiet, platform-native loading state shared by athlete screens. */
export function AppleLoadingMark({ label = 'Cargando TriWaveX', className = '' }: { label?: string; className?: string }) {
  return (
    <div className={`apple-loading-mark ${className}`} role="status" aria-live="polite" aria-label={label}>
      <span className="apple-loading-mark__spinner" aria-hidden="true" />
      <span className="apple-loading-mark__label">{label}</span>
    </div>
  )
}
