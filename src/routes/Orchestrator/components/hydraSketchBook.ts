// Curated audio-reactive Hydra sketches
// Inspired by Ritchse's hydra examples (CC BY-NC-SA 4.0)
// Converted to use audio globals for real-time reactivity

export const DEFAULT_SKETCH = `// Audio-reactive kaleidoscope
osc(20, 0.1, () => bass() * 2)
  .color(1, 0.5, () => treble())
  .modulate(noise(3), () => beat() * 0.4)
  .modulate(voronoi(5, () => energy() * 2), () => beat() * 0.2)
  .rotate(() => mid() * 0.5)
  .kaleid(() => 2 + beat() * 4)
  .saturate(() => 0.6 + energy() * 0.4)
  .out()`

export const SKETCHES: string[] = [
  // 1. Voronoi energy field
  `voronoi(8, () => energy(), () => beat() * 0.3)
  .color(0.5, 0.3, 1)
  .modulateRotate(osc(3), () => mid() * 0.2)
  .brightness(() => bright() * 0.3)
  .out()`,

  // 2. Feedback tunnel
  `src(o0)
  .scale(() => 1.01 + beat() * 0.02)
  .rotate(() => 0.01 + mid() * 0.02)
  .blend(osc(3, 0.1, () => bass()), 0.05)
  .saturate(() => 1.2 + treble() * 0.5)
  .out()`,

  // 3. Noise plasma
  `noise(10, () => bpm() * 0.5)
  .color(() => bass(), () => mid(), () => treble())
  .rotate(() => energy() * 0.3)
  .modulate(osc(3, 0.1), () => beat() * 0.2)
  .brightness(() => -0.2 + bright() * 0.4)
  .out()`,

  // 4. Shape pulse
  `shape(6, () => 0.3 + beat() * 0.3, 0.01)
  .color(() => bass(), 0.2, () => treble())
  .repeat(3, 3)
  .rotate(() => mid() * 0.2)
  .modulate(noise(2), () => energy() * 0.1)
  .out()`,

  // 5. Oscillator stack
  `osc(10, 0.1, () => bass())
  .add(osc(20, 0.2, () => mid()), 0.5)
  .color(1, () => treble(), () => bright())
  .kaleid(() => 3 + beat() * 3)
  .rotate(() => bpm() * 0.1)
  .out()`,

  // 6. Modulate cascade
  `osc(5, 0.1, () => bass() * 2)
  .modulateScale(noise(3), () => mid() * 0.5)
  .modulateRotate(osc(1), () => beat() * 0.3)
  .color(() => treble(), 0.5, () => energy())
  .saturate(() => 1.5 + bright() * 0.5)
  .out()`,

  // 7. Gradient drift
  `gradient(0.5)
  .color(() => bass(), () => mid(), () => treble())
  .modulate(voronoi(10, () => energy()), () => beat() * 0.3)
  .rotate(() => bpm() * 0.05)
  .pixelate(() => 20 + bright() * 80, () => 20 + bright() * 80)
  .out()`,

  // 8. Dual-buffer feedback
  `osc(8, 0.1, () => bass() * 3)
  .color(1, 0.5, () => treble())
  .diff(src(o0).rotate(() => 0.01 + mid() * 0.01))
  .saturate(() => 1 + energy() * 2)
  .brightness(() => beat() * 0.1)
  .out()`,

  // 9. Voronoi kaleidoscope
  `voronoi(15, () => bass() * 0.5, () => mid() * 0.3)
  .kaleid(() => 4 + beat() * 4)
  .color(() => treble(), 0.3, () => energy())
  .modulate(noise(2), () => bright() * 0.2)
  .rotate(() => bpm() * 0.1)
  .out()`,

  // 10. Scrolling waveform
  `osc(30, 0.05, () => bass())
  .scrollX(() => mid() * 0.2)
  .scrollY(() => treble() * 0.1)
  .color(() => beat(), 0.3, () => energy())
  .modulate(noise(3), () => bright() * 0.1)
  .kaleid(4)
  .out()`,

  // 11. Neon rings
  `shape(64, () => 0.5 + bass() * 0.3, 0.5)
  .scale(() => 1 + beat() * 0.5)
  .color(0, () => mid(), () => treble())
  .add(shape(3, 0.2, 0.01).color(() => energy(), 0, () => bright()), 0.5)
  .rotate(() => bpm() * 0.05)
  .out()`,

  // 12. Noise erosion
  `noise(5, () => bass() * 0.5)
  .thresh(() => 0.3 + mid() * 0.4)
  .color(() => treble(), () => beat(), () => energy())
  .modulateScale(osc(2), () => bright() * 0.3)
  .rotate(() => bpm() * 0.02)
  .out()`,
]

/**
 * Returns a random sketch from SKETCHES, avoiding the current one.
 *
 * Deterministic when seed and counter are provided (seeded PRNG using
 * seed + counter). Falls back to Math.random() when seed is undefined.
 *
 * Random is LOCAL-ONLY — it changes the editor code but does NOT dispatch
 * to the server. The user must explicitly Send (Ctrl+Enter) to share.
 * This avoids spamming collaborators with rapid random clicks.
 */
export function getRandomSketch (
  current?: string,
  seed?: number,
  counter?: number,
): string {
  const candidates = current
    ? SKETCHES.filter(s => s !== current)
    : SKETCHES

  if (candidates.length === 0) return SKETCHES[0]

  let index: number
  if (seed != null && counter != null) {
    // Simple seeded PRNG (mulberry32-inspired)
    index = seededIndex(seed + counter, candidates.length)
  } else {
    index = Math.floor(Math.random() * candidates.length)
  }

  return candidates[index]
}

function seededIndex (seed: number, length: number): number {
  // mulberry32
  let t = (seed + 0x6D2B79F5) | 0
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  const result = ((t ^ (t >>> 14)) >>> 0) / 4294967296
  return Math.floor(result * length)
}
