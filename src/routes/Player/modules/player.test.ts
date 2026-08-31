import { describe, expect, it, vi } from 'vitest'
import playerReducer, { playerLoad, playerLoadCurrent, playerUpdate } from './player'
import type { QueueItem } from 'shared/types'

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

describe('playerLoadCurrent', () => {
  // the thunk reads only player.queueId and that item from the queue
  const loadWith = (item?: Partial<QueueItem> | { isOptimistic: true }) => {
    const dispatch = vi.fn()
    const getState = () => ({
      player: { queueId: 1 },
      queue: { result: item ? [1] : [], entities: item ? { 1: item } : {} },
    })

    playerLoadCurrent()(dispatch, getState as never, undefined)

    return dispatch.mock.calls[0][0].payload.pitch
  }

  it('prefers the singer\'s saved pitch over the media default', () => {
    expect(loadWith({ pitch: 4, userPitch: 2 })).toBe(2)
  })

  it('treats a saved 0 as a preference, not the absence of one', () => {
    expect(loadWith({ pitch: 4, userPitch: 0 })).toBe(0)
  })

  it('falls back to the media default without a saved pitch', () => {
    expect(loadWith({ pitch: 4, userPitch: null })).toBe(4)
  })

  it('uses 0 when neither is set', () => {
    expect(loadWith({ pitch: null, userPitch: null })).toBe(0)
  })

  it('uses 0 for an optimistic item, which has no media yet', () => {
    expect(loadWith({ isOptimistic: true })).toBe(0)
  })

  it('uses 0 when the item is gone', () => {
    expect(loadWith()).toBe(0)
  })
})
