export interface PreviewSize {
  width: number
  height: number
}

const NARROW_BREAKPOINT = 980
const PREVIEW_MIN = 240
const PREVIEW_PADDING = 32
const PREVIEW_RATIO = 0.75
const PREVIEW_MAX_DESKTOP = 420

export function shouldShowRefPanelToggle (innerWidth: number): boolean {
  return innerWidth < NARROW_BREAKPOINT
}

export function getPreviewSize (innerWidth: number): PreviewSize {
  if (innerWidth < NARROW_BREAKPOINT) {
    const width = Math.max(PREVIEW_MIN, innerWidth - PREVIEW_PADDING)
    return {
      width,
      height: Math.round(width * PREVIEW_RATIO),
    }
  }

  return {
    width: PREVIEW_MAX_DESKTOP,
    height: Math.round(PREVIEW_MAX_DESKTOP * PREVIEW_RATIO),
  }
}
