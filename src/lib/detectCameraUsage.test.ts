import { describe, it, expect } from 'vitest'
import { detectCameraUsage } from './detectCameraUsage'

describe('detectCameraUsage', () => {
  it('detects src(s0) usage', () => {
    const result = detectCameraUsage('src(s0).out()')
    expect(result).toEqual({ sources: ['s0'], hasExplicitInit: false })
  })

  it('detects src(s0) with explicit initCam', () => {
    const result = detectCameraUsage('s0.initCam()\nsrc(s0).out()')
    expect(result).toEqual({ sources: ['s0'], hasExplicitInit: true })
  })

  it('detects multiple sources in one expression', () => {
    const result = detectCameraUsage('src(s0).blend(src(s2)).out()')
    expect(result.sources).toEqual(['s0', 's2'])
  })

  it('returns empty sources for non-camera code', () => {
    const result = detectCameraUsage('osc(10).out()')
    expect(result).toEqual({ sources: [], hasExplicitInit: false })
  })

  it('ignores src(s0) in line comments', () => {
    const result = detectCameraUsage('// src(s0)\nosc(10).out()')
    expect(result).toEqual({ sources: [], hasExplicitInit: false })
  })

  it('ignores src(s0) in block comments', () => {
    const result = detectCameraUsage('/* src(s0) */\nosc(10).out()')
    expect(result).toEqual({ sources: [], hasExplicitInit: false })
  })

  it('ignores src(s0) in string literals', () => {
    const result = detectCameraUsage('"src(s0)"\nosc(10).out()')
    expect(result).toEqual({ sources: [], hasExplicitInit: false })
  })

  it('deduplicates sources', () => {
    const result = detectCameraUsage('src(s0).blend(src(s0)).out()')
    expect(result.sources).toEqual(['s0'])
  })

  it('detects initImage as explicit init', () => {
    const result = detectCameraUsage('s0.initImage("url")\nsrc(s0).out()')
    expect(result).toEqual({ sources: ['s0'], hasExplicitInit: true })
  })

  it('detects initVideo as explicit init', () => {
    const result = detectCameraUsage('s0.initVideo("url")\nsrc(s0).out()')
    expect(result).toEqual({ sources: ['s0'], hasExplicitInit: true })
  })

  it('detects initScreen as explicit init', () => {
    const result = detectCameraUsage('s0.initScreen()\nsrc(s0).out()')
    expect(result).toEqual({ sources: ['s0'], hasExplicitInit: true })
  })

  it('sorts sources numerically', () => {
    const result = detectCameraUsage('src(s2).blend(src(s0)).out()')
    expect(result.sources).toEqual(['s0', 's2'])
  })

  /**
   * Known limitation: template literals (backtick strings) are treated as
   * opaque skip regions by getSkipRegions. src(s0) inside a template literal
   * will be skipped, even if it's in a ${} expression. This is acceptable
   * for Hydra code patterns where template literals are rarely used.
   */
  it('(known limitation) src(s0) inside template literal is skipped', () => {
    const result = detectCameraUsage('`${src(s0)}`\nosc(10).out()')
    expect(result).toEqual({ sources: [], hasExplicitInit: false })
  })
})
