import type { Server as SocketIOServer } from 'socket.io'
import type { Provider, ProviderStatus as Status } from '../../shared/types.js'
import getLogger from '../lib/Log.js'
import Prefs from '../Prefs/Prefs.js'
import Providers, { ProviderError } from './Providers.js'
import { PROVIDER_STATUS_PUSH } from '../../shared/actionTypes.js'

const log = getLogger('ProviderStatus')

const RETRY_MIN_MS = 1_000
const RETRY_MAX_MS = 30_000

interface Entry {
  status: Status
  // what the current check uses, so sync can tell when to recheck
  url: string
  apiKey?: string
  // bumped on every check so a superseded check's result is ignored
  generation: number
  check: Promise<void> | null
  retryTimer?: ReturnType<typeof setTimeout>
  retryMs: number
}

type Listener = (providerId: number) => void

/**
 * Runtime (in-memory) status of each enabled provider: whether it's reachable,
 * accepts our credentials, and which auth/type API versions were negotiated.
 * Rechecked on startup, on url/apiKey changes, and on request (e.g. when a
 * status stream drops). Failed checks retry with backoff.
 */
export class ProviderStatusImpl {
  private entries = new Map<number, Entry>()
  private listeners = new Set<Listener>()
  private io: SocketIOServer | null = null

  init (io: SocketIOServer): void {
    this.io = io
  }

  stopAll (): void {
    for (const entry of this.entries.values()) {
      if (entry.retryTimer) clearTimeout(entry.retryTimer)
      entry.generation++
    }
    this.entries.clear()
    this.listeners.clear()
  }

  /**
   * Subscribe to status changes
   * @return unsubscribe function
   */
  onChange (fn: Listener): () => void {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  get (providerId: number): Status | undefined {
    return this.entries.get(providerId)?.status
  }

  getAll (): Record<number, Status> {
    return Object.fromEntries(Array.from(this.entries, ([id, entry]) => [id, entry.status]))
  }

  /**
   * Status once any in-progress check finishes
   */
  async settled (providerId: number): Promise<Status | undefined> {
    await this.entries.get(providerId)?.check
    return this.get(providerId)
  }

  /**
   * Negotiated song API version, or null if the song API isn't usable now
   */
  songVersion (providerId: number): number | null {
    const status = this.get(providerId)
    return status?.state === 'ready' ? status.types.song?.version ?? null : null
  }

  /**
   * Why a provider's song API isn't usable (for errors shown to users)
   */
  songUnavailableReason (providerId: number): string {
    const status = this.get(providerId)
    if (!status) return 'Provider is disabled'
    if (status.state === 'checking') return 'Provider is being checked'
    if (status.state !== 'ready') return status.message ?? `Provider is ${status.state}`
    return status.types.song?.message ?? 'Provider does not offer songs'
  }

  /**
   * Reconcile with the enabled providers in prefs: check new providers and
   * those whose url/apiKey changed, and forget removed or disabled ones
   */
  sync (): void {
    const providers = (Object.values(Prefs.get().providers.entities) as Provider[])
      .filter(p => p.prefs.enabled)
    const live = new Map(providers.map(p => [p.providerId, p]))
    const changed: number[] = []

    for (const [providerId, entry] of this.entries) {
      if (live.has(providerId)) continue
      if (entry.retryTimer) clearTimeout(entry.retryTimer)
      entry.generation++
      this.entries.delete(providerId)
      changed.push(providerId)
    }

    for (const provider of providers) {
      const entry = this.entries.get(provider.providerId)
      if (entry && entry.url === provider.url && entry.apiKey === provider.apiKey) continue
      void this.recheck(provider.providerId)
    }

    if (changed.length) this.emit(changed)
  }

  /**
   * Start a check now (or join the one in progress)
   */
  recheck (providerId: number): Promise<void> {
    const provider = Prefs.get().providers.entities[providerId] as Provider | undefined
    if (!provider?.prefs.enabled) return Promise.resolve()

    let entry = this.entries.get(providerId)

    // join an in-progress check unless it's for stale connection details
    if (entry?.check && entry.url === provider.url && entry.apiKey === provider.apiKey) {
      return entry.check
    }

    if (!entry) {
      entry = { status: { state: 'checking', types: {} }, url: provider.url, generation: 0, check: null, retryMs: RETRY_MIN_MS }
      this.entries.set(providerId, entry)
    }

    if (entry.retryTimer) {
      clearTimeout(entry.retryTimer)
      entry.retryTimer = undefined
    }

    if (entry.url !== provider.url || entry.apiKey !== provider.apiKey) {
      entry.retryMs = RETRY_MIN_MS
    }

    entry.url = provider.url
    entry.apiKey = provider.apiKey
    // keep the last known types so the UI doesn't flicker while checking
    entry.status = { state: 'checking', types: entry.status.types }
    this.emit([providerId])

    const generation = ++entry.generation
    const check = this.runCheck(provider, generation)
    entry.check = check
    return check
  }

  private async runCheck (provider: Provider, generation: number): Promise<void> {
    const { providerId } = provider
    let status: Status

    try {
      const { types } = await Providers.probe(provider.url, provider.apiKey)
      status = { state: 'ready', types }
    } catch (err) {
      status = err instanceof ProviderError
        ? { state: err.state, message: err.message, types: err.types }
        : { state: 'unreachable', message: (err as Error).message, types: {} }
    }

    const entry = this.entries.get(providerId)
    if (!entry || entry.generation !== generation) return // superseded

    entry.check = null
    entry.status = status

    if (status.state === 'ready') {
      log.info('%s (%d) ready: %j', provider.name, providerId, status.types)
      entry.retryMs = RETRY_MIN_MS
    } else {
      log.warn('%s (%d) %s: %s (retrying in %dms)', provider.name, providerId, status.state, status.message, entry.retryMs)
      entry.retryTimer = setTimeout(() => {
        entry.retryTimer = undefined
        void this.recheck(providerId)
      }, entry.retryMs)
      entry.retryTimer.unref?.()
      entry.retryMs = Math.min(entry.retryMs * 2, RETRY_MAX_MS)
    }

    this.emit([providerId])
  }

  private emit (providerIds: number[]): void {
    this.pushToAdmins()

    for (const providerId of providerIds) {
      for (const fn of this.listeners) {
        try {
          fn(providerId)
        } catch (err) {
          log.error('listener failed for provider %d: %s', providerId, (err as Error).message)
        }
      }
    }
  }

  private pushToAdmins (): void {
    if (!this.io) return

    const adminIds: string[] = []
    for (const sock of this.io.sockets.sockets.values()) {
      // user is attached when the socket authenticates
      const { user } = sock as unknown as { user?: { isAdmin?: boolean } }
      if (user?.isAdmin) adminIds.push(sock.id)
    }

    if (adminIds.length) {
      this.io.to(adminIds).emit('action', {
        type: PROVIDER_STATUS_PUSH,
        payload: this.getAll(),
      })
    }
  }
}

const ProviderStatus = new ProviderStatusImpl()

export default ProviderStatus
