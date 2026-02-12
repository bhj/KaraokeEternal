// @vitest-environment jsdom
import React, { act } from 'react'
import { describe, it, expect, vi } from 'vitest'
import { createRoot } from 'react-dom/client'
import { useAudioAnalyser } from './useAudioAnalyser'

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
  it('hardcodes gain node value to 1.0 regardless of sensitivity option', async () => {
    const { gainNodes, source } = createMockAudioGraph()
    const container = document.createElement('div')
    const root = createRoot(container)

    function TestWithSensitivity (): null {
      useAudioAnalyser(source, { sensitivity: 2.5 })
      return null
    }

    await act(async () => {
      root.render(<TestWithSensitivity />)
    })

    // First gain node is the sensitivity gain — should be hardcoded to 1.0
    expect(gainNodes[0].gain.setValueAtTime).toHaveBeenCalledWith(1.0, expect.any(Number))

    await act(async () => {
      root.unmount()
    })
  })

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
