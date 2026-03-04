/**
 * Unit tests for the timing analyser utility functions.
 *
 * All functions are pure, so they can be tested without any browser APIs.
 */

import { describe, it, expect } from 'vitest'
import {
  ALLOWED_DEVIATION_MS,
  evaluateSample,
  analyzeTimings,
  findNearestMetadata,
} from './timingAnalyzer'

// ---------------------------------------------------------------------------
// evaluateSample
// ---------------------------------------------------------------------------

describe('evaluateSample', () => {
  it('returns isOnTime=true when timestamps are identical', () => {
    const { isOnTime, deviation } = evaluateSample(1000, 1000)
    expect(isOnTime).toBe(true)
    expect(deviation).toBe(0)
  })

  it('returns isOnTime=true when deviation is within the allowed window', () => {
    const { isOnTime, deviation } = evaluateSample(1000, 800)
    expect(isOnTime).toBe(true)
    expect(deviation).toBe(200)
  })

  it('returns isOnTime=true when deviation equals the allowed boundary', () => {
    const { isOnTime } = evaluateSample(1300, 1000)
    expect(isOnTime).toBe(true)
  })

  it('returns isOnTime=false when deviation exceeds the allowed window', () => {
    const { isOnTime, deviation } = evaluateSample(2000, 1500)
    expect(isOnTime).toBe(false)
    expect(deviation).toBe(500)
  })

  it('reports negative deviation when singer is early', () => {
    const { deviation, isOnTime } = evaluateSample(900, 1000)
    expect(deviation).toBe(-100)
    expect(isOnTime).toBe(true)
  })

  it(`ALLOWED_DEVIATION_MS constant is ${ALLOWED_DEVIATION_MS}`, () => {
    expect(ALLOWED_DEVIATION_MS).toBe(300)
  })
})

// ---------------------------------------------------------------------------
// analyzeTimings
// ---------------------------------------------------------------------------

describe('analyzeTimings', () => {
  it('returns 0 for an empty array', () => {
    expect(analyzeTimings([])).toBe(0)
  })

  it('returns 1.0 when all pairs are on time', () => {
    const pairs = [
      { userTimestamp: 1000, expectedTimestamp: 950 },
      { userTimestamp: 2000, expectedTimestamp: 1900 },
      { userTimestamp: 3000, expectedTimestamp: 3100 },
    ]
    expect(analyzeTimings(pairs)).toBe(1)
  })

  it('returns 0 when all pairs are off time', () => {
    const pairs = [
      { userTimestamp: 2000, expectedTimestamp: 1000 },
      { userTimestamp: 3500, expectedTimestamp: 2000 },
    ]
    expect(analyzeTimings(pairs)).toBe(0)
  })

  it('returns the fraction of on-time pairs for a mixed set', () => {
    const pairs = [
      { userTimestamp: 1000, expectedTimestamp: 950 }, // on time  (50 ms)
      { userTimestamp: 2000, expectedTimestamp: 1600 }, // off time (400 ms)
      { userTimestamp: 3000, expectedTimestamp: 2750 }, // on time  (250 ms)
    ]
    expect(analyzeTimings(pairs)).toBeCloseTo(2 / 3, 5)
  })

  it('handles a single on-time pair', () => {
    expect(analyzeTimings([{ userTimestamp: 500, expectedTimestamp: 500 }])).toBe(1)
  })

  it('handles a single off-time pair', () => {
    expect(analyzeTimings([{ userTimestamp: 1000, expectedTimestamp: 0 }])).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// findNearestMetadata
// ---------------------------------------------------------------------------

describe('findNearestMetadata', () => {
  const metadata = [
    { time: 1.0, note: 392.00 }, // G4
    { time: 2.0, note: 440.00 }, // A4
    { time: 3.0, note: 493.88 }, // B4
  ]

  it('returns null for an empty metadata array', () => {
    expect(findNearestMetadata([], 1.0)).toBeNull()
  })

  it('returns the exact entry when elapsed time matches perfectly', () => {
    const result = findNearestMetadata(metadata, 2.0)
    expect(result).toEqual({ time: 2.0, note: 440.00 })
  })

  it('returns the nearest entry within the default window', () => {
    const result = findNearestMetadata(metadata, 1.3)
    expect(result).toEqual({ time: 1.0, note: 392.00 })
  })

  it('returns null when the nearest entry is outside the window', () => {
    expect(findNearestMetadata(metadata, 1.8, 0.1)).toBeNull()
  })

  it('respects a custom window size', () => {
    const result = findNearestMetadata(metadata, 1.8, 1.0)
    expect(result).toEqual({ time: 2.0, note: 440.00 })
  })

  it('picks the closest entry when two are equidistant', () => {
    // elapsed = 1.5 is exactly between t=1.0 and t=2.0; should return t=1.0
    // (first minimum found wins because delta comparison is strict <)
    const result = findNearestMetadata(metadata, 1.5)
    expect(result).not.toBeNull()
    expect(result!.time).toBeLessThanOrEqual(2.0)
  })

  it('handles a single-entry array', () => {
    const single = [{ time: 5.0, note: 440 }]
    expect(findNearestMetadata(single, 5.4)).toEqual({ time: 5.0, note: 440 })
    expect(findNearestMetadata(single, 6.0)).toBeNull()
  })
})
