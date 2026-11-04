import { describe, it, expect } from 'vitest'
import getSearchResults from './getSearchResults'

interface Fixture {
  artists: { artistId: number, name: string, songIds: number[] }[]
  songs: { songId: number, artistId: number, title: string }[]
  filterStr?: string
  filterStarred?: boolean
  starredSongs?: number[]
}

const buildState = (f: Fixture) => ({
  artists: {
    result: f.artists.map(a => a.artistId),
    entities: Object.fromEntries(f.artists.map(a => [a.artistId, a])),
  },
  songs: {
    result: f.songs.map(s => s.songId),
    entities: Object.fromEntries(f.songs.map(s => [s.songId, { ...s, duration: 0, numMedia: 1 }])),
  },
  library: {
    filterStr: f.filterStr ?? '',
    filterStarred: f.filterStarred ?? false,
  },
  userStars: {
    starredSongs: f.starredSongs ?? [],
    starredArtists: [] as number[],
  },
})

// Re-create the selector per test to bypass cross-test memoization.
const getResults = (state: ReturnType<typeof buildState>) => {
  // The default-exported selector is module-scoped and memoizes across calls.
  // For each call here we pass a fresh state object, but since we vary
  // filterStr/library between tests the memo key changes naturally.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return getSearchResults(state as any).songsResult
}

const beatles = { artistId: 1, name: 'The Beatles', songIds: [10, 11, 12] }
const stones = { artistId: 2, name: 'The Rolling Stones', songIds: [20, 21] }
const queen = { artistId: 3, name: 'Queen', songIds: [30] }

const songs = [
  { songId: 10, artistId: 1, title: 'All Together Now' },
  { songId: 11, artistId: 1, title: 'Yesterday' },
  { songId: 12, artistId: 1, title: 'Hey Jude' },
  { songId: 20, artistId: 2, title: 'Paint It Black' },
  { songId: 21, artistId: 2, title: 'Yesterday\'s Papers' },
  { songId: 30, artistId: 3, title: 'Bohemian Rhapsody' },
]

const libraryFixture: Omit<Fixture, 'filterStr'> = {
  artists: [beatles, stones, queen],
  songs,
}

describe('getSearchResults', () => {
  it('returns the full library when filterStr is empty', () => {
    const result = getResults(buildState({ ...libraryFixture, filterStr: '' }))
    expect(result).toEqual([10, 11, 12, 20, 21, 30])
  })

  it('matches a multi-field query across artist + title', () => {
    const result = getResults(buildState({ ...libraryFixture, filterStr: 'beatles all together' }))
    expect(result[0]).toBe(10) // "All Together Now"
    // other Beatles songs shouldn't match because "all" and "together" aren't in their titles
    expect(result).not.toContain(11)
    expect(result).not.toContain(12)
  })

  it('is order-independent for multi-token queries', () => {
    const a = getResults(buildState({ ...libraryFixture, filterStr: 'beatles all together' }))
    const b = getResults(buildState({ ...libraryFixture, filterStr: 'all together beatles' }))
    const c = getResults(buildState({ ...libraryFixture, filterStr: 'together beatles all' }))
    expect(a).toEqual(b)
    expect(a).toEqual(c)
  })

  it('returns all of an artist\'s songs for a single-word artist query, sorted by title', () => {
    const result = getResults(buildState({ ...libraryFixture, filterStr: 'beatles' }))
    expect(result).toEqual([10, 12, 11]) // All Together Now, Hey Jude, Yesterday — alphabetical
  })

  it('matches a title-only query across any artist', () => {
    const result = getResults(buildState({ ...libraryFixture, filterStr: 'yesterday' }))
    expect(result).toContain(11) // Beatles - Yesterday
    expect(result).toContain(21) // Stones - Yesterday's Papers
  })

  it('tolerates typos within fuzzy threshold', () => {
    const result = getResults(buildState({ ...libraryFixture, filterStr: 'beetles' }))
    expect(result.length).toBeGreaterThan(0)
    // first match should be a Beatles song
    expect([10, 11, 12]).toContain(result[0])
  })

  it('returns empty array when no songs match all tokens', () => {
    const result = getResults(buildState({ ...libraryFixture, filterStr: 'zzzzz xxxxx' }))
    expect(result).toEqual([])
  })

  describe('special characters', () => {
    const fixture: Omit<Fixture, 'filterStr'> = {
      artists: [
        { artistId: 4, name: 'Big & Rich', songIds: [40] },
        { artistId: 5, name: 'Sigur Rós', songIds: [50] },
        { artistId: 6, name: 'Jason Mraz', songIds: [60] },
        { artistId: 7, name: 'AC/DC', songIds: [70] },
      ],
      songs: [
        { songId: 40, artistId: 4, title: 'Save a Horse' },
        { songId: 50, artistId: 5, title: 'Hoppípolla' },
        { songId: 60, artistId: 6, title: 'I\'m Yours' },
        { songId: 70, artistId: 7, title: 'Back in Black' },
      ],
    }

    it('ignores symbol-only tokens', () => {
      expect(getResults(buildState({ ...fixture, filterStr: 'big & rich' }))).toEqual([40])
      expect(getResults(buildState({ ...fixture, filterStr: '&' }))).toEqual([40, 50, 60, 70])
      expect(getResults(buildState({ ...fixture, filterStr: 'big &' }))).toEqual([40])
    })

    it('treats a spaced "&" as "and"', () => {
      expect(getResults(buildState({ ...fixture, filterStr: 'big and rich' }))).toEqual([40])
    })

    it('keeps an unspaced "&" from splitting into single-letter tokens', () => {
      const withRnB: Omit<Fixture, 'filterStr'> = {
        artists: [...fixture.artists, { artistId: 8, name: 'Usher', songIds: [80] }],
        songs: [...fixture.songs, { songId: 80, artistId: 8, title: 'R&B Junkie' }],
      }
      expect(getResults(buildState({ ...withRnB, filterStr: 'r&b' }))).toEqual([80])
      expect(getResults(buildState({ ...withRnB, filterStr: 'rb' }))).toEqual([80])
    })

    it('matches across straight and curly apostrophes', () => {
      expect(getResults(buildState({ ...fixture, filterStr: 'i’m' }))).toEqual([60])
    })

    it('matches unaccented queries against accented names, and vice versa', () => {
      expect(getResults(buildState({ ...fixture, filterStr: 'ros' }))).toEqual([50])
      expect(getResults(buildState({ ...fixture, filterStr: 'hoppipolla' }))).toEqual([50])
      expect(getResults(buildState({ ...fixture, filterStr: 'mráz' }))).toEqual([60])
    })

    it('matches with or without punctuation inside words', () => {
      expect(getResults(buildState({ ...fixture, filterStr: 'acdc' }))).toEqual([70])
      expect(getResults(buildState({ ...fixture, filterStr: 'ac/dc' }))).toEqual([70])
    })
  })

  it('applies the starred filter after ranking', () => {
    const result = getResults(buildState({
      ...libraryFixture,
      filterStr: 'beatles',
      filterStarred: true,
      starredSongs: [12],
    }))
    expect(result).toEqual([12])
  })
})
