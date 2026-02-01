export interface PreviewSize {
  width: number
  height: number
}

const NARROW_BREAKPOINT = 980
const PREVIEW_MAX = 360
const PREVIEW_MIN = 240
const PREVIEW_PADDING = 32
const PREVIEW_RATIO = 0.75

export function shouldShowRefPanelToggle (innerWidth: number): boolean {
  return innerWidth < NARROW_BREAKPOINT
}

export function getPreviewSize (innerWidth: number): PreviewSize {
  if (innerWidth < NARROW_BREAKPOINT) {
    const width = Math.max(PREVIEW_MIN, Math.min(PREVIEW_MAX, innerWidth - PREVIEW_PADDING))
    return {
      width,
      height: Math.round(width * PREVIEW_RATIO),
    }
  }

  return {
    width: PREVIEW_MAX,
    height: Math.round(PREVIEW_MAX * PREVIEW_RATIO),
  }
}
