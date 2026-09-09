import { TriWaveXMark } from './triwavex-mark'

/** A compact, brand-led loading state shared by athlete screens. */
export function AppleLoadingMark({ label = 'Cargando TriWaveX', className = '' }: { label?: string; className?: string }) {
  return (
    <div className={`apple-loading-mark ${className}`} role="status" aria-live="polite" aria-label={label}>
      <div className="apple-loading-mark__orb" aria-hidden="true">
        <TriWaveXMark className="apple-loading-mark__logo" />
      </div>
      <span className="apple-loading-mark__label">{label}</span>
    </div>
  )
}
