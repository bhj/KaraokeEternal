import { describe, it, expect } from 'vitest'
import { valueFromPosition, valueFromDelta } from './paramUtils'

describe('paramUtils', () => {
  it('valueFromPosition maps pointer to range', () => {
    const min = 0
    const max = 100
    const step = 1
    const left = 10
    const width = 200

    expect(valueFromPosition(10, left, width, min, max, step)).toBe(0)
    expect(valueFromPosition(210, left, width, min, max, step)).toBe(100)
    expect(valueFromPosition(110, left, width, min, max, step)).toBe(50)
  })

  it('valueFromPosition snaps to step', () => {
    const min = 0
    const max = 1
    const step = 0.1
    const left = 0
    const width = 100

    expect(valueFromPosition(55, left, width, min, max, step)).toBe(0.6)
  })

  it('valueFromDelta combines horizontal and vertical drag', () => {
    const min = 0
    const max = 1
    const step = 0.01
    const trackWidth = 200

    const base = 0.5
    const deltaX = 50 // quarter of track width
    const deltaY = -75 // upward drag (increase)

    const next = valueFromDelta({
      startValue: base,
      deltaX,
      deltaY,
      trackWidth,
      min,
      max,
      step,
    })

    expect(next).toBeGreaterThan(base)
    expect(next).toBeLessThanOrEqual(max)
  })
})
