// @vitest-environment jsdom
import React, { act } from 'react'
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import { createRoot } from 'react-dom/client'
import ApiReference from './ApiReference'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

beforeAll(() => {
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

beforeEach(() => {
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: {
      writeText: vi.fn().mockResolvedValue(undefined),
    },
  })
})

function getButtonByText (container: HTMLElement, text: string): HTMLButtonElement | null {
  const buttons = Array.from(container.querySelectorAll('button')) as HTMLButtonElement[]
  return buttons.find(button => (button.textContent ?? '').trim() === text) ?? null
}

describe('ApiReference', () => {
  it('renders a learning-oriented API workspace with search and detail sections', async () => {
    const container = document.createElement('div')
    const root = createRoot(container)

    await act(async () => {
      root.render(<ApiReference />)
    })

    const text = container.textContent ?? ''
    expect(text).toContain('Hydra Function Lab')
    expect(text).toContain('Learn by exploring signatures and examples')
    expect(container.querySelector('input[type="search"]')).not.toBeNull()
    expect(text).toContain('Parameters')
    expect(text).toContain('Example')
    expect(text).toContain('When to use')
    expect(text).toContain('Pitfall')

    await act(async () => {
      root.unmount()
    })
  })

  it('shows function-specific coaching copy for the selected function', async () => {
    const container = document.createElement('div')
    const root = createRoot(container)

    await act(async () => {
      root.render(<ApiReference />)
    })

    const text = container.textContent ?? ''
    expect(text).toContain('Core oscillator source for rhythmic stripes and phase motion.')
    expect(text).toContain('High freq plus high sync can alias hard on low-end devices.')

    await act(async () => {
      root.unmount()
    })
  })

  it('filters function list by search query', async () => {
    const container = document.createElement('div')
    const root = createRoot(container)

    await act(async () => {
      root.render(<ApiReference />)
    })

    const search = container.querySelector('input[type="search"]') as HTMLInputElement | null
    expect(search).not.toBeNull()

    await act(async () => {
      if (!search) return
      search.value = 'modulateRotate'
      search.dispatchEvent(new Event('input', { bubbles: true }))
    })

    const text = container.textContent ?? ''
    expect(text).toContain('modulateRotate')
    expect(text).not.toContain('brightness')

    await act(async () => {
      root.unmount()
    })
  })

  it('supports inserting or replacing editor code from selected examples', async () => {
    const container = document.createElement('div')
    const root = createRoot(container)
    const onInsertExample = vi.fn()
    const onReplaceWithExample = vi.fn()

    await act(async () => {
      root.render(
        <ApiReference
          onInsertExample={onInsertExample}
          onReplaceWithExample={onReplaceWithExample}
        />,
      )
    })

    const insertButton = getButtonByText(container, 'Insert Example')
    const replaceButton = getButtonByText(container, 'Replace Editor')
    expect(insertButton).not.toBeNull()
    expect(replaceButton).not.toBeNull()

    await act(async () => {
      insertButton?.click()
      replaceButton?.click()
    })

    expect(onInsertExample).toHaveBeenCalledTimes(1)
    expect(onReplaceWithExample).toHaveBeenCalledTimes(1)
    expect(typeof onInsertExample.mock.calls[0]?.[0]).toBe('string')
    expect(typeof onReplaceWithExample.mock.calls[0]?.[0]).toBe('string')

    await act(async () => {
      root.unmount()
    })
  })

  it('copies selected function signature to clipboard', async () => {
    const container = document.createElement('div')
    const root = createRoot(container)
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })

    await act(async () => {
      root.render(<ApiReference />)
    })

    const copyButton = getButtonByText(container, 'Copy Signature')
    expect(copyButton).not.toBeNull()

    await act(async () => {
      copyButton?.click()
      await Promise.resolve()
    })

    expect(writeText).toHaveBeenCalledWith('osc(freq, sync, offset)')

    await act(async () => {
      root.unmount()
    })
  })
})
