import { describe, expect, it } from 'vitest'
import { isValidReplayGain, RG_GAIN_MAX, RG_GAIN_MIN, RG_PEAK_MAX } from './ReplayGain.js'

describe('isValidReplayGain', () => {
  it.each([
    ['a typical value', -5.2, 0.98, true],
    ['unity', 0, 1, true],
    ['overshooting peak', -8, 1.4, true],
    ['minimum gain', RG_GAIN_MIN, 1, true],
    ['maximum gain', RG_GAIN_MAX, 1, true],
    ['maximum peak', 0, RG_PEAK_MAX, true],
    ['gain below range', RG_GAIN_MIN - 0.1, 1, false],
    ['gain above range', RG_GAIN_MAX + 0.1, 1, false],
    ['absurd gain', 1e9, 1, false],
    ['zero peak', -5, 0, false],
    ['negative peak', -5, -1, false],
    ['peak above range', -5, RG_PEAK_MAX + 0.1, false],
    ['NaN gain', NaN, 1, false],
    ['NaN peak', -5, NaN, false],
    ['infinite gain', Infinity, 1, false],
    ['negative infinite gain', -Infinity, 1, false],
    ['infinite peak', -5, Infinity, false],
    ['string gain', '-5', 1, false],
    ['string peak', -5, '1', false],
    ['null gain', null, 1, false],
    ['null peak', -5, null, false],
    ['undefined gain', undefined, 1, false],
    ['undefined peak', -5, undefined, false],
  ])('%s', (_name, gain, peak, expected) => {
    expect(isValidReplayGain(gain, peak)).toBe(expected)
  })
})
