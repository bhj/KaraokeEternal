import { describe, it, expect, vi } from 'vitest'
import { applyVideoProxyOverride, restoreVideoProxyOverride } from './videoProxyOverride'

describe('videoProxyOverride', () => {
  it('rewrites external HTTPS URL through proxy', () => {
    const initVideo = vi.fn()
    const globals: Record<string, unknown> = {
      s0: { initVideo },
    }
    const overrides = new Map<string, unknown>()

    applyVideoProxyOverride(['s0'], globals, overrides)

    const ext = globals.s0 as { initVideo: (url: string) => void }
    ext.initVideo('https://example.com/video.mp4')
    expect(initVideo).toHaveBeenCalledWith(
      'api/video-proxy?url=' + encodeURIComponent('https://example.com/video.mp4'),
    )
  })

  it('uses base-relative proxy path (no leading slash)', () => {
    const initVideo = vi.fn()
    const globals: Record<string, unknown> = {
      s0: { initVideo },
    }
    const overrides = new Map<string, unknown>()

    applyVideoProxyOverride(['s0'], globals, overrides)

    const ext = globals.s0 as { initVideo: (url: string) => void }
    ext.initVideo('https://example.com/video.mp4')

    const calledWith = initVideo.mock.calls[0]?.[0]
    expect(typeof calledWith).toBe('string')
    expect((calledWith as string).startsWith('/')).toBe(false)
  })

  it('passes relative URL through unchanged', () => {
    const initVideo = vi.fn()
    const globals: Record<string, unknown> = {
      s0: { initVideo },
    }
    const overrides = new Map<string, unknown>()

    applyVideoProxyOverride(['s0'], globals, overrides)

    const ext = globals.s0 as { initVideo: (url: string) => void }
    ext.initVideo('/local/path.mp4')
    expect(initVideo).toHaveBeenCalledWith('/local/path.mp4')
  })

  it('passes no-arg call through unchanged', () => {
    const initVideo = vi.fn()
    const globals: Record<string, unknown> = {
      s0: { initVideo },
    }
    const overrides = new Map<string, unknown>()

    applyVideoProxyOverride(['s0'], globals, overrides)

    const ext = globals.s0 as { initVideo: () => void }
    ext.initVideo()
    expect(initVideo).toHaveBeenCalledWith(undefined)
  })

  it('preserves this binding when calling original', () => {
    const initVideo = vi.fn(function (this: unknown) {})
    const source = { initVideo }
    const globals: Record<string, unknown> = { s0: source }
    const overrides = new Map<string, unknown>()

    applyVideoProxyOverride(['s0'], globals, overrides)

    const ext = globals.s0 as { initVideo: (url: string) => void }
    ext.initVideo('https://example.com/video.mp4')
    expect(initVideo.mock.contexts[0]).toBe(source)
  })

  it('restores original initVideo', () => {
    const initVideo = vi.fn()
    const globals: Record<string, unknown> = {
      s0: { initVideo },
    }
    const overrides = new Map<string, unknown>()

    applyVideoProxyOverride(['s0'], globals, overrides)
    restoreVideoProxyOverride(globals, overrides)

    const ext = globals.s0 as { initVideo: typeof initVideo }
    expect(ext.initVideo).toBe(initVideo)
    expect(overrides.size).toBe(0)
  })
})
