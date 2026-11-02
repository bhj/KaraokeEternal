import { describe, it, expect } from 'vitest'
import getDisplayQueue, { type DisplayRow } from './getDisplayQueue.js'
import getRoundRobinQueue from './getRoundRobinQueue.js'
import getWaits from './getWaits.js'
import { providerFetchKey, type ProviderFetchView } from '../../Library/modules/library.js'
import type { RootState } from '../../../store/store.js'

interface Fixture {
  // [queueId, userId] in queue order; each item's songId is its queueId
  queue?: [number, number][]
  history?: number[]
  queueId?: number
  nextUserId?: number | null
  position?: number
  fetches?: ProviderFetchView[]
  // song durations by songId (default 200)
  durations?: Record<number, number>
  // songIds not yet in the library
  unloaded?: number[]
}

const stateWith = ({ queue = [], history = [], queueId = -1, nextUserId = null, position = 0, fetches = [], durations = {}, unloaded = [] }: Fixture) => ({
  queue: {
    result: queue.map(([qId]) => qId),
    entities: Object.fromEntries(queue.map(([qId, userId]) => [qId, { queueId: qId, songId: qId, userId }])),
  },
  status: { queueId, nextUserId, position, historyJSON: JSON.stringify(history) },
  library: {
    providerFetches: Object.fromEntries(fetches.map(f => [providerFetchKey(f.providerId, f.itemId), f])),
  },
  songs: {
    entities: Object.fromEntries(queue
      .filter(([qId]) => !unloaded.includes(qId))
      .map(([qId]) => [qId, { songId: qId, duration: durations[qId] ?? 200 }])),
  },
} as unknown as RootState)

// one fetch per singer listed: [userId, timestamp]
const fetch = (itemId: string, requests: [number, number][], overrides: Partial<ProviderFetchView> = {}): ProviderFetchView => ({
  providerId: 1,
  itemId,
  status: 'downloading',
  progress: 0.5,
  title: 'Title',
  artist: 'Artist',
  requests: requests.map(([userId, timestamp]) => ({ userId, timestamp, userDisplayName: 'User', userDateUpdated: 0 })),
  ...overrides,
})

const label = (row: DisplayRow) => row.kind === 'queue' ? row.queueId : `${row.item.itemId}:${row.userId}`
const labels = (state: RootState) => getDisplayQueue(state).map(label)

describe('getDisplayQueue', () => {
  it('matches the round-robin queue when nothing is in flight', () => {
    const state = stateWith({ queue: [[1, 1], [2, 1], [3, 2]], queueId: 1 })
    expect(labels(state)).toEqual(getRoundRobinQueue(state).result)
  })

  it('gives a singer with only an in-flight song their round-robin turn', () => {
    // singer 1 is up; singer 2 has never sung, so goes next
    const state = stateWith({ queue: [[1, 1], [2, 1], [3, 1]], queueId: 1, fetches: [fetch('p', [[2, 100]])] })
    expect(labels(state)).toEqual([1, 'p:2', 2, 3])
  })

  it('puts a singer\'s in-flight songs after their queued ones', () => {
    const state = stateWith({ queue: [[1, 1], [2, 2], [3, 1]], queueId: 1, fetches: [fetch('p', [[2, 100]])] })
    expect(labels(state)).toEqual([1, 2, 3, 'p:2'])
  })

  it('orders one singer\'s in-flight songs by request', () => {
    const state = stateWith({ fetches: [fetch('late', [[1, 200]]), fetch('early', [[1, 100]])] })
    expect(labels(state)).toEqual(['early:1', 'late:1'])
  })

  it('puts never-sung singers with queued songs ahead of those with only in-flight ones', () => {
    const state = stateWith({
      queue: [[1, 1], [2, 3]],
      queueId: 1,
      fetches: [fetch('p4', [[4, 100]]), fetch('p2', [[2, 150]])],
    })
    expect(labels(state)).toEqual([1, 2, 'p4:4', 'p2:2'])
  })

  it('never puts an in-flight song ahead of the current or locked-in next song', () => {
    const base = {
      // 3 sang (0), 1 is up (1); 3 has song 2 queued; 2 has one in flight
      queue: [[0, 3], [1, 1], [2, 3]] as [number, number][],
      history: [0],
      queueId: 1,
      fetches: [fetch('p', [[2, 100]])],
    }
    // unlocked, never-sung singer 2 goes before singer 3
    expect(labels(stateWith(base))).toEqual([0, 1, 'p:2', 2])
    // singer 3 locked in next
    expect(labels(stateWith({ ...base, nextUserId: 3 }))).toEqual([0, 1, 2, 'p:2'])
  })

  it('locks in the next singer\'s in-flight song when their queued one is gone', () => {
    // singer 2 was locked in next, then removed their song and requested one
    const state = stateWith({
      queue: [[1, 1], [3, 4]],
      queueId: 1,
      nextUserId: 2,
      fetches: [fetch('p', [[2, 100]]), fetch('p2', [[2, 200]])],
    })
    expect(labels(state)).toEqual([1, 'p:2', 3, 'p2:2'])
  })

  it('puts errored songs at the bottom', () => {
    const state = stateWith({
      queue: [[1, 1], [2, 1]],
      queueId: 1,
      fetches: [fetch('bad', [[2, 100]], { status: 'error', error: 'nope' })],
    })
    expect(labels(state)).toEqual([1, 2, 'bad:2'])
  })

  it('shows one row per singer waiting on a shared fetch', () => {
    const state = stateWith({ queue: [[1, 1]], queueId: 1, fetches: [fetch('p', [[2, 100], [3, 150]])] })
    expect(labels(state)).toEqual([1, 'p:2', 'p:3'])
  })

  it('hides finished and canceled fetches', () => {
    const state = stateWith({
      fetches: [
        fetch('done', [[1, 100]], { status: 'complete', progress: 1 }),
        fetch('canceled', [[1, 100]], { status: 'canceled' }),
        fetch('waiting', [[1, 100]], { status: 'pending', progress: 0 }),
      ],
    })
    expect(labels(state)).toEqual(['waiting:1'])
  })

  it.each([
    ['nothing in flight', {}],
    ['interleaved singers', { fetches: [fetch('p', [[2, 100]]), fetch('q', [[5, 50]])] }],
    ['a locked-in next singer', { nextUserId: 3, fetches: [fetch('p', [[2, 100]])] }],
    ['a locked-in singer with no queued song', { nextUserId: 5, fetches: [fetch('p', [[5, 100]])] }],
    ['errored songs', { fetches: [fetch('bad', [[1, 100]], { status: 'error' })] }],
  ])('leaves the order of queued songs alone with %s', (_, fixture: Fixture) => {
    const state = stateWith({
      queue: [[0, 3], [1, 1], [2, 3], [3, 1], [4, 4], [6, 3]],
      history: [0],
      queueId: 1,
      ...fixture,
    })
    const queued = getDisplayQueue(state).flatMap(row => row.kind === 'queue' ? [row.queueId] : [])
    expect(queued).toEqual(getRoundRobinQueue(state).result)
  })
})

describe('getWaits', () => {
  const waitsBy = (state: RootState) => {
    const waits = getWaits(state)
    return Object.fromEntries(getDisplayQueue(state)
      .filter(row => waits[row.key] !== undefined)
      .map(row => [label(row), waits[row.key]]))
  }

  it('counts the rest of the current song, then each upcoming one', () => {
    const state = stateWith({ queue: [[1, 1], [2, 2], [3, 1]], queueId: 1, position: 50, durations: { 1: 180, 2: 240 } })
    expect(waitsBy(state)).toEqual({ 2: 130, 3: 370 })
  })

  it('counts an in-flight song expected to be ready for its turn', () => {
    const state = stateWith({
      queue: [[1, 1], [2, 1]],
      queueId: 1,
      fetches: [fetch('p', [[2, 100]], { duration: 300, eta: 60 })],
    })
    expect(waitsBy(state)).toEqual({ 'p:2': 200, '2': 500 })
  })

  it.each([
    ['expected late', { duration: 300, eta: 201 }],
    ['without an estimate', { duration: 300 }],
    ['without a duration', { eta: 0 }],
  ])('gives an in-flight song %s a wait but adds nothing for it', (_, overrides) => {
    const state = stateWith({
      queue: [[1, 1], [2, 1]],
      queueId: 1,
      fetches: [fetch('p', [[2, 100]], overrides)],
    })
    expect(waitsBy(state)).toEqual({ 'p:2': 200, '2': 200 })
  })

  it('gives errored songs no wait', () => {
    const state = stateWith({ queue: [[1, 1]], queueId: 1, fetches: [fetch('bad', [[2, 100]], { status: 'error' })] })
    expect(waitsBy(state)).toEqual({})
  })

  it('counts nothing for a current song already played (queue end)', () => {
    const state = stateWith({ queue: [[1, 1]], history: [1], queueId: 1, fetches: [fetch('p', [[2, 100]])] })
    expect(waitsBy(state)).toEqual({ 'p:2': 0 })
  })

  it('counts nothing for played songs when the current one is gone from the queue', () => {
    const state = stateWith({ queue: [[1, 1], [2, 2], [3, 1]], history: [1, 2], queueId: 99 })
    expect(waitsBy(state)).toEqual({ 3: 0 })
  })

  it('counts every song when nothing has played', () => {
    const state = stateWith({ queue: [[1, 1], [2, 2]] })
    expect(waitsBy(state)).toEqual({ 1: 0, 2: 200 })
  })

  it('skips songs not yet in the library', () => {
    const state = stateWith({ queue: [[1, 1], [2, 2], [3, 3]], queueId: 1, unloaded: [2] })
    expect(waitsBy(state)).toEqual({ 3: 200 })
  })
})
