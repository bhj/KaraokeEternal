// @vitest-environment jsdom
import React, { act } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createRoot } from 'react-dom/client'
import StagePanel from './StagePanel'
import { buildPreviewCode, detectOutputBuffer } from './stagePanelUtils'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let mockBoundSources: string[] = []

vi.mock('./HydraPreview', () => ({
  default: ({ onCameraBoundSourcesChange }: { onCameraBoundSourcesChange?: (sources: string[]) => void }) => {
    onCameraBoundSourcesChange?.(mockBoundSources)
    return <div data-testid='preview' />
  },
}))

describe('StagePanel', () => {
  beforeEach(() => {
    mockBoundSources = []
  })

  describe('detectOutputBuffer', () => {
    it('.out() (no arg) → o0', () => {
      expect(detectOutputBuffer('osc(10).out()')).toBe('o0')
    })

    it('.out(o2) → o2', () => {
      expect(detectOutputBuffer('osc(10).out(o2)')).toBe('o2')
    })

    it('render(o2) overrides .out(o1)', () => {
      expect(detectOutputBuffer('osc(10).out(o1)\nrender(o2)')).toBe('o2')
    })

    it('render() (no arg) → o0', () => {
      expect(detectOutputBuffer('osc(10).out(o1)\nrender()')).toBe('o0')
    })

    it('multiple .out() → last one', () => {
      expect(detectOutputBuffer('osc(10).out(o1)\nnoise(3).out(o3)')).toBe('o3')
    })

    it('no .out or render → o0', () => {
      expect(detectOutputBuffer('osc(10).color(1,0,0)')).toBe('o0')
    })

    it('.out(o2) inside // comment is ignored', () => {
      expect(detectOutputBuffer('// .out(o2)\nosc(10).out(o1)')).toBe('o1')
    })

    it('.out(o3) inside /* */ block comment is ignored', () => {
      expect(detectOutputBuffer('/* .out(o3) */\nosc(10).out(o1)')).toBe('o1')
    })
  })

  describe('buildPreviewCode', () => {
    it('auto mode uses detectOutputBuffer to find target', () => {
      const code = 'osc(10).out(o2)'
      const result = buildPreviewCode(code, 'auto')
      // Auto-detect: .out(o2) → render(o2)
      expect(result).toContain('render(o2)')
    })

    it('auto mode with .out() → render(o0)', () => {
      const code = 'osc(10).out()'
      const result = buildPreviewCode(code, 'auto')
      expect(result).toContain('render(o0)')
    })

    it('auto mode with render(o2) in code → no extra render appended', () => {
      const code = 'osc(10).out(o1)\nrender(o2)'
      const result = buildPreviewCode(code, 'auto')
      expect(result).toBe(code)
    })

    it('auto mode with render() in code → no extra render appended', () => {
      const code = 'osc(10).out()\nrender()'
      const result = buildPreviewCode(code, 'auto')
      expect(result).toBe(code)
    })

    it('auto mode with commented-out render → appends render', () => {
      const code = '// render(o2)\nosc(10).out(o1)'
      const result = buildPreviewCode(code, 'auto')
      expect(result).toBe(`${code}\nrender(o1)`)
    })

    it('explicit buffer override always appends even with existing render', () => {
      const code = 'osc(10).out(o1)\nrender(o2)'
      const result = buildPreviewCode(code, 'o1')
      expect(result).toBe(`${code}\nrender(o1)`)
    })

    it('manual o1 override works', () => {
      const code = 'osc(10).out(o2)'
      const result = buildPreviewCode(code, 'o1')
      expect(result).toBe(`${code}\nrender(o1)`)
    })

    it('returns empty for empty code', () => {
      expect(buildPreviewCode('', 'auto')).toBe('')
      expect(buildPreviewCode('  ', 'o0')).toBe('')
    })
  })

  // NOTE: In auto mode, preview respects user's existing render() call.
  // In explicit buffer mode, preview always appends render(oN).
  it('renders buffer buttons (Auto + o0-o3)', async () => {
    const container = document.createElement('div')
    const root = createRoot(container)

    await act(async () => {
      root.render(
        <StagePanel
          code='osc(10,0,1).out(o0)'
          width={360}
          height={270}
          buffer='auto'
          onBufferChange={vi.fn()}
          visualizerMode='hydra'
          visualizerEnabled={true}
          visualizerSensitivity={1}
          visualizerAllowCamera={false}
          cameraRelayStatus='idle'
        />,
      )
    })

    expect(container.textContent).toContain('Auto')
    expect(container.textContent).toContain('o0')
    expect(container.textContent).toContain('o1')
    expect(container.textContent).toContain('o2')
    expect(container.textContent).toContain('o3')
    expect(container.textContent).not.toContain('Player Feed')

    await act(async () => {
      root.unmount()
    })
  })

  it('shows Camera Live when relay is active and Hydra has bound camera source', async () => {
    mockBoundSources = ['s0']
    const container = document.createElement('div')
    const root = createRoot(container)

    await act(async () => {
      root.render(
        <StagePanel
          code='src(s0).out(o0)'
          width={360}
          height={270}
          buffer='auto'
          onBufferChange={vi.fn()}
          visualizerMode='hydra'
          visualizerEnabled={true}
          visualizerSensitivity={1}
          visualizerAllowCamera={true}
          cameraRelayStatus='active'
        />,
      )
    })

    expect(container.textContent).toContain('Camera Live')
    expect(container.textContent).not.toContain('Missing')

    await act(async () => {
      root.unmount()
    })
  })

  it('shows Camera Partial and missing checks when relay is still connecting', async () => {
    mockBoundSources = []
    const container = document.createElement('div')
    const root = createRoot(container)

    await act(async () => {
      root.render(
        <StagePanel
          code='src(s0).out(o0)'
          width={360}
          height={270}
          buffer='auto'
          onBufferChange={vi.fn()}
          visualizerMode='hydra'
          visualizerEnabled={true}
          visualizerSensitivity={1}
          visualizerAllowCamera={true}
          cameraRelayStatus='connecting'
        />,
      )
    })

    expect(container.textContent).toContain('Camera Partial')
    expect(container.textContent).toContain('publish/subscribe')
    expect(container.textContent).toContain('hydra source bind')

    await act(async () => {
      root.unmount()
    })
  })
})
