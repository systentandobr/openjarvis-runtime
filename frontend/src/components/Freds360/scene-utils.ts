/** Gate de animação da cena — movimento manual && aba visível && sem reduced-motion. */
export function resolveAnimate(moving: boolean, hidden: boolean, reduced: boolean): boolean {
  return moving && !hidden && !reduced;
}

/** Parallax decorativo limitado a ±8px (F360-04). */
export const PARALLAX_MAX_PX = 8;

export function parallaxDelta(ratio: number): number {
  return Math.max(-1, Math.min(1, ratio)) * PARALLAX_MAX_PX;
}
