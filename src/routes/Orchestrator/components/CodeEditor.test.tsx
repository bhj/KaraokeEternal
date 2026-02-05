// @vitest-environment jsdom
import React, { act } from 'react'
import { describe, it, expect, beforeAll } from 'vitest'
import { createRoot } from 'react-dom/client'
import CodeEditor from './CodeEditor'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

beforeAll(() => {
  class ResizeObserver {
    observe () {}
    unobserve () {}
    disconnect () {}
  }
  ;(global as unknown as { ResizeObserver?: typeof ResizeObserver }).ResizeObserver = ResizeObserver
  if (!window.matchMedia) {
    ;(window as unknown as {
      matchMedia: (query: string) => {
        matches: boolean
        addListener: () => void
        removeListener: () => void
      }
    }).matchMedia = () => ({ matches: false, addListener () {}, removeListener () {} })
  }
})

describe('CodeEditor', () => {
  it('does not render auto-audio controls', async () => {
    const container = document.createElement('div')
    const root = createRoot(container)

    await act(async () => {
      root.render(
        <CodeEditor
          code='osc(10).out()'
          onCodeChange={() => {}}
          onSend={() => {}}
          onRandomize={() => {}}
        />,
      )
    })

    const text = container.textContent ?? ''
    expect(text).not.toContain('Auto Audio')
    expect(text).not.toContain('Strip Audio')
    expect(text).not.toContain('Low')
    expect(text).not.toContain('Med')
    expect(text).not.toContain('High')

    await act(async () => {
      root.unmount()
    })
  })
})
