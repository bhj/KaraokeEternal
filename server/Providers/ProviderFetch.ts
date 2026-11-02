import fs from 'fs'
import path from 'path'
import sql from 'sqlate'
import type { Server as SocketIOServer } from 'socket.io'
import type { Provider, ProviderFetchRequester, ProviderFetchStatus, ProviderFetchView } from '../../shared/types.js'
import { db } from '../lib/Database.js'
import getLogger from '../lib/Log.js'
import Rooms from '../Rooms/Rooms.js'
import Prefs from '../Prefs/Prefs.js'
import Queue from '../Queue/Queue.js'
import Library from '../Library/Library.js'
import pushQueuesAndLibrary from '../lib/pushQueuesAndLibrary.js'
import Providers, {
  isTypeEnabled,
  ProviderItemGoneError,
  type ProviderFetchEvent,
  type ProviderStatusSubscription,
} from './Providers.js'
import ProviderStatus from './ProviderStatus.js'
import { PROVIDER_FETCH_STATUS } from '../../shared/actionTypes.js'

type StartFileScannerFn = (
  opts: { absPath: string, pathId: number },
) => Promise<{ mediaId: number, songId: number }>

interface UserDisplay {
  userDisplayName: string
  userDateUpdated: number
}

function lookupUser (userId: number): UserDisplay | null {
  const query = sql`SELECT name AS userDisplayName, dateUpdated AS userDateUpdated FROM users WHERE userId = ${userId}`
  const row = db.get<UserDisplay>(String(query), query.parameters)
  return row ?? null
}

const log = getLogger('ProviderFetch')

const RECONNECT_MIN_MS = 1_000
const RECONNECT_MAX_MS = 30_000
// Per-FetchKey leading+trailing throttle for status broadcasts. Coalesces rapid
// progress events so socket.io fan-out doesn't scale with rooms × clients ×
// events/sec. Terminal statuses (complete/error/canceled) bypass.
const STATUS_THROTTLE_MS = 1_000

// Clients compare a row's eta with its wait, which falls as the current song
// plays, so an eta from a provider that rarely sends events is re-sent,
// counted down, often enough that it can't go stale against the wait.
const ETA_RESEND_MS = 10_000

type FetchKey = `${number}:${string}`

// One singer's request for an item in one room. It becomes that singer's
// queue item in that room once the file is ingested, and is their row in the
// room's queue until then. The same singer in two rooms holds two claims.
interface Claim extends ProviderFetchRequester {
  roomId: number
}

interface FetchEntry {
  providerId: number
  itemId: string
  status: ProviderFetchStatus
  progress: number
  error?: string
  // every (room, singer) waiting on the item; empty once canceled
  claims: Claim[]
  // the timestamp the provider holds for this download (see request/resync)
  timestamp: number
  title: string
  artist: string
  // from status events; unset until the provider's first one
  source?: string
  iconUrl?: string
  // the song's length in seconds, from the search result it was requested from
  duration?: number
  // when the provider's latest estimate says it completes (epoch ms); unset
  // without one
  readyAt?: number
  // set once the finished file is ingested, so a later request for the
  // same item can be queued without going back to the provider
  songId?: number
  // the finished file's absolute path, set when ingest starts, so the
  // folder watcher can skip it
  path?: string
}

interface Connection {
  sub: ProviderStatusSubscription | null
  // what the subscription was opened with, so reconcile can tell when to reopen
  url: string
  apiKey?: string
  version: number
  backoffMs: number
  recheckTimer?: ReturnType<typeof setTimeout>
}

function key (providerId: number, itemId: string): FetchKey {
  return `${providerId}:${itemId}`
}

function roomsOf (entry: FetchEntry): Set<number> {
  return new Set(entry.claims.map(c => c.roomId))
}

// the wire view for one room: the entry's state plus that room's requesters
function viewFor (entry: FetchEntry, roomId: number): ProviderFetchView {
  const view: ProviderFetchView = {
    providerId: entry.providerId,
    itemId: entry.itemId,
    status: entry.status,
    progress: entry.progress,
    title: entry.title,
    artist: entry.artist,
    requests: entry.claims
      .filter(c => c.roomId === roomId)
      .map(({ userId, userDisplayName, userDateUpdated, timestamp }) => ({ userId, userDisplayName, userDateUpdated, timestamp })),
  }
  if (entry.error !== undefined) view.error = entry.error
  if (entry.source !== undefined) view.source = entry.source
  if (entry.iconUrl !== undefined) view.iconUrl = entry.iconUrl
  if (entry.duration !== undefined) view.duration = entry.duration
  if (entry.readyAt !== undefined) view.eta = Math.max(0, Math.ceil((entry.readyAt - Date.now()) / 1000))
  return view
}

export class ProviderFetchImpl {
  private entries = new Map<FetchKey, FetchEntry>()
  private connections = new Map<number, Connection>()
  private broadcastTimers = new Map<FetchKey, ReturnType<typeof setTimeout>>()
  private pendingBroadcast = new Set<FetchKey>()
  private io!: SocketIOServer
  private bootstrapSinceSeconds = 0
  private startFileScanner!: StartFileScannerFn
  private unsubscribeStatus: (() => void) | null = null
  private etaTimer: ReturnType<typeof setInterval> | null = null

  init (io: SocketIOServer, opts: { startFileScanner: StartFileScannerFn }): void {
    this.io = io
    this.startFileScanner = opts.startFileScanner

    if (this.etaTimer === null) {
      this.etaTimer = setInterval(() => {
        for (const entry of this.entries.values()) {
          if (entry.readyAt !== undefined) this.emitToRooms(entry)
        }
      }, ETA_RESEND_MS)
      this.etaTimer.unref?.()
    }
  }

  async startAll (): Promise<void> {
    this.bootstrapSinceSeconds = this.computeBootstrapSince()
    log.info('startAll: bootstrap since=%d', this.bootstrapSinceSeconds)

    // status streams open once a provider's song API is negotiated
    this.unsubscribeStatus?.()
    this.unsubscribeStatus = ProviderStatus.onChange(providerId => this.reconcile(providerId))
    this.syncProviders()
  }

  stopAll (): void {
    this.unsubscribeStatus?.()
    this.unsubscribeStatus = null
    for (const conn of this.connections.values()) this.closeConnection(conn)
    this.connections.clear()
    for (const t of this.broadcastTimers.values()) clearTimeout(t)
    this.broadcastTimers.clear()
    this.pendingBroadcast.clear()
  }

  /**
   * Reconcile provider checks and song status streams with the current
   * Prefs.providers list, and cancel in-flight fetches for providers whose
   * songs were disabled. Call after admin add/update/remove of providers so
   * changes apply without a server restart.
   */
  syncProviders (): void {
    const all = Object.values(Prefs.get().providers.entities) as Provider[]

    // before ProviderStatus forgets disabled providers' negotiated versions
    for (const provider of all) {
      if (!isTypeEnabled(provider, 'song')) this.cancelInFlight(provider)
    }

    ProviderStatus.sync()

    const ids = new Set(all.map(p => p.providerId))
    for (const providerId of this.connections.keys()) {
      if (!ids.has(providerId)) this.reconcile(providerId)
    }
    for (const providerId of ids) this.reconcile(providerId)
  }

  /**
   * Request an item for a singer (`userId`) in a room. `by` is who asked when
   * that's someone else: only an admin, and only to retry that singer's
   * failed request in the room.
   */
  async request (
    provider: Provider,
    itemId: string,
    userId: number,
    roomId: number,
    title: string,
    artist: string,
    duration?: number,
    by?: { userId: number, isAdmin: boolean },
  ): Promise<void> {
    const now = Math.floor(Date.now() / 1000)
    const k = key(provider.providerId, itemId)

    // Optimistically upsert local state so the requesting singer is tracked
    // before the provider's first status event arrives.
    const existing = this.getLive(k)

    if (by && by.userId !== userId) {
      if (!by.isAdmin) {
        throw new Error('Only an admin can retry another singer\'s request')
      }
      if (existing?.status !== 'error' || !existing.claims.some(c => c.roomId === roomId && c.userId === userId)) {
        throw new Error('No failed request to retry for that singer')
      }
    }

    // The timestamp the provider stores and echoes on the download's events.
    // onEvent drops events below the entry's, so it never goes backwards
    // (a clock step), and a re-request after a cancel or error goes strictly
    // above the failed download's, so a late event from that one (a
    // `canceled` still in flight) can't be taken for the new download's.
    const isTerminalFailure = existing?.status === 'canceled' || existing?.status === 'error'
    const timestamp = existing ? Math.max(now, existing.timestamp + (isTerminalFailure ? 1 : 0)) : now

    if (existing) {
      this.addClaim(existing, roomId, userId, now)
      existing.duration ??= duration

      // A completed item is already in the library, so this is a request to
      // queue it here; the provider has nothing to add (and would only have
      // its stored meta rewritten). Until ingest has produced a songId, the
      // claim just joins the entry and handleComplete queues it with the rest.
      if (existing.status === 'complete') {
        if (existing.songId !== undefined) {
          await this.queueForRoom(existing, roomId, userId)
          pushQueuesAndLibrary(this.io)
        }
        this.emitToRooms(existing, [roomId])
        return
      }
      // Re-requesting after a terminal failure means the user is asking the
      // provider to try again — reset the entry so the UI shows a spinner
      // instead of the stale canceled/error indicator. Earlier requesters
      // keep their claims: they asked for the song too, and get it if this
      // attempt succeeds.
      if (isTerminalFailure) {
        existing.status = 'pending'
        existing.progress = 0
        delete existing.error
        delete existing.readyAt
        existing.timestamp = timestamp
        this.broadcastEntry(existing)
      } else {
        // Scoped to the requesting room: gives its clients current state now
        // (including the new requester) without waiting on the next trailing
        // edge and without re-broadcasting to other rooms that already have it.
        this.emitToRooms(existing, [roomId])
      }
    } else {
      const entry: FetchEntry = {
        providerId: provider.providerId,
        itemId,
        status: 'pending',
        progress: 0,
        claims: [],
        timestamp,
        title,
        artist,
      }
      if (duration !== undefined) entry.duration = duration
      this.addClaim(entry, roomId, userId, now)
      // Not broadcast until the provider's first status event (which it must
      // send for every accepted request) supplies source/iconUrl; until then
      // the requesting client shows its own optimistic entry.
      this.entries.set(k, entry)
    }

    // Provider-side failures are reported on the item (via broadcast) rather
    // than thrown, so the requester's optimistic entry always resolves
    try {
      const version = ProviderStatus.songVersion(provider.providerId)
      if (version === null) throw new Error(ProviderStatus.songUnavailableReason(provider.providerId))
      await Providers.fetch(provider, version, itemId, timestamp, { userId, roomId })
    } catch (err) {
      log.warn('request failed for %s (%d)/%s: %s', provider.name, provider.providerId, itemId, (err as Error).message)
      const entry = this.entries.get(k)
      if (entry) {
        entry.status = 'error'
        entry.error = (err as Error).message
        this.broadcastEntry(entry)
      }
    }
  }

  /**
   * Withdraw a claim on a tracked fetch. A singer withdraws their own; an
   * admin withdraws any singer's in their room (`targetUserId`), or every
   * claim in the room when they name no one. The provider is only told to
   * cancel once no room is waiting on the item, and only for fetches this
   * server requested (a provider may be shared).
   */
  async cancel (
    provider: Provider,
    itemId: string,
    { roomId, userId, isAdmin, targetUserId }: { roomId: number, userId: number, isAdmin: boolean, targetUserId?: number },
  ): Promise<void> {
    const entry = this.entries.get(key(provider.providerId, itemId))
    if (!entry) {
      throw new Error('Unknown fetch')
    }

    const inRoom = entry.claims.filter(c => c.roomId === roomId)
    let withdrawn: Claim[]
    if (targetUserId !== undefined) {
      if (!isAdmin && targetUserId !== userId) {
        throw new Error('Only the requester or an admin can cancel this fetch')
      }
      withdrawn = inRoom.filter(c => c.userId === targetUserId)
    } else {
      withdrawn = inRoom.filter(c => c.userId === userId)
      if (withdrawn.length === 0 && isAdmin) withdrawn = inRoom
    }
    if (withdrawn.length === 0) {
      if (!isAdmin) throw new Error('Only the requester or an admin can cancel this fetch')
      throw new Error('Unknown fetch')
    }

    entry.claims = entry.claims.filter(c => !withdrawn.includes(c))

    // someone here or in another room is still waiting on it
    if (entry.claims.length > 0) {
      this.emitToRooms(entry, [roomId])
      return
    }

    // A failed fetch has nothing left to cancel provider-side; canceling it
    // just removes it from the queue. Otherwise telling the provider is
    // best-effort: an unavailable or failing provider must not leave the
    // entry stuck, so it's canceled locally regardless.
    const isFailed = entry.status === 'error' || entry.status === 'canceled'
    const version = ProviderStatus.songVersion(provider.providerId)
    if (!isFailed && version !== null) {
      try {
        await Providers.cancel(provider, version, itemId)
      } catch (err) {
        log.warn('cancel: provider cancel failed for %s (%d)/%s: %s', provider.name, provider.providerId, itemId, (err as Error).message)
      }
    }
    this.markCanceled(provider.providerId, itemId, [roomId])
  }

  /**
   * Cancel a provider's pending/downloading fetches (when it's disabled or
   * removed). Its status stream is or will be closed, so entries are marked
   * canceled locally rather than waiting on a `canceled` event; the
   * provider-side cancels are best-effort.
   */
  cancelInFlight (provider: Provider): void {
    const version = ProviderStatus.songVersion(provider.providerId)

    for (const entry of this.entries.values()) {
      if (entry.providerId !== provider.providerId) continue
      if (entry.status !== 'pending' && entry.status !== 'downloading') continue

      log.info('cancelInFlight: canceling %s (%d)/%s', provider.name, provider.providerId, entry.itemId)
      this.markCanceled(provider.providerId, entry.itemId)
      if (version === null) continue
      Providers.cancel(provider, version, entry.itemId).catch((err) => {
        log.warn('cancelInFlight: provider cancel failed for %s (%d)/%s: %s', provider.name, provider.providerId, entry.itemId, (err as Error).message)
      })
    }
  }

  /**
   * Withdraw every claim a user holds (they were deleted). An entry left
   * with no claims is canceled like the last `cancel()` would: the provider
   * is told best-effort and the entry is marked canceled locally. Call after
   * User.remove (User/router.ts) so the user's pending rows leave every
   * room's queue and a download nobody else wants doesn't finish.
   */
  dropUser (userId: number): void {
    for (const entry of this.entries.values()) {
      const withdrawn = entry.claims.filter(c => c.userId === userId)
      if (withdrawn.length === 0) continue

      const rooms = new Set(withdrawn.map(c => c.roomId))
      entry.claims = entry.claims.filter(c => c.userId !== userId)

      if (entry.claims.length > 0) {
        this.emitToRooms(entry, rooms)
        continue
      }

      const provider = Prefs.get().providers.entities[entry.providerId] as Provider | undefined
      const version = ProviderStatus.songVersion(entry.providerId)
      const inFlight = entry.status === 'pending' || entry.status === 'downloading'
      if (inFlight && provider && version !== null) {
        log.info('dropUser: canceling %s (%d)/%s', provider.name, provider.providerId, entry.itemId)
        Providers.cancel(provider, version, entry.itemId).catch((err) => {
          log.warn('dropUser: provider cancel failed for %s (%d)/%s: %s', provider.name, provider.providerId, entry.itemId, (err as Error).message)
        })
      }
      this.markCanceled(entry.providerId, entry.itemId, rooms)
    }
  }

  isComplete (providerId: number, itemId: string): boolean {
    return this.getLive(key(providerId, itemId))?.status === 'complete'
  }

  /**
   * Whether a completed fetch produced the file at absPath, which the file
   * scanner ingests (or already has). A file that's since been deleted, or
   * whose song has left the library, doesn't count, so the change still
   * reaches the library.
   */
  isIngestedFile (absPath: string): boolean {
    const resolved = path.resolve(absPath)
    for (const [k, entry] of this.entries) {
      if (entry.path === resolved && this.getLive(k)?.status === 'complete') {
        return fs.existsSync(resolved)
      }
    }
    return false
  }

  /**
   * Whether any fetch is pending or downloading, i.e. could still land a
   * file before its `complete` event arrives.
   */
  hasInFlight (): boolean {
    for (const entry of this.entries.values()) {
      if (entry.status === 'pending' || entry.status === 'downloading') return true
    }
    return false
  }

  rehydrateForRoom (roomId: number): ProviderFetchView[] {
    const items: ProviderFetchView[] = []
    for (const entry of this.entries.values()) {
      if (entry.claims.some(c => c.roomId === roomId)) items.push(viewFor(entry, roomId))
    }
    return items
  }

  /**
   * Mark a tracked entry as canceled, drop its claims, and rebroadcast to
   * the rooms that held them (plus `rooms`, for a caller that already
   * withdrew the last claim). Every cancel ends here instead of waiting for
   * the provider's `canceled` event, which may never arrive: the provider
   * can answer 404 (it has no download of the item, e.g. it forgot it across
   * a restart), be unreachable, or have had its status stream closed because
   * it was disabled. onEvent ignores whatever the provider sends for the
   * entry afterwards.
   *
   * Callsites: `cancel()`, `cancelInFlight()`, `dropUser()`.
   */
  markCanceled (providerId: number, itemId: string, rooms: Iterable<number> = []): void {
    const k = key(providerId, itemId)
    const entry = this.entries.get(k)
    if (!entry) return
    // A completed fetch already ingested its file; don't retroactively cancel it.
    if (entry.status === 'complete') return

    const notify = new Set([...roomsOf(entry), ...rooms])
    entry.status = 'canceled'
    entry.progress = 0
    delete entry.error
    delete entry.readyAt
    entry.timestamp = Math.floor(Date.now() / 1000)
    entry.claims = []
    this.flushThrottle(k)
    this.emitToRooms(entry, notify)
  }

  // ---- internals ----

  /**
   * Get an entry, first dropping a completed one whose song has since left
   * the library (its file was removed and a rescan dropped it). Search then
   * shows the item again, and a request starts a new download instead of
   * queueing a song that no longer exists.
   */
  private getLive (k: FetchKey): FetchEntry | undefined {
    const entry = this.entries.get(k)
    if (entry?.status === 'complete' && entry.songId !== undefined && !Library.get().songs?.entities[entry.songId]) {
      this.entries.delete(k)
      this.flushThrottle(k)
      return undefined
    }
    return entry
  }

  /**
   * Add a (room, singer) claim unless that singer already holds one there.
   * Throws for an unknown user, who can't be shown in a queue.
   */
  private addClaim (entry: FetchEntry, roomId: number, userId: number, timestamp: number): void {
    if (entry.claims.some(c => c.roomId === roomId && c.userId === userId)) return
    const user = lookupUser(userId)
    if (!user) {
      throw new Error(`Unknown userId ${userId}`)
    }
    entry.claims.push({ roomId, userId, ...user, timestamp })
  }

  /**
   * Drop terminal entries (complete / error / canceled) whose timestamp
   * predates the oldest room still observed by a client. "Still observed"
   * means status='open' OR closed-but-with-connected-sockets. Call after
   * room create/update/delete (Rooms/router.ts)
   */
  prune (): void {
    this.bootstrapSinceSeconds = this.computeBootstrapSince()
    const cutoff = this.bootstrapSinceSeconds
    if (cutoff <= 0) return // no open rooms — nothing to prune against

    let removed = 0
    for (const [k, entry] of this.entries) {
      const terminal = entry.status === 'complete' || entry.status === 'error' || entry.status === 'canceled'
      if (!terminal || entry.timestamp >= cutoff) continue
      this.entries.delete(k)
      this.flushThrottle(k)
      removed++
    }
    if (removed) log.verbose('prune: removed %d entries (cutoff=%d)', removed, cutoff)
  }

  private computeBootstrapSince (): number {
    try {
      // "Still relevant" floor: any room that could have a client watching.
      const occupied = Rooms.getActive(this.io).map(r => r.roomId)
      const query = occupied.length === 0
        ? sql`SELECT MIN(dateCreated) AS minDate FROM rooms WHERE status = 'open'`
        : sql`SELECT MIN(dateCreated) AS minDate FROM rooms WHERE status = 'open' OR roomId IN ${sql.tuple(occupied)}`
      const row = db.get<{ minDate: number | null }>(String(query), query.parameters)
      const min = row?.minDate
      return typeof min === 'number' && Number.isFinite(min) ? min : 0
    } catch (err) {
      log.warn('computeBootstrapSince failed: %s', (err as Error).message)
      return 0
    }
  }

  private since (providerId: number): number {
    // On reconnect, an in-flight fetch may belong to a room that has since
    // closed. Its entry timestamp can predate bootstrapSinceSeconds, so
    // reach back to the oldest tracked entry to avoid missing its tail events.
    let min: number | null = null
    for (const entry of this.entries.values()) {
      if (entry.providerId !== providerId) continue
      if (min === null || entry.timestamp < min) min = entry.timestamp
    }
    if (min !== null && min < this.bootstrapSinceSeconds) return min
    return this.bootstrapSinceSeconds
  }

  /**
   * Open, reopen, or close a provider's song status stream to match its prefs
   * and negotiated status
   */
  private reconcile (providerId: number): void {
    // keep the current stream (if any) until an in-progress check finishes
    if (ProviderStatus.get(providerId)?.state === 'checking') return

    const provider = Prefs.get().providers.entities[providerId] as Provider | undefined
    const version = provider && isTypeEnabled(provider, 'song') ? ProviderStatus.songVersion(providerId) : null
    const conn = this.connections.get(providerId)

    if (!provider || version === null) {
      if (conn) {
        log.info('closing status stream for %s', provider ? `${provider.name} (${providerId})` : `#${providerId}`)
        this.closeConnection(conn)
        this.connections.delete(providerId)
      }
      return
    }

    if (conn?.sub && conn.url === provider.url && conn.apiKey === provider.apiKey && conn.version === version) return

    if (conn) this.closeConnection(conn)
    this.openConnection(provider, version, conn?.backoffMs)
  }

  private openConnection (provider: Provider, version: number, backoffMs = RECONNECT_MIN_MS): void {
    const sinceSeconds = this.since(provider.providerId)
    log.info('opening status stream for %s (%d) (song v%d)', provider.name, provider.providerId, version)

    const conn: Connection = { sub: null, url: provider.url, apiKey: provider.apiKey, version, backoffMs }
    this.connections.set(provider.providerId, conn)

    conn.sub = Providers.subscribeStatus(
      provider,
      version,
      sinceSeconds,
      event => this.onEvent(provider.providerId, event),
      err => this.onError(provider, err),
      () => {
        // the provider accepted the stream, so the connection is healthy
        conn.backoffMs = RECONNECT_MIN_MS
        this.resync(provider, version)
      },
    )
  }

  /**
   * Re-request every fetch still in flight with a provider once its status
   * stream (re)opens.
   *
   * A provider may forget download state (e.g. one that doesn't persist it
   * restarts). Its snapshot then just omits the download, and since nothing
   * marks the snapshot's end, absence can't be told apart from "not sent
   * yet". Without this, such an entry would sit at pending/downloading until
   * someone canceled it. The provider must answer every fetch with an event
   * or a 404, so re-requesting resolves each entry: a remembered download
   * re-emits its state (a no-op), a forgotten one starts fresh, and an
   * expired item 404s.
   *
   * The entry's own timestamp is sent so the resulting event passes this
   * stream's `since` (the lowest tracked timestamp; see since()). A repeat
   * fetch replaces the provider's stored timestamp and meta, so meta is sent
   * in full. The provider holds one requester per download (the latest one
   * request() sent), and that is all onEvent can adopt the download under
   * after a restart; the first claim is sent here so the provider holds a
   * claim that is still waiting.
   */
  private resync (provider: Provider, version: number): void {
    for (const entry of this.entries.values()) {
      if (entry.providerId !== provider.providerId) continue
      if (entry.status !== 'pending' && entry.status !== 'downloading') continue

      const [first] = entry.claims
      const meta = first ? { userId: first.userId, roomId: first.roomId } : {}

      log.verbose('resync: re-requesting %s (%d)/%s', provider.name, provider.providerId, entry.itemId)
      Providers.fetch(provider, version, entry.itemId, entry.timestamp, meta).catch((err) => {
        // the entry may have been canceled or replaced while the request ran
        const k = key(provider.providerId, entry.itemId)
        const stillInFlight = this.entries.get(k) === entry && (entry.status === 'pending' || entry.status === 'downloading')

        if (err instanceof ProviderItemGoneError && stillInFlight) {
          entry.status = 'error'
          entry.error = err.message
          this.broadcastEntry(entry)
          return
        }
        // anything else (e.g. the provider went away again) leaves the entry
        // as is; the next reopen resyncs it
        log.warn('resync: re-request failed for %s (%d)/%s: %s', provider.name, provider.providerId, entry.itemId, (err as Error).message)
      })
    }
  }

  private closeConnection (conn: Connection): void {
    if (conn.recheckTimer) clearTimeout(conn.recheckTimer)
    conn.recheckTimer = undefined
    conn.sub?.close()
    conn.sub = null
  }

  /**
   * After a stream error, recheck the provider (it may have restarted with
   * different versions or credentials); the stream reopens once it's ready
   */
  private scheduleRecheck (provider: Provider): void {
    const conn = this.connections.get(provider.providerId)
    if (!conn || conn.recheckTimer) return

    const delay = Math.min(conn.backoffMs, RECONNECT_MAX_MS)
    log.info('scheduling recheck: %s (%d) in %dms', provider.name, provider.providerId, delay)

    conn.recheckTimer = setTimeout(() => {
      conn.recheckTimer = undefined
      void ProviderStatus.recheck(provider.providerId)
    }, delay)
    conn.recheckTimer.unref?.()

    conn.backoffMs = Math.min(conn.backoffMs * 2, RECONNECT_MAX_MS)
  }

  private nameFor (providerId: number): string {
    const p = Prefs.get().providers.entities[providerId] as Provider | undefined
    return p?.name ?? `#${providerId}`
  }

  private onEvent (providerId: number, event: ProviderFetchEvent): void {
    log.verbose('onEvent provider=%s (%d) id=%s status=%s progress=%d', this.nameFor(providerId), providerId, event.id, event.status, event.progress)

    const k = key(providerId, event.id)
    const existing = this.entries.get(k)

    if (!existing) {
      // Providers scope downloads to the API key, so a stream carries only
      // this server's downloads, even from a provider other servers also use.
      // An untracked event is therefore one this server lost track of, e.g.
      // across a restart, and meta says whose it was.
      const meta = event.meta ?? {}
      // A completion we never tracked (e.g. it finished while this server
      // was down) can't be told apart from one already ingested and queued
      // before a restart, so it isn't acted on. Dropping it, rather than
      // recording a 'complete' entry, keeps the item visible in search; a
      // re-request then follows the normal pending -> complete path.
      if (event.status === 'complete') {
        log.info('onEvent: ignoring untracked completion %s (%d)/%s', this.nameFor(providerId), providerId, event.id)
        return
      }
      const metaRoomId = typeof meta.roomId === 'number' ? meta.roomId : undefined
      const metaUserId = typeof meta.userId === 'number' ? meta.userId : undefined
      // Without the room and singer it was requested for there's nowhere to
      // show or queue it. Better to drop than to push an unattributed row.
      if (metaUserId === undefined || metaRoomId === undefined) {
        log.warn('onEvent: dropping %s (%d)/%s — no userId/roomId in meta', this.nameFor(providerId), providerId, event.id)
        return
      }
      const user = lookupUser(metaUserId)
      if (!user) {
        log.warn('onEvent: dropping %s (%d)/%s — unknown userId %d', this.nameFor(providerId), providerId, event.id, metaUserId)
        return
      }
      const entry: FetchEntry = {
        providerId,
        itemId: event.id,
        status: event.status,
        progress: event.progress,
        claims: [{ roomId: metaRoomId, userId: metaUserId, ...user, timestamp: event.timestamp }],
        timestamp: event.timestamp,
        title: event.title,
        artist: event.artist,
        source: event.source,
        iconUrl: event.iconUrl,
      }
      if (event.error !== undefined) entry.error = event.error
      if (event.eta !== undefined) entry.readyAt = Date.now() + event.eta * 1000
      this.entries.set(k, entry)
      this.broadcastEntry(entry)
      return
    }

    // A canceled entry stays canceled until it's re-requested (which resets it
    // to pending). Events after a cancel mean the provider never got or
    // honored it, and applying them would revive the entry, and on
    // `complete` queue a song the user canceled.
    if (existing.status === 'canceled') {
      log.verbose('onEvent: ignoring %s for canceled %s (%d)/%s', event.status, this.nameFor(providerId), providerId, event.id)
      return
    }

    // The provider echoes the timestamp of the fetch that started a download,
    // and a cancel's event keeps it. An event below the entry's timestamp is
    // from a download this entry has moved past: a `canceled` that arrives
    // after a re-request replaced the download would otherwise mark the new
    // one canceled, and everything it sends afterwards would be ignored.
    if (event.timestamp < existing.timestamp) {
      log.verbose('onEvent: ignoring stale %s (%d < %d) for %s (%d)/%s', event.status, event.timestamp, existing.timestamp, this.nameFor(providerId), providerId, event.id)
      return
    }

    // Update existing entry. Keep its claims; provider's meta only carries
    // the first one.
    const priorStatus = existing.status
    existing.status = event.status
    existing.progress = event.progress
    existing.timestamp = event.timestamp
    existing.source = event.source
    existing.iconUrl = event.iconUrl
    if (event.error !== undefined) existing.error = event.error
    if (event.eta !== undefined) existing.readyAt = Date.now() + event.eta * 1000
    else delete existing.readyAt

    this.broadcastEntry(existing)

    // Fresh transition into 'complete' — ingest the file and queue the song.
    // Snapshot re-emissions (status already complete) short-circuit here.
    if (event.status === 'complete' && priorStatus !== 'complete') {
      void this.handleComplete(existing, event)
    }
  }

  private async handleComplete (entry: FetchEntry, event: ProviderFetchEvent): Promise<void> {
    // Flip the entry to error and rebroadcast so it stays visible in the queue
    // with an error indicator (clients can tap to see the message).
    const failIngest = (message: string) => {
      entry.status = 'error'
      entry.error = message
      this.broadcastEntry(entry)
    }

    if (!event.path) {
      log.warn('handleComplete: no path on event %s (%d)/%s', this.nameFor(entry.providerId), entry.providerId, event.id)
      failIngest('Provider did not return a file path')
      return
    }

    const resolvedPath = path.resolve(event.path)
    const pathId = Prefs.resolvePathId(resolvedPath)
    if (pathId === null) {
      log.warn('handleComplete: %s does not match any configured library path', event.path)
      failIngest(`Downloaded file path is not inside a configured library path: ${event.path}`)
      return
    }

    entry.path = resolvedPath

    try {
      const { songId } = await this.startFileScanner({ absPath: resolvedPath, pathId })

      // Queue the song for every claim. Failures in one room don't abort the
      // others. A claim added while this runs is still visited (array
      // iteration sees pushes), so songId is only published afterwards: until
      // then request() leaves queueing to this loop, and after it, request()
      // queues the new claim itself.
      for (const claim of entry.claims) {
        await this.queueForRoom(entry, claim.roomId, claim.userId, songId)
      }
      entry.songId = songId

      pushQueuesAndLibrary(this.io)
    } catch (err) {
      log.error('handleComplete failed for %s (%d)/%s: %s', this.nameFor(entry.providerId), entry.providerId, event.id, (err as Error).message)
      failIngest((err as Error).message)
    }
  }

  /**
   * Queue the entry's ingested song for one singer in one room, skipping a
   * closed room.
   */
  private async queueForRoom (entry: FetchEntry, roomId: number, userId: number, songId = entry.songId): Promise<void> {
    if (songId === undefined) return
    try {
      await Rooms.validate(roomId, null, { validatePassword: false })
    } catch (err) {
      log.info('queueForRoom: skipping closed room %d: %s', roomId, (err as Error).message)
      return
    }
    try {
      Queue.add({ roomId, songId, userId })
    } catch (err) {
      log.warn('queueForRoom: queue.add failed for room %d: %s', roomId, (err as Error).message)
    }
  }

  private onError (provider: Provider, err: Error): void {
    log.warn('SSE error: %s (%d): %s', provider.name, provider.providerId, err.message)
    const conn = this.connections.get(provider.providerId)
    if (conn) {
      // Close the failed subscription; it reopens after the recheck below
      conn.sub?.close()
      conn.sub = null
    }
    this.scheduleRecheck(provider)
  }

  /**
   * Emit each room's view of the entry. Bypasses the per-key throttle —
   * callers that need coalescing should go through broadcastEntry.
   *
   * Pass `rooms` to scope the emit to a subset (used when a room joins an
   * in-flight fetch and needs current state without disturbing the throttle
   * window or re-broadcasting to rooms that already have it, and for a
   * canceled entry, which no longer has claims to derive rooms from).
   * Omitted, fans out to every room with a claim.
   */
  private emitToRooms (entry: FetchEntry, rooms: Iterable<number> = roomsOf(entry)): void {
    const ids: number[] = []
    for (const roomId of rooms) {
      ids.push(roomId)
      this.io.to(Rooms.prefix(roomId)).emit('action', {
        type: PROVIDER_FETCH_STATUS,
        payload: [viewFor(entry, roomId)],
      })
    }
    if (ids.length) {
      log.verbose('broadcast rooms=%s provider=%s (%d) id=%s status=%s progress=%d', ids.join(','), this.nameFor(entry.providerId), entry.providerId, entry.itemId, entry.status, entry.progress)
    }
  }

  // forget a queued trailing emit for a key
  private flushThrottle (k: FetchKey): void {
    const t = this.broadcastTimers.get(k)
    if (t) {
      clearTimeout(t)
      this.broadcastTimers.delete(k)
    }
    this.pendingBroadcast.delete(k)
  }

  /**
   * Broadcast the entry's current state to every room with a claim on it.
   * Leading + trailing throttle per FetchKey: the first call emits immediately
   * for snappy UI, subsequent calls inside the window are coalesced into one
   * trailing emit when the timer fires. Terminal statuses bypass the throttle
   * and clear any pending state — end-of-fetch indicators shouldn't wait.
   */
  private broadcastEntry (entry: FetchEntry): void {
    const k = key(entry.providerId, entry.itemId)
    const terminal = entry.status === 'complete' || entry.status === 'error' || entry.status === 'canceled'

    if (terminal) {
      this.flushThrottle(k)
      this.emitToRooms(entry)
      return
    }

    if (this.broadcastTimers.has(k)) {
      // Inside the window — queue a trailing emit. The entry is mutated in
      // place upstream, so the timer callback will pick up the latest state.
      this.pendingBroadcast.add(k)
      return
    }

    // Leading edge.
    this.emitToRooms(entry)
    const t = setTimeout(() => {
      this.broadcastTimers.delete(k)
      if (this.pendingBroadcast.delete(k)) {
        const cur = this.entries.get(k)
        if (cur) this.emitToRooms(cur)
      }
    }, STATUS_THROTTLE_MS)
    t.unref?.()
    this.broadcastTimers.set(k, t)
  }
}

const ProviderFetch = new ProviderFetchImpl()

export default ProviderFetch
