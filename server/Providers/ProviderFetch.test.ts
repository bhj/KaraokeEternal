import fs from 'fs'
import os from 'os'
import path from 'path'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mocked transitively — these touch DB or websockets in production, so we
// stub them out before importing ProviderFetch.
// Mock Prefs but keep resolvePathId real — it's a pure query over Prefs.get().
// Binding it to the mock means tests that configure paths via setPaths()
// drive resolution through the actual algorithm.
vi.mock('../Prefs/Prefs.js', async () => {
  const actual = await vi.importActual<typeof import('../Prefs/Prefs.js')>('../Prefs/Prefs.js')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mock: any = { get: vi.fn() }
  mock.resolvePathId = actual.default.resolvePathId.bind(mock)
  return { default: mock }
})
vi.mock('../Rooms/Rooms.js', () => ({
  default: {
    validate: vi.fn(),
    prefix: vi.fn((roomId: number) => `room_${roomId}`),
    getActive: vi.fn(() => []),
  },
}))
vi.mock('../Queue/Queue.js', () => ({
  default: {
    add: vi.fn(),
    get: vi.fn(() => ({ result: [], entities: {} })),
  },
}))
vi.mock('../lib/Database.js', () => ({
  db: {
    get: vi.fn(() => ({ userDisplayName: 'Test User', userDateUpdated: 0 })),
  },
}))
vi.mock('../lib/pushQueuesAndLibrary.js', () => ({
  default: vi.fn(),
}))
vi.mock('../Library/Library.js', () => ({
  default: {
    get: vi.fn(() => ({ version: 1, songs: { result: [99], entities: { 99: { songId: 99 } } } })),
  },
}))

// Controllable stand-in for ProviderStatus: every provider is ready with
// song v0 unless a test sets its status
const fakeStatus = vi.hoisted(() => {
  type FakeStatus = { state: string, types: Record<string, { version: number | null }> }
  const ready: FakeStatus = { state: 'ready', types: { song: { version: 0 } } }
  const statuses = new Map<number, FakeStatus>()
  const listeners = new Set<(providerId: number) => void>()
  const get = (id: number) => statuses.get(id) ?? ready

  return {
    statuses,
    listeners,
    // simulate a check finishing (or starting) for a provider
    set (id: number, status: FakeStatus) {
      statuses.set(id, status)
      for (const fn of listeners) fn(id)
    },
    impl: {
      get,
      songVersion: (id: number) => get(id).state === 'ready' ? get(id).types.song?.version ?? null : null,
      songUnavailableReason: () => 'Provider is unreachable',
      settled: async (id: number) => get(id),
      sync: vi.fn(),
      recheck: vi.fn(async () => {}),
      onChange: (fn: (providerId: number) => void) => {
        listeners.add(fn)
        return () => listeners.delete(fn)
      },
    },
  }
})
vi.mock('./ProviderStatus.js', () => ({ default: fakeStatus.impl }))

const Prefs = (await import('../Prefs/Prefs.js')).default as unknown as { get: ReturnType<typeof vi.fn> }
const Rooms = (await import('../Rooms/Rooms.js')).default as unknown as {
  validate: ReturnType<typeof vi.fn>
  prefix: ReturnType<typeof vi.fn>
  getActive: ReturnType<typeof vi.fn>
}
const Queue = (await import('../Queue/Queue.js')).default as unknown as { add: ReturnType<typeof vi.fn> }
const pushQueuesAndLibrary = (await import('../lib/pushQueuesAndLibrary.js')).default as unknown as ReturnType<typeof vi.fn>
const Library = (await import('../Library/Library.js')).default as unknown as { get: ReturnType<typeof vi.fn> }
const db = (await import('../lib/Database.js')).db as unknown as { get: ReturnType<typeof vi.fn> }
const { ProviderFetchImpl } = await import('./ProviderFetch.js')
const Providers = (await import('./Providers.js')).default

function makeIo () {
  return {
    to: vi.fn(() => ({ emit: vi.fn() })),
    emit: vi.fn(),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any
}

function setPaths (paths: Record<number, { path: string }>) {
  Prefs.get.mockReturnValue({
    paths: { entities: paths, result: Object.keys(paths).map(Number) },
    providers: { entities: {}, result: [] },
  })
}

// claims for one singer in each of the given rooms
function claimsFor (rooms: number[], opts: { userId?: number, userDisplayName?: string, timestamp?: number } = {}) {
  const { userId = 3, userDisplayName = 'U', timestamp = 1700000000 } = opts
  return rooms.map(roomId => ({ roomId, userId, userDisplayName, userDateUpdated: 0, timestamp }))
}

// Drive a complete-status event through onEvent for a tracked entry.
// onEvent is private so we cast through unknown for direct invocation.
async function fireComplete (
  impl: InstanceType<typeof ProviderFetchImpl>,
  args: { providerId: number, itemId: string, roomId: number, userId: number, absPath: string, title?: string, artist?: string, priorStatus?: 'pending' | 'downloading' | 'complete' },
) {
  // Seed an entry by manually injecting into the private map. Avoids the DB
  // path that `request()` would otherwise take.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const entries: Map<string, any> = (impl as any).entries
  entries.set(`${args.providerId}:${args.itemId}`, {
    providerId: args.providerId,
    itemId: args.itemId,
    status: args.priorStatus ?? 'downloading',
    progress: 0.5,
    claims: claimsFor([args.roomId], { userId: args.userId, userDisplayName: 'Test User' }),
    timestamp: 1700000000,
    title: args.title ?? 'Some Title',
    artist: args.artist ?? 'Some Artist',
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(impl as any).onEvent(args.providerId, {
    id: args.itemId,
    status: 'complete',
    progress: 1,
    timestamp: 1700000001,
    title: args.title ?? 'Some Title',
    artist: args.artist ?? 'Some Artist',
    path: args.absPath,
    meta: { roomId: args.roomId, userId: args.userId },
  })

  // handleComplete is fire-and-forget from onEvent; let queued microtasks run.
  await new Promise<void>(resolve => setImmediate(resolve))
  await new Promise<void>(resolve => setImmediate(resolve))
}

describe('ProviderFetch.handleComplete', () => {
  let impl: InstanceType<typeof ProviderFetchImpl>
  let startFileScanner: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fakeStatus.statuses.clear()
    fakeStatus.listeners.clear()
    setPaths({ 1: { path: '/library' } })
    Rooms.validate.mockResolvedValue(undefined)
    Queue.add.mockReset()
    pushQueuesAndLibrary.mockReset()
    startFileScanner = vi.fn(() => Promise.resolve({ mediaId: 42, songId: 99 }))

    impl = new ProviderFetchImpl()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    impl.init(makeIo(), { startFileScanner: startFileScanner as any })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('ingests + queues on a fresh complete transition', async () => {
    await fireComplete(impl, {
      providerId: 1,
      itemId: 'a1',
      roomId: 7,
      userId: 3,
      absPath: '/library/Artist Name - Song Title.mp4',
    })

    expect(startFileScanner).toHaveBeenCalledTimes(1)
    expect(startFileScanner.mock.calls[0][0]).toEqual({
      absPath: '/library/Artist Name - Song Title.mp4',
      pathId: 1,
    })

    expect(Queue.add).toHaveBeenCalledWith({ roomId: 7, songId: 99, userId: 3 })
    expect(pushQueuesAndLibrary).toHaveBeenCalledTimes(1)
  })

  it('skips ingest and flips entry to error when event has no path', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const entries: Map<string, any> = (impl as any).entries
    entries.set('1:a1', {
      providerId: 1, itemId: 'a1', status: 'downloading', progress: 0.5,
      claims: claimsFor([7], { userId: 3, userDisplayName: 'U', timestamp: 1700000000 }), timestamp: 1700000000, title: 'T', artist: 'A',
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(impl as any).onEvent(1, {
      id: 'a1', status: 'complete', progress: 1, timestamp: 1700000001,
      title: 'T', artist: 'A', // no `path`
      meta: { roomId: 7, userId: 3 },
    })
    await new Promise<void>(resolve => setImmediate(resolve))

    expect(startFileScanner).not.toHaveBeenCalled()
    expect(Queue.add).not.toHaveBeenCalled()
    expect(pushQueuesAndLibrary).not.toHaveBeenCalled()

    const entry = entries.get('1:a1')
    expect(entry.status).toBe('error')
    expect(entry.error).toMatch(/file path/i)
  })

  it('skips ingest and flips entry to error when path is outside configured library', async () => {
    await fireComplete(impl, {
      providerId: 1, itemId: 'a1', roomId: 7, userId: 3,
      absPath: '/somewhere-else/foo.mp4',
    })

    expect(startFileScanner).not.toHaveBeenCalled()
    expect(Queue.add).not.toHaveBeenCalled()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const entries: Map<string, any> = (impl as any).entries
    const entry = entries.get('1:a1')
    expect(entry.status).toBe('error')
    expect(entry.error).toMatch(/not inside a configured library path/i)
  })

  it('ingests but skips queue.add when the originating room is closed', async () => {
    Rooms.validate.mockRejectedValue(new Error('room closed'))

    await fireComplete(impl, {
      providerId: 1, itemId: 'a1', roomId: 7, userId: 3,
      absPath: '/library/foo.mp4',
    })

    expect(startFileScanner).toHaveBeenCalledTimes(1)
    expect(Queue.add).not.toHaveBeenCalled()
    // library cache + broadcast still flow so other clients see the new song
    expect(pushQueuesAndLibrary).toHaveBeenCalledTimes(1)
  })

  it('flips status to error and rebroadcasts when ingest worker rejects', async () => {
    startFileScanner.mockReturnValue(Promise.reject(new Error('parse failed')))

    await fireComplete(impl, {
      providerId: 1, itemId: 'a1', roomId: 7, userId: 3,
      absPath: '/library/corrupt.mp4',
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const entries: Map<string, any> = (impl as any).entries
    const entry = entries.get('1:a1')
    expect(entry.status).toBe('error')
    expect(entry.error).toMatch(/parse failed/)
    expect(Queue.add).not.toHaveBeenCalled()
  })

  it('ignores an untracked completion (e.g. finished while the server was down)', async () => {
    setPaths({ 1: { path: '/srv/library' } })
    const emit = vi.fn()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    impl.init({ to: vi.fn(() => ({ emit })), emit: vi.fn() } as any, { startFileScanner: startFileScanner as any })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(impl as any).onEvent(1, {
      id: 'x1', status: 'complete', progress: 1, timestamp: 1700000001,
      title: 'T', artist: 'A', source: 's', iconUrl: 'http://p/i.svg',
      path: '/srv/library/x1.mp4', meta: { roomId: 7, userId: 3 },
    })
    await new Promise<void>(resolve => setImmediate(resolve))

    expect(startFileScanner).not.toHaveBeenCalled()
    expect(Queue.add).not.toHaveBeenCalled()
    expect(emit).not.toHaveBeenCalled()
    expect(impl.isComplete(1, 'x1')).toBe(false)
    expect(impl.rehydrateForRoom(7)).toEqual([])
  })

  it('queues a completed item for a re-requesting room without contacting the provider', async () => {
    const fetchSpy = vi.spyOn(Providers, 'fetch').mockResolvedValue(undefined)
    const provider = { providerId: 1, name: 'P', url: 'http://p', priority: 0, prefs: { enabled: true, types: { song: { enabled: true, maxLibraryResults: null } } } }
    try {
      await fireComplete(impl, { providerId: 1, itemId: 'a1', roomId: 7, userId: 3, absPath: '/library/x.mp4' })
      Queue.add.mockClear()
      pushQueuesAndLibrary.mockClear()

      // another user, in another room, asks for the same item
      await impl.request(provider, 'a1', 5, 8, 'Some Title', 'Some Artist')

      expect(fetchSpy).not.toHaveBeenCalled()
      expect(startFileScanner).toHaveBeenCalledTimes(1)
      expect(Queue.add).toHaveBeenCalledTimes(1)
      expect(Queue.add).toHaveBeenCalledWith({ roomId: 8, songId: 99, userId: 5 })
      expect(pushQueuesAndLibrary).toHaveBeenCalledTimes(1)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const entry = (impl as any).entries.get('1:a1')
      expect(entry.status).toBe('complete')
      expect(entry.claims.map((c: { roomId: number, userId: number }) => [c.roomId, c.userId])).toEqual([[7, 3], [8, 5]])
    } finally {
      fetchSpy.mockRestore()
    }
  })

  it('recognizes a completed fetch\'s file until it is deleted', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ke-provider-'))
    try {
      setPaths({ 1: { path: dir } })
      const file = path.join(dir, 'Artist - Title.mp4')
      fs.writeFileSync(file, '')

      expect(impl.isIngestedFile(file)).toBe(false)
      await fireComplete(impl, { providerId: 1, itemId: 'a1', roomId: 7, userId: 3, absPath: file })

      expect(impl.isIngestedFile(file)).toBe(true)
      expect(impl.isIngestedFile(path.join(dir, 'Other - Song.mp4'))).toBe(false)

      // the song left the library (deleted and rescanned), then the file came back
      Library.get.mockReturnValueOnce({ version: 2, songs: { result: [], entities: {} } })
      expect(impl.isIngestedFile(file)).toBe(false)

      fs.rmSync(file)
      expect(impl.isIngestedFile(file)).toBe(false)
    } finally {
      fs.rmSync(dir, { recursive: true, force: true })
    }
  })

  it('reports in-flight fetches until they settle', async () => {
    expect(impl.hasInFlight()).toBe(false)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const entries: Map<string, any> = (impl as any).entries
    entries.set('1:a1', {
      providerId: 1, itemId: 'a1', status: 'pending', progress: 0,
      claims: claimsFor([7]), timestamp: 1700000000, title: 'T', artist: 'A',
    })
    expect(impl.hasInFlight()).toBe(true)

    entries.get('1:a1').status = 'downloading'
    expect(impl.hasInFlight()).toBe(true)

    await fireComplete(impl, { providerId: 1, itemId: 'a1', roomId: 7, userId: 3, absPath: '/library/x.mp4' })
    expect(impl.hasInFlight()).toBe(false)
  })

  it('re-fetches a completed item whose song has left the library', async () => {
    const fetchSpy = vi.spyOn(Providers, 'fetch').mockResolvedValue(undefined)
    const provider = { providerId: 1, name: 'P', url: 'http://p', priority: 0, prefs: { enabled: true, types: { song: { enabled: true, maxLibraryResults: null } } } }
    try {
      await fireComplete(impl, { providerId: 1, itemId: 'a1', roomId: 7, userId: 3, absPath: '/library/x.mp4' })
      expect(impl.isComplete(1, 'a1')).toBe(true)
      Queue.add.mockClear()

      // the file was deleted and a rescan dropped the song
      Library.get.mockReturnValueOnce({ version: 2, songs: { result: [], entities: {} } })
      expect(impl.isComplete(1, 'a1')).toBe(false)

      await impl.request(provider, 'a1', 3, 7, 'Some Title', 'Some Artist')

      expect(fetchSpy).toHaveBeenCalledTimes(1)
      expect(Queue.add).not.toHaveBeenCalled()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const entry = (impl as any).entries.get('1:a1')
      expect(entry.status).toBe('pending')
      expect(entry.songId).toBeUndefined()
    } finally {
      fetchSpy.mockRestore()
    }
  })

  it('queues a singer who requests while ingest is still running exactly once', async () => {
    const fetchSpy = vi.spyOn(Providers, 'fetch').mockResolvedValue(undefined)
    const provider = { providerId: 1, name: 'P', url: 'http://p', priority: 0, prefs: { enabled: true, types: { song: { enabled: true, maxLibraryResults: null } } } }
    let finishScan!: () => void
    startFileScanner.mockImplementationOnce(() => new Promise((resolve) => {
      finishScan = () => resolve({ mediaId: 42, songId: 99 })
    }))
    try {
      // the complete event arrives and ingest starts, but hasn't returned
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const entries: Map<string, any> = (impl as any).entries
      entries.set('1:a1', {
        providerId: 1, itemId: 'a1', status: 'downloading', progress: 0.5, claims: claimsFor([7], { userId: 3, userDisplayName: 'Test User', timestamp: 1700000000 }),
        timestamp: 1700000000, title: 'T', artist: 'A',
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(impl as any).onEvent(1, { id: 'a1', status: 'complete', progress: 1, timestamp: 1700000001, title: 'T', artist: 'A', path: '/library/x.mp4' })

      await impl.request(provider, 'a1', 5, 8, 'T', 'A')
      expect(fetchSpy).not.toHaveBeenCalled()
      expect(Queue.add).not.toHaveBeenCalled()

      finishScan()
      await new Promise<void>(resolve => setImmediate(resolve))
      await new Promise<void>(resolve => setImmediate(resolve))

      expect(Queue.add).toHaveBeenCalledTimes(2)
      expect(Queue.add).toHaveBeenCalledWith({ roomId: 7, songId: 99, userId: 3 })
      expect(Queue.add).toHaveBeenCalledWith({ roomId: 8, songId: 99, userId: 5 })
    } finally {
      fetchSpy.mockRestore()
    }
  })

  it('queues once per singer when two singers in a room requested the item', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const entries: Map<string, any> = (impl as any).entries
    entries.set('1:a1', {
      providerId: 1, itemId: 'a1', status: 'downloading', progress: 0.5,
      claims: [...claimsFor([7], { userId: 3 }), ...claimsFor([7], { userId: 5 }), ...claimsFor([8], { userId: 3 })],
      timestamp: 1700000000, title: 'T', artist: 'A',
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(impl as any).onEvent(1, { id: 'a1', status: 'complete', progress: 1, timestamp: 1700000001, title: 'T', artist: 'A', path: '/library/x.mp4' })
    await new Promise<void>(resolve => setImmediate(resolve))
    await new Promise<void>(resolve => setImmediate(resolve))

    expect(startFileScanner).toHaveBeenCalledTimes(1)
    expect(Queue.add.mock.calls.map(([arg]) => arg)).toEqual([
      { roomId: 7, songId: 99, userId: 3 },
      { roomId: 7, songId: 99, userId: 5 },
      { roomId: 8, songId: 99, userId: 3 },
    ])
  })

  it('lets a second singer in the room join an in-flight fetch', async () => {
    const fetchSpy = vi.spyOn(Providers, 'fetch').mockResolvedValue(undefined)
    const provider = { providerId: 1, name: 'P', url: 'http://p', priority: 0, prefs: { enabled: true, types: { song: { enabled: true, maxLibraryResults: null } } } }
    const emit = vi.fn()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    impl.init({ to: vi.fn(() => ({ emit })), emit: vi.fn() } as any, { startFileScanner: startFileScanner as any })
    try {
      await impl.request(provider, 'a1', 3, 7, 'T', 'A')
      await impl.request(provider, 'a1', 5, 7, 'T', 'A')

      // the room is told right away, with both requesters
      const view = emit.mock.lastCall?.[1].payload[0]
      expect(view.requests.map((r: { userId: number }) => r.userId)).toEqual([3, 5])
      expect(impl.rehydrateForRoom(7)[0].requests).toHaveLength(2)

      // the same singer asking again is a no-op
      await impl.request(provider, 'a1', 5, 7, 'T', 'A')
      expect(impl.rehydrateForRoom(7)[0].requests).toHaveLength(2)
    } finally {
      fetchSpy.mockRestore()
    }
  })

  it('does not re-ingest on snapshot replay (status already complete)', async () => {
    await fireComplete(impl, {
      providerId: 1, itemId: 'a1', roomId: 7, userId: 3,
      absPath: '/library/foo.mp4',
      priorStatus: 'complete',
    })

    expect(startFileScanner).not.toHaveBeenCalled()
    expect(Queue.add).not.toHaveBeenCalled()
  })

  describe('markCanceled', () => {
    function seed (impl: InstanceType<typeof ProviderFetchImpl>, opts: { status: 'pending' | 'downloading' | 'complete' | 'error' | 'canceled', error?: string } = { status: 'downloading' }) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const entries: Map<string, any> = (impl as any).entries
      entries.set('1:a1', {
        providerId: 1, itemId: 'a1', status: opts.status, progress: 0.5,
        claims: claimsFor([7, 8], { userId: 3, userDisplayName: 'U', timestamp: 1700000000 }), timestamp: 1700000000, title: 'T', artist: 'A',
        ...(opts.error !== undefined ? { error: opts.error } : {}),
      })
      return entries
    }

    it('flips status to canceled and broadcasts to every subscribed room', () => {
      const emit = vi.fn()
      const to = vi.fn(() => ({ emit }))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      impl.init({ to, emit: vi.fn() } as any, { startFileScanner: startFileScanner as any })
      const entries = seed(impl)

      impl.markCanceled(1, 'a1')

      expect(entries.get('1:a1').status).toBe('canceled')
      // one emit per room in the entry's rooms set
      expect(to).toHaveBeenCalledTimes(2)
      expect(emit).toHaveBeenCalledTimes(2)
      const payloads = emit.mock.calls.map(c => c[1])
      for (const p of payloads) {
        expect(p.payload[0]).toMatchObject({ providerId: 1, itemId: 'a1', status: 'canceled', progress: 0 })
      }
    })

    it('clears prior error when canceling', () => {
      const entries = seed(impl, { status: 'error', error: 'boom' })
      impl.markCanceled(1, 'a1')
      const entry = entries.get('1:a1')
      expect(entry.status).toBe('canceled')
      expect(entry.error).toBeUndefined()
    })

    it('no-ops when the entry is unknown', () => {
      const emit = vi.fn()
      const to = vi.fn(() => ({ emit }))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      impl.init({ to, emit: vi.fn() } as any, { startFileScanner: startFileScanner as any })
      // no seeding
      impl.markCanceled(1, 'missing')
      expect(to).not.toHaveBeenCalled()
      expect(emit).not.toHaveBeenCalled()
    })

    it('does not retroactively cancel a completed fetch', () => {
      const entries = seed(impl, { status: 'complete' })
      impl.markCanceled(1, 'a1')
      expect(entries.get('1:a1').status).toBe('complete')
    })
  })

  describe('cancel', () => {
    const provider = { providerId: 1, name: 'P', url: 'http://p', priority: 0, prefs: { enabled: true, types: { song: { enabled: true, maxLibraryResults: null } } } }
    let cancelSpy: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
      cancelSpy = vi.spyOn(Providers, 'cancel').mockResolvedValue(undefined)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const entries: Map<string, any> = (impl as any).entries
      entries.set('1:a1', {
        providerId: 1, itemId: 'a1', status: 'downloading', progress: 0.5,
        claims: claimsFor([7], { userId: 3, userDisplayName: 'U', timestamp: 1700000000 }), timestamp: 1700000000, title: 'T', artist: 'A',
      })
    })

    afterEach(() => {
      cancelSpy.mockRestore()
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const entryStatus = () => (impl as any).entries.get('1:a1').status

    it('lets the requester cancel', async () => {
      await impl.cancel(provider, 'a1', { roomId: 7, userId: 3, isAdmin: false })
      expect(cancelSpy).toHaveBeenCalledWith(provider, 0, 'a1')
      expect(entryStatus()).toBe('canceled')
    })

    it('lets an admin cancel another user\'s fetch', async () => {
      await impl.cancel(provider, 'a1', { roomId: 7, userId: 99, isAdmin: true })
      expect(cancelSpy).toHaveBeenCalledWith(provider, 0, 'a1')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((impl as any).entries.get('1:a1')).toMatchObject({ status: 'canceled', claims: [] })
    })

    describe('with several requesters', () => {
      beforeEach(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const entries: Map<string, any> = (impl as any).entries
        entries.get('1:a1').claims = [
          ...claimsFor([7], { userId: 3 }),
          ...claimsFor([7], { userId: 5 }),
          ...claimsFor([8], { userId: 3 }),
        ]
      })

      const requesters = (roomId: number) => impl.rehydrateForRoom(roomId)[0]?.requests.map(r => r.userId)

      it('withdraws only the caller\'s request while others are waiting', async () => {
        await impl.cancel(provider, 'a1', { roomId: 7, userId: 3, isAdmin: false })
        expect(cancelSpy).not.toHaveBeenCalled()
        expect(entryStatus()).toBe('downloading')
        expect(requesters(7)).toEqual([5])
        expect(requesters(8)).toEqual([3])
      })

      it('cancels with the provider once the last request is withdrawn', async () => {
        await impl.cancel(provider, 'a1', { roomId: 7, userId: 3, isAdmin: false })
        await impl.cancel(provider, 'a1', { roomId: 7, userId: 5, isAdmin: false })
        expect(cancelSpy).not.toHaveBeenCalled()
        await impl.cancel(provider, 'a1', { roomId: 8, userId: 3, isAdmin: false })
        expect(cancelSpy).toHaveBeenCalledTimes(1)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((impl as any).entries.get('1:a1')).toMatchObject({ status: 'canceled', claims: [] })
      })

      it('lets an admin withdraw a named singer\'s request', async () => {
        await impl.cancel(provider, 'a1', { roomId: 7, userId: 99, isAdmin: true, targetUserId: 5 })
        expect(cancelSpy).not.toHaveBeenCalled()
        expect(requesters(7)).toEqual([3])
      })

      it('lets an admin holding no request withdraw everyone\'s in the room', async () => {
        await impl.cancel(provider, 'a1', { roomId: 7, userId: 99, isAdmin: true })
        expect(cancelSpy).not.toHaveBeenCalled()
        expect(impl.rehydrateForRoom(7)).toEqual([])
        expect(requesters(8)).toEqual([3])
      })

      it('rejects a non-admin naming another singer', async () => {
        await expect(impl.cancel(provider, 'a1', { roomId: 7, userId: 3, isAdmin: false, targetUserId: 5 })).rejects.toThrow(/requester or an admin/)
        expect(requesters(7)).toEqual([3, 5])
      })

      it('rejects a named singer with no request in the room', async () => {
        await expect(impl.cancel(provider, 'a1', { roomId: 7, userId: 99, isAdmin: true, targetUserId: 42 })).rejects.toThrow(/Unknown fetch/)
        expect(requesters(7)).toEqual([3, 5])
      })

      it('tells the withdrawing room only', async () => {
        const emit = vi.fn()
        const to = vi.fn(() => ({ emit }))
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        impl.init({ to, emit: vi.fn() } as any, { startFileScanner: startFileScanner as any })

        await impl.cancel(provider, 'a1', { roomId: 7, userId: 3, isAdmin: false })
        expect(to).toHaveBeenCalledTimes(1)
        expect(to).toHaveBeenCalledWith('room_7')
        expect(emit.mock.calls[0][1].payload[0].requests.map((r: { userId: number }) => r.userId)).toEqual([5])
      })
    })

    it('rejects a non-admin who is not the requester', async () => {
      await expect(impl.cancel(provider, 'a1', { roomId: 7, userId: 99, isAdmin: false })).rejects.toThrow(/requester or an admin/)
      expect(cancelSpy).not.toHaveBeenCalled()
      expect(entryStatus()).toBe('downloading')
    })

    it('cancels locally when the provider is unavailable', async () => {
      fakeStatus.statuses.set(1, { state: 'unreachable', types: {} })
      await impl.cancel(provider, 'a1', { roomId: 7, userId: 3, isAdmin: false })
      expect(cancelSpy).not.toHaveBeenCalled()
      expect(entryStatus()).toBe('canceled')
    })

    it('rejects an untracked item, even for admins', async () => {
      await expect(impl.cancel(provider, 'other', { roomId: 7, userId: 3, isAdmin: true })).rejects.toThrow(/Unknown fetch/)
      expect(cancelSpy).not.toHaveBeenCalled()
    })

    it('cancels locally when the provider-side cancel fails', async () => {
      cancelSpy.mockRejectedValueOnce(new Error('fetch failed'))
      await expect(impl.cancel(provider, 'a1', { roomId: 7, userId: 3, isAdmin: false })).resolves.toBeUndefined()
      expect(entryStatus()).toBe('canceled')
    })

    it('removes a failed fetch without contacting the provider', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const entries: Map<string, any> = (impl as any).entries
      entries.get('1:a1').status = 'error'
      await impl.cancel(provider, 'a1', { roomId: 7, userId: 3, isAdmin: false })
      expect(cancelSpy).not.toHaveBeenCalled()
      expect(entryStatus()).toBe('canceled')
    })

    it('still enforces requester-or-admin for a failed fetch', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const entries: Map<string, any> = (impl as any).entries
      entries.get('1:a1').status = 'error'
      await expect(impl.cancel(provider, 'a1', { roomId: 7, userId: 99, isAdmin: false })).rejects.toThrow(/requester or an admin/)
      expect(entryStatus()).toBe('error')
    })

    it('ignores provider events after a local cancel', async () => {
      cancelSpy.mockRejectedValueOnce(new Error('fetch failed'))
      await impl.cancel(provider, 'a1', { roomId: 7, userId: 3, isAdmin: false })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(impl as any).onEvent(1, {
        id: 'a1', status: 'complete', progress: 1, timestamp: 1700000100,
        title: 'T', artist: 'A', source: 'src', iconUrl: 'http://p/icon.svg', path: '/x/a1.mp4',
        meta: { roomId: 7, userId: 3 },
      })
      expect(entryStatus()).toBe('canceled')
      expect(startFileScanner).not.toHaveBeenCalled()
    })
  })

  describe('stale events', () => {
    const provider = { providerId: 1, name: 'P', url: 'http://p', priority: 0, prefs: { enabled: true, types: { song: { enabled: true, maxLibraryResults: null } } } }
    const event = {
      id: 'a1', status: 'downloading', progress: 0.5, timestamp: 1700000000,
      title: 'T', artist: 'A', source: 'src', iconUrl: 'http://p/icon.svg',
    }
    let cancelSpy: ReturnType<typeof vi.spyOn>
    let fetchSpy: ReturnType<typeof vi.spyOn>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const entry = () => (impl as any).entries.get('1:a1')

    beforeEach(() => {
      cancelSpy = vi.spyOn(Providers, 'cancel').mockResolvedValue(undefined)
      fetchSpy = vi.spyOn(Providers, 'fetch').mockResolvedValue(undefined)
      db.get.mockReturnValue({ userDisplayName: 'U', userDateUpdated: 0 })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const entries: Map<string, any> = (impl as any).entries
      entries.set('1:a1', {
        providerId: 1, itemId: 'a1', status: 'downloading', progress: 0.5,
        claims: claimsFor([7], { userId: 3, userDisplayName: 'U', timestamp: 1700000000 }), timestamp: 1700000000, title: 'T', artist: 'A',
      })
    })

    afterEach(() => {
      cancelSpy.mockRestore()
      fetchSpy.mockRestore()
      db.get.mockReset()
    })

    it('ignores an event with a timestamp below the entry\'s', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(impl as any).onEvent(1, { ...event, status: 'canceled', timestamp: 1699999999 })
      expect(entry()).toMatchObject({ status: 'downloading', timestamp: 1700000000 })
    })

    it('applies an event at the entry\'s timestamp', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(impl as any).onEvent(1, { ...event, progress: 0.75 })
      expect(entry()).toMatchObject({ status: 'downloading', progress: 0.75 })
    })

    it('keeps a re-request after a cancel when the canceled event arrives late', async () => {
      await impl.cancel(provider, 'a1', { roomId: 7, userId: 3, isAdmin: false })
      expect(entry().status).toBe('canceled')

      await impl.request(provider, 'a1', 3, 7, 'T', 'A')
      expect(entry().status).toBe('pending')
      const [, , , sent] = fetchSpy.mock.calls[0]
      expect(sent).toBeGreaterThan(1700000000)

      // the provider's event for the canceled download, carrying its timestamp
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(impl as any).onEvent(1, { ...event, status: 'canceled', timestamp: 1700000000 })
      expect(entry().status).toBe('pending')

      // the new download's events still apply
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(impl as any).onEvent(1, { ...event, timestamp: sent })
      expect(entry()).toMatchObject({ status: 'downloading', progress: 0.5 })
    })

    it('re-requests a failed download with a timestamp above its own, even within the same second', async () => {
      const future = Math.floor(Date.now() / 1000) + 1000
      entry().status = 'error'
      entry().timestamp = future

      await impl.request(provider, 'a1', 3, 7, 'T', 'A')

      expect(fetchSpy).toHaveBeenCalledWith(provider, 0, 'a1', future + 1, { userId: 3, roomId: 7 })
      expect(entry().timestamp).toBe(future + 1)
      // the singer's own request time is unaffected
      expect(entry().claims[0].timestamp).toBeLessThan(future)
    })

    it('never sends a timestamp below the entry\'s to a download in flight', async () => {
      const future = Math.floor(Date.now() / 1000) + 1000
      entry().timestamp = future

      await impl.request(provider, 'a1', 4, 7, 'T', 'A')

      expect(fetchSpy).toHaveBeenCalledWith(provider, 0, 'a1', future, { userId: 4, roomId: 7 })
    })
  })

  describe('retry for another singer', () => {
    const provider = { providerId: 1, name: 'P', url: 'http://p', priority: 0, prefs: { enabled: true, types: { song: { enabled: true, maxLibraryResults: null } } } }
    let fetchSpy: ReturnType<typeof vi.spyOn>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const entry = () => (impl as any).entries.get('1:a1')

    beforeEach(() => {
      fetchSpy = vi.spyOn(Providers, 'fetch').mockResolvedValue(undefined)
      db.get.mockReturnValue({ userDisplayName: 'U', userDateUpdated: 0 })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const entries: Map<string, any> = (impl as any).entries
      entries.set('1:a1', {
        providerId: 1, itemId: 'a1', status: 'error', progress: 0, error: 'boom',
        claims: claimsFor([7], { userId: 3 }), timestamp: 1700000000, title: 'T', artist: 'A',
      })
    })

    afterEach(() => {
      fetchSpy.mockRestore()
      db.get.mockReset()
    })

    it('lets an admin retry a singer\'s failed request as that singer', async () => {
      await impl.request(provider, 'a1', 3, 7, 'T', 'A', undefined, { userId: 99, isAdmin: true })

      expect(entry()).toMatchObject({ status: 'pending', claims: [expect.objectContaining({ userId: 3 })] })
      expect(entry().claims).toHaveLength(1)
      expect(fetchSpy).toHaveBeenCalledWith(provider, 0, 'a1', expect.any(Number), { userId: 3, roomId: 7 })
    })

    it('rejects a non-admin naming another singer', async () => {
      await expect(impl.request(provider, 'a1', 3, 7, 'T', 'A', undefined, { userId: 5, isAdmin: false }))
        .rejects.toThrow('Only an admin')
      expect(entry().status).toBe('error')
      expect(fetchSpy).not.toHaveBeenCalled()
    })

    it('rejects an admin naming a singer for a fetch that hasn\'t failed', async () => {
      entry().status = 'downloading'
      await expect(impl.request(provider, 'a1', 3, 7, 'T', 'A', undefined, { userId: 99, isAdmin: true }))
        .rejects.toThrow('No failed request')
      expect(fetchSpy).not.toHaveBeenCalled()
    })

    it('rejects an admin naming a singer with no request in the room', async () => {
      await expect(impl.request(provider, 'a1', 5, 7, 'T', 'A', undefined, { userId: 99, isAdmin: true }))
        .rejects.toThrow('No failed request')
      await expect(impl.request(provider, 'a1', 3, 8, 'T', 'A', undefined, { userId: 99, isAdmin: true }))
        .rejects.toThrow('No failed request')
      expect(entry().claims).toHaveLength(1)
      expect(fetchSpy).not.toHaveBeenCalled()
    })

    it('rejects an admin naming a singer for an untracked item', async () => {
      await expect(impl.request(provider, 'b2', 3, 7, 'T', 'A', undefined, { userId: 99, isAdmin: true }))
        .rejects.toThrow('No failed request')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((impl as any).entries.has('1:b2')).toBe(false)
    })

    it('treats a caller naming themselves as an ordinary request', async () => {
      await impl.request(provider, 'a1', 5, 7, 'T', 'A', undefined, { userId: 5, isAdmin: false })
      expect(entry().status).toBe('pending')
      expect(entry().claims.map((c: { userId: number }) => c.userId)).toEqual([3, 5])
    })
  })

  describe('dropUser', () => {
    const provider = { providerId: 1, name: 'P', url: 'http://p', priority: 0, prefs: { enabled: true, types: { song: { enabled: true, maxLibraryResults: null } } } }
    let cancelSpy: ReturnType<typeof vi.spyOn>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let entries: Map<string, any>

    beforeEach(() => {
      cancelSpy = vi.spyOn(Providers, 'cancel').mockResolvedValue(undefined)
      Prefs.get.mockReturnValue({
        paths: { entities: { 1: { path: '/library' } }, result: [1] },
        providers: { entities: { 1: provider }, result: [1] },
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      entries = (impl as any).entries
      // user 3 alone, in two rooms
      entries.set('1:solo', {
        providerId: 1, itemId: 'solo', status: 'downloading', progress: 0.5,
        claims: claimsFor([7, 8], { userId: 3 }), timestamp: 1700000000, title: 'T', artist: 'A',
      })
      // user 3 and user 5 share it in room 7; user 5 also has it in room 8
      entries.set('1:shared', {
        providerId: 1, itemId: 'shared', status: 'pending', progress: 0,
        claims: [...claimsFor([7], { userId: 3 }), ...claimsFor([7, 8], { userId: 5 })],
        timestamp: 1700000000, title: 'T', artist: 'A',
      })
      // a failed fetch only user 3 was waiting on
      entries.set('1:failed', {
        providerId: 1, itemId: 'failed', status: 'error', progress: 1, error: 'boom',
        claims: claimsFor([7], { userId: 3 }), timestamp: 1700000000, title: 'T', artist: 'A',
      })
      // someone else's fetch, untouched
      entries.set('1:other', {
        providerId: 1, itemId: 'other', status: 'downloading', progress: 0.2,
        claims: claimsFor([7], { userId: 5 }), timestamp: 1700000000, title: 'T', artist: 'A',
      })
    })

    afterEach(() => {
      cancelSpy.mockRestore()
    })

    const requesters = (itemId: string, roomId: number) =>
      impl.rehydrateForRoom(roomId).find(v => v.itemId === itemId)?.requests.map(r => r.userId)

    it('cancels with the provider when the user was the only requester', () => {
      impl.dropUser(3)
      expect(cancelSpy).toHaveBeenCalledWith(provider, 0, 'solo')
      expect(entries.get('1:solo')).toMatchObject({ status: 'canceled', claims: [] })
      expect(requesters('solo', 7)).toBeUndefined()
      expect(requesters('solo', 8)).toBeUndefined()
    })

    it('withdraws only that user\'s claims when others are still waiting', () => {
      impl.dropUser(3)
      expect(cancelSpy).not.toHaveBeenCalledWith(provider, 0, 'shared')
      expect(entries.get('1:shared').status).toBe('pending')
      expect(requesters('shared', 7)).toEqual([5])
      expect(requesters('shared', 8)).toEqual([5])
    })

    it('clears a failed fetch without calling the provider', () => {
      impl.dropUser(3)
      expect(cancelSpy).not.toHaveBeenCalledWith(provider, 0, 'failed')
      expect(entries.get('1:failed')).toMatchObject({ status: 'canceled', claims: [] })
    })

    it('leaves other users\' fetches alone', () => {
      impl.dropUser(3)
      expect(cancelSpy).not.toHaveBeenCalledWith(provider, 0, 'other')
      expect(entries.get('1:other').status).toBe('downloading')
      expect(requesters('other', 7)).toEqual([5])
    })

    it('rebroadcasts to the rooms that lost a row', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const io = (impl as any).io
      io.to.mockClear()
      impl.dropUser(3)
      const rooms = io.to.mock.calls.map((c: string[]) => c[0]).sort()
      expect(rooms).toContain('room_7')
      expect(rooms).toContain('room_8')
    })

    it('is a no-op for a user with no claims', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const io = (impl as any).io
      io.to.mockClear()
      impl.dropUser(42)
      expect(cancelSpy).not.toHaveBeenCalled()
      expect(io.to).not.toHaveBeenCalled()
    })
  })

  describe('source icon', () => {
    const provider = { providerId: 1, name: 'P', url: 'http://p', priority: 0, prefs: { enabled: true, types: { song: { enabled: true, maxLibraryResults: null } } } }
    const event = {
      id: 'a1', status: 'pending', progress: 0, timestamp: 1700000000,
      title: 'T', artist: 'A', source: 'src', iconUrl: 'http://p/icon.svg',
      meta: { roomId: 7, userId: 3 },
    }
    let fetchSpy: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
      fetchSpy = vi.spyOn(Providers, 'fetch').mockResolvedValue(undefined)
      db.get.mockReturnValue({ userDisplayName: 'U', userDateUpdated: 0 })
    })

    afterEach(() => {
      fetchSpy.mockRestore()
      db.get.mockReset()
    })

    it('holds a new request\'s broadcast until the provider\'s first event supplies the icon', async () => {
      const emit = vi.fn()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      impl.init({ to: vi.fn(() => ({ emit })), emit: vi.fn() } as any, { startFileScanner: startFileScanner as any })

      await impl.request(provider, 'a1', 3, 7, 'T', 'A')
      expect(emit).not.toHaveBeenCalled()

      // the provider echoes the timestamp the request sent
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(impl as any).onEvent(1, { ...event, timestamp: fetchSpy.mock.calls[0][3] })
      expect(emit).toHaveBeenCalledTimes(1)
      expect(emit.mock.calls[0][1].payload[0]).toMatchObject({ source: 'src', iconUrl: 'http://p/icon.svg' })
    })

    it('reports an unavailable provider on the item instead of throwing', async () => {
      const emit = vi.fn()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      impl.init({ to: vi.fn(() => ({ emit })), emit: vi.fn() } as any, { startFileScanner: startFileScanner as any })
      fakeStatus.set(1, { state: 'unreachable', types: {} })

      try {
        await expect(impl.request(provider, 'a1', 3, 7, 'T', 'A')).resolves.toBeUndefined()
      } finally {
        fakeStatus.statuses.delete(1)
      }
      expect(fetchSpy).not.toHaveBeenCalled()
      expect(emit).toHaveBeenCalledTimes(1)
      expect(emit.mock.calls[0][1].payload[0]).toMatchObject({ status: 'error', error: 'Provider is unreachable' })
    })

    it('reports a failed provider request on the item instead of throwing', async () => {
      const emit = vi.fn()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      impl.init({ to: vi.fn(() => ({ emit })), emit: vi.fn() } as any, { startFileScanner: startFileScanner as any })
      fetchSpy.mockRejectedValueOnce(new Error('Provider is unreachable: fetch failed'))

      await expect(impl.request(provider, 'a1', 3, 7, 'T', 'A')).resolves.toBeUndefined()
      expect(emit).toHaveBeenCalledTimes(1)
      expect(emit.mock.calls[0][1].payload[0]).toMatchObject({ status: 'error', error: 'Provider is unreachable: fetch failed' })
    })

    it('reports an expired item with the user-facing message', async () => {
      const emit = vi.fn()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      impl.init({ to: vi.fn(() => ({ emit })), emit: vi.fn() } as any, { startFileScanner: startFileScanner as any })
      const { ProviderItemGoneError } = await import('./Providers.js')
      fetchSpy.mockRejectedValueOnce(new ProviderItemGoneError())

      await impl.request(provider, 'a1', 3, 7, 'T', 'A')
      expect(emit.mock.calls[0][1].payload[0]).toMatchObject({ status: 'error', error: 'This result has expired. Search again for a fresh one.' })
    })

    it('takes source and icon from the event for an untracked item', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(impl as any).onEvent(1, event)

      expect(impl.rehydrateForRoom(7)[0]).toMatchObject({ source: 'src', iconUrl: 'http://p/icon.svg' })
    })
  })

  describe('duration', () => {
    const provider = { providerId: 1, name: 'P', url: 'http://p', priority: 0, prefs: { enabled: true, types: { song: { enabled: true, maxLibraryResults: null } } } }
    let fetchSpy: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
      fetchSpy = vi.spyOn(Providers, 'fetch').mockResolvedValue(undefined)
      db.get.mockReturnValue({ userDisplayName: 'U', userDateUpdated: 0 })
    })

    afterEach(() => {
      fetchSpy.mockRestore()
      db.get.mockReset()
    })

    it('sends the requested song\'s duration on the view', async () => {
      await impl.request(provider, 'a1', 3, 7, 'T', 'A', 225)
      expect(impl.rehydrateForRoom(7)[0]).toMatchObject({ duration: 225 })
    })

    it('keeps the first duration when another singer joins', async () => {
      await impl.request(provider, 'a1', 3, 7, 'T', 'A', 225)
      await impl.request(provider, 'a1', 4, 7, 'T', 'A', 999)
      expect(impl.rehydrateForRoom(7)[0].duration).toBe(225)
    })

    it('takes a joining singer\'s duration when it had none', async () => {
      await impl.request(provider, 'a1', 3, 7, 'T', 'A')
      await impl.request(provider, 'a1', 4, 7, 'T', 'A', 225)
      expect(impl.rehydrateForRoom(7)[0].duration).toBe(225)
    })
  })

  describe('fetch meta', () => {
    const provider = { providerId: 1, name: 'P', url: 'http://p', priority: 0, prefs: { enabled: true, types: { song: { enabled: true, maxLibraryResults: null } } } }
    const event = {
      id: 'a1', status: 'pending', progress: 0, timestamp: 1700000000,
      title: 'T', artist: 'A', source: 'src', iconUrl: 'http://p/icon.svg',
    }

    it('sends the requester and room on every fetch request', async () => {
      const fetchSpy = vi.spyOn(Providers, 'fetch').mockResolvedValue(undefined)
      db.get.mockReturnValue({ userDisplayName: 'U', userDateUpdated: 0 })
      try {
        await impl.request(provider, 'a1', 3, 7, 'T', 'A')
        expect(fetchSpy).toHaveBeenCalledWith(provider, 0, 'a1', expect.any(Number), { userId: 3, roomId: 7 })
      } finally {
        fetchSpy.mockRestore()
        db.get.mockReset()
      }
    })

    it('adopts an untracked in-flight event under the requester and room in its meta', () => {
      db.get.mockReturnValue({ userDisplayName: 'U', userDateUpdated: 0 })
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(impl as any).onEvent(1, { ...event, status: 'downloading', progress: 0.4, meta: { userId: 3, roomId: 7 } })
        expect(impl.rehydrateForRoom(7)).toEqual([expect.objectContaining({
          itemId: 'a1',
          status: 'downloading',
          requests: [expect.objectContaining({ userId: 3, timestamp: 1700000000 })],
        })])
      } finally {
        db.get.mockReset()
      }
    })

    it.each([
      ['no userId', { roomId: 7 }],
      ['no roomId', { userId: 3 }],
      ['no meta', undefined],
    ])('ignores an untracked event with %s', (_, meta) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(impl as any).onEvent(1, { ...event, meta })
      expect(impl.rehydrateForRoom(7)).toEqual([])
    })

    it('still applies events for tracked entries regardless of meta', async () => {
      const fetchSpy = vi.spyOn(Providers, 'fetch').mockResolvedValue(undefined)
      db.get.mockReturnValue({ userDisplayName: 'U', userDateUpdated: 0 })
      try {
        await impl.request(provider, 'a1', 3, 7, 'T', 'A')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(impl as any).onEvent(1, { ...event, status: 'downloading', progress: 0.4, timestamp: fetchSpy.mock.calls[0][3] })
        expect(impl.rehydrateForRoom(7)[0]).toMatchObject({ status: 'downloading', progress: 0.4 })
      } finally {
        fetchSpy.mockRestore()
        db.get.mockReset()
      }
    })
  })

  describe('broadcast throttling', () => {
    function setupIo () {
      const emit = vi.fn()
      const to = vi.fn(() => ({ emit }))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      impl.init({ to, emit: vi.fn() } as any, { startFileScanner: startFileScanner as any })
      return { to, emit }
    }

    function seed (status: 'pending' | 'downloading' | 'complete' | 'error' | 'canceled' = 'downloading', rooms = [7]) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const entries: Map<string, any> = (impl as any).entries
      entries.set('1:a1', {
        providerId: 1, itemId: 'a1', status, progress: 0,
        claims: claimsFor(rooms, { userId: 3, userDisplayName: 'U', timestamp: 1700000000 }), timestamp: 1700000000, title: 'T', artist: 'A',
      })
      return entries
    }

    function fireStatus (
      status: 'pending' | 'downloading' | 'complete' | 'error' | 'canceled',
      progress: number,
    ) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(impl as any).onEvent(1, {
        id: 'a1', status, progress, timestamp: 1700000000,
        title: 'T', artist: 'A',
        meta: { roomId: 7, userId: 3 },
      })
    }

    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('leading-edge emits immediately on the first event', () => {
      const { emit } = setupIo()
      seed('downloading')

      fireStatus('downloading', 0.1)

      expect(emit).toHaveBeenCalledTimes(1)
      expect(emit.mock.calls[0][1].payload[0]).toMatchObject({ progress: 0.1 })
    })

    it('coalesces a burst inside the window into one trailing emit', () => {
      const { emit } = setupIo()
      seed('downloading')

      fireStatus('downloading', 0.1) // leading
      fireStatus('downloading', 0.2) // queued
      fireStatus('downloading', 0.3) // queued
      fireStatus('downloading', 0.4) // queued

      expect(emit).toHaveBeenCalledTimes(1)
      expect(emit.mock.calls[0][1].payload[0]).toMatchObject({ progress: 0.1 })

      vi.advanceTimersByTime(1000)

      expect(emit).toHaveBeenCalledTimes(2)
      // trailing should reflect the latest queued state
      expect(emit.mock.calls[1][1].payload[0]).toMatchObject({ progress: 0.4 })
    })

    it('does not fire a trailing emit when no events arrived inside the window', () => {
      const { emit } = setupIo()
      seed('downloading')

      fireStatus('downloading', 0.1) // leading
      vi.advanceTimersByTime(1000)

      expect(emit).toHaveBeenCalledTimes(1)
    })

    it('fans the trailing emit across every room in the entry', () => {
      const { to, emit } = setupIo()
      seed('downloading', [7, 8])

      fireStatus('downloading', 0.1) // leading: 2 emits (one per room)
      fireStatus('downloading', 0.5) // queued

      expect(emit).toHaveBeenCalledTimes(2)

      vi.advanceTimersByTime(1000)

      // trailing: 2 more emits (one per room)
      expect(emit).toHaveBeenCalledTimes(4)
      expect(to).toHaveBeenCalledTimes(4)
    })

    it('terminal status flushes immediately and clears pending trailing emit', () => {
      const { emit } = setupIo()
      seed('downloading')

      fireStatus('downloading', 0.1) // leading
      fireStatus('downloading', 0.5) // queued
      expect(emit).toHaveBeenCalledTimes(1)

      // canceled is terminal but (unlike complete) doesn't trigger ingest, so
      // we can assert solely on the broadcast count.
      fireStatus('canceled', 0)
      expect(emit).toHaveBeenCalledTimes(2)
      expect(emit.mock.calls[1][1].payload[0]).toMatchObject({ status: 'canceled' })

      // advancing past the window must not produce a stale trailing emit
      vi.advanceTimersByTime(1000)
      expect(emit).toHaveBeenCalledTimes(2)
    })

    it('omits meta.throttle on the wire (server now owns coalescing)', () => {
      const { emit } = setupIo()
      seed('downloading')

      fireStatus('downloading', 10)

      const action = emit.mock.calls[0][1]
      expect(action.meta).toBeUndefined()
    })
  })

  describe('eta', () => {
    let emit: ReturnType<typeof vi.fn>

    function fire (overrides: Record<string, unknown>) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(impl as any).onEvent(1, {
        id: 'a1', status: 'downloading', progress: 0.5, timestamp: 1700000000,
        title: 'T', artist: 'A', source: 'src', iconUrl: 'http://p/icon.svg',
        meta: { roomId: 7, userId: 3 },
        ...overrides,
      })
    }

    beforeEach(() => {
      vi.useFakeTimers()
      emit = vi.fn()
      // a fresh instance, so its re-send timer runs on the fake clock
      impl = new ProviderFetchImpl()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      impl.init({ to: vi.fn(() => ({ emit })), emit: vi.fn() } as any, { startFileScanner: startFileScanner as any })
      db.get.mockReturnValue({ userDisplayName: 'U', userDateUpdated: 0 })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(impl as any).entries.set('1:a1', {
        providerId: 1, itemId: 'a1', status: 'downloading', progress: 0,
        claims: claimsFor([7]), timestamp: 1700000000, title: 'T', artist: 'A',
      })
    })

    afterEach(() => {
      vi.useRealTimers()
      db.get.mockReset()
    })

    it('sends the provider\'s estimate on the view', () => {
      fire({ eta: 30 })
      expect(emit.mock.calls[0][1].payload[0]).toMatchObject({ eta: 30 })
    })

    it('counts down from when the event arrived, not when it is sent', () => {
      fire({ eta: 30 })
      vi.advanceTimersByTime(10_000)
      expect(impl.rehydrateForRoom(7)[0].eta).toBe(20)
    })

    it('never goes below zero', () => {
      fire({ eta: 5 })
      vi.advanceTimersByTime(60_000)
      expect(impl.rehydrateForRoom(7)[0].eta).toBe(0)
    })

    it('clears the estimate when a later event has none', () => {
      fire({ eta: 30 })
      fire({ progress: 0.6 })
      expect(impl.rehydrateForRoom(7)[0]).not.toHaveProperty('eta')
    })

    it('clears the estimate on cancel', () => {
      fire({ eta: 30 })
      impl.markCanceled(1, 'a1')
      expect(emit.mock.lastCall![1].payload[0]).not.toHaveProperty('eta')
    })

    it('re-sends a view with an estimate, counted down', () => {
      fire({ eta: 30 })
      emit.mockClear()
      vi.advanceTimersByTime(10_000)
      expect(emit).toHaveBeenCalledTimes(1)
      expect(emit.mock.calls[0][1].payload[0]).toMatchObject({ eta: 20 })
    })

    it('does not re-send a view without an estimate', () => {
      fire({ progress: 0.6 })
      emit.mockClear()
      vi.advanceTimersByTime(30_000)
      expect(emit).not.toHaveBeenCalled()
    })

    it('keeps the estimate of an untracked event it adopts', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(impl as any).entries.clear()
      fire({ status: 'pending', progress: 0, eta: 90 })
      expect(impl.rehydrateForRoom(7)[0]).toMatchObject({ status: 'pending', eta: 90 })
    })
  })

  describe('prune', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let entries: Map<string, any>

    function seedEntry (
      itemId: string,
      opts: { status: 'pending' | 'downloading' | 'complete' | 'error' | 'canceled', timestamp: number },
    ) {
      entries.set(`1:${itemId}`, {
        providerId: 1, itemId, status: opts.status, progress: 0,
        claims: claimsFor([7], { userId: 3, userDisplayName: 'U', timestamp: opts.timestamp }), timestamp: opts.timestamp, title: 'T', artist: 'A',
      })
    }

    // db.get is shared between lookupUser and computeBootstrapSince; the latter
    // is the only db query prune triggers, so route by SQL substring.
    function mockMinDate (minDate: number | null) {
      db.get.mockImplementation((sqlString: string) =>
        sqlString.includes('rooms') ? { minDate } : { userDisplayName: 'U', userDateUpdated: 0 },
      )
    }

    beforeEach(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      entries = (impl as any).entries
    })

    it('drops terminal entries older than the oldest open room', () => {
      mockMinDate(1700000500)
      seedEntry('a', { status: 'complete', timestamp: 1700000000 })
      seedEntry('b', { status: 'error', timestamp: 1700000100 })
      seedEntry('c', { status: 'canceled', timestamp: 1700000200 })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(impl as any).prune()

      expect(entries.size).toBe(0)
    })

    it('keeps terminal entries at or after the cutoff', () => {
      mockMinDate(1700000500)
      seedEntry('a', { status: 'complete', timestamp: 1700000500 }) // boundary
      seedEntry('b', { status: 'complete', timestamp: 1700000600 })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(impl as any).prune()

      expect(entries.size).toBe(2)
    })

    it('keeps in-flight entries regardless of age (SSE tail-event catch-up)', () => {
      mockMinDate(1700000500)
      seedEntry('a', { status: 'pending', timestamp: 1700000000 })
      seedEntry('b', { status: 'downloading', timestamp: 1700000100 })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(impl as any).prune()

      expect(entries.size).toBe(2)
    })

    it('no-ops when no rooms are open (cutoff falls back to 0)', () => {
      mockMinDate(null)
      seedEntry('a', { status: 'complete', timestamp: 1700000000 })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(impl as any).prune()

      expect(entries.size).toBe(1)
    })

    it('clears broadcastTimers and pendingBroadcast for pruned keys', () => {
      mockMinDate(1700000500)
      seedEntry('a', { status: 'complete', timestamp: 1700000000 })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const timers: Map<string, ReturnType<typeof setTimeout>> = (impl as any).broadcastTimers
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pending: Set<string> = (impl as any).pendingBroadcast
      const t = setTimeout(() => {}, 1_000_000)
      timers.set('1:a', t)
      pending.add('1:a')

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(impl as any).prune()

      expect(timers.has('1:a')).toBe(false)
      expect(pending.has('1:a')).toBe(false)
    })

    it('refreshes bootstrapSinceSeconds so SSE catch-up tightens as rooms close', () => {
      mockMinDate(1700000500)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((impl as any).bootstrapSinceSeconds).toBe(0)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(impl as any).prune()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((impl as any).bootstrapSinceSeconds).toBe(1700000500)
    })

    it('keeps entries for a closed room that still has socket-connected occupants', () => {
      // Open room created at 1700000500. Closed room (id 99) created earlier
      // at 1700000300 but still has a socket connected → it pins the floor.
      // An entry at 1700000400 falls between the two; without occupant
      // accounting it would be pruned, with it the entry must survive.
      Rooms.getActive.mockReturnValueOnce([{ room: 'ROOM_ID_99', roomId: 99 }])
      db.get.mockImplementation((sqlString: string) => {
        if (sqlString.includes('rooms')) {
          // The occupant-aware query routes through the IN clause; default
          // (open-only) query returns the higher minDate.
          return { minDate: sqlString.includes(' IN ') ? 1700000300 : 1700000500 }
        }
        return { userDisplayName: 'U', userDateUpdated: 0 }
      })
      seedEntry('a', { status: 'complete', timestamp: 1700000400 })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(impl as any).prune()

      expect(entries.size).toBe(1)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((impl as any).bootstrapSinceSeconds).toBe(1700000300)
    })
  })

  describe('syncProviders', () => {
    let subscribeSpy: ReturnType<typeof vi.spyOn>
    let close: ReturnType<typeof vi.fn<() => void>>

    function setProviders (byId: Record<number, { enabled?: boolean, song?: boolean, name?: string, url?: string, apiKey?: string }>) {
      const ids = Object.keys(byId).map(Number)
      Prefs.get.mockReturnValue({
        paths: { entities: {}, result: [] },
        providers: {
          result: ids,
          entities: Object.fromEntries(ids.map((id) => {
            const { enabled = true, song = true, name = `P${id}`, url = `http://p${id}`, apiKey } = byId[id]
            const types = { song: { enabled: song, maxLibraryResults: null } }
            return [id, { providerId: id, name, url, apiKey, priority: id, prefs: { enabled, types } }]
          })),
        },
      })
    }

    const subscribedIds = () => subscribeSpy.mock.calls.map(([p]) => (p as { providerId: number }).providerId)
    const subscribedUrls = () => subscribeSpy.mock.calls.map(([p]) => (p as { url: string }).url)

    beforeEach(() => {
      close = vi.fn<() => void>()
      subscribeSpy = vi.spyOn(Providers, 'subscribeStatus').mockReturnValue({ close })
    })

    afterEach(() => {
      subscribeSpy.mockRestore()
    })

    it('opens status streams for providers with songs enabled only', () => {
      setProviders({ 1: {}, 2: { enabled: false }, 3: { song: false } })
      impl.syncProviders()
      expect(subscribedIds()).toEqual([1])
    })

    it('opens with the negotiated song version', () => {
      fakeStatus.statuses.set(1, { state: 'ready', types: { song: { version: 2 } } })
      setProviders({ 1: {} })
      impl.syncProviders()
      expect(subscribeSpy.mock.lastCall?.[1]).toBe(2)
    })

    it('waits for the song API to be usable before opening', async () => {
      fakeStatus.statuses.set(1, { state: 'unreachable', types: {} })
      setProviders({ 1: {} })
      await impl.startAll()
      expect(subscribeSpy).not.toHaveBeenCalled()

      fakeStatus.set(1, { state: 'ready', types: { song: { version: 0 } } })
      expect(subscribedIds()).toEqual([1])
    })

    it('does not open when no song version is shared', () => {
      fakeStatus.statuses.set(1, { state: 'ready', types: { song: { version: null } } })
      setProviders({ 1: {} })
      impl.syncProviders()
      expect(subscribeSpy).not.toHaveBeenCalled()
    })

    it('keeps an open stream while a recheck is in progress, and closes it if the provider becomes unusable', async () => {
      setProviders({ 1: {} })
      await impl.startAll()

      fakeStatus.set(1, { state: 'checking', types: { song: { version: 0 } } })
      expect(close).not.toHaveBeenCalled()

      fakeStatus.set(1, { state: 'unauthorized', types: {} })
      expect(close).toHaveBeenCalledTimes(1)
    })

    it('rechecks the provider after a stream error, then reopens', async () => {
      vi.useFakeTimers()
      try {
        setProviders({ 1: {} })
        await impl.startAll()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(impl as any).onError({ providerId: 1, name: 'P1', url: 'http://p1' }, new Error('down'))
        expect(fakeStatus.impl.recheck).not.toHaveBeenCalled()

        vi.runAllTimers()
        expect(fakeStatus.impl.recheck).toHaveBeenCalledWith(1)

        fakeStatus.set(1, { state: 'ready', types: { song: { version: 0 } } })
        expect(subscribedIds()).toEqual([1, 1])
      } finally {
        vi.useRealTimers()
      }
    })

    it('starts the recheck backoff over once a reopened stream is accepted', async () => {
      vi.useFakeTimers()
      try {
        setProviders({ 1: {} })
        await impl.startAll()
        const provider = { providerId: 1, name: 'P1', url: 'http://p1' }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fail = () => (impl as any).onError(provider, new Error('down'))
        const reopen = () => fakeStatus.set(1, { state: 'ready', types: { song: { version: 0 } } })
        const rechecksAfter = (ms: number) => {
          const before = fakeStatus.impl.recheck.mock.calls.length
          vi.advanceTimersByTime(ms - 1)
          expect(fakeStatus.impl.recheck).toHaveBeenCalledTimes(before)
          vi.advanceTimersByTime(1)
          expect(fakeStatus.impl.recheck).toHaveBeenCalledTimes(before + 1)
        }

        // streams that fail before being accepted back off
        fail()
        rechecksAfter(1_000)
        reopen()
        fail()
        rechecksAfter(2_000)

        // an accepted stream, even with an empty snapshot, resets it
        reopen()
        subscribeSpy.mock.lastCall?.[5]?.()
        fail()
        rechecksAfter(1_000)
      } finally {
        vi.useRealTimers()
      }
    })

    it('closes a provider\'s stream when it is disabled and reopens it when re-enabled', () => {
      setProviders({ 1: {} })
      impl.syncProviders()

      setProviders({ 1: { enabled: false } })
      impl.syncProviders()
      expect(close).toHaveBeenCalledTimes(1)

      setProviders({ 1: {} })
      impl.syncProviders()
      expect(subscribedIds()).toEqual([1, 1])
    })

    it.each([
      ['url', { url: 'http://moved' }],
      ['apiKey', { apiKey: 'new-key' }],
    ])('reopens a provider\'s stream when its %s changes', (_, change) => {
      setProviders({ 1: {} })
      impl.syncProviders()

      setProviders({ 1: change })
      impl.syncProviders()
      expect(close).toHaveBeenCalledTimes(1)
      expect(subscribedIds()).toEqual([1, 1])
      expect(subscribeSpy.mock.lastCall?.[0]).toMatchObject(change)
    })

    it('keeps a provider\'s stream open when only its name changes', () => {
      setProviders({ 1: {} })
      impl.syncProviders()

      setProviders({ 1: { name: 'Renamed' } })
      impl.syncProviders()
      expect(close).not.toHaveBeenCalled()
      expect(subscribedUrls()).toEqual(['http://p1'])
    })

    describe('resync on stream open', () => {
      let fetchSpy: ReturnType<typeof vi.spyOn>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let entries: Map<string, any>

      function seedEntry (providerId: number, itemId: string, status: 'pending' | 'downloading' | 'complete' | 'error' | 'canceled', timestamp = 1700000000) {
        entries.set(`${providerId}:${itemId}`, {
          providerId, itemId, status, progress: 0.5,
          claims: claimsFor([7], { userId: 3, userDisplayName: 'U', timestamp: timestamp }), timestamp, title: 'T', artist: 'A',
        })
      }

      // open provider 1's stream and simulate the provider accepting it
      async function openStream () {
        setProviders({ 1: {}, 2: {} })
        impl.syncProviders()
        const call = subscribeSpy.mock.calls.find(([p]) => (p as { providerId: number }).providerId === 1)
        ;(call?.[5] as () => void)()
        await new Promise<void>(resolve => setImmediate(resolve))
      }

      beforeEach(() => {
        fetchSpy = vi.spyOn(Providers, 'fetch').mockResolvedValue(undefined)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        entries = (impl as any).entries
      })

      afterEach(() => {
        fetchSpy.mockRestore()
      })

      it('re-requests only that provider\'s in-flight fetches, with their own timestamps', async () => {
        for (const status of ['pending', 'downloading', 'complete', 'error', 'canceled'] as const) {
          seedEntry(1, status, status, status === 'downloading' ? 1700000500 : 1700000000)
        }
        seedEntry(2, 'other', 'downloading')

        await openStream()

        expect(fetchSpy.mock.calls.map(([p, version, itemId, timestamp, meta]) => [(p as { providerId: number }).providerId, version, itemId, timestamp, meta]))
          .toEqual([
            [1, 0, 'pending', 1700000000, { userId: 3, roomId: 7 }],
            [1, 0, 'downloading', 1700000500, { userId: 3, roomId: 7 }],
          ])
      })

      it('marks a fetch the provider no longer recognizes as expired', async () => {
        seedEntry(1, 'a', 'downloading')
        fetchSpy.mockRejectedValue(new (await import('./Providers.js')).ProviderItemGoneError())

        await openStream()

        expect(entries.get('1:a')).toMatchObject({ status: 'error', error: 'This result has expired. Search again for a fresh one.' })
      })

      it('leaves the entry alone when the re-request fails for another reason', async () => {
        seedEntry(1, 'a', 'downloading')
        fetchSpy.mockRejectedValue(new Error('Provider returned 503'))

        await openStream()

        expect(entries.get('1:a')).toMatchObject({ status: 'downloading' })
        expect(entries.get('1:a').error).toBeUndefined()
      })

      it('does not overwrite a cancel that landed while the re-request ran', async () => {
        seedEntry(1, 'a', 'downloading')
        const { ProviderItemGoneError } = await import('./Providers.js')
        fetchSpy.mockImplementation(async () => {
          impl.markCanceled(1, 'a')
          throw new ProviderItemGoneError()
        })

        await openStream()

        expect(entries.get('1:a')).toMatchObject({ status: 'canceled' })
      })
    })

    describe('in-flight cancellation', () => {
      let cancelSpy: ReturnType<typeof vi.spyOn>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let entries: Map<string, any>

      function seedEntry (providerId: number, itemId: string, status: 'pending' | 'downloading' | 'complete' | 'error' | 'canceled') {
        entries.set(`${providerId}:${itemId}`, {
          providerId, itemId, status, progress: 0.5,
          claims: claimsFor([7], { userId: 3, userDisplayName: 'U', timestamp: 1700000000 }), timestamp: 1700000000, title: 'T', artist: 'A',
        })
      }

      const statusOf = (providerId: number, itemId: string) => entries.get(`${providerId}:${itemId}`).status

      beforeEach(() => {
        cancelSpy = vi.spyOn(Providers, 'cancel').mockResolvedValue(undefined)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        entries = (impl as any).entries
        for (const status of ['pending', 'downloading', 'complete', 'error', 'canceled'] as const) {
          seedEntry(1, status, status)
        }
        seedEntry(2, 'other', 'downloading')
      })

      afterEach(() => {
        cancelSpy.mockRestore()
      })

      it('cancels the provider\'s in-flight fetches only', () => {
        setProviders({ 1: { enabled: false }, 2: {} })
        impl.syncProviders()

        expect(cancelSpy.mock.calls.map(([p, version, itemId]) => [(p as { providerId: number }).providerId, version, itemId]))
          .toEqual([[1, 0, 'pending'], [1, 0, 'downloading']])
        expect(statusOf(1, 'pending')).toBe('canceled')
        expect(statusOf(1, 'downloading')).toBe('canceled')
        expect(statusOf(1, 'complete')).toBe('complete')
        expect(statusOf(1, 'error')).toBe('error')
        expect(statusOf(2, 'other')).toBe('downloading')
      })

      it('marks fetches canceled even if the provider-side cancel fails', async () => {
        cancelSpy.mockRejectedValue(new Error('unreachable'))
        setProviders({ 1: { enabled: false }, 2: {} })
        impl.syncProviders()
        await Promise.resolve()

        expect(statusOf(1, 'pending')).toBe('canceled')
        expect(statusOf(1, 'downloading')).toBe('canceled')
      })

      it('cancels when only the song type is disabled', () => {
        setProviders({ 1: { song: false }, 2: {} })
        impl.syncProviders()

        expect(statusOf(1, 'pending')).toBe('canceled')
        expect(statusOf(2, 'other')).toBe('downloading')
      })

      it('does not re-cancel on later syncs', () => {
        setProviders({ 1: { enabled: false }, 2: {} })
        impl.syncProviders()
        impl.syncProviders()

        expect(cancelSpy).toHaveBeenCalledTimes(2)
      })

      it('cancels in-flight fetches directly (provider removal)', () => {
        impl.cancelInFlight({ providerId: 1, name: 'P1', url: 'http://p1', priority: 1, prefs: { enabled: true, types: {} } })

        expect(cancelSpy.mock.calls.map(([, , itemId]) => itemId)).toEqual(['pending', 'downloading'])
        expect(statusOf(1, 'pending')).toBe('canceled')
        expect(statusOf(2, 'other')).toBe('downloading')
      })
    })

    it('cancels a pending recheck when reopening for a url change', () => {
      vi.useFakeTimers()
      try {
        setProviders({ 1: {} })
        impl.syncProviders()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(impl as any).onError({ providerId: 1, name: 'P1', url: 'http://p1' }, new Error('down'))

        setProviders({ 1: { url: 'http://moved' } })
        impl.syncProviders()
        vi.runAllTimers()

        expect(subscribedUrls()).toEqual(['http://p1', 'http://moved'])
        expect(fakeStatus.impl.recheck).not.toHaveBeenCalled()
      } finally {
        vi.useRealTimers()
      }
    })
  })
})
