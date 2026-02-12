import { describe, it, expect } from 'vitest'
import { getPreviewSize, shouldShowRefPanelToggle } from './orchestratorLayout'

describe('orchestratorLayout', () => {
  it('uses full-width preview on narrow screens', () => {
    const size = getPreviewSize(390)
    expect(size.width).toBe(358)
    expect(size.height).toBe(269)
  })

  it('uses full-width preview on tablet-width mobile', () => {
    const size = getPreviewSize(768)
    expect(size.width).toBe(736)
    expect(size.height).toBe(552)
  })

  it('clamps preview width to minimum on very small screens', () => {
    const size = getPreviewSize(260)
    expect(size.width).toBe(240)
    expect(size.height).toBe(180)
  })

  it('uses desktop preview sizing on wide screens', () => {
    const size = getPreviewSize(1200)
    expect(size.width).toBe(420)
    expect(size.height).toBe(315)
  })

  describe('shouldShowRefPanelToggle', () => {
    it('returns true for narrow screens', () => {
      expect(shouldShowRefPanelToggle(800)).toBe(true)
    })

    it('returns false at breakpoint', () => {
      expect(shouldShowRefPanelToggle(980)).toBe(false)
    })

    it('returns false for wide screens', () => {
      expect(shouldShowRefPanelToggle(1200)).toBe(false)
    })
  })
})
