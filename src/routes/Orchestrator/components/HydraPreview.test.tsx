// @vitest-environment jsdom
import React, { act } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createRoot } from 'react-dom/client'

let lastHydraProps: Record<string, unknown> | null = null

vi.mock('../../Player/components/Player/PlayerVisualizer/HydraVisualizer', () => ({
  default: (props: Record<string, unknown>) => {
    lastHydraProps = props
    return <div data-testid='hydra' />
  },
}))

vi.mock('store/hooks', () => ({
  useAppSelector: (selector: (state: { status: { fftData: null, isPlayerPresent: boolean } }) => unknown) => {
    return selector({ status: { fftData: null, isPlayerPresent: false } })
  },
}))

import HydraPreview from './HydraPreview'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

describe('HydraPreview', () => {
  beforeEach(() => {
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined)
  })

  it('passes local camera stream as remoteVideoElement to HydraVisualizer', async () => {
    class FakeGainNode {
      gain = { value: 1 }
      connect () {}
    }
    class FakeOscillatorNode {
      type = 'sine'
      frequency = { value: 0 }
      connect () {}
      start () {}
      stop () {}
    }
    class FakeAudioContext {
      destination = {}
      createGain () { return new FakeGainNode() }
      createOscillator () { return new FakeOscillatorNode() }
      close () {}
    }

    ;(window as unknown as { AudioContext: typeof FakeAudioContext }).AudioContext = FakeAudioContext

    lastHydraProps = null
    const container = document.createElement('div')
    const root = createRoot(container)

    const fakeStream = { id: 'local-stream' } as unknown as MediaStream

    await act(async () => {
      root.render(
        <HydraPreview
          code='osc(10).out()'
          width={320}
          height={200}
          localCameraStream={fakeStream}
          mode='hydra'
          isEnabled={true}
          sensitivity={1}
          allowCamera={true}
          audioResponse={{ globalGain: 1, bassWeight: 1, midWeight: 1, trebleWeight: 1 }}
        />,
      )
    })

    expect(lastHydraProps).not.toBeNull()
    expect(lastHydraProps?.remoteVideoElement).toBeInstanceOf(HTMLVideoElement)

    await act(async () => {
      root.unmount()
    })
  })

  it('does not pass a camera element when local stream is unavailable', async () => {
    class FakeGainNode {
      gain = { value: 1 }
      connect () {}
    }
    class FakeOscillatorNode {
      type = 'sine'
      frequency = { value: 0 }
      connect () {}
      start () {}
      stop () {}
    }
    class FakeAudioContext {
      destination = {}
      createGain () { return new FakeGainNode() }
      createOscillator () { return new FakeOscillatorNode() }
      close () {}
    }

    ;(window as unknown as { AudioContext: typeof FakeAudioContext }).AudioContext = FakeAudioContext

    lastHydraProps = null
    const container = document.createElement('div')
    const root = createRoot(container)

    await act(async () => {
      root.render(
        <HydraPreview
          code='osc(10).out()'
          width={320}
          height={200}
          localCameraStream={null}
          mode='hydra'
          isEnabled={true}
          sensitivity={1}
          allowCamera={true}
          audioResponse={{ globalGain: 1, bassWeight: 1, midWeight: 1, trebleWeight: 1 }}
        />,
      )
    })

    expect(lastHydraProps).not.toBeNull()
    expect(lastHydraProps?.remoteVideoElement).toBeNull()

    await act(async () => {
      root.unmount()
    })
  })
})
