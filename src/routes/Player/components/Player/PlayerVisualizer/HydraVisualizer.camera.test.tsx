// @vitest-environment jsdom
import React, { act } from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { createRoot } from 'react-dom/client'
import HydraVisualizer from './HydraVisualizer'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const { evalSpy, hushSpy } = vi.hoisted(() => ({
  evalSpy: vi.fn(),
  hushSpy: vi.fn(),
}))

vi.mock('react-redux', () => ({
  useDispatch: () => vi.fn(),
}))

vi.mock('hydra-synth', () => {
  class FakeHydra {
    regl = { destroy: vi.fn() }
    o = [{}, {}, {}, {}]
    synth = { solid: vi.fn(() => ({ out: vi.fn() })), render: vi.fn() }

    constructor () {}

    eval (...args: unknown[]) { evalSpy(...args) }

    hush () { hushSpy() }

    tick () {}

    setResolution () {}
  }

  return { default: FakeHydra }
})

vi.mock('./hooks/useHydraAudio', () => ({
  useHydraAudio: () => ({
    update: () => {},
    compat: { fft: new Float32Array(8) },
    audioRef: {
      current: {
        bass: 0,
        mid: 0,
        treble: 0,
        beatIntensity: 0,
        energy: 0,
        beatFrequency: 0,
        spectralCentroid: 0,
      },
    },
  }),
}))

afterEach(() => {
  evalSpy.mockClear()
  hushSpy.mockClear()
})

function markVideoRenderable (video: HTMLVideoElement, width = 640, height = 360, readyState = 4) {
  Object.defineProperty(video, 'videoWidth', { configurable: true, get: () => width })
  Object.defineProperty(video, 'videoHeight', { configurable: true, get: () => height })
  Object.defineProperty(video, 'readyState', { configurable: true, get: () => readyState })
}

describe('HydraVisualizer camera rebinding', () => {
  it('re-binds camera source when remote video element changes', async () => {
    const init = vi.fn()
    ;(window as unknown as Record<string, unknown>).s0 = {
      init,
      initCam: vi.fn(),
    }

    const remoteA = document.createElement('video')
    markVideoRenderable(remoteA)
    const remoteB = document.createElement('video')
    markVideoRenderable(remoteB)
    const container = document.createElement('div')
    const root = createRoot(container)

    await act(async () => {
      root.render(
        <HydraVisualizer
          audioSourceNode={null}
          isPlaying={true}
          sensitivity={1}
          width={320}
          height={180}
          code='src(s0).out(o0)'
          allowCamera={true}
          remoteVideoElement={remoteA}
        />,
      )
    })

    expect(init).toHaveBeenCalledWith({ src: remoteA })

    await act(async () => {
      root.render(
        <HydraVisualizer
          audioSourceNode={null}
          isPlaying={true}
          sensitivity={1}
          width={320}
          height={180}
          code='src(s0).out(o0)'
          allowCamera={true}
          remoteVideoElement={remoteB}
        />,
      )
    })

    expect(init).toHaveBeenCalledWith({ src: remoteB })
    expect(init).toHaveBeenCalledTimes(2)

    await act(async () => {
      root.unmount()
    })
  })

  it('re-inits camera source when switching from camera preset to non-camera and back', async () => {
    const init = vi.fn()
    ;(window as unknown as Record<string, unknown>).s0 = {
      init,
      initCam: vi.fn(),
    }

    const remote = document.createElement('video')
    markVideoRenderable(remote)
    const container = document.createElement('div')
    const root = createRoot(container)

    await act(async () => {
      root.render(
        <HydraVisualizer
          audioSourceNode={null}
          isPlaying={true}
          sensitivity={1}
          width={320}
          height={180}
          code='src(s0).out(o0)'
          allowCamera={true}
          remoteVideoElement={remote}
        />,
      )
    })

    await act(async () => {
      root.render(
        <HydraVisualizer
          audioSourceNode={null}
          isPlaying={true}
          sensitivity={1}
          width={320}
          height={180}
          code='osc(10).out(o0)'
          allowCamera={true}
          remoteVideoElement={remote}
        />,
      )
    })

    await act(async () => {
      root.render(
        <HydraVisualizer
          audioSourceNode={null}
          isPlaying={true}
          sensitivity={1}
          width={320}
          height={180}
          code='src(s0).out(o0)'
          allowCamera={true}
          remoteVideoElement={remote}
        />,
      )
    })

    expect(init).toHaveBeenCalledTimes(2)

    await act(async () => {
      root.unmount()
    })
  })

  it('waits for renderable remote video before binding camera source', async () => {
    const init = vi.fn()
    ;(window as unknown as Record<string, unknown>).s0 = {
      init,
      initCam: vi.fn(),
    }

    const remote = document.createElement('video')
    const container = document.createElement('div')
    const root = createRoot(container)

    await act(async () => {
      root.render(
        <HydraVisualizer
          audioSourceNode={null}
          isPlaying={true}
          sensitivity={1}
          width={320}
          height={180}
          code='src(s0).out(o0)'
          allowCamera={true}
          remoteVideoElement={remote}
        />,
      )
    })

    expect(init).not.toHaveBeenCalled()

    markVideoRenderable(remote, 1280, 720)

    await act(async () => {
      remote.dispatchEvent(new Event('loadedmetadata'))
    })

    expect(init).toHaveBeenCalledTimes(1)
    expect(init).toHaveBeenCalledWith({ src: remote })

    await act(async () => {
      root.unmount()
    })
  })
})

describe('HydraVisualizer relay feedback loop prevention', () => {
  it('does not re-evaluate code or hush on remote video events', async () => {
    const init = vi.fn()
    ;(window as unknown as Record<string, unknown>).s0 = {
      init,
      initCam: vi.fn(),
    }

    const remote = document.createElement('video')
    markVideoRenderable(remote)
    const container = document.createElement('div')
    const root = createRoot(container)

    await act(async () => {
      root.render(
        <HydraVisualizer
          audioSourceNode={null}
          isPlaying={false}
          sensitivity={1}
          width={320}
          height={180}
          code='src(s0).out(o0)'
          allowCamera={true}
          remoteVideoElement={remote}
        />,
      )
    })

    // Record call counts after mount
    const evalCountAfterMount = evalSpy.mock.calls.length
    const hushCountAfterMount = hushSpy.mock.calls.length

    // Dispatch rapid video events (the feedback loop trigger)
    await act(async () => {
      for (const evt of ['playing', 'waiting', 'stalled', 'playing', 'waiting', 'stalled', 'playing']) {
        remote.dispatchEvent(new Event(evt))
      }
    })

    // No additional eval or hush calls from video events
    expect(evalSpy.mock.calls.length).toBe(evalCountAfterMount)
    expect(hushSpy.mock.calls.length).toBe(hushCountAfterMount)

    await act(async () => {
      root.unmount()
    })
  })

  it('does not call hush during code change when relay is active', async () => {
    const init = vi.fn()
    ;(window as unknown as Record<string, unknown>).s0 = {
      init,
      initCam: vi.fn(),
    }

    const remote = document.createElement('video')
    markVideoRenderable(remote)
    const container = document.createElement('div')
    const root = createRoot(container)

    await act(async () => {
      root.render(
        <HydraVisualizer
          audioSourceNode={null}
          isPlaying={false}
          sensitivity={1}
          width={320}
          height={180}
          code='src(s0).out(o0)'
          allowCamera={true}
          remoteVideoElement={remote}
        />,
      )
    })

    hushSpy.mockClear()

    // Change code while relay is active
    await act(async () => {
      root.render(
        <HydraVisualizer
          audioSourceNode={null}
          isPlaying={false}
          sensitivity={1}
          width={320}
          height={180}
          code='src(s0).saturate(2).out(o0)'
          allowCamera={true}
          remoteVideoElement={remote}
        />,
      )
    })

    // hush must NOT be called — it would kill WebRTC tracks via source.clear()
    expect(hushSpy).not.toHaveBeenCalled()

    // But eval should still fire with the new code
    expect(evalSpy).toHaveBeenCalledWith(expect.stringContaining('saturate'))

    await act(async () => {
      root.unmount()
    })
  })

  it('calls hush during code change when no relay is active', async () => {
    const container = document.createElement('div')
    const root = createRoot(container)

    await act(async () => {
      root.render(
        <HydraVisualizer
          audioSourceNode={null}
          isPlaying={false}
          sensitivity={1}
          width={320}
          height={180}
          code='osc(10).out(o0)'
        />,
      )
    })

    hushSpy.mockClear()

    await act(async () => {
      root.render(
        <HydraVisualizer
          audioSourceNode={null}
          isPlaying={false}
          sensitivity={1}
          width={320}
          height={180}
          code='osc(20).out(o0)'
        />,
      )
    })

    // Without remote video, hush should be called normally
    expect(hushSpy).toHaveBeenCalled()

    await act(async () => {
      root.unmount()
    })
  })
})

describe('HydraVisualizer audio globals', () => {
  it('sets window.a with valid fft after mount', async () => {
    const container = document.createElement('div')
    const root = createRoot(container)

    await act(async () => {
      root.render(
        <HydraVisualizer
          audioSourceNode={null}
          isPlaying={false}
          sensitivity={1}
          width={320}
          height={180}
        />,
      )
    })

    const w = window as unknown as Record<string, unknown>
    const a = w.a as { fft?: unknown } | undefined
    expect(a).toBeDefined()
    expect(a!.fft).toBeDefined()

    await act(async () => {
      root.unmount()
    })
  })
})
