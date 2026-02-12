type HydraExternalSource = {
  initVideo?: (url?: string) => void
}

const PROXY_PATH = 'api/video-proxy'

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

    const original = overrides.get(src) as HydraExternalSource['initVideo']
    ext.initVideo = function (this: HydraExternalSource, url?: string) {
      if (url && /^https?:\/\//i.test(url)) {
        original?.call(this, `${PROXY_PATH}?url=` + encodeURIComponent(url))
      } else {
        original?.call(this, url)
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
