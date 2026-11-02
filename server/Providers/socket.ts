import type { Socket } from 'socket.io'
import type { Provider } from '../../shared/types.js'
import Providers, { isTypeEnabled } from './Providers.js'
import ProviderFetch from './ProviderFetch.js'
import ProviderStatus from './ProviderStatus.js'
import Prefs from '../Prefs/Prefs.js'
import getLogger from '../lib/Log.js'
import {
  PROVIDER_SEARCH_REQUEST,
  PROVIDER_SEARCH_CANCEL,
  PROVIDER_SEARCH_RESULT,
  PROVIDER_SEARCH_PROVIDER_ERROR,
  PROVIDER_SEARCH_COMPLETE,
  PROVIDER_FETCH_REQUEST,
  PROVIDER_FETCH_CANCEL,
  _SUCCESS,
  _ERROR,
} from '../../shared/actionTypes.js'

const log = getLogger('Providers')
const SEARCH_TIMEOUT_MS = 15_000
const MAX_SEARCH_PROVIDER_IDS = 100
const MAX_DURATION_SECONDS = 86_400

const aborters = new Map<Socket, AbortController>()

function abortFor (sock: Socket): void {
  const existing = aborters.get(sock)
  if (existing) {
    existing.abort()
    aborters.delete(sock)
  }
}

export function disposeProviderSearch (sock: Socket): void {
  abortFor(sock)
}

const ACTION_HANDLERS = {
  [PROVIDER_SEARCH_REQUEST]: async (sock, { payload }, acknowledge) => {
    const query: unknown = payload?.query
    if (typeof query !== 'string' || !query.trim()) {
      return acknowledge({ type: PROVIDER_SEARCH_REQUEST + _ERROR, error: 'Invalid query' })
    }

    const providerIds: unknown = payload?.providerIds
    if (!Array.isArray(providerIds)
      || providerIds.length > MAX_SEARCH_PROVIDER_IDS
      || !providerIds.every(Number.isInteger)) {
      return acknowledge({ type: PROVIDER_SEARCH_REQUEST + _ERROR, error: 'Invalid providerIds' })
    }

    // The client picks providerIds by comparing its local result count to each
    // provider's prefs.maxLibraryResults. That's a UI hint only (the server can't see the
    // client's local results), so this doesn't restrict what a client may search.
    // Filtering the configured list (vs. mapping ids) caps the fan-out at one
    // request per provider regardless of duplicate or unknown ids.
    const requested = new Set(providerIds)
    const providers = (Object.values(Prefs.get().providers.entities) as Provider[])
      .filter(p => isTypeEnabled(p, 'song') && requested.has(p.providerId))

    if (providers.length === 0) {
      return acknowledge({ type: PROVIDER_SEARCH_REQUEST + _ERROR, error: 'No matching providers' })
    }

    abortFor(sock)
    const controller = new AbortController()
    aborters.set(sock, controller)
    log.verbose('[search] start query=%j', query)
    const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(SEARCH_TIMEOUT_MS)])

    await Promise.allSettled(providers.map(async (provider) => {
      try {
        // right after startup or a provider change, its check may still be running
        await ProviderStatus.settled(provider.providerId)
        const version = ProviderStatus.songVersion(provider.providerId)
        if (version === null) throw new Error(ProviderStatus.songUnavailableReason(provider.providerId))

        await Providers.search(provider, version, query, (results) => {
          if (signal.aborted) return
          // Hide items already completed (ingested) so the UI prioritizes the
          // local entry and we don't risk re-triggering provider work.
          const fresh = results.filter(r => !ProviderFetch.isComplete(provider.providerId, r.id))
          sock.emit('action', {
            type: PROVIDER_SEARCH_RESULT,
            payload: { query, providerId: provider.providerId, results: fresh },
          })
        }, signal)
      } catch (err) {
        if (signal.aborted) return
        log.warn('search failed for provider %s: %s', provider.url, (err as Error).message)
        sock.emit('action', {
          type: PROVIDER_SEARCH_PROVIDER_ERROR,
          payload: { query, providerId: provider.providerId, message: (err as Error).message },
        })
      }
    }))

    // Only signal completion if this request wasn't superseded or cancelled.
    // Timeouts leave the controller in the map, so they still emit COMPLETE
    // (lets the client clear its loading state on a stuck provider).
    const stillCurrent = aborters.get(sock) === controller
    log.verbose('[search] settled query=%j aborted=%s stillCurrent=%s', query, signal.aborted, stillCurrent)
    if (stillCurrent) {
      aborters.delete(sock)
      sock.emit('action', {
        type: PROVIDER_SEARCH_COMPLETE,
        payload: { query },
      })
    }
  },

  [PROVIDER_SEARCH_CANCEL]: (sock, _action, acknowledge) => {
    abortFor(sock)
    acknowledge({ type: PROVIDER_SEARCH_CANCEL + _SUCCESS })
  },

  [PROVIDER_FETCH_REQUEST]: async (sock, { payload }, acknowledge) => {
    const providerId = Number(payload?.providerId)
    const itemId: unknown = payload?.itemId
    const title: unknown = payload?.title
    const artist: unknown = payload?.artist
    if (!Number.isFinite(providerId) || typeof itemId !== 'string' || !itemId) {
      return acknowledge({ type: PROVIDER_FETCH_REQUEST + _ERROR, error: 'Invalid providerId or itemId' })
    }
    if (typeof title !== 'string' || typeof artist !== 'string') {
      return acknowledge({ type: PROVIDER_FETCH_REQUEST + _ERROR, error: 'Missing title or artist' })
    }
    // only used for wait estimates, so a bad one is dropped rather than
    // failing the request
    const duration = typeof payload?.duration === 'number' && Number.isFinite(payload.duration) && payload.duration > 0 && payload.duration <= MAX_DURATION_SECONDS
      ? payload.duration as number
      : undefined

    const provider = (Prefs.get().providers.entities as Record<number, Provider>)[providerId]
    if (!provider) {
      return acknowledge({ type: PROVIDER_FETCH_REQUEST + _ERROR, error: 'Unknown provider' })
    }
    if (!isTypeEnabled(provider, 'song')) {
      return acknowledge({ type: PROVIDER_FETCH_REQUEST + _ERROR, error: 'Provider is disabled' })
    }

    const userId: unknown = sock.user?.userId
    const roomId: unknown = sock.user?.roomId
    if (typeof userId !== 'number' || typeof roomId !== 'number') {
      return acknowledge({ type: PROVIDER_FETCH_REQUEST + _ERROR, error: 'No room joined' })
    }

    // whose request it is; omitted, the caller's own (an admin may name
    // another singer to retry their failed request)
    const targetUserId: unknown = payload?.userId ?? userId
    if (typeof targetUserId !== 'number') {
      return acknowledge({ type: PROVIDER_FETCH_REQUEST + _ERROR, error: 'Invalid userId' })
    }

    try {
      await ProviderStatus.settled(providerId)
      await ProviderFetch.request(provider, itemId, targetUserId, roomId, title, artist, duration, { userId, isAdmin: sock.user.isAdmin === true })
      acknowledge({ type: PROVIDER_FETCH_REQUEST + _SUCCESS })
    } catch (err) {
      log.warn('fetch failed for provider %s, item %s: %s', provider.url, itemId, (err as Error).message)
      acknowledge({ type: PROVIDER_FETCH_REQUEST + _ERROR, error: (err as Error).message })
    }
  },

  [PROVIDER_FETCH_CANCEL]: async (sock, { payload }, acknowledge) => {
    const providerId = Number(payload?.providerId)
    const itemId: unknown = payload?.itemId
    if (!Number.isFinite(providerId) || typeof itemId !== 'string' || !itemId) {
      return acknowledge({ type: PROVIDER_FETCH_CANCEL + _ERROR, error: 'Invalid providerId or itemId' })
    }

    const provider = (Prefs.get().providers.entities as Record<number, Provider>)[providerId]
    if (!provider) {
      return acknowledge({ type: PROVIDER_FETCH_CANCEL + _ERROR, error: 'Unknown provider' })
    }

    // whose request to withdraw; omitted, the caller's own (or, for an admin
    // holding none, everyone's in the room)
    const targetUserId: number | undefined = typeof payload?.userId === 'number' ? payload.userId : undefined
    if (payload?.userId !== undefined && targetUserId === undefined) {
      return acknowledge({ type: PROVIDER_FETCH_CANCEL + _ERROR, error: 'Invalid userId' })
    }

    const userId: unknown = sock.user?.userId
    const roomId: unknown = sock.user?.roomId
    if (typeof userId !== 'number' || typeof roomId !== 'number') {
      return acknowledge({ type: PROVIDER_FETCH_CANCEL + _ERROR, error: 'No room joined' })
    }

    try {
      await ProviderFetch.cancel(provider, itemId, { roomId, userId, isAdmin: sock.user.isAdmin === true, targetUserId })
      acknowledge({ type: PROVIDER_FETCH_CANCEL + _SUCCESS })
    } catch (err) {
      acknowledge({ type: PROVIDER_FETCH_CANCEL + _ERROR, error: (err as Error).message })
    }
  },
}

export default ACTION_HANDLERS
