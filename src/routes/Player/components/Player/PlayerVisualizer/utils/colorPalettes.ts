import * as THREE from 'three'
import type { ColorPalette } from 'shared/types'

// Palette definitions as hex strings for readability
const PALETTE_HEX: Record<ColorPalette, string[]> = {
  warm: ['#ff6b35', '#f7c59f', '#eb5e28', '#8b0000', '#ff9a5a'],
  cool: ['#00b4d8', '#0077b6', '#90e0ef', '#023e8a', '#48cae4'],
  neon: ['#ff00ff', '#00ffff', '#ff6600', '#00ff00', '#ff0066'],
  monochrome: ['#ffffff', '#cccccc', '#888888', '#444444', '#666666'],
  rainbow: ['#ff0000', '#ff7f00', '#ffff00', '#00ff00', '#0000ff', '#8b00ff'],
}

// Pre-computed THREE.Color arrays for performance
export const COLOR_PALETTES: Record<ColorPalette, THREE.Color[]> = {
  warm: PALETTE_HEX.warm.map(hex => new THREE.Color(hex)),
  cool: PALETTE_HEX.cool.map(hex => new THREE.Color(hex)),
  neon: PALETTE_HEX.neon.map(hex => new THREE.Color(hex)),
  monochrome: PALETTE_HEX.monochrome.map(hex => new THREE.Color(hex)),
  rainbow: PALETTE_HEX.rainbow.map(hex => new THREE.Color(hex)),
}

/**
 * Get a color from the palette based on a normalized value (0-1)
 */
export function getColorFromPalette (
  palette: ColorPalette,
  value: number,
  target?: THREE.Color,
): THREE.Color {
  const colors = COLOR_PALETTES[palette]
  const t = Math.max(0, Math.min(1, value))
  const index = t * (colors.length - 1)
  const i = Math.floor(index)
  const f = index - i

  const color = target ?? new THREE.Color()

  if (i >= colors.length - 1) {
    return color.copy(colors[colors.length - 1])
  }

  // Interpolate between adjacent colors
  return color.copy(colors[i]).lerp(colors[i + 1], f)
}

/**
 * Get a random color from the palette
 */
export function getRandomColorFromPalette (palette: ColorPalette): THREE.Color {
  const colors = COLOR_PALETTES[palette]
  const index = Math.floor(Math.random() * colors.length)
  return colors[index].clone()
}

/**
 * Convert palette colors to a flat Float32Array for use in shaders
 * Each color is 3 floats (r, g, b)
 */
export function getPaletteAsUniform (palette: ColorPalette): Float32Array {
  const colors = COLOR_PALETTES[palette]
  const data = new Float32Array(colors.length * 3)

  colors.forEach((color, i) => {
    data[i * 3] = color.r
    data[i * 3 + 1] = color.g
    data[i * 3 + 2] = color.b
  })

  return data
}

/**
 * Get the number of colors in a palette
 */
export function getPaletteLength (palette: ColorPalette): number {
  return COLOR_PALETTES[palette].length
}
