/**
 * Unit tests for the scoring system.
 *
 * Tests cover pitch-only scoring (backward compat) and the new combined
 * pitch + timing scoring.
 */

import { describe, it, expect } from 'vitest'
import { calculateScore } from './scoringSystem'
import type { PitchSample } from './types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSample (
  frequency: number | null,
  expectedFrequency?: number,
  cents?: number | null,
): PitchSample {
  return {
    timestamp: Date.now(),
    frequency,
    noteName: null,
    cents: cents ?? null,
    ...(expectedFrequency != null ? { expectedFrequency } : {}),
  }
}

// ---------------------------------------------------------------------------
// calculateScore – pitch-only (backward compatibility)
// ---------------------------------------------------------------------------

describe('calculateScore – pitch-only', () => {
  it('returns score 0 for empty samples', () => {
    const result = calculateScore([])
    expect(result.score).toBe(0)
    expect(result.presenceRatio).toBe(0)
    expect(result.accuracyRatio).toBeNull()
    expect(result.timingAccuracy).toBeNull()
    expect(result.totalFrames).toBe(0)
  })

  it('scores 100 when all frames have detected pitch (presence only)', () => {
    const samples = [
      makeSample(440),
      makeSample(493.88),
      makeSample(523.25),
    ]
    const { score, presenceRatio } = calculateScore(samples)
    expect(presenceRatio).toBe(1)
    expect(score).toBe(100)
  })

  it('scores 0 when no pitch is detected in any frame', () => {
    const samples = [makeSample(null), makeSample(null)]
    const { score } = calculateScore(samples)
    expect(score).toBe(0)
  })

  it('produces partial score proportional to presence', () => {
    const samples = [makeSample(440), makeSample(null), makeSample(null), makeSample(440)]
    const { presenceRatio } = calculateScore(samples)
    expect(presenceRatio).toBe(0.5)
  })

  it('timingAccuracy is null when not provided', () => {
    const { timingAccuracy } = calculateScore([makeSample(440)])
    expect(timingAccuracy).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// calculateScore – with timing accuracy
// ---------------------------------------------------------------------------

describe('calculateScore – with timingAccuracy', () => {
  it('blends pitch score (70%) with timing (30%) when timingAccuracy is provided', () => {
    // All frames singing, no expected pitch → pitchScore = 1.0
    const samples = [makeSample(440), makeSample(440), makeSample(440)]
    const result = calculateScore(samples, 0.5)

    // score = round((1.0 * 0.7 + 0.5 * 0.3) * 100) = round(85) = 85
    expect(result.score).toBe(85)
    expect(result.timingAccuracy).toBe(0.5)
  })

  it('combines 0% timing with 100% pitch presence correctly', () => {
    const samples = [makeSample(440), makeSample(440)]
    const result = calculateScore(samples, 0)
    // score = round((1.0 * 0.7 + 0 * 0.3) * 100) = 70
    expect(result.score).toBe(70)
  })

  it('returns score=100 when both pitch and timing are perfect', () => {
    const samples = [makeSample(440), makeSample(440)]
    const result = calculateScore(samples, 1.0)
    expect(result.score).toBe(100)
  })

  it('passes timingAccuracy=null through correctly (pitch-only mode)', () => {
    const samples = [makeSample(440)]
    const result = calculateScore(samples, null)
    expect(result.timingAccuracy).toBeNull()
    // Score is pitch-only
    expect(result.score).toBe(100)
  })
})
