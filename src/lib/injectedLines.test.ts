import { describe, it, expect } from 'vitest'
import { isInjectedLine, stripInjectedLines, isPartialInjectedLine } from './injectedLines'

describe('isInjectedLine', () => {
  it('matches .modulate injection with default multiplier', () => {
    expect(isInjectedLine('  .modulate(osc(3, 0.05), () => a.fft[0] * 0.25)')).toBe(true)
  })

  it('matches .rotate injection with default multiplier', () => {
    expect(isInjectedLine('  .rotate(() => a.fft[1] * 0.08)')).toBe(true)
  })

  it('matches .scale injection with default multiplier', () => {
    expect(isInjectedLine('  .scale(() => 0.95 + a.fft[2] * 0.08)')).toBe(true)
  })

  it('matches .color injection with default multiplier', () => {
    expect(isInjectedLine('  .color(1, 1 - a.fft[3] * 0.06, 1 + a.fft[3] * 0.06)')).toBe(true)
  })

  it('matches with different multipliers (variable float values)', () => {
    expect(isInjectedLine('  .modulate(osc(3, 0.05), () => a.fft[0] * 0.5)')).toBe(true)
    expect(isInjectedLine('  .rotate(() => a.fft[1] * 0.2)')).toBe(true)
    expect(isInjectedLine('  .scale(() => 0.95 + a.fft[2] * 1.0)')).toBe(true)
    expect(isInjectedLine('  .color(1, 1 - a.fft[3] * 0.1, 1 + a.fft[3] * 0.1)')).toBe(true)
  })

  it('matches .saturate injection with default multiplier', () => {
    expect(isInjectedLine('  .saturate(() => 1 + a.fft[0] * 0.3)')).toBe(true)
  })

  it('matches .contrast injection with default multiplier', () => {
    expect(isInjectedLine('  .contrast(() => 1 + a.fft[1] * 0.2)')).toBe(true)
  })

  it('matches .brightness injection with default multiplier', () => {
    expect(isInjectedLine('  .brightness(() => a.fft[0] * 0.15)')).toBe(true)
  })

  it('matches new chain patterns with different multipliers', () => {
    expect(isInjectedLine('  .saturate(() => 1 + a.fft[0] * 0.6)')).toBe(true)
    expect(isInjectedLine('  .contrast(() => 1 + a.fft[1] * 0.4)')).toBe(true)
    expect(isInjectedLine('  .brightness(() => a.fft[0] * 0.3)')).toBe(true)
  })

  it('does NOT match .rotate(0.5) — no a.fft reference', () => {
    expect(isInjectedLine('.rotate(0.5)')).toBe(false)
  })

  it('does NOT match empty lines', () => {
    expect(isInjectedLine('')).toBe(false)
    expect(isInjectedLine('   ')).toBe(false)
  })

  it('does NOT match normal code lines', () => {
    expect(isInjectedLine('osc(10).out()')).toBe(false)
    expect(isInjectedLine('.color(1, 0.5, 0.3)')).toBe(false)
  })
})

describe('stripInjectedLines', () => {
  it('removes only injected lines, preserves everything else', () => {
    const code = [
      'osc(10)',
      '  .modulate(osc(3, 0.05), () => a.fft[0] * 0.25)',
      '  .rotate(() => a.fft[1] * 0.08)',
      '  .scale(() => 0.95 + a.fft[2] * 0.08)',
      '  .color(1, 1 - a.fft[3] * 0.06, 1 + a.fft[3] * 0.06)',
      '  .out()',
    ].join('\n')
    const result = stripInjectedLines(code)
    expect(result).toBe('osc(10)\n  .out()')
  })

  it('returns unchanged code if no injected lines', () => {
    const code = 'osc(10)\n  .rotate(0.5)\n  .out()'
    expect(stripInjectedLines(code)).toBe(code)
  })

  it('strips camera chain (saturate + contrast)', () => {
    const code = [
      'src(s0)',
      '  .saturate(() => 1 + a.fft[0] * 0.3)',
      '  .contrast(() => 1 + a.fft[1] * 0.2)',
      '  .out()',
    ].join('\n')
    const result = stripInjectedLines(code)
    expect(result).toBe('src(s0)\n  .out()')
  })

  it('strips feedback chain (brightness + contrast)', () => {
    const code = [
      'src(o0)',
      '  .brightness(() => a.fft[0] * 0.15)',
      '  .contrast(() => 1 + a.fft[1] * 0.2)',
      '  .out(o0)',
    ].join('\n')
    const result = stripInjectedLines(code)
    expect(result).toBe('src(o0)\n  .out(o0)')
  })
})

describe('isPartialInjectedLine', () => {
  it('matches .modulate( containing a.fft[0] with changed multiplier', () => {
    expect(isPartialInjectedLine('  .modulate(osc(3, 0.05), () => a.fft[0] * 0.99)')).toBe(false) // exact match = isInjectedLine
  })

  it('matches user-modified modulate injection', () => {
    // Changed structure but still has .modulate and a.fft[0]
    expect(isPartialInjectedLine('  .modulate(osc(5, 0.1), () => a.fft[0] * 0.5)')).toBe(true)
  })

  it('does NOT match .rotate(0.5) — no a.fft reference', () => {
    expect(isPartialInjectedLine('.rotate(0.5)')).toBe(false)
  })

  it('returns false for exact injected lines (lint only on modified ones)', () => {
    expect(isPartialInjectedLine('  .modulate(osc(3, 0.05), () => a.fft[0] * 0.25)')).toBe(false)
    expect(isPartialInjectedLine('  .rotate(() => a.fft[1] * 0.08)')).toBe(false)
    expect(isPartialInjectedLine('  .scale(() => 0.95 + a.fft[2] * 0.08)')).toBe(false)
    expect(isPartialInjectedLine('  .color(1, 1 - a.fft[3] * 0.06, 1 + a.fft[3] * 0.06)')).toBe(false)
  })

  it('matches modified rotate injection', () => {
    expect(isPartialInjectedLine('  .rotate(() => a.fft[1] * 0.5 + 0.1)')).toBe(true)
  })

  it('matches modified scale injection', () => {
    expect(isPartialInjectedLine('  .scale(() => 1.0 + a.fft[2] * 0.2)')).toBe(true)
  })

  it('matches modified color injection', () => {
    // Structure changed (added extra arg) but still has .color and a.fft[3]
    expect(isPartialInjectedLine('  .color(1, 1 - a.fft[3] * 0.2, 1 + a.fft[3] * 0.3, 0.5)')).toBe(true)
  })

  it('returns false for exact saturate/contrast/brightness injected lines', () => {
    expect(isPartialInjectedLine('  .saturate(() => 1 + a.fft[0] * 0.3)')).toBe(false)
    expect(isPartialInjectedLine('  .contrast(() => 1 + a.fft[1] * 0.2)')).toBe(false)
    expect(isPartialInjectedLine('  .brightness(() => a.fft[0] * 0.15)')).toBe(false)
  })

  it('matches modified saturate injection', () => {
    expect(isPartialInjectedLine('  .saturate(() => 2 + a.fft[0] * 0.5)')).toBe(true)
  })

  it('matches modified brightness injection', () => {
    expect(isPartialInjectedLine('  .brightness(() => a.fft[0] * 0.5 + 0.1)')).toBe(true)
  })
})
