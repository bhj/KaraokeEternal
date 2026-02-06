// @vitest-environment jsdom
import React, { act } from 'react'
import { describe, it, expect, beforeAll, vi } from 'vitest'
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

function findButtonByText (container: HTMLElement, text: string): HTMLButtonElement | null {
  const buttons = Array.from(container.querySelectorAll('button')) as HTMLButtonElement[]
  return buttons.find(b => (b.textContent ?? '').trim() === text) ?? null
}

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

  it('renders visible undo redo and format controls', async () => {
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

    expect(findButtonByText(container, 'Undo')).not.toBeNull()
    expect(findButtonByText(container, 'Redo')).not.toBeNull()
    expect(findButtonByText(container, 'Format')).not.toBeNull()

    await act(async () => {
      root.unmount()
    })
  })

  it('formats current code when format is clicked', async () => {
    const container = document.createElement('div')
    const root = createRoot(container)
    const changes: string[] = []

    await act(async () => {
      root.render(
        <CodeEditor
          code={'osc(10)  \r\n  .out()  \r\n'}
          onCodeChange={(next) => { changes.push(next) }}
          onSend={() => {}}
          onRandomize={() => {}}
        />,
      )
    })

    const formatButton = findButtonByText(container, 'Format')
    expect(formatButton).not.toBeNull()

    await act(async () => {
      formatButton?.click()
    })

    expect(changes[changes.length - 1]).toBe('osc(10)\n  .out()')

    await act(async () => {
      root.unmount()
    })
  })

  it('shows a debug solution when send is blocked by lint errors', async () => {
    const container = document.createElement('div')
    const root = createRoot(container)
    const onSend = vi.fn()

    await act(async () => {
      root.render(
        <CodeEditor
          code={'osc("unterminated)\n  .out()'}
          onCodeChange={() => {}}
          onSend={onSend}
          onRandomize={() => {}}
        />,
      )
    })

    const sendButton = findButtonByText(container, 'Send')
    expect(sendButton).not.toBeNull()

    await act(async () => {
      sendButton?.click()
    })

    expect(onSend).not.toHaveBeenCalled()
    expect(container.textContent ?? '').toContain('Debug:')

    await act(async () => {
      root.unmount()
    })
  })
})
