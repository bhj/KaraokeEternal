import { describe, it, expect } from 'vitest'
import { getPreviewSize } from './orchestratorLayout'

describe('orchestratorLayout', () => {
  it('uses compact preview sizing on narrow screens', () => {
    const size = getPreviewSize(360)
    expect(size.width).toBe(328)
    expect(size.height).toBe(246)
  })

  it('clamps preview width to minimum on very small screens', () => {
    const size = getPreviewSize(280)
    expect(size.width).toBe(248)
    expect(size.height).toBe(186)
  })

  it('uses default preview sizing on wide screens', () => {
    const size = getPreviewSize(1200)
    expect(size.width).toBe(360)
    expect(size.height).toBe(270)
  })
})
