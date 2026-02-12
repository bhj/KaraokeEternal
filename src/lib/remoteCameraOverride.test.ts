import { describe, it, expect, vi } from 'vitest'
import { applyRemoteCameraOverride, restoreRemoteCameraOverride } from './remoteCameraOverride'

describe('remoteCameraOverride', () => {
  it('overrides initCam to use init({src}) with remote element', () => {
    const remote = {} as HTMLVideoElement
    const originalInitCam = vi.fn()
    const init = vi.fn()
    const globals: Record<string, unknown> = {
      s0: { initCam: originalInitCam, init },
    }
    const overrides = new Map<string, unknown>()

    applyRemoteCameraOverride(['s0'], remote, globals, overrides)

    const ext = globals.s0 as { initCam?: () => void, init?: (opts: { src: HTMLVideoElement }) => void }
    expect(typeof ext.initCam).toBe('function')
    ext.initCam?.()
    expect(init).toHaveBeenCalledWith({ src: remote })
    expect(overrides.get('s0')).toBe(originalInitCam)
  })

  it('preserves source context when overridden initCam calls init', () => {
    const remote = {} as HTMLVideoElement
    const globals: Record<string, unknown> = {
      s0: {
        initCam: vi.fn(),
        init (this: { boundSrc?: HTMLVideoElement }, opts: { src: HTMLVideoElement }) {
          this.boundSrc = opts.src
        },
      },
    }
    const overrides = new Map<string, unknown>()

    applyRemoteCameraOverride(['s0'], remote, globals, overrides)

    const ext = globals.s0 as { initCam?: () => void, boundSrc?: HTMLVideoElement }
    ext.initCam?.()

    expect(ext.boundSrc).toBe(remote)
  })

  it('restores original initCam when remote is cleared', () => {
    const remote = {} as HTMLVideoElement
    const originalInitCam = vi.fn()
    const init = vi.fn()
    const globals: Record<string, unknown> = {
      s0: { initCam: originalInitCam, init },
    }
    const overrides = new Map<string, unknown>()

    applyRemoteCameraOverride(['s0'], remote, globals, overrides)
    restoreRemoteCameraOverride(globals, overrides)

    const ext = globals.s0 as { initCam?: () => void }
    expect(ext.initCam).toBe(originalInitCam)
    expect(overrides.size).toBe(0)
  })

  it('skips sources without init', () => {
    const remote = {} as HTMLVideoElement
    const originalInitCam = vi.fn()
    const globals: Record<string, unknown> = {
      s0: { initCam: originalInitCam },
    }
    const overrides = new Map<string, unknown>()

    applyRemoteCameraOverride(['s0'], remote, globals, overrides)
    const ext = globals.s0 as { initCam?: () => void }
    expect(ext.initCam).toBe(originalInitCam)
    expect(overrides.size).toBe(0)
  })
})
