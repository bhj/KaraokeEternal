// @vitest-environment jsdom
import React, { act } from 'react'
import { describe, it, expect, vi } from 'vitest'
import { createRoot } from 'react-dom/client'
import { useAudioAnalyser, applyAudioResponseWeights } from './useAudioAnalyser'
import { AUDIO_RESPONSE_DEFAULTS, type AudioResponseState } from 'shared/types'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

type MockGainNode = {
  gain: {
    value: number
    setValueAtTime: ReturnType<typeof vi.fn>
  }
  context: MockAudioContext
  connect: ReturnType<typeof vi.fn>
  disconnect: ReturnType<typeof vi.fn>
}

type MockAnalyserNode = {
  fftSize: number
  smoothingTimeConstant: number
  minDecibels: number
  maxDecibels: number
  frequencyBinCount: number
  connect: ReturnType<typeof vi.fn>
  disconnect: ReturnType<typeof vi.fn>
  getFloatFrequencyData: ReturnType<typeof vi.fn>
  getFloatTimeDomainData: ReturnType<typeof vi.fn>
}

type MockAudioContext = {
  state: 'suspended' | 'running'
  currentTime: number
  destination: Record<string, unknown>
  createGain: () => MockGainNode
  createAnalyser: () => MockAnalyserNode
  resume: ReturnType<typeof vi.fn>
}

type MockAudioGraph = {
  ctx: MockAudioContext
  gainNodes: MockGainNode[]
  getAnalyser: () => MockAnalyserNode | null
  source: MediaElementAudioSourceNode
}

function createMockAudioGraph (): MockAudioGraph {
  const gainNodes: MockGainNode[] = []

  let analyser: MockAnalyserNode | null = null

  const ctx: MockAudioContext = {
    state: 'suspended',
    currentTime: 0,
    destination: {},
    createGain: () => {
      const node: MockGainNode = {
        gain: {
          value: 1,
          setValueAtTime: vi.fn(),
        },
        context: ctx,
        connect: vi.fn(),
        disconnect: vi.fn(),
      }
      gainNodes.push(node)
      return node
    },
    createAnalyser: () => {
      analyser = {
        fftSize: 256,
        smoothingTimeConstant: 0.8,
        minDecibels: -100,
        maxDecibels: 0,
        frequencyBinCount: 128,
        connect: vi.fn(),
        disconnect: vi.fn(),
        getFloatFrequencyData: vi.fn(),
        getFloatTimeDomainData: vi.fn(),
      }
      return analyser
    },
    resume: vi.fn().mockResolvedValue(undefined),
  }

  const source = {
    context: ctx,
    connect: vi.fn(),
    disconnect: vi.fn(),
  } as unknown as MediaElementAudioSourceNode

  return {
    ctx,
    gainNodes,
    getAnalyser: () => analyser,
    source,
  }
}

function TestComponent ({ source }: { source: MediaElementAudioSourceNode | null }): null {
  useAudioAnalyser(source)
  return null
}

describe('useAudioAnalyser setup', () => {
  it('resumes suspended audio context and keeps analyser branch alive', async () => {
    const { ctx, gainNodes, source, getAnalyser } = createMockAudioGraph()
    const container = document.createElement('div')
    const root = createRoot(container)

    await act(async () => {
      root.render(<TestComponent source={source} />)
    })

    const analyser = getAnalyser()

    expect(ctx.resume).toHaveBeenCalledTimes(1)
    expect(analyser).not.toBeNull()
    if (!analyser) {
      await act(async () => {
        root.unmount()
      })
      return
    }
    expect(source.connect).toHaveBeenCalledWith(gainNodes[0])
    expect(gainNodes[0].connect).toHaveBeenCalledWith(analyser)
    expect(gainNodes.length).toBeGreaterThanOrEqual(2)
    expect(analyser.connect).toHaveBeenCalledWith(gainNodes[1])
    expect(gainNodes[1].gain.value).toBe(0)
    expect(gainNodes[1].connect).toHaveBeenCalledWith(ctx.destination)

    await act(async () => {
      root.unmount()
    })
  })
})

describe('applyAudioResponseWeights', () => {
  it('scales rawFreq and gammaFreq by globalGain * bandWeight', () => {
    const rawFreq = new Float32Array([0.5, 0.5, 0.5, 0.5, 0.5, 0.5])
    const gammaFreq = new Float32Array([0.4, 0.4, 0.4, 0.4, 0.4, 0.4])
    const response: AudioResponseState = { globalGain: 2.0, bassWeight: 1.0, midWeight: 1.0, trebleWeight: 1.0 }
    applyAudioResponseWeights(rawFreq, gammaFreq, 2, 4, response)
    expect(rawFreq[0]).toBeCloseTo(1.0)
    expect(gammaFreq[0]).toBeCloseTo(0.8)
  })

  it('applies per-band weights correctly', () => {
    const rawFreq = new Float32Array([0.2, 0.2, 0.2, 0.2, 0.2, 0.2])
    const gammaFreq = new Float32Array([0.2, 0.2, 0.2, 0.2, 0.2, 0.2])
    // bassEnd=2, midEnd=4 → bins 0-1 bass, 2-3 mid, 4-5 treble
    const response: AudioResponseState = { globalGain: 1.0, bassWeight: 2.0, midWeight: 0.5, trebleWeight: 3.0 }
    applyAudioResponseWeights(rawFreq, gammaFreq, 2, 4, response)
    expect(rawFreq[0]).toBeCloseTo(0.4) // bass: 0.2 * 1.0 * 2.0
    expect(rawFreq[1]).toBeCloseTo(0.4) // bass
    expect(rawFreq[2]).toBeCloseTo(0.1) // mid: 0.2 * 1.0 * 0.5
    expect(rawFreq[3]).toBeCloseTo(0.1) // mid
    expect(rawFreq[4]).toBeCloseTo(0.6) // treble: 0.2 * 1.0 * 3.0
    expect(rawFreq[5]).toBeCloseTo(0.6) // treble
  })

  it('clamps output values to max 1.0', () => {
    const rawFreq = new Float32Array([0.8])
    const gammaFreq = new Float32Array([0.8])
    const response: AudioResponseState = { globalGain: 3.0, bassWeight: 3.0, midWeight: 1.0, trebleWeight: 1.0 }
    applyAudioResponseWeights(rawFreq, gammaFreq, 1, 1, response)
    expect(rawFreq[0]).toBe(1.0)
    expect(gammaFreq[0]).toBe(1.0)
  })

  it('clamps output values to min 0.0', () => {
    const rawFreq = new Float32Array([-0.5])
    const gammaFreq = new Float32Array([-0.5])
    const response: AudioResponseState = { globalGain: 1.0, bassWeight: 1.0, midWeight: 1.0, trebleWeight: 1.0 }
    applyAudioResponseWeights(rawFreq, gammaFreq, 1, 1, response)
    expect(rawFreq[0]).toBe(0)
    expect(gammaFreq[0]).toBe(0)
  })

  it('treats NaN globalGain as 1.0', () => {
    const rawFreq = new Float32Array([0.5])
    const gammaFreq = new Float32Array([0.5])
    const response: AudioResponseState = { globalGain: NaN, bassWeight: 1.0, midWeight: 1.0, trebleWeight: 1.0 }
    applyAudioResponseWeights(rawFreq, gammaFreq, 1, 1, response)
    expect(rawFreq[0]).toBeCloseTo(0.5)
  })

  it('treats NaN bandWeight as 1.0', () => {
    const rawFreq = new Float32Array([0.5])
    const gammaFreq = new Float32Array([0.5])
    const response: AudioResponseState = { globalGain: 1.0, bassWeight: NaN, midWeight: 1.0, trebleWeight: 1.0 }
    applyAudioResponseWeights(rawFreq, gammaFreq, 1, 1, response)
    expect(rawFreq[0]).toBeCloseTo(0.5)
  })

  it('treats negative bandWeight as 0', () => {
    const rawFreq = new Float32Array([0.5])
    const gammaFreq = new Float32Array([0.5])
    const response: AudioResponseState = { globalGain: 1.0, bassWeight: -1.0, midWeight: 1.0, trebleWeight: 1.0 }
    applyAudioResponseWeights(rawFreq, gammaFreq, 1, 1, response)
    expect(rawFreq[0]).toBe(0)
    expect(gammaFreq[0]).toBe(0)
  })

  it('treats negative globalGain as 0', () => {
    const rawFreq = new Float32Array([0.5])
    const gammaFreq = new Float32Array([0.5])
    const response: AudioResponseState = { globalGain: -1.0, bassWeight: 1.0, midWeight: 1.0, trebleWeight: 1.0 }
    applyAudioResponseWeights(rawFreq, gammaFreq, 1, 1, response)
    expect(rawFreq[0]).toBe(0)
    expect(gammaFreq[0]).toBe(0)
  })

  it('treats Infinity as 1.0', () => {
    const rawFreq = new Float32Array([0.5])
    const gammaFreq = new Float32Array([0.5])
    const response: AudioResponseState = { globalGain: Infinity, bassWeight: 1.0, midWeight: 1.0, trebleWeight: 1.0 }
    applyAudioResponseWeights(rawFreq, gammaFreq, 1, 1, response)
    expect(rawFreq[0]).toBeCloseTo(0.5)
  })

  it('produces no change with default weights', () => {
    const rawFreq = new Float32Array([0.3, 0.5, 0.7])
    const gammaFreq = new Float32Array([0.2, 0.4, 0.6])
    applyAudioResponseWeights(rawFreq, gammaFreq, 1, 2, AUDIO_RESPONSE_DEFAULTS)
    expect(rawFreq[0]).toBeCloseTo(0.3)
    expect(rawFreq[1]).toBeCloseTo(0.5)
    expect(rawFreq[2]).toBeCloseTo(0.7)
    expect(gammaFreq[0]).toBeCloseTo(0.2)
    expect(gammaFreq[1]).toBeCloseTo(0.4)
    expect(gammaFreq[2]).toBeCloseTo(0.6)
  })
})
