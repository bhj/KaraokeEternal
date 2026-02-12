import { HYDRA_GALLERY, type HydraGalleryItem } from './hydraGallery'

const KNOWN_SKETCH_REPAIRS: Record<string, string> = {
  example_10: `// by Zach Krall
// http://zachkrall.online/

osc(215, 0.1, 2)
  .modulate(
    osc(2, -0.3, 100)
      .rotate(15),
  )
  .mult(
    osc(215, -0.1, 2)
      .pixelate(50, 50),
  )
  .color(0.9, 0.0, 0.9)
  .modulate(
    osc(6, -0.1)
      .rotate(9),
  )
  .add(
    osc(10, -0.9, 900)
      .color(1, 0, 1),
  )
  .mult(
    shape(900, 0.2, 1)
      .luma()
      .repeatX(2)
      .repeatY(2),
  )
  .colorama(10)
  .modulate(
    osc(9, -0.3, 900)
      .rotate(6),
  )
  .add(
    osc(4, 1, 90),
  )
  .color(0.2, 0, 1)
  .out()`,
  example_16: `// by Olivia Jack
// https://ojack.github.io

osc(4, 0.1, 0.8)
  .color(1.04, 0, -1.1)
  .rotate(0.30, 0.1)
  .pixelate(2, 20)
  .modulate(noise(2.5), () => 1.5 * Math.sin(0.08 * time))
  .out(o0)`,
  eerie_ear_0: `// ee_2 . MULTIVERSE . time and feedback
// e_e // @eerie_ear
pat = () =>
  solid()
    .layer(
      solid().diff(
        osc((time / 16) * 1, (time / 1000) * 0.2)
          .mult(osc((time / 8) * 1, (time / 1006) * 0.2).rotate(1.57))
          .modulate(shape(106, 1, 0.05))
          .mult(shape(106, 1, 0.05))
          .modulateScale(osc(4, 0.125), -0.125)
          .color(1.2, 0.3, 0.85),
      ),
    )

pat()
  .color(0.95, 0.55, 1.2)
  .shift(0.04, 0.04, 0)
  .add(src(o0).saturate(1.2).contrast(1.05).modulate(o0, 0.03), 0.45)
  .add(gradient(1.5).color(0.3, 0.08, 0.7), 0.12)
  .out(o0)`,
  eerie_ear_2: `//ee_5 . FUGITIVE GEOMETRY VHS . audioreactive shapes and gradients
// e_e // @eerie_ear
//
s = () =>
  shape(4, 0.35, 0.01)
    .scrollX([-0.5, -0.2, 0.3, -0.1, -0.1].smooth(0.1).fast(0.3))
    .scrollY([0.25, -0.2, 0.3, -0.1, 0.2].smooth(0.9).fast(0.15))
    .color(1.2, 0.25, 0.55)

solid(0, 0, 0)
  .add(gradient(3, 0.05).color(0.08, 0.05, 0.25), 0.35)
  .add(s(), 0.78)
  .modulateScale(osc(2, 0.04).kaleid(2), 0.08)
  .add(src(o0).scale(0.995).contrast(1.02), 0.22)
  .out()`,
}

function repairKnownSketchIssues (item: HydraGalleryItem, decoded: string): string {
  return KNOWN_SKETCH_REPAIRS[item.sketch_id] ?? decoded
}

/**
 * Decode a gallery item from base64+URI encoding.
 * Uses Buffer.from() which works in both browser (via polyfill) and Node (tests).
 */
export function decodeSketch (item: HydraGalleryItem): string {
  try {
    // atob() doesn't exist in Node test environment; use Buffer fallback.
    const raw = typeof atob === 'function'
      ? atob(item.code)
      : Buffer.from(item.code, 'base64').toString('utf8')
    const decoded = decodeURIComponent(raw)
    return repairKnownSketchIssues(item, decoded)
  } catch {
    return ''
  }
}

/**
 * All gallery sketches decoded. Gallery is canonical; entries decode to strings.
 * Known corrupted entries are repaired in decodeSketch().
 */
export const PRESETS: string[] = HYDRA_GALLERY.map(item => decodeSketch(item))

/** Formatted labels: [1/N] sketch_id */
export const PRESET_LABELS: string[] = HYDRA_GALLERY.map(
  (item, i) => `[${i + 1}/${HYDRA_GALLERY.length}] ${item.sketch_id}`,
)

/** Index of marianne_1 in the gallery (default sketch) */
export const DEFAULT_PRESET_INDEX: number = HYDRA_GALLERY.findIndex(
  item => item.sketch_id === 'marianne_1',
)

export function getDefaultPreset (): string {
  return PRESETS[DEFAULT_PRESET_INDEX]
}

export function getDefaultPresetIndex (): number {
  return DEFAULT_PRESET_INDEX
}

export function getPresetByIndex (i: number): string {
  return PRESETS[i]
}

export function getPresetLabel (i: number): string {
  return PRESET_LABELS[i]
}

export function getPresetCount (): number {
  return PRESETS.length
}

export function getNextPreset (i: number): number {
  return (i + 1) % PRESETS.length
}

export function getPrevPreset (i: number): number {
  return (i - 1 + PRESETS.length) % PRESETS.length
}

export function getRandomPreset (excludeIndex?: number): number {
  if (excludeIndex == null) {
    return Math.floor(Math.random() * PRESETS.length)
  }
  const idx = Math.floor(Math.random() * (PRESETS.length - 1))
  return idx >= excludeIndex ? idx + 1 : idx
}
