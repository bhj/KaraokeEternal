import path from 'path'
import getLogger from '../lib/Log.js'
import type { Provider, ProviderFetchStatus, ProviderSearchResult, ProviderState, ProviderTypeStatus } from '../../shared/types.js'
import { parseNdjson } from './ndjson.js'
import { parseSse } from './sse.js'

const log = getLogger('Providers')

const MAX_RESULTS_PER_PROVIDER = 50

// item types and their API versions this version of Karaoke Eternal implements
export const SUPPORTED_TYPE_VERSIONS: Readonly<Record<string, readonly number[]>> = { song: [0] }
export const SUPPORTED_PROVIDER_TYPES: readonly string[] = Object.keys(SUPPORTED_TYPE_VERSIONS)
export const SUPPORTED_AUTH_VERSIONS: readonly number[] = [0]

// discovery and auth checks shouldn't hang a status check or the admin's add
// flow, and fetch/cancel commands shouldn't hang a user's socket request
const CHECK_TIMEOUT_MS = 10_000
const COMMAND_TIMEOUT_MS = 10_000

// Providers must send a keepalive comment at least every 30s, so a status
// stream silent for three of those intervals died without being closed
const STATUS_IDLE_TIMEOUT_MS = 90_000

// Endpoint paths are appended to the base url, so a trailing slash would double
// up, and so would a pasted discovery URL (the base url plus /api).
export function normalizeProviderUrl (url: string): string {
  return url.trim().replace(/\/+$/, '').replace(/\/api$/, '').replace(/\/+$/, '')
}

// whether the admin has enabled both the provider and one of its types
export function isTypeEnabled (provider: Provider, type: keyof Provider['prefs']['types']): boolean {
  return provider.prefs.enabled && provider.prefs.types[type]?.enabled === true
}

// GET /api response
export interface ProviderApiDescription {
  name: string
  auth: { versions: number[] }
  types: Record<string, { versions: number[] }>
}

export interface ProviderNegotiation {
  // null when no auth version is shared
  authVersion: number | null
  types: Record<string, ProviderTypeStatus>
}

export interface ProviderProbeResult {
  name: string
  authVersion: number
  types: Record<string, ProviderTypeStatus>
}

// Error that also says what state the provider is in, plus per-type
// statuses when it failed after negotiation
export class ProviderError extends Error {
  state: ProviderState
  types: Record<string, ProviderTypeStatus>

  constructor (state: ProviderState, message: string, types: Record<string, ProviderTypeStatus> = {}) {
    super(message)
    this.state = state
    this.types = types
  }
}

// The provider no longer recognizes an item id (a 404 on fetch). Ids are
// opaque and the provider decides their lifetime, so this is an expected
// outcome rather than a provider fault, and the message is user-facing.
export class ProviderItemGoneError extends Error {
  constructor () {
    super('This result has expired. Search again for a fresh one.')
    this.name = 'ProviderItemGoneError'
  }
}

export type { ProviderFetchStatus }
const FETCH_STATUSES: ReadonlySet<string> = new Set<ProviderFetchStatus>(['pending', 'downloading', 'complete', 'error', 'canceled'])

// Field limits from the provider API contract (documented on each field in
// reference-provider-song's src/types.ts), which lets consumers drop values that
// break them. The contract counts UTF-8 bytes; .length counts UTF-16 code
// units, never more than the bytes, so no conformant value is rejected.
// They also keep stored strings, broadcast to every client in a room, bounded.
const MAX_TEXT_CHARS = 1024
const MAX_URL_CHARS = 2048
const MAX_PATH_CHARS = 4096
// meta's contract limit is 4096 bytes as JSON. It's ours, echoed back
// verbatim, and we only ever send a userId and roomId
const MAX_META_CHARS = 4096
const MAX_ETA_SECONDS = 86_400

export interface ProviderFetchEvent {
  id: string
  status: ProviderFetchStatus
  progress: number
  // seconds until complete as of when the event was sent; only on an active status
  eta?: number
  timestamp: number
  title: string
  artist: string
  source: string
  iconUrl: string
  error?: string
  // Absolute filesystem path of the finished file. Required when status === 'complete'.
  path?: string
  meta?: Record<string, unknown>
}

export interface ProviderStatusSubscription {
  close: () => void
}

function isText (val: unknown, max = MAX_TEXT_CHARS): val is string {
  return typeof val === 'string' && val.length <= max
}

// icons are loaded directly by every client's browser, so only web URLs
function isHttpUrl (val: unknown): val is string {
  if (!isText(val, MAX_URL_CHARS)) return false
  try {
    const { protocol } = new URL(val)
    return protocol === 'http:' || protocol === 'https:'
  } catch {
    return false
  }
}

function isPlainObject (val: unknown): val is Record<string, unknown> {
  return !!val && typeof val === 'object' && !Array.isArray(val)
}

type RawSearchResult = Omit<ProviderSearchResult, 'providerId'>

/**
 * Validate one search result and return a copy holding only the contract's
 * fields, or null if it's malformed.
 */
function parseSearchResult (raw: unknown): RawSearchResult | null {
  if (!isPlainObject(raw)) return null
  // an id travels as a URL path segment, and parsers collapse . and ..
  if (!isText(raw.id) || raw.id.length === 0 || raw.id === '.' || raw.id === '..') return null
  if (!isText(raw.title) || raw.title.length === 0) return null
  if (!isText(raw.artist)) return null
  if (!isText(raw.source) || raw.source.length === 0) return null
  if (!isHttpUrl(raw.iconUrl)) return null

  const result: RawSearchResult = { id: raw.id, title: raw.title, artist: raw.artist, source: raw.source, iconUrl: raw.iconUrl }
  if (raw.duration !== undefined) {
    if (typeof raw.duration !== 'number' || !Number.isFinite(raw.duration) || raw.duration <= 0) return null
    result.duration = raw.duration
  }
  return result
}

function isVersionList (raw: unknown): raw is { versions: number[] } {
  if (!raw || typeof raw !== 'object') return false
  const { versions } = raw as Record<string, unknown>
  return Array.isArray(versions) && versions.every(v => Number.isInteger(v))
}

function isApiDescription (raw: unknown): raw is ProviderApiDescription {
  if (!raw || typeof raw !== 'object') return false
  const r = raw as Record<string, unknown>
  return typeof r.name === 'string'
    && isVersionList(r.auth)
    && !!r.types && typeof r.types === 'object' && !Array.isArray(r.types)
    && Object.values(r.types).every(isVersionList)
}

function highestShared (theirs: number[], ours: readonly number[]): number | null {
  const shared = theirs.filter(v => ours.includes(v))
  return shared.length ? Math.max(...shared) : null
}

async function request (url: string, init: RequestInit = {}): Promise<Response> {
  try {
    return await fetch(url, { ...init, signal: AbortSignal.timeout(CHECK_TIMEOUT_MS) })
  } catch (err) {
    throw new ProviderError('unreachable', `Provider is unreachable: ${(err as Error).message}`)
  }
}

export function authHeaders (apiKey?: string): Record<string, string> {
  return apiKey ? { Authorization: `Bearer ${apiKey}` } : {}
}

// base path of one type's API at a negotiated version, e.g. {url}/api/song/v0
function typeApiUrl (provider: Provider, type: string, version: number): string {
  return `${provider.url}/api/${type}/v${version}`
}

/**
 * Parse and validate one status event's JSON payload. Returns a copy holding
 * only the contract's fields, or null if the event is malformed.
 */
export function parseStatusEvent (data: string): ProviderFetchEvent | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(data)
  } catch {
    return null
  }
  if (!isPlainObject(parsed)) return null
  const r = parsed

  if (!isText(r.id) || r.id.length === 0) return null
  if (typeof r.status !== 'string' || !FETCH_STATUSES.has(r.status)) return null
  if (typeof r.progress !== 'number' || !Number.isFinite(r.progress)) return null
  if (typeof r.timestamp !== 'number' || !Number.isFinite(r.timestamp) || r.timestamp < 0) return null
  // title and source are shown in every room's queue, so, as for a search
  // result, they can't be blank
  if (!isText(r.title) || r.title.length === 0) return null
  if (!isText(r.artist)) return null
  if (!isText(r.source) || r.source.length === 0) return null
  if (!isHttpUrl(r.iconUrl)) return null
  let error: string | undefined
  if (r.error !== undefined) {
    if (!isText(r.error)) return null
    error = r.error
  }

  let meta: Record<string, unknown> | undefined
  if (r.meta !== undefined) {
    if (!isPlainObject(r.meta) || JSON.stringify(r.meta).length > MAX_META_CHARS) return null
    meta = r.meta
  }

  let filePath: string | undefined
  if (r.path !== undefined) {
    if (!isText(r.path, MAX_PATH_CHARS) || r.path.length === 0 || r.path.includes('\0') || !path.isAbsolute(r.path)) return null
    filePath = r.path
  }

  const event: ProviderFetchEvent = {
    id: r.id,
    status: r.status as ProviderFetchStatus,
    progress: Math.min(1, Math.max(0, r.progress)),
    timestamp: r.timestamp,
    title: r.title,
    artist: r.artist,
    source: r.source,
    iconUrl: r.iconUrl,
  }
  // only a hint, so an out-of-contract eta is dropped rather than the event,
  // and it means nothing once the download has ended
  const isActive = event.status === 'pending' || event.status === 'downloading'
  if (isActive && typeof r.eta === 'number' && Number.isFinite(r.eta) && r.eta >= 0 && r.eta <= MAX_ETA_SECONDS) {
    event.eta = r.eta
  }
  if (error !== undefined) event.error = error
  if (filePath !== undefined) event.path = filePath
  if (meta !== undefined) event.meta = meta
  return event
}

export default class Providers {
  /**
   * GET /api (unauthenticated discovery)
   */
  static async describe (url: string): Promise<ProviderApiDescription> {
    log.verbose('describe %s', url)
    const res = await request(`${url}/api`)

    // /api is unauthenticated per the provider API, so a 401 can't mean a bad key
    if (res.status === 401 || res.status === 403) {
      throw new ProviderError('unauthorized', 'Provider URL requires separate authentication (e.g. a reverse proxy login)')
    }
    if (res.status === 404) throw new ProviderError('incompatible', 'No provider found at this URL')
    if (!res.ok) throw new ProviderError('unreachable', `Provider returned ${res.status}`)

    const body = await res.json().catch(() => null)
    if (!isApiDescription(body)) throw new ProviderError('incompatible', 'No provider found at this URL')

    return body
  }

  /**
   * Pick the highest shared auth version and, for each supported type the
   * provider offers, the highest shared type version
   */
  static negotiate (desc: ProviderApiDescription): ProviderNegotiation {
    const types: Record<string, ProviderTypeStatus> = {}

    for (const [type, ours] of Object.entries(SUPPORTED_TYPE_VERSIONS)) {
      const offered = desc.types[type]
      if (!offered) continue

      const version = highestShared(offered.versions, ours)
      types[type] = version === null
        ? { version, message: `Provider supports ${type} API ${offered.versions.join(', ') || 'none'}; Karaoke Eternal supports ${ours.join(', ')}` }
        : { version }
    }

    return { authVersion: highestShared(desc.auth.versions, SUPPORTED_AUTH_VERSIONS), types }
  }

  /**
   * GET /api/auth/v{N}
   */
  static async checkAuth (url: string, apiKey: string | undefined, authVersion: number): Promise<void> {
    log.verbose('checkAuth %s (v%d)', url, authVersion)
    const res = await request(`${url}/api/auth/v${authVersion}`, { headers: authHeaders(apiKey) })

    if (res.status === 401 || res.status === 403) throw new ProviderError('unauthorized', 'Invalid API key')
    if (!res.ok) throw new ProviderError('unreachable', `Provider returned ${res.status}`)
  }

  /**
   * Discover, negotiate, and verify credentials. Throws a ProviderError
   * unless auth and at least one supported type are usable.
   */
  static async probe (url: string, apiKey?: string): Promise<ProviderProbeResult> {
    const desc = await Providers.describe(url)
    const { authVersion, types } = Providers.negotiate(desc)

    if (authVersion === null) {
      throw new ProviderError('incompatible', `Provider requires an authentication method Karaoke Eternal doesn't support (provider supports auth ${desc.auth.versions.join(', ') || 'none'}; Karaoke Eternal supports ${SUPPORTED_AUTH_VERSIONS.join(', ')})`)
    }

    const statuses = Object.values(types)
    if (statuses.length === 0) {
      const offered = Object.keys(desc.types)
      throw new ProviderError('incompatible', `Provider offers no types Karaoke Eternal supports (provider offers ${offered.join(', ') || 'none'})`)
    }
    if (!statuses.some(t => t.version !== null)) {
      throw new ProviderError('incompatible', statuses.map(t => t.message).join('. '), types)
    }

    try {
      await Providers.checkAuth(url, apiKey, authVersion)
    } catch (err) {
      if (err instanceof ProviderError) err.types = types
      throw err
    }

    return { name: desc.name, authVersion, types }
  }

  static async search (
    provider: Provider,
    version: number,
    query: string,
    onResult: (results: ProviderSearchResult[]) => void,
    signal: AbortSignal,
  ): Promise<void> {
    const headers = { 'Content-Type': 'application/json', ...authHeaders(provider.apiKey) }

    log.verbose('search %s (%d): %s', provider.name, provider.providerId, query)
    const res = await fetch(`${typeApiUrl(provider, 'song', version)}/search`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query }),
      signal,
    })

    if (!res.ok) throw new Error(`Provider returned ${res.status}`)
    if (!res.body) throw new Error('Provider returned empty body')

    // Each NDJSON line is an array of SearchResults (per the provider API
    // contract), emitted as one onResult call so downstream actions stay
    // batched. Anything else is a protocol error that ends the search.
    let count = 0
    for await (const raw of parseNdjson(res.body)) {
      if (!Array.isArray(raw)) throw new Error('Provider sent a malformed search result line')
      const valid: ProviderSearchResult[] = []
      for (const item of raw) {
        const result = parseSearchResult(item)
        if (result) {
          valid.push({ providerId: provider.providerId, ...result })
        } else {
          log.warn('dropping malformed result from %s (%d)', provider.name, provider.providerId)
        }
      }
      if (valid.length === 0) continue

      const remaining = MAX_RESULTS_PER_PROVIDER - count
      const toEmit = valid.slice(0, remaining)
      onResult(toEmit)
      count += toEmit.length

      if (count >= MAX_RESULTS_PER_PROVIDER) {
        log.verbose('reached %d-result cap for %s (%d)', MAX_RESULTS_PER_PROVIDER, provider.name, provider.providerId)
        break
      }
    }
  }

  static async fetch (
    provider: Provider,
    version: number,
    itemId: string,
    timestamp: number,
    meta: Record<string, unknown>,
  ): Promise<void> {
    const headers = { 'Content-Type': 'application/json', ...authHeaders(provider.apiKey) }

    log.verbose('fetch %s (%d): %s ts=%d', provider.name, provider.providerId, itemId, timestamp)
    const res = await fetch(`${typeApiUrl(provider, 'song', version)}/items/${encodeURIComponent(itemId)}/fetch`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ timestamp, meta }),
      signal: AbortSignal.timeout(COMMAND_TIMEOUT_MS),
    })

    if (res.status === 404) throw new ProviderItemGoneError()
    if (!res.ok) throw new Error(`Provider returned ${res.status}`)
  }

  static async cancel (provider: Provider, version: number, itemId: string): Promise<void> {
    const headers = { 'Content-Type': 'application/json', ...authHeaders(provider.apiKey) }

    log.verbose('cancel %s (%d): %s', provider.name, provider.providerId, itemId)
    const res = await fetch(`${typeApiUrl(provider, 'song', version)}/items/${encodeURIComponent(itemId)}/cancel`, {
      method: 'POST',
      headers,
      signal: AbortSignal.timeout(COMMAND_TIMEOUT_MS),
    })
    // 404 means the provider has no download of the item for our API key
    // (we never fetched it, or the provider forgot it): nothing to cancel
    if (!res.ok && res.status !== 404) throw new Error(`Provider returned ${res.status}`)
  }

  static subscribeStatus (
    provider: Provider,
    version: number,
    sinceSeconds: number,
    onEvent: (e: ProviderFetchEvent) => void,
    onError: (err: Error) => void,
    // called once the provider has accepted the stream, before its snapshot
    onOpen?: () => void,
  ): ProviderStatusSubscription {
    const url = `${typeApiUrl(provider, 'song', version)}/status?since=${encodeURIComponent(String(sinceSeconds))}`
    const controller = new AbortController()

    // Aborts a stream that has gone silent; any bytes reset it, including
    // keepalive comments
    const idleError = new Error('Status stream went silent')
    let idleTimer: ReturnType<typeof setTimeout> | undefined
    const resetIdle = () => {
      clearTimeout(idleTimer)
      idleTimer = setTimeout(() => controller.abort(idleError), STATUS_IDLE_TIMEOUT_MS)
      idleTimer.unref?.()
    }

    log.info('subscribeStatus %s (%d) since=%d', provider.name, provider.providerId, sinceSeconds)

    // Node's EventSource has no way to send the Authorization header, so the
    // stream is read with fetch. ProviderFetch owns reconnection (recheck +
    // backoff), so the stream ending for any reason other than close() is
    // reported through onError.
    void (async () => {
      try {
        resetIdle()
        const res = await fetch(url, {
          headers: { Accept: 'text/event-stream', ...authHeaders(provider.apiKey) },
          signal: controller.signal,
        })
        resetIdle()
        if (!res.ok) throw new Error(`Provider returned ${res.status}`)
        if (!res.body) throw new Error('Provider returned empty body')

        log.info('subscribeStatus %s (%d) OPEN', provider.name, provider.providerId)
        onOpen?.()

        const body = res.body.pipeThrough(new TransformStream<Uint8Array, Uint8Array>({
          transform (chunk, out) {
            resetIdle()
            out.enqueue(chunk)
          },
        }))

        for await (const data of parseSse(body)) {
          log.verbose('subscribeStatus %s (%d) RAW: %s', provider.name, provider.providerId, data)
          const event = parseStatusEvent(data)
          if (event) onEvent(event)
          else log.warn('subscribeStatus %s (%d): rejected malformed event', provider.name, provider.providerId)
        }
        throw new Error('Status stream ended')
      } catch (err) {
        if (controller.signal.reason === idleError) return onError(idleError)
        if (controller.signal.aborted) return
        onError(err instanceof Error ? err : new Error(String(err)))
      } finally {
        clearTimeout(idleTimer)
      }
    })()

    return {
      close: () => {
        clearTimeout(idleTimer)
        controller.abort()
      },
    }
  }
}
