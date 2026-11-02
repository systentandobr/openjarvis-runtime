/** Gate de animação da cena — movimento manual && aba visível && sem reduced-motion. */
export function resolveAnimate(moving: boolean, hidden: boolean, reduced: boolean): boolean {
  return moving && !hidden && !reduced;
}

/** Parallax decorativo limitado a ±8px (F360-04). */
export const PARALLAX_MAX_PX = 8;

export function parallaxDelta(ratio: number): number {
  return Math.max(-1, Math.min(1, ratio)) * PARALLAX_MAX_PX;
}

/** Posição determinística em órbita elíptica do palco (viewBox 1000×660, centro 500,335).
 *  Mesma entrada → mesma posição entre snapshots; sem colisão quando total muda. */
export function orbitPosition(index: number, total: number, rx: number, ry: number): { x: number; y: number } {
  const angle = -Math.PI / 2 + (index / Math.max(total, 1)) * Math.PI * 2;
  return {
    x: Math.round(((500 + rx * Math.cos(angle)) / 10) * 10) / 10,
    y: Math.round(((335 + ry * Math.sin(angle)) / 6.6) * 10) / 10,
  };
}

/** Raios das órbitas em px do viewBox — externa: serviços; interna: agentes. */
export const ORBIT_SERVICE = { rx: 300, ry: 220 };
export const ORBIT_AGENT = { rx: 190, ry: 150 };
