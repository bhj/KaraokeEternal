// @vitest-environment jsdom
import React, { act } from 'react'
import { describe, it, expect, vi } from 'vitest'
import { createRoot } from 'react-dom/client'
import StagePanel from './StagePanel'
import { buildPreviewCode } from './stagePanelUtils'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

vi.mock('./HydraPreview', () => ({
  default: () => <div data-testid='preview' />,
}))

describe('StagePanel', () => {
  it('buildPreviewCode appends render for grid mode', () => {
    const code = 'osc(10,0,1).out(o0)'
    const result = buildPreviewCode(code, 'grid')
    expect(result).toBe(`${code}\nrender()`)
  })

  it('buildPreviewCode maps buffer output to o0', () => {
    const code = 'noise(3,0).out(o2)'
    const result = buildPreviewCode(code, 'o2')
    expect(result).toBe(`${code}\nsrc(o2).out(o0)`)
  })

  it('renders buffer buttons', async () => {
    const container = document.createElement('div')
    const root = createRoot(container)

    await act(async () => {
      root.render(
        <StagePanel
          code='osc(10,0,1).out(o0)'
          width={360}
          height={270}
          buffer='o0'
          onBufferChange={vi.fn()}
        />,
      )
    })

    expect(container.textContent).toContain('o0')
    expect(container.textContent).toContain('o1')
    expect(container.textContent).toContain('o2')
    expect(container.textContent).toContain('o3')
    expect(container.textContent).toContain('grid')

    await act(async () => {
      root.unmount()
    })
  })
})
