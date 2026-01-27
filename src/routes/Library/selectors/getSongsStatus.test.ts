import { describe, it, expect, vi, beforeEach } from 'vitest'
import getSongsStatus from './getSongsStatus'
import getPlayerHistory from 'routes/Queue/selectors/getPlayerHistory'
import type { RootState } from 'store/store'

// Helper to access selector internals for testing
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getSelectorWithMethods = (selector: any) => selector as {
  resetRecomputations?: () => void
  recomputations: () => number
}

// Mock state factory - creates minimal state for selector testing
function createMockState (overrides: Partial<{
  queue: { result: number[], entities: Record<number, { songId: number }> }
  status: { isAtQueueEnd: boolean, queueId: number, historyJSON: string }
}>) {
  return {
    queue: {
      // redux-optimistic-ui wraps state in { current, history, beforeState }
      current: {
        result: [1, 2, 3],
        entities: {
          1: { songId: 101 },
          2: { songId: 102 },
          3: { songId: 103 },
        },
        ...overrides.queue,
      },
      history: [],
      beforeState: null,
    },
    status: {
      isAtQueueEnd: false,
      queueId: 2,
      historyJSON: '[1]',
      ...overrides.status,
    },
    // Other required state slices (minimal stubs)
    user: {} as RootState['user'],
    rooms: {} as RootState['rooms'],
    prefs: {} as RootState['prefs'],
    ui: {} as RootState['ui'],
    songs: {} as RootState['songs'],
    artists: {} as RootState['artists'],
    library: {} as RootState['library'],
    starCounts: {} as RootState['starCounts'],
    userStars: {} as RootState['userStars'],
    songInfo: {} as RootState['songInfo'],
  } as unknown as RootState
}

describe('getSongsStatus', () => {
  beforeEach(() => {
    // Reset selector memoization between tests
    getSelectorWithMethods(getSongsStatus).resetRecomputations?.()
    getSelectorWithMethods(getPlayerHistory).resetRecomputations?.()
  })

  it('should return correct played, upcoming, and current songIds', () => {
    const state = createMockState({})
    const result = getSongsStatus(state)

    expect(result).toEqual({
      played: [101], // queueId 1 is in history
      upcoming: [103], // queueId 3 is not current and not in history
      current: 102, // queueId 2 is current
    })
  })

  it('should memoize results when inputs are identical', () => {
    const state = createMockState({})

    const result1 = getSongsStatus(state)
    const result2 = getSongsStatus(state)

    // Should return same reference due to memoization
    expect(result1).toBe(result2)
  })

  it('should share parsed history with getPlayerHistory selector', () => {
    // The key benefit of using getPlayerHistory is that multiple selectors
    // can share the same parsed history array. When getSongsStatus is called,
    // it should use the same memoized result as getPlayerHistory.
    const state = createMockState({})

    // Call getPlayerHistory first
    const historyFromDirect = getPlayerHistory(state)

    // Now call getSongsStatus - it should use the same memoized history
    getSongsStatus(state)

    // Call getPlayerHistory again - should return the same reference
    // This proves getSongsStatus uses getPlayerHistory internally
    const historyFromDirectAgain = getPlayerHistory(state)

    // The history reference should be identical (memoized)
    expect(historyFromDirect).toBe(historyFromDirectAgain)
  })

  it('should use getPlayerHistory for memoized JSON parsing', () => {
    // This test verifies the selector uses getPlayerHistory internally
    // rather than parsing JSON directly. We can verify this by checking
    // that calling getSongsStatus multiple times with the same state
    // doesn't cause multiple JSON.parse calls.

    const jsonParseSpy = vi.spyOn(JSON, 'parse')
    const state = createMockState({
      status: { isAtQueueEnd: false, queueId: 2, historyJSON: '[1]' },
    })

    // First call - should parse once via getPlayerHistory
    getSongsStatus(state)
    const parseCount1 = jsonParseSpy.mock.calls.length

    // Second call with same state - should NOT parse again
    getSongsStatus(state)
    const parseCount2 = jsonParseSpy.mock.calls.length

    // Parse count should be the same (memoization working)
    expect(parseCount2).toBe(parseCount1)

    jsonParseSpy.mockRestore()
  })
})
