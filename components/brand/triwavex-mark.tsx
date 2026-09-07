import Image from 'next/image';

/** Unmodified 84 × 84 logo group extracted from the supplied identity SVG. */
export function TriWaveXMark({ className, title }: { className?: string; title?: string }) {
  return <Image src="/brand/triwavex-mark.svg" width={84} height={84} alt={title || ''} className={className} priority />;
}
