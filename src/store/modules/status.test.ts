import { describe, it, expect } from 'vitest'
import statusReducer from './status'
import { PLAYER_FFT, PLAYER_LEAVE } from 'shared/actionTypes'
import type { FftPayload } from 'shared/fftPayload'

const validFft: FftPayload = {
  fft: [0.5, 0.3],
  bass: 0.6,
  mid: 0.4,
  treble: 0.2,
  beat: 0,
  energy: 0.5,
  bpm: 0.5,
  bright: 0.4,
}

describe('status reducer', () => {
  it('stores fftData on PLAYER_FFT', () => {
    const state = statusReducer(undefined, { type: PLAYER_FFT, payload: validFft })
    expect(state.fftData).toEqual(validFft)
  })

  it('clears fftData on PLAYER_LEAVE', () => {
    const prev = statusReducer(undefined, { type: PLAYER_FFT, payload: validFft })
    expect(prev.fftData).toEqual(validFft)
    const state = statusReducer(prev, { type: PLAYER_LEAVE })
    expect(state.fftData).toBeNull()
  })
})
