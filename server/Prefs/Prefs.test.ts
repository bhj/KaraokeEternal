import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../lib/Database.js', () => ({
  db: {
    get: vi.fn(),
    all: vi.fn(() => []),
    run: vi.fn(() => ({ lastID: 99, changes: 1 })),
  },
}))

const Prefs = (await import('./Prefs.js')).default
const Database = (await import('../lib/Database.js')).db as unknown as {
  get: ReturnType<typeof vi.fn>
  all: ReturnType<typeof vi.fn>
  run: ReturnType<typeof vi.fn>
}

// Mirrors what Prefs.get() returns after parsing the prefs/paths rows.
function mockExistingPaths (entities: Record<number, { path: string }>) {
  const result = Object.keys(entities).map(Number)
  vi.spyOn(Prefs, 'get').mockReturnValue({
    paths: {
      result,
      entities: Object.fromEntries(
        Object.entries(entities).map(([id, e]) => [id, { pathId: Number(id), path: e.path, priority: 0, prefs: {} }]),
      ),
    },
    providers: { result: [], entities: {} },
    roles: { result: [], entities: {} },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any)
}

describe('Prefs.addPath nesting invariant', () => {
  beforeEach(() => {
    Database.run.mockClear()
  })

  it('rejects a child of an existing path', () => {
    mockExistingPaths({ 1: { path: '/library' } })
    expect(() => Prefs.addPath('/library/karaoke')).toThrow(/inside an existing/)
    expect(Database.run).not.toHaveBeenCalled()
  })

  it('rejects a parent of an existing path', () => {
    mockExistingPaths({ 1: { path: '/library/karaoke' } })
    expect(() => Prefs.addPath('/library')).toThrow(/contains an existing/)
    expect(Database.run).not.toHaveBeenCalled()
  })

  it('rejects an exact duplicate after normalization', () => {
    mockExistingPaths({ 1: { path: '/library' } })
    expect(() => Prefs.addPath('/library/')).toThrow(/already been added/)
    expect(Database.run).not.toHaveBeenCalled()
  })

  it('rejects a path equivalent via `..` traversal', () => {
    mockExistingPaths({ 1: { path: '/library' } })
    expect(() => Prefs.addPath('/library/foo/..')).toThrow(/already been added/)
    expect(Database.run).not.toHaveBeenCalled()
  })

  it('accepts a sibling path', () => {
    mockExistingPaths({ 1: { path: '/library' } })
    expect(() => Prefs.addPath('/other-library')).not.toThrow()
    expect(Database.run).toHaveBeenCalledTimes(1)
  })

  it('accepts the first path when none exist', () => {
    mockExistingPaths({})
    expect(() => Prefs.addPath('/library')).not.toThrow()
    expect(Database.run).toHaveBeenCalledTimes(1)
  })
})

describe('Prefs.resolvePathId', () => {
  it('returns the pathId when absPath is inside a configured base', () => {
    mockExistingPaths({ 1: { path: '/library' } })
    expect(Prefs.resolvePathId('/library/foo/queen.mp4')).toBe(1)
  })

  it('returns null when absPath is outside every configured base', () => {
    mockExistingPaths({ 1: { path: '/library' } })
    expect(Prefs.resolvePathId('/elsewhere/queen.mp4')).toBeNull()
  })

  it('returns null for non-absolute input', () => {
    mockExistingPaths({ 1: { path: '/library' } })
    expect(Prefs.resolvePathId('library/queen.mp4')).toBeNull()
  })

  it('rejects `..` traversal that escapes the configured base', () => {
    mockExistingPaths({ 1: { path: '/library' } })
    // path.resolve normalizes to /etc/passwd.mp4, which is outside /library
    expect(Prefs.resolvePathId('/library/../etc/passwd.mp4')).toBeNull()
  })

  it('matches when configured path differs but resolves equivalently', () => {
    // Configured base has trailing-slash / dot-segments; absPath resolves to same parent
    mockExistingPaths({ 1: { path: '/library/./' } })
    expect(Prefs.resolvePathId('/library/foo/queen.mp4')).toBe(1)
  })

  it('returns null when a legacy db has nested configured paths that both contain absPath', () => {
    // Bypasses addPath enforcement (which now rejects nesting in both directions)
    // by seeding Prefs directly — simulating a database that predates the invariant.
    mockExistingPaths({
      1: { path: '/library' },
      2: { path: '/library/karaoke' },
    })
    expect(Prefs.resolvePathId('/library/karaoke/queen.mp4')).toBeNull()
  })
})

describe('Prefs.get providers', () => {
  function mockProviderRows (rows: Record<string, unknown>[]) {
    Database.all.mockImplementation((query: string) => query.includes('FROM providers') ? rows : [])
  }

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('does not let data keys shadow columns', () => {
    mockProviderRows([{
      providerId: 1,
      name: 'Real',
      url: 'http://real',
      priority: 0,
      data: JSON.stringify({ providerId: 9, name: 'Fake', url: 'http://evil', priority: 5, apiKey: 'k' }),
    }])

    expect(Prefs.get().providers.entities[1]).toEqual({
      providerId: 1,
      name: 'Real',
      url: 'http://real',
      priority: 0,
      apiKey: 'k',
      prefs: { enabled: true, types: {} },
    })
  })

  it.each([
    ['missing', undefined, { enabled: true, types: {} }],
    ['disabled with no types', { enabled: false }, { enabled: false, types: {} }],
    ['song set', { types: { song: { enabled: true, maxLibraryResults: 3 } } }, { enabled: true, types: { song: { enabled: true, maxLibraryResults: 3 } } }],
    ['song partial', { types: { song: { maxLibraryResults: 3 } } }, { enabled: true, types: { song: { enabled: false, maxLibraryResults: 3 } } }],
    ['song always', { types: { song: { enabled: true } } }, { enabled: true, types: { song: { enabled: true, maxLibraryResults: null } } }],
  ])('builds prefs when %s', (_, prefs, expected) => {
    mockProviderRows([{ providerId: 1, name: 'P', url: 'http://p', priority: 0, data: JSON.stringify({ prefs }) }])
    expect(Prefs.get().providers.entities[1].prefs).toEqual(expected)
  })

  it('keeps only known prefs and types', () => {
    mockProviderRows([{
      providerId: 1,
      name: 'P',
      url: 'http://p',
      priority: 0,
      data: JSON.stringify({ prefs: { enabled: false, apiKey: 'k', types: { song: { enabled: true, apiKey: 'k' }, other: { enabled: true } } } }),
    }])
    expect(Prefs.get().providers.entities[1].prefs).toEqual({ enabled: false, types: { song: { enabled: true, maxLibraryResults: null } } })
  })
})

describe('Prefs.getSanitizedProviders', () => {
  it('exposes only whitelisted fields', () => {
    const songPrefs = { enabled: true, types: { song: { enabled: true, maxLibraryResults: 2 } } }
    const sanitized = Prefs.getSanitizedProviders({
      result: [1],
      entities: {
        1: { providerId: 1, name: 'Song', url: 'http://s', priority: 0, apiKey: 'secret', prefs: songPrefs },
      },
    })

    expect(sanitized).toEqual({
      result: [1],
      entities: {
        1: { providerId: 1, name: 'Song', priority: 0, prefs: songPrefs },
      },
    })
  })

  it('omits disabled providers', () => {
    const sanitized = Prefs.getSanitizedProviders({
      result: [1, 2],
      entities: {
        1: { providerId: 1, name: 'A', url: 'http://a', priority: 0, prefs: { enabled: true, types: {} } },
        2: { providerId: 2, name: 'B', url: 'http://b', priority: 1, prefs: { enabled: false, types: {} } },
      },
    })

    expect(sanitized.result).toEqual([1])
    expect(Object.keys(sanitized.entities)).toEqual(['1'])
  })
})
