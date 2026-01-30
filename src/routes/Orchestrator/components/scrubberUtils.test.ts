import { describe, it, expect } from 'vitest'
import { findNumberAtCursor, spliceNumber, getScrubberRange } from './scrubberUtils'

describe('scrubberUtils', () => {
  describe('findNumberAtCursor', () => {
    it('finds an integer at cursor position', () => {
      const code = 'osc(20, 0.1)'
      // cursor on the '2' of '20' (index 4)
      const result = findNumberAtCursor(code, 4)
      expect(result).not.toBeNull()
      expect(result!.value).toBe(20)
      expect(result!.charStart).toBe(4)
      expect(result!.charEnd).toBe(6)
    })

    it('finds a decimal number', () => {
      const code = 'osc(20, 0.1)'
      // cursor on '0.1' (index 8)
      const result = findNumberAtCursor(code, 8)
      expect(result).not.toBeNull()
      expect(result!.value).toBe(0.1)
    })

    it('returns null when cursor is not on a number', () => {
      const code = 'osc(20, 0.1)'
      // cursor on 'o' (index 0)
      const result = findNumberAtCursor(code, 0)
      expect(result).toBeNull()
    })

    it('returns null when cursor is on opening paren', () => {
      const code = 'osc(20)'
      // cursor on '(' (index 3)
      const result = findNumberAtCursor(code, 3)
      expect(result).toBeNull()
    })

    // Unary minus edge cases
    it('treats x-3 as subtraction: cursor on 3 finds 3 (not -3)', () => {
      const code = 'x-3'
      // cursor on '3' (index 2)
      const result = findNumberAtCursor(code, 2)
      expect(result).not.toBeNull()
      expect(result!.value).toBe(3)
      expect(result!.charStart).toBe(2)
    })

    it('treats *-3 as unary minus: cursor on -3 finds -3', () => {
      const code = 'val*-3'
      // cursor on '-' (index 4)
      const result = findNumberAtCursor(code, 4)
      expect(result).not.toBeNull()
      expect(result!.value).toBe(-3)
      expect(result!.charStart).toBe(4)
      expect(result!.charEnd).toBe(6)
    })

    it('treats (-3 as unary minus: finds -3', () => {
      const code = 'osc(-3)'
      // cursor on '-' (index 4)
      const result = findNumberAtCursor(code, 4)
      expect(result).not.toBeNull()
      expect(result!.value).toBe(-3)
      expect(result!.charStart).toBe(4)
      expect(result!.charEnd).toBe(6)
    })

    it('treats -3 at line start as unary minus: finds -3', () => {
      const code = '-3.5'
      const result = findNumberAtCursor(code, 0)
      expect(result).not.toBeNull()
      expect(result!.value).toBe(-3.5)
      expect(result!.charStart).toBe(0)
      expect(result!.charEnd).toBe(4)
    })

    it('treats ,-3 as unary minus: finds -3', () => {
      const code = 'osc(5,-3)'
      // cursor on '-' (index 6)
      const result = findNumberAtCursor(code, 6)
      expect(result).not.toBeNull()
      expect(result!.value).toBe(-3)
    })

    it('treats =-3 as unary minus: finds -3', () => {
      const code = 'x=-3'
      const result = findNumberAtCursor(code, 2)
      expect(result).not.toBeNull()
      expect(result!.value).toBe(-3)
    })

    it('treats cursor on minus sign of *-3 correctly', () => {
      const code = 'a*-3'
      // cursor on '3' (index 3)
      const result = findNumberAtCursor(code, 3)
      expect(result).not.toBeNull()
      expect(result!.value).toBe(-3)
    })
  })

  describe('spliceNumber', () => {
    it('replaces a number at the specified range', () => {
      const code = 'osc(20, 0.1)'
      const result = spliceNumber(code, 4, 6, '35')
      expect(result).toBe('osc(35, 0.1)')
    })

    it('preserves surrounding code', () => {
      const code = 'osc(20, 0.1).rotate(3)'
      const result = spliceNumber(code, 4, 6, '50')
      expect(result).toBe('osc(50, 0.1).rotate(3)')
    })

    it('handles replacing with a longer string', () => {
      const code = 'osc(5)'
      const result = spliceNumber(code, 4, 5, '123')
      expect(result).toBe('osc(123)')
    })

    it('handles replacing with a shorter string', () => {
      const code = 'osc(123)'
      const result = spliceNumber(code, 4, 7, '5')
      expect(result).toBe('osc(5)')
    })
  })

  describe('getScrubberRange', () => {
    it('returns 0-1 range for values between 0 and 1', () => {
      const range = getScrubberRange(0.5)
      expect(range.min).toBe(0)
      expect(range.max).toBe(1)
      expect(range.step).toBe(0.01)
    })

    it('returns appropriate range for values between 1 and 10', () => {
      const range = getScrubberRange(5)
      expect(range.min).toBe(0)
      expect(range.max).toBe(15)
      expect(range.step).toBe(0.1)
    })

    it('returns appropriate range for values > 10', () => {
      const range = getScrubberRange(20)
      expect(range.min).toBe(0)
      expect(range.max).toBe(60)
      expect(range.step).toBe(1)
    })

    it('handles negative values symmetrically', () => {
      const range = getScrubberRange(-5)
      expect(range.min).toBe(-10)
      expect(range.max).toBe(10)
      expect(range.step).toBe(0.1)
    })

    it('handles zero', () => {
      const range = getScrubberRange(0)
      expect(range.min).toBe(0)
      expect(range.max).toBe(1)
      expect(range.step).toBe(0.01)
    })
  })
})
