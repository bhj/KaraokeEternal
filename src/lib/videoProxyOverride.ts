type HydraExternalSource = {
  initVideo?: (url?: string) => void
}

/**
 * Override sN.initVideo() to rewrite external URLs through the video proxy.
 * Stores original initVideo in overrides map for restoration.
 */
export function applyVideoProxyOverride (
  sources: string[],
  globals: Record<string, unknown>,
  overrides: Map<string, unknown>,
): void {
  for (const src of sources) {
    const ext = globals[src] as HydraExternalSource | undefined
    if (!ext || typeof ext.initVideo !== 'function') continue

    if (!overrides.has(src)) {
      overrides.set(src, ext.initVideo)
    }

    const originalInitVideo = overrides.get(src) as HydraExternalSource['initVideo']
    ext.initVideo = (url?: string) => {
      if (url && /^https?:\/\//i.test(url)) {
        originalInitVideo?.('/api/video-proxy?url=' + encodeURIComponent(url))
      } else {
        originalInitVideo?.(url)
      }
    }
  }
}

export function restoreVideoProxyOverride (
  globals: Record<string, unknown>,
  overrides: Map<string, unknown>,
): void {
  for (const [src, original] of overrides.entries()) {
    const ext = globals[src] as HydraExternalSource | undefined
    if (!ext) continue
    ext.initVideo = original as HydraExternalSource['initVideo']
  }
  overrides.clear()
}
