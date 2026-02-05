// @vitest-environment jsdom
import React, { act } from 'react'
import { describe, it, expect } from 'vitest'
import { createRoot } from 'react-dom/client'
import InjectionLevelIndicator from './InjectionLevelIndicator'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

describe('InjectionLevelIndicator', () => {
  it('does not render the indicator', async () => {
    const container = document.createElement('div')
    const root = createRoot(container)

    await act(async () => {
      root.render(<InjectionLevelIndicator level='med' />)
    })

    expect(container.textContent ?? '').not.toContain('Audio:')

    await act(async () => {
      root.unmount()
    })
  })

  it('never renders even when visible is true', async () => {
    const container = document.createElement('div')
    const root = createRoot(container)

    await act(async () => {
      root.render(<InjectionLevelIndicator level='high' visible />)
    })

    expect(container.textContent ?? '').not.toContain('Audio:')

    await act(async () => {
      root.unmount()
    })
  })
})
