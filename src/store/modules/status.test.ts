import { describe, it, expect } from 'vitest'
import statusReducer, { type StatusState } from './status'
import { PLAYER_FFT, PLAYER_LEAVE } from 'shared/actionTypes'
import { type FftPayload } from 'shared/fftPayload'

describe('status reducer', () => {
  const initialState: StatusState = {
    cdgAlpha: 0,
    cdgSize: 0.8,
    errorMessage: '',
    fftData: null,
    historyJSON: '[]',
    isAtQueueEnd: false,
    isErrored: false,
    isPlayerPresent: false,
    isPlaying: false,
    isVideoKeyingEnabled: false,
    isWebGLSupported: false,
    mediaType: null,
    mp4Alpha: 1,
    nextUserId: null,
    position: 0,
    queueId: -1,
    visualizer: {},
    volume: 1,
  }

  it('should handle PLAYER_FFT', () => {
    const payload: FftPayload = {
      fft: [0, 1],
      bass: 0.5,
      mid: 0.5,
      treble: 0.5,
      beat: 1,
      energy: 0.5,
      bpm: 120,
      bright: 0.5,
    }

    const nextState = statusReducer(initialState, {
      type: PLAYER_FFT,
      payload,
    })

    expect(nextState.fftData).toEqual(payload)
  })

  it('should clear fftData on PLAYER_LEAVE', () => {
    const stateWithFft: StatusState = {
      ...initialState,
      isPlayerPresent: true,
      fftData: {
        fft: [0, 1],
        bass: 0.5,
        mid: 0.5,
        treble: 0.5,
        beat: 1,
        energy: 0.5,
        bpm: 120,
        bright: 0.5,
      },
    }

    const nextState = statusReducer(stateWithFft, {
      type: PLAYER_LEAVE,
    })

    expect(nextState.isPlayerPresent).toBe(false)
    expect(nextState.fftData).toBeNull()
  })
})
