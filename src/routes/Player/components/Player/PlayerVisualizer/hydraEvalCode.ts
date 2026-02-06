export const DEFAULT_PATCH = `
osc(20, 0.1, () => a.fft[0] * 2)
  .color(1, 0.5, () => 0.5 + a.fft[2] * 0.5)
  .modulate(noise(3), () => a.fft[1] * 0.4)
  .modulate(voronoi(5, () => 1 + a.fft[0] * 2), () => a.fft[1] * 0.2)
  .rotate(() => a.fft[1] * 0.5)
  .kaleid(() => 2 + a.fft[0] * 4)
  .saturate(() => 0.6 + a.fft[3] * 0.4)
  .out()
`.trim()

export function getHydraEvalCode (code?: string): string {
  if (typeof code === 'string' && code.trim().length > 0) {
    return code
  }
  return DEFAULT_PATCH
}
