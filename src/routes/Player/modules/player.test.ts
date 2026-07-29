import { describe, expect, it, vi } from 'vitest'
import playerReducer, { playerLoad, playerUpdate } from './player'

// hoisted above the import above: the engine subclasses AudioWorkletNode at
// module scope, which doesn't exist outside a browser. The reducer only ever
// needs isSupported().
vi.mock('lib/pitchShifter', () => ({
  pitchShifterEngine: { isSupported: () => true },
}))

// the reducer's initialState reflects the browser's actual capabilities, so
// isPitchSupported is set explicitly by every case below
const stateWith = (overrides: Record<string, unknown>) => playerReducer(
  undefined,
  playerUpdate({ isPitchSupported: true, ...overrides }),
)

describe('playerLoad', () => {
  it('applies the media\'s default pitch', () => {
    const state = playerReducer(stateWith({}), playerLoad({ queueId: 1, pitch: 3 }))

    expect(state.pitch).toBe(3)
    expect(state._isFetching).toBe(true)
  })

  it('leaves the pitch alone when the same item loads again', () => {
    // a load fires again once mediaSrc resolves; a pitch set while waiting
    // shouldn't be discarded by it
    let state = playerReducer(stateWith({}), playerLoad({ queueId: 1, pitch: 3 }))
    state = playerReducer(state, playerUpdate({ pitch: -2 }))
    state = playerReducer(state, playerLoad({ queueId: 1, pitch: 3 }))

    expect(state.pitch).toBe(-2)
  })

  it('applies the default of the next item', () => {
    let state = playerReducer(stateWith({}), playerLoad({ queueId: 1, pitch: 3 }))
    state = playerReducer(state, playerLoad({ queueId: 2, pitch: -4 }))

    expect(state.pitch).toBe(-4)
  })

  it('resets to 0 when the next item has no default', () => {
    let state = playerReducer(stateWith({}), playerLoad({ queueId: 1, pitch: 3 }))
    state = playerReducer(state, playerLoad({ queueId: 2, pitch: 0 }))

    expect(state.pitch).toBe(0)
  })

  it('ignores the default when pitch shifting is unsupported', () => {
    // otherwise every client's status would report a pitch the audio never got
    const state = playerReducer(
      stateWith({ isPitchSupported: false }),
      playerLoad({ queueId: 1, pitch: 3 }),
    )

    expect(state.pitch).toBe(0)
  })

  it('clears any error from the previous item', () => {
    const state = playerReducer(
      stateWith({ errorMessage: 'nope', isErrored: true }),
      playerLoad({ queueId: 1, pitch: 0 }),
    )

    expect(state.isErrored).toBe(false)
    expect(state.errorMessage).toBe('')
  })
})
