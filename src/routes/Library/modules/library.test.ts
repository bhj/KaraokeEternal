import { describe, it, expect } from 'vitest'
import {
  PROVIDER_FETCH_REQUEST,
  PROVIDER_FETCH_STATUS,
  PROVIDER_SEARCH_REQUEST,
} from '../../../../shared/actionTypes.js'
import libraryReducer, { providerFetchKey, type ProviderFetchView } from './library.js'

const alice = { userId: 7, userDisplayName: 'Alice', userDateUpdated: 1700000000, timestamp: 1700000000 }
const bob = { userId: 8, userDisplayName: 'Bob', userDateUpdated: 1700000000, timestamp: 1700000010 }

const view = (overrides: Partial<ProviderFetchView> = {}): ProviderFetchView => ({
  providerId: 1,
  itemId: 'a1',
  status: 'pending',
  progress: 0,
  title: 'Some Song',
  artist: 'Some Artist',
  requests: [alice],
  ...overrides,
})

const requestPayload = (overrides: Partial<{
  providerId: number
  itemId: string
  title: string
  artist: string
  userId: number
  userDisplayName: string
  userDateUpdated: number
}> = {}) => ({
  providerId: 1,
  itemId: 'a1',
  title: 'Some Song',
  artist: 'Some Artist',
  userId: 7,
  userDisplayName: 'Alice',
  userDateUpdated: 1700000000,
  ...overrides,
})

describe('library reducer — PROVIDER_FETCH_*', () => {
  it('PROVIDER_FETCH_REQUEST optimistically inserts a pending entry', () => {
    const next = libraryReducer(undefined, {
      type: PROVIDER_FETCH_REQUEST,
      payload: requestPayload(),
    })
    expect(next.providerFetches[providerFetchKey(1, 'a1')]).toMatchObject({
      providerId: 1,
      itemId: 'a1',
      status: 'pending',
      progress: 0,
      title: 'Some Song',
      artist: 'Some Artist',
      requests: [{ userId: 7, userDisplayName: 'Alice' }],
    })
  })

  it('PROVIDER_FETCH_REQUEST joins an in-flight entry as another requester', () => {
    let state = libraryReducer(undefined, {
      type: PROVIDER_FETCH_STATUS,
      payload: [view({ status: 'downloading', progress: 0.42 })],
    })
    state = libraryReducer(state, {
      type: PROVIDER_FETCH_REQUEST,
      payload: requestPayload({ userId: 8, userDisplayName: 'Bob' }),
    })
    expect(state.providerFetches[providerFetchKey(1, 'a1')]).toMatchObject({
      status: 'downloading',
      progress: 0.42,
      requests: [{ userId: 7 }, { userId: 8, userDisplayName: 'Bob' }],
    })
  })

  it('PROVIDER_FETCH_REQUEST keeps the other requesters when retrying after an error', () => {
    let state = libraryReducer(undefined, {
      type: PROVIDER_FETCH_STATUS,
      payload: [view({ status: 'error', error: 'boom', requests: [alice, bob] })],
    })
    state = libraryReducer(state, {
      type: PROVIDER_FETCH_REQUEST,
      payload: requestPayload(),
    })
    expect(state.providerFetches[providerFetchKey(1, 'a1')]).toMatchObject({
      status: 'pending',
      requests: [{ userId: 8 }, { userId: 7 }],
    })
  })

  it('PROVIDER_FETCH_REQUEST starts over after a cancel', () => {
    let state = libraryReducer(undefined, {
      type: PROVIDER_FETCH_STATUS,
      payload: [view({ status: 'canceled', requests: [] })],
    })
    state = libraryReducer(state, {
      type: PROVIDER_FETCH_REQUEST,
      payload: requestPayload({ userId: 8, userDisplayName: 'Bob' }),
    })
    expect(state.providerFetches[providerFetchKey(1, 'a1')]).toMatchObject({
      status: 'pending',
      requests: [{ userId: 8 }],
    })
  })

  it('PROVIDER_FETCH_REQUEST does not clobber an in-flight entry', () => {
    let state = libraryReducer(undefined, {
      type: PROVIDER_FETCH_STATUS,
      payload: [view({ status: 'downloading', progress: 0.42 })],
    })
    state = libraryReducer(state, {
      type: PROVIDER_FETCH_REQUEST,
      payload: requestPayload(),
    })
    expect(state.providerFetches[providerFetchKey(1, 'a1')]).toMatchObject({
      status: 'downloading',
      progress: 0.42,
    })
  })

  it('PROVIDER_FETCH_REQUEST overwrites a terminal entry', () => {
    let state = libraryReducer(undefined, {
      type: PROVIDER_FETCH_STATUS,
      payload: [view({ status: 'error', progress: 1, error: 'boom' })],
    })
    state = libraryReducer(state, {
      type: PROVIDER_FETCH_REQUEST,
      payload: requestPayload(),
    })
    expect(state.providerFetches[providerFetchKey(1, 'a1')]).toMatchObject({
      providerId: 1,
      itemId: 'a1',
      status: 'pending',
      progress: 0,
    })
  })

  it('PROVIDER_FETCH_STATUS upserts by key', () => {
    let state = libraryReducer(undefined, {
      type: PROVIDER_FETCH_STATUS,
      payload: [view({ status: 'downloading', progress: 0.3 })],
    })
    state = libraryReducer(state, {
      type: PROVIDER_FETCH_STATUS,
      payload: [view({ status: 'complete', progress: 1 })],
    })
    expect(state.providerFetches[providerFetchKey(1, 'a1')]).toMatchObject({
      status: 'complete',
      progress: 1,
    })
  })

  it('PROVIDER_FETCH_STATUS upserts a batch of entries', () => {
    let state = libraryReducer(undefined, {
      type: PROVIDER_FETCH_STATUS,
      payload: [view({ providerId: 1, itemId: 'a1', status: 'downloading', progress: 0.5 })],
    })
    state = libraryReducer(state, {
      type: PROVIDER_FETCH_STATUS,
      payload: [
        view({ providerId: 1, itemId: 'a1', status: 'complete', progress: 1 }),
        view({ providerId: 2, itemId: 'fresh', status: 'downloading', progress: 0.1 }),
      ],
    })
    expect(state.providerFetches[providerFetchKey(1, 'a1')]).toMatchObject({ status: 'complete', progress: 1 })
    expect(state.providerFetches[providerFetchKey(2, 'fresh')]).toMatchObject({ status: 'downloading', progress: 0.1 })
  })
})

describe('library reducer — PROVIDER_SEARCH_REQUEST', () => {
  it('drops complete entries but keeps the rest', () => {
    let state = libraryReducer(undefined, {
      type: PROVIDER_FETCH_STATUS,
      payload: [
        view({ itemId: 'a1', status: 'complete', progress: 1 }),
        view({ itemId: 'b2', status: 'downloading', progress: 0.5 }),
        view({ itemId: 'c3', status: 'error', error: 'nope' }),
      ],
    })
    state = libraryReducer(state, { type: PROVIDER_SEARCH_REQUEST, payload: { query: 'song', providerIds: [1] } })

    expect(state.providerFetches[providerFetchKey(1, 'a1')]).toBeUndefined()
    expect(state.providerFetches[providerFetchKey(1, 'b2')]).toMatchObject({ status: 'downloading' })
    expect(state.providerFetches[providerFetchKey(1, 'c3')]).toMatchObject({ status: 'error' })
  })
})
