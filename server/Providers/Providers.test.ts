import { describe, it, expect, vi, afterEach } from 'vitest'
import Providers, { normalizeProviderUrl, parseStatusEvent, ProviderError, ProviderItemGoneError, type ProviderApiDescription } from './Providers.js'

// Responses keyed by path; unmatched paths return 404
// (string bodies are sent as-is; anything else is JSON-encoded)
function mockProvider (routes: Record<string, { body: unknown, status?: number }>) {
  const fetchMock = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>(async (url) => {
    const route = routes[new URL(url).pathname]
    if (!route) return new Response('Not Found', { status: 404 })
    const body = typeof route.body === 'string' ? route.body : JSON.stringify(route.body)
    return new Response(route.status === 204 ? null : body, { status: route.status ?? 200 })
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function describeBody (overrides: Partial<ProviderApiDescription> = {}): ProviderApiDescription {
  return {
    name: 'Test Provider',
    auth: { versions: [0] },
    types: { song: { versions: [0] } },
    ...overrides,
  }
}

const AUTH_OK = { '/api/auth/v0': { body: '', status: 204 } }

// the error a promise rejects with, for asserting on state + message
async function rejection (promise: Promise<unknown>): Promise<ProviderError> {
  const err = await promise.then(() => null, (e: unknown) => e)
  expect(err).toBeInstanceOf(ProviderError)
  return err as ProviderError
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('Providers.describe', () => {
  it('returns a valid discovery document', async () => {
    mockProvider({ '/api': { body: describeBody() } })
    await expect(Providers.describe('http://provider')).resolves.toEqual(describeBody())
  })

  it('sends no credentials', async () => {
    const fetchMock = mockProvider({ '/api': { body: describeBody() } })
    await Providers.describe('http://provider')
    expect(fetchMock.mock.calls[0][1]?.headers).toBeUndefined()
  })

  it('appends to a base URL that includes a path', async () => {
    mockProvider({ '/karaoke/api': { body: describeBody() } })
    await expect(Providers.describe('http://provider/karaoke')).resolves.toMatchObject({ name: 'Test Provider' })
  })

  it.each([
    ['a 404', { body: 'Not Found', status: 404 }],
    ['a non-JSON body', { body: '<!doctype html>' }],
    ['a missing name', { body: { auth: { versions: [0] }, types: {} } }],
    ['non-integer versions', { body: describeBody({ auth: { versions: ['1' as unknown as number] } }) }],
    ['an array of types', { body: { ...describeBody(), types: [] } }],
  ])('rejects %s as not a provider', async (_, route) => {
    mockProvider({ '/api': route })
    const err = await rejection(Providers.describe('http://provider'))
    expect(err.state).toBe('incompatible')
    expect(err.message).toBe('No provider found at this URL')
  })

  it('rejects a 401 as separate (proxy) authentication', async () => {
    mockProvider({ '/api': { body: 'Unauthorized', status: 401 } })
    const err = await rejection(Providers.describe('http://provider'))
    expect(err.state).toBe('unauthorized')
    expect(err.message).toMatch(/requires separate authentication/)
  })

  it('rejects other non-2xx responses as unreachable', async () => {
    mockProvider({ '/api': { body: 'Bad Gateway', status: 502 } })
    const err = await rejection(Providers.describe('http://provider'))
    expect(err.state).toBe('unreachable')
    expect(err.message).toBe('Provider returned 502')
  })

  it('rejects a network failure as unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new TypeError('fetch failed')
    }))
    const err = await rejection(Providers.describe('http://provider'))
    expect(err.state).toBe('unreachable')
    expect(err.message).toMatch(/unreachable: fetch failed/)
  })
})

describe('Providers.negotiate', () => {
  it('picks the highest shared auth and type versions', () => {
    const result = Providers.negotiate(describeBody({ auth: { versions: [0, 1] }, types: { song: { versions: [0, 1] } } }))
    expect(result).toEqual({ authVersion: 0, types: { song: { version: 0 } } })
  })

  it('returns a null authVersion when none is shared', () => {
    expect(Providers.negotiate(describeBody({ auth: { versions: [2] } })).authVersion).toBeNull()
  })

  it('reports a supported type with no shared version', () => {
    const result = Providers.negotiate(describeBody({ types: { song: { versions: [2, 3] } } }))
    expect(result.types.song).toEqual({ version: null, message: 'Provider supports song API 2, 3; Karaoke Eternal supports 0' })
  })

  it('ignores types Karaoke Eternal does not support', () => {
    const result = Providers.negotiate(describeBody({ types: { song: { versions: [0] }, background: { versions: [0] } } }))
    expect(Object.keys(result.types)).toEqual(['song'])
  })
})

describe('Providers.checkAuth', () => {
  it('sends the API key as a bearer token to the negotiated auth version', async () => {
    const fetchMock = mockProvider(AUTH_OK)
    await Providers.checkAuth('http://provider', 'secret', 0)
    expect(fetchMock).toHaveBeenCalledWith('http://provider/api/auth/v0', expect.objectContaining({ headers: { Authorization: 'Bearer secret' } }))
  })

  it('rejects a 401 as an invalid API key', async () => {
    mockProvider({ '/api/auth/v0': { body: 'Unauthorized', status: 401 } })
    const err = await rejection(Providers.checkAuth('http://provider', 'wrong', 0))
    expect(err.state).toBe('unauthorized')
    expect(err.message).toBe('Invalid API key')
  })

  it('rejects other non-2xx responses as unreachable', async () => {
    mockProvider({ '/api/auth/v0': { body: 'Internal Server Error', status: 500 } })
    const err = await rejection(Providers.checkAuth('http://provider', 'secret', 0))
    expect(err.state).toBe('unreachable')
  })
})

describe('Providers.probe', () => {
  it('returns name, auth version, and type versions', async () => {
    mockProvider({ '/api': { body: describeBody() }, ...AUTH_OK })
    await expect(Providers.probe('http://provider', 'secret')).resolves.toEqual({
      name: 'Test Provider',
      authVersion: 0,
      types: { song: { version: 0 } },
    })
  })

  it('rejects when no auth version is shared', async () => {
    mockProvider({ '/api': { body: describeBody({ auth: { versions: [2] } }) } })
    const err = await rejection(Providers.probe('http://provider'))
    expect(err.state).toBe('incompatible')
    expect(err.message).toMatch(/authentication method .* \(provider supports auth 2; Karaoke Eternal supports 0\)/)
  })

  it('rejects when no supported type is offered', async () => {
    mockProvider({ '/api': { body: describeBody({ types: { background: { versions: [0] } } }) } })
    const err = await rejection(Providers.probe('http://provider'))
    expect(err.state).toBe('incompatible')
    expect(err.message).toBe('Provider offers no types Karaoke Eternal supports (provider offers background)')
  })

  it('rejects when no supported type has a shared version', async () => {
    mockProvider({ '/api': { body: describeBody({ types: { song: { versions: [2] } } }) } })
    const err = await rejection(Providers.probe('http://provider'))
    expect(err.state).toBe('incompatible')
    expect(err.message).toBe('Provider supports song API 2; Karaoke Eternal supports 0')
  })

  it('rejects an invalid API key after discovery succeeds', async () => {
    mockProvider({ '/api': { body: describeBody() }, '/api/auth/v0': { body: 'Unauthorized', status: 401 } })
    const err = await rejection(Providers.probe('http://provider', 'wrong'))
    expect(err.message).toBe('Invalid API key')
  })
})

describe('song endpoints', () => {
  const provider = { providerId: 1, name: 'P', url: 'http://provider', priority: 0, apiKey: 'secret', prefs: { enabled: true, types: {} } }

  it('build URLs from the negotiated song version', async () => {
    const fetchMock = mockProvider({ '/api/song/v2/items/abc/fetch': { body: '', status: 202 } })
    await Providers.fetch(provider, 2, 'abc', 1, {})
    expect(fetchMock).toHaveBeenCalledWith('http://provider/api/song/v2/items/abc/fetch', expect.objectContaining({
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer secret' },
    }))
  })

  it('fetch reports a 404 as an expired item', async () => {
    mockProvider({})
    await expect(Providers.fetch(provider, 0, 'abc', 1, {})).rejects.toBeInstanceOf(ProviderItemGoneError)
  })

  it('cancel treats a 404 as already canceled', async () => {
    mockProvider({})
    await expect(Providers.cancel(provider, 0, 'abc')).resolves.toBeUndefined()
  })

  it.each([
    ['fetch', () => Providers.fetch(provider, 0, 'abc', 1, {})],
    ['cancel', () => Providers.cancel(provider, 0, 'abc')],
  ])('%s sends a timeout signal and surfaces its expiry', async (_, call) => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      expect(init?.signal).toBeInstanceOf(AbortSignal)
      throw new DOMException('The operation was aborted due to timeout', 'TimeoutError')
    })
    vi.stubGlobal('fetch', fetchMock)
    await expect(call()).rejects.toThrow(/timeout/)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})

describe('parseStatusEvent', () => {
  const valid = { id: 'a1', status: 'downloading', progress: 0.5, timestamp: 1700000000, title: 'T', artist: 'A', source: 's', iconUrl: 'https://p/i.svg' }
  const parse = (overrides: Record<string, unknown>) => parseStatusEvent(JSON.stringify({ ...valid, ...overrides }))

  it('returns only the contract fields', () => {
    expect(parse({ extra: 1, error: 'e', path: '/srv/x.mp4', meta: { userId: 1 } })).toEqual({
      ...valid, error: 'e', path: '/srv/x.mp4', meta: { userId: 1 },
    })
  })

  it('keeps an eta on an active status', () => {
    expect(parse({ eta: 30 })?.eta).toBe(30)
    expect(parse({ status: 'pending', progress: 0, eta: 0 })?.eta).toBe(0)
  })

  it('ignores an eta once the download has ended', () => {
    expect(parse({ status: 'complete', progress: 1, path: '/srv/x.mp4', eta: 30 })).not.toHaveProperty('eta')
  })

  it.each([
    ['negative', -1],
    ['non-numeric', '30'],
    ['non-finite', null],
    ['over a day', 86_401],
  ])('drops a %s eta but keeps the event', (_, eta) => {
    const event = parse({ eta })
    expect(event).toMatchObject({ status: 'downloading', progress: 0.5 })
    expect(event).not.toHaveProperty('eta')
  })

  it('clamps progress to [0, 1]', () => {
    expect(parse({ progress: 1.5 })?.progress).toBe(1)
    expect(parse({ progress: -1 })?.progress).toBe(0)
  })

  it.each([
    ['invalid JSON', 'nope'],
    ['a non-object', '[]'],
    ['an unknown status', { status: 'paused' }],
    ['a non-numeric progress', { progress: '0.5' }],
    ['a non-finite progress', { progress: null }],
    ['a non-numeric timestamp', { timestamp: '1700000000' }],
    ['a negative timestamp', { timestamp: -1 }],
    ['an empty id', { id: '' }],
    ['an empty title', { title: '' }],
    ['an empty source', { source: '' }],
    ['a non-string title', { title: 5 }],
    ['an over-long title', { title: 'x'.repeat(1025) }],
    ['a non-http iconUrl', { iconUrl: 'javascript:alert(1)' }],
    ['a relative iconUrl', { iconUrl: '/icon.svg' }],
    ['a non-string error', { error: { code: 1 } }],
    ['an array meta', { meta: [1] }],
    ['an over-long meta', { meta: { pad: 'x'.repeat(5000) } }],
    ['a relative path', { path: 'relative/x.mp4' }],
    ['a path with a NUL byte', { path: '/srv/x\0.mp4' }],
  ])('rejects %s', (_, input) => {
    const data = typeof input === 'string' ? input : JSON.stringify({ ...valid, ...input })
    expect(parseStatusEvent(data)).toBeNull()
  })
})

describe('Providers.search', () => {
  const provider = { providerId: 1, name: 'P', url: 'http://provider', priority: 0, prefs: { enabled: true, types: {} } }
  const result = { id: 'a1', title: 'T', artist: 'A', source: 's', iconUrl: 'http://provider/i.svg' }

  async function search (ndjson: string) {
    mockProvider({ '/api/song/v0/search': { body: ndjson } })
    const batches: unknown[][] = []
    await Providers.search(provider, 0, 'q', r => batches.push(r), new AbortController().signal)
    return batches
  }

  it('tags each result with the providerId', async () => {
    await expect(search(JSON.stringify([result]) + '\n')).resolves.toEqual([[{ providerId: 1, ...result }]])
  })

  it('returns only the contract fields', async () => {
    const line = JSON.stringify([{ ...result, duration: 225, extra: 'x' }]) + '\n'
    await expect(search(line)).resolves.toEqual([[{ providerId: 1, ...result, duration: 225 }]])
  })

  it('rejects a line that is not an array', async () => {
    await expect(search(JSON.stringify(result) + '\n')).rejects.toThrow(/malformed search result line/)
  })

  it('rejects an oversized line', async () => {
    const line = JSON.stringify([{ ...result, title: 'x'.repeat(70_000) }]) + '\n'
    await expect(search(line)).rejects.toThrow(/exceeded/)
  })

  it('stops reading and cancels the body at the result cap', async () => {
    let canceled = false
    const lines = Array.from({ length: 60 }, (_, i) => JSON.stringify([{ ...result, id: `r${i}` }])).join('\n') + '\n'
    const body = new ReadableStream<Uint8Array>({
      start (c) {
        c.enqueue(new TextEncoder().encode(lines))
      },
      cancel () {
        canceled = true
      },
    })
    vi.stubGlobal('fetch', vi.fn(async () => new Response(body, { status: 200 })))

    const batches: unknown[][] = []
    await Providers.search(provider, 0, 'q', r => batches.push(r), new AbortController().signal)
    expect(batches.flat()).toHaveLength(50)
    expect(canceled).toBe(true)
  })

  it.each([
    ['a non-http iconUrl', { iconUrl: 'ftp://provider/i.svg' }],
    ['an over-long title', { title: 'x'.repeat(1025) }],
    ['a missing source', { source: undefined }],
    ['a dot id', { id: '.' }],
    ['a dot-dot id', { id: '..' }],
    ['a zero duration', { duration: 0 }],
    ['a non-numeric duration', { duration: '225' }],
    ['an infinite duration', { duration: Infinity }],
  ])('drops a result with %s', async (_, overrides) => {
    const line = JSON.stringify([{ ...result, ...overrides }, { ...result, id: 'a2' }]) + '\n'
    await expect(search(line)).resolves.toEqual([[{ providerId: 1, ...result, id: 'a2' }]])
  })
})

describe('Providers.subscribeStatus', () => {
  const provider = { providerId: 1, name: 'P', url: 'http://provider', priority: 0, apiKey: 'secret', prefs: { enabled: true, types: {} } }
  const settle = () => new Promise(resolve => setTimeout(resolve, 20))

  // fetch stub serving a controllable SSE body; aborting the request's signal
  // errors the body like a real fetch would
  function mockStream (status = 200) {
    let controller!: ReadableStreamDefaultController<Uint8Array>
    const stream = new ReadableStream<Uint8Array>({
      start (c) {
        controller = c
      },
    })
    const fetchMock = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>(async (_url, init) => {
      init?.signal?.addEventListener('abort', () => {
        try {
          controller.error(new Error('aborted'))
        } catch {
          // already closed
        }
      })
      return new Response(status === 200 ? stream : 'Unauthorized', { status })
    })
    vi.stubGlobal('fetch', fetchMock)
    const enc = new TextEncoder()
    return {
      fetchMock,
      push: (s: string) => controller.enqueue(enc.encode(s)),
      end: () => controller.close(),
    }
  }

  function subscribe () {
    const onEvent = vi.fn()
    const onError = vi.fn()
    const onOpen = vi.fn()
    const sub = Providers.subscribeStatus(provider, 0, 1700000000, onEvent, onError, onOpen)
    return { sub, onEvent, onError, onOpen }
  }

  const event = { id: 'a1', status: 'pending', progress: 0, timestamp: 1700000000, title: 'T', artist: 'A', source: 's', iconUrl: 'http://provider/i.svg' }

  it('requests the stream with the API key and since', async () => {
    const { fetchMock } = mockStream()
    const { sub } = subscribe()
    await settle()
    expect(fetchMock).toHaveBeenCalledWith('http://provider/api/song/v0/status?since=1700000000', expect.objectContaining({
      headers: { Accept: 'text/event-stream', Authorization: 'Bearer secret' },
    }))
    sub.close()
  })

  it('delivers parsed events', async () => {
    const { push } = mockStream()
    const { sub, onEvent, onError } = subscribe()
    await settle()
    push(`data: ${JSON.stringify(event)}\n\n`)
    push(`data: ${JSON.stringify({ ...event, status: 'downloading' })}\n\n`)
    await settle()
    expect(onEvent.mock.calls.map(([e]) => e.status)).toEqual(['pending', 'downloading'])
    expect(onError).not.toHaveBeenCalled()
    sub.close()
  })

  it('ignores comments and malformed events', async () => {
    const { push } = mockStream()
    const { sub, onEvent, onError } = subscribe()
    await settle()
    push(': keepalive\n\ndata: not json\n\ndata: {"id":"a1"}\n\n')
    await settle()
    expect(onEvent).not.toHaveBeenCalled()
    expect(onError).not.toHaveBeenCalled()
    sub.close()
  })

  it('calls onOpen once the stream is accepted, before any event', async () => {
    const { push } = mockStream()
    const { sub, onEvent, onOpen } = subscribe()
    await settle()
    expect(onOpen).toHaveBeenCalledTimes(1)
    push(`data: ${JSON.stringify(event)}\n\n`)
    await settle()
    expect(onOpen.mock.invocationCallOrder[0]).toBeLessThan(onEvent.mock.invocationCallOrder[0])
    sub.close()
  })

  it('reports a non-2xx response', async () => {
    mockStream(401)
    const { onError, onOpen } = subscribe()
    await settle()
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'Provider returned 401' }))
    expect(onOpen).not.toHaveBeenCalled()
  })

  it('reports the provider ending the stream', async () => {
    const { end } = mockStream()
    const { onError } = subscribe()
    await settle()
    end()
    await settle()
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'Status stream ended' }))
  })

  it('close() ends the stream without reporting an error', async () => {
    mockStream()
    const { sub, onError } = subscribe()
    await settle()
    sub.close()
    await settle()
    expect(onError).not.toHaveBeenCalled()
  })

  describe('when the stream goes silent', () => {
    afterEach(() => {
      vi.useRealTimers()
    })

    it('reports a stream that sends nothing for 90s', async () => {
      vi.useFakeTimers()
      mockStream()
      const { onError } = subscribe()
      await vi.advanceTimersByTimeAsync(89_000)
      expect(onError).not.toHaveBeenCalled()
      await vi.advanceTimersByTimeAsync(1_000)
      expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'Status stream went silent' }))
    })

    it('keeps a stream open while keepalive comments arrive', async () => {
      vi.useFakeTimers()
      const { push } = mockStream()
      const { sub, onError } = subscribe()
      for (let i = 0; i < 4; i++) {
        await vi.advanceTimersByTimeAsync(30_000)
        push(': keepalive\n\n')
      }
      await vi.advanceTimersByTimeAsync(60_000)
      expect(onError).not.toHaveBeenCalled()
      sub.close()
    })

    it('stops watching once closed', async () => {
      vi.useFakeTimers()
      mockStream()
      const { sub, onError } = subscribe()
      await vi.advanceTimersByTimeAsync(10)
      sub.close()
      await vi.advanceTimersByTimeAsync(10)
      expect(vi.getTimerCount()).toBe(0)
      expect(onError).not.toHaveBeenCalled()
    })
  })
})

describe('normalizeProviderUrl', () => {
  it.each([
    ['http://provider', 'http://provider'],
    ['http://provider/', 'http://provider'],
    ['http://provider/karaoke//', 'http://provider/karaoke'],
    ['  http://provider/  ', 'http://provider'],
    ['http://provider/api', 'http://provider'],
    ['http://provider/karaoke/api/', 'http://provider/karaoke'],
    ['http://provider/apix', 'http://provider/apix'],
    ['/', ''],
  ])('normalizes %j to %j', (input, expected) => {
    expect(normalizeProviderUrl(input)).toBe(expected)
  })
})
