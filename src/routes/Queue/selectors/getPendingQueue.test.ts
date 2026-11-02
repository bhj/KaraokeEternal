import { describe, it, expect } from 'vitest'
import getPendingQueue from './getPendingQueue.js'
import { providerFetchKey, type ProviderFetchView } from '../../Library/modules/library.js'
import type { RootState } from '../../../store/store.js'

const requester = (userId: number, timestamp: number) => ({ userId, timestamp, userDisplayName: 'User', userDateUpdated: 1700000000 })

// one fetch with a single requester
const view = (
  { userId, timestamp, ...overrides }: Partial<ProviderFetchView> & Pick<ProviderFetchView, 'providerId' | 'itemId'> & { userId: number, timestamp: number },
): ProviderFetchView => ({
  status: 'downloading',
  progress: 0,
  title: 'Title',
  artist: 'Artist',
  requests: [requester(userId, timestamp)],
  ...overrides,
})

const stateWith = (entries: ProviderFetchView[]): RootState => ({
  library: {
    providerFetches: Object.fromEntries(
      entries.map(e => [providerFetchKey(e.providerId, e.itemId), e]),
    ),
  },
} as unknown as RootState)

describe('getPendingQueue', () => {
  it('returns [] when there are no fetches', () => {
    expect(getPendingQueue(stateWith([]))).toEqual([])
  })

  it('hides terminal statuses (canceled, complete)', () => {
    const result = getPendingQueue(stateWith([
      view({ providerId: 1, itemId: 'a', userId: 1, timestamp: 100, status: 'pending' }),
      view({ providerId: 1, itemId: 'b', userId: 1, timestamp: 101, status: 'complete' }),
      view({ providerId: 1, itemId: 'c', userId: 1, timestamp: 102, status: 'canceled' }),
    ]))
    expect(result.map(r => r.itemId)).toEqual(['a'])
  })

  it('includes pending, downloading, and error', () => {
    const result = getPendingQueue(stateWith([
      view({ providerId: 1, itemId: 'a', userId: 1, timestamp: 100, status: 'pending' }),
      view({ providerId: 1, itemId: 'b', userId: 1, timestamp: 101, status: 'downloading' }),
      view({ providerId: 1, itemId: 'c', userId: 1, timestamp: 102, status: 'error' }),
    ]))
    expect(result.map(r => r.itemId)).toEqual(['a', 'b', 'c'])
  })

  it('lists one row per requester of a shared fetch', () => {
    const result = getPendingQueue(stateWith([
      view({ providerId: 1, itemId: 'shared', userId: 1, timestamp: 100, requests: [requester(1, 100), requester(2, 150)] }),
      view({ providerId: 1, itemId: 'solo', userId: 2, timestamp: 120 }),
    ]))
    expect(result.map(r => [r.itemId, r.userId])).toEqual([['shared', 1], ['solo', 2], ['shared', 2]])
  })

  it('orders a single user by timestamp ascending', () => {
    const result = getPendingQueue(stateWith([
      view({ providerId: 1, itemId: 'late', userId: 1, timestamp: 200 }),
      view({ providerId: 1, itemId: 'early', userId: 1, timestamp: 100 }),
      view({ providerId: 1, itemId: 'mid', userId: 1, timestamp: 150 }),
    ]))
    expect(result.map(r => r.itemId)).toEqual(['early', 'mid', 'late'])
  })

  it('orders every row by request, oldest first, leaving placement to getDisplayQueue', () => {
    const result = getPendingQueue(stateWith([
      view({ providerId: 1, itemId: 'b1', userId: 2, timestamp: 102 }),
      view({ providerId: 1, itemId: 'a1', userId: 1, timestamp: 100 }),
      view({ providerId: 1, itemId: 'a2', userId: 1, timestamp: 101 }),
    ]))
    expect(result.map(r => r.itemId)).toEqual(['a1', 'a2', 'b1'])
  })

  it('keys each row by fetch and requester', () => {
    const result = getPendingQueue(stateWith([
      view({ providerId: 1, itemId: 'shared', userId: 1, timestamp: 100, requests: [requester(1, 100), requester(2, 150)] }),
    ]))
    expect(result.map(r => r.key)).toEqual(['pending-1-shared-1', 'pending-1-shared-2'])
  })
})
