export const DEFAULT_PATCH = `
osc(20, 0.1, () => bass() * 2)
  .color(1, 0.5, () => treble())
  .modulate(noise(3), () => beat() * 0.4)
  .modulate(voronoi(5, () => energy() * 2), () => beat() * 0.2)
  .rotate(() => mid() * 0.5)
  .kaleid(() => 2 + beat() * 4)
  .saturate(() => 0.6 + energy() * 0.4)
  .out()
`.trim()

export function getHydraEvalCode (code?: string): string {
  if (typeof code === 'string' && code.trim().length > 0) {
    return code
  }
  return DEFAULT_PATCH
}
