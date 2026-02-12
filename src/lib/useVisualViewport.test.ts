import { describe, it, expect } from 'vitest'
import { computeKeyboardOffset } from './useVisualViewport'

describe('computeKeyboardOffset', () => {
  it('returns 0 when visual viewport matches window height', () => {
    expect(computeKeyboardOffset(800, 800, 0)).toEqual({
      keyboardOffset: 0,
      isKeyboardOpen: false,
    })
  })

  it('detects keyboard when visual viewport is significantly smaller', () => {
    // Keyboard takes 300px
    expect(computeKeyboardOffset(800, 500, 0)).toEqual({
      keyboardOffset: 300,
      isKeyboardOpen: true,
    })
  })

  it('ignores small offsets (URL bar hide/show)', () => {
    // URL bar change of 56px should not trigger keyboard detection
    expect(computeKeyboardOffset(800, 744, 0)).toEqual({
      keyboardOffset: 56,
      isKeyboardOpen: false,
    })
  })

  it('accounts for offsetTop in calculation', () => {
    expect(computeKeyboardOffset(800, 450, 50)).toEqual({
      keyboardOffset: 300,
      isKeyboardOpen: true,
    })
  })

  it('clamps negative values to 0', () => {
    expect(computeKeyboardOffset(800, 900, 0)).toEqual({
      keyboardOffset: 0,
      isKeyboardOpen: false,
    })
  })
})
