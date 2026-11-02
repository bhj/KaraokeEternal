import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { Provider } from '../../shared/types.js'

vi.mock('../Prefs/Prefs.js', () => ({ default: { get: vi.fn() } }))

const Prefs = (await import('../Prefs/Prefs.js')).default as unknown as { get: ReturnType<typeof vi.fn> }
const { default: Providers, ProviderError } = await import('./Providers.js')
const { ProviderStatusImpl } = await import('./ProviderStatus.js')
const { PROVIDER_STATUS_PUSH } = await import('../../shared/actionTypes.js')

function setProviders (byId: Record<number, { enabled?: boolean, url?: string, apiKey?: string }>) {
  const ids = Object.keys(byId).map(Number)
  Prefs.get.mockReturnValue({
    providers: {
      result: ids,
      entities: Object.fromEntries(ids.map((id) => {
        const { enabled = true, url = `http://p${id}`, apiKey } = byId[id]
        const provider: Provider = { providerId: id, name: `P${id}`, url, apiKey, priority: id, prefs: { enabled, types: {} } }
        return [id, provider]
      })),
    },
  })
}

function makeIo (sockets: { id: string, isAdmin: boolean }[]) {
  const emit = vi.fn()
  const to = vi.fn(() => ({ emit }))
  const io = {
    sockets: { sockets: new Map(sockets.map(s => [s.id, { id: s.id, user: { isAdmin: s.isAdmin } }])) },
    to,
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { io: io as any, to, emit }
}

const READY = { name: 'P', authVersion: 0, types: { song: { version: 0 } } }

// resolve pending checks (and the microtasks after them)
const flush = () => new Promise<void>(resolve => setImmediate(resolve))

describe('ProviderStatus', () => {
  let status: InstanceType<typeof ProviderStatusImpl>
  let probe: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    status = new ProviderStatusImpl()
    probe = vi.spyOn(Providers, 'probe').mockResolvedValue(READY)
  })

  afterEach(() => {
    status.stopAll()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('checks enabled providers only', async () => {
    setProviders({ 1: {}, 2: { enabled: false } })
    status.sync()
    await flush()

    expect(probe).toHaveBeenCalledTimes(1)
    expect(probe).toHaveBeenCalledWith('http://p1', undefined)
    expect(status.get(1)).toEqual({ state: 'ready', types: { song: { version: 0 } } })
    expect(status.get(2)).toBeUndefined()
  })

  it('is checking until the check finishes', async () => {
    setProviders({ 1: {} })
    status.sync()
    expect(status.get(1)?.state).toBe('checking')

    await expect(status.settled(1)).resolves.toMatchObject({ state: 'ready' })
  })

  it('reports the negotiated song version', async () => {
    probe.mockResolvedValue({ ...READY, types: { song: { version: 2 } } })
    setProviders({ 1: {} })
    status.sync()
    await flush()

    expect(status.songVersion(1)).toBe(2)
  })

  it('keeps per-type statuses from a failed check', async () => {
    const types = { song: { version: null, message: 'Provider supports song API 2; Karaoke Eternal supports 1' } }
    probe.mockRejectedValue(new ProviderError('incompatible', 'Provider supports song API 2; Karaoke Eternal supports 1', types))
    setProviders({ 1: {} })
    status.sync()
    await flush()

    expect(status.get(1)).toEqual({ state: 'incompatible', message: types.song.message, types })
    expect(status.songVersion(1)).toBeNull()
    expect(status.songUnavailableReason(1)).toBe(types.song.message)
  })

  it('treats unexpected errors as unreachable', async () => {
    probe.mockRejectedValue(new Error('boom'))
    setProviders({ 1: {} })
    status.sync()
    await flush()

    expect(status.get(1)).toEqual({ state: 'unreachable', message: 'boom', types: {} })
  })

  it('shares one check between concurrent rechecks', async () => {
    setProviders({ 1: {} })
    await Promise.all([status.recheck(1), status.recheck(1)])
    expect(probe).toHaveBeenCalledTimes(1)
  })

  it('does not recheck on sync when url and apiKey are unchanged', async () => {
    setProviders({ 1: {} })
    status.sync()
    await flush()
    status.sync()
    await flush()

    expect(probe).toHaveBeenCalledTimes(1)
  })

  it('rechecks on sync when the apiKey changes, ignoring the superseded check', async () => {
    let resolveFirst!: (v: typeof READY) => void
    probe.mockImplementationOnce(() => new Promise((resolve) => {
      resolveFirst = resolve
    }))
    probe.mockRejectedValueOnce(new ProviderError('unauthorized', 'Invalid API key'))

    setProviders({ 1: {} })
    status.sync()
    setProviders({ 1: { apiKey: 'new' } })
    status.sync()
    await flush()

    resolveFirst(READY)
    await flush()

    expect(probe).toHaveBeenLastCalledWith('http://p1', 'new')
    expect(status.get(1)?.state).toBe('unauthorized')
  })

  it('retries failed checks with backoff', async () => {
    vi.useFakeTimers()
    probe.mockRejectedValue(new ProviderError('unreachable', 'Provider returned 502'))
    setProviders({ 1: {} })
    status.sync()
    await vi.advanceTimersByTimeAsync(0)
    expect(probe).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(1_000)
    expect(probe).toHaveBeenCalledTimes(2)

    await vi.advanceTimersByTimeAsync(1_999)
    expect(probe).toHaveBeenCalledTimes(2)
    await vi.advanceTimersByTimeAsync(1)
    expect(probe).toHaveBeenCalledTimes(3)

    probe.mockResolvedValue(READY)
    await vi.advanceTimersByTimeAsync(4_000)
    expect(status.get(1)?.state).toBe('ready')

    await vi.advanceTimersByTimeAsync(60_000)
    expect(probe).toHaveBeenCalledTimes(4)
  })

  it('forgets disabled or removed providers and stops retrying them', async () => {
    vi.useFakeTimers()
    probe.mockRejectedValue(new ProviderError('unreachable', 'down'))
    setProviders({ 1: {} })
    status.sync()
    await vi.advanceTimersByTimeAsync(0)

    setProviders({ 1: { enabled: false } })
    status.sync()
    await vi.advanceTimersByTimeAsync(60_000)

    expect(status.get(1)).toBeUndefined()
    expect(probe).toHaveBeenCalledTimes(1)
    expect(status.songUnavailableReason(1)).toBe('Provider is disabled')
  })

  it('notifies listeners of each change', async () => {
    const listener = vi.fn()
    status.onChange(listener)
    setProviders({ 1: {} })
    status.sync()
    await flush()

    // checking, then ready
    expect(listener.mock.calls).toEqual([[1], [1]])

    setProviders({})
    status.sync()
    expect(listener).toHaveBeenCalledTimes(3)
  })

  it('pushes all statuses to admin sockets only', async () => {
    const { io, to, emit } = makeIo([{ id: 'a', isAdmin: true }, { id: 'u', isAdmin: false }])
    status.init(io)
    setProviders({ 1: {} })
    status.sync()
    await flush()

    expect(to).toHaveBeenLastCalledWith(['a'])
    expect(emit).toHaveBeenLastCalledWith('action', {
      type: PROVIDER_STATUS_PUSH,
      payload: { 1: { state: 'ready', types: { song: { version: 0 } } } },
    })
  })
})
