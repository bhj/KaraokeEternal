type HydraExternalSource = {
  initCam?: (index?: number) => void
  init?: (opts: { src: HTMLVideoElement }) => void
}

function isVideoRenderable (videoEl: HTMLVideoElement): boolean {
  return videoEl.readyState >= 2
    && videoEl.videoWidth > 0
    && videoEl.videoHeight > 0
}

/**
 * Override sN.initCam() to use a remote video element when present.
 * Stores original initCam in overrides map for restoration.
 */
export function applyRemoteCameraOverride (
  sources: string[],
  remoteVideoElement: HTMLVideoElement,
  globals: Record<string, unknown>,
  overrides: Map<string, unknown>,
): void {
  for (const src of sources) {
    const ext = globals[src] as HydraExternalSource | undefined
    if (!ext || typeof ext.init !== 'function') continue

    if (!overrides.has(src)) {
      overrides.set(src, ext.initCam)
    }

    const init = ext.init
    ext.initCam = () => {
      // Avoid regl texture errors when the remote stream exists but has no decoded frame yet.
      if (!isVideoRenderable(remoteVideoElement)) return
      // Preserve Hydra external source context for internal mutable state.
      init.call(ext, { src: remoteVideoElement })
    }
  }
}

export function restoreRemoteCameraOverride (
  globals: Record<string, unknown>,
  overrides: Map<string, unknown>,
): void {
  for (const [src, original] of overrides.entries()) {
    const ext = globals[src] as HydraExternalSource | undefined
    if (!ext) continue
    ext.initCam = original as HydraExternalSource['initCam']
  }
  overrides.clear()
}
