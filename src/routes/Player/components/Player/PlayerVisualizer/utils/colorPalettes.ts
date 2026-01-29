import * as THREE from 'three'

/**
 * Generate a 5-color palette from a single hue value (0-360).
 *
 *  0: vivid base       — hsl(hue, 90%, 55%)
 *  1: light tint        — hsl(hue, 60%, 80%)
 *  2: darker analogous  — hsl(hue+15, 95%, 40%)
 *  3: muted shadow      — hsl(hue-15, 50%, 30%)
 *  4: complementary     — hsl(hue+180, 70%, 50%)
 */
export function generatePaletteFromHue (hue: number): THREE.Color[] {
  const h = ((hue % 360) + 360) % 360 // normalise to [0, 360)
  return [
    new THREE.Color().setHSL(h / 360, 0.90, 0.55),
    new THREE.Color().setHSL(h / 360, 0.60, 0.80),
    new THREE.Color().setHSL(((h + 15) % 360) / 360, 0.95, 0.40),
    new THREE.Color().setHSL(((h - 15 + 360) % 360) / 360, 0.50, 0.30),
    new THREE.Color().setHSL(((h + 180) % 360) / 360, 0.70, 0.50),
  ]
}

/**
 * Get a color from a hue-generated palette based on a normalised value (0-1).
 */
export function getColorFromPalette (
  hue: number,
  value: number,
  target?: THREE.Color,
): THREE.Color {
  const colors = generatePaletteFromHue(hue)
  const t = Math.max(0, Math.min(1, value))
  const index = t * (colors.length - 1)
  const i = Math.floor(index)
  const f = index - i

  const color = target ?? new THREE.Color()

  if (i >= colors.length - 1) {
    return color.copy(colors[colors.length - 1])
  }

  return color.copy(colors[i]).lerp(colors[i + 1], f)
}

/**
 * Convert hue-generated palette to a flat Float32Array for shaders.
 * Each color is 3 floats (r, g, b).
 */
export function getPaletteAsUniform (hue: number): Float32Array {
  const colors = generatePaletteFromHue(hue)
  const data = new Float32Array(colors.length * 3)

  colors.forEach((color, i) => {
    data[i * 3] = color.r
    data[i * 3 + 1] = color.g
    data[i * 3 + 2] = color.b
  })

  return data
}

/**
 * Get the number of colors in a hue-generated palette (always 5).
 */
export function getPaletteLength (): number {
  return 5
}
