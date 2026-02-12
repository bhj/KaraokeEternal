// @vitest-environment jsdom
import React, { act } from 'react'
import { describe, it, expect, vi } from 'vitest'
import { createRoot } from 'react-dom/client'
import HydraVisualizer from './HydraVisualizer'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

vi.mock('react-redux', () => ({
  useDispatch: () => vi.fn(),
}))

vi.mock('hydra-synth', () => {
  class FakeHydra {
    regl = { destroy: vi.fn() }

    constructor () {}

    eval () {}

    hush () {}

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

describe('HydraVisualizer camera rebinding', () => {
  it('re-binds camera source when remote video element changes', async () => {
    const init = vi.fn()
    ;(window as unknown as Record<string, unknown>).s0 = {
      init,
      initCam: vi.fn(),
    }

    const remoteA = document.createElement('video')
    const remoteB = document.createElement('video')
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
})
