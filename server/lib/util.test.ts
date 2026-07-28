import { describe, it, expect } from 'vitest'
import { parsePathIds } from './util.js'

describe('parsePathIds', () => {
  it('parses a single pathId', () => {
    expect(parsePathIds('5')).toEqual({ pathIds: [5], full: false })
  })

  it('parses a comma-separated list of pathIds', () => {
    expect(parsePathIds('1, 2,3')).toEqual({ pathIds: [1, 2, 3], full: false })
  })

  it('treats "all" as all paths', () => {
    expect(parsePathIds('all')).toEqual({ pathIds: true, full: false })
  })

  it('treats "full" alone as a full scan with no pathIds', () => {
    expect(parsePathIds('full')).toEqual({ pathIds: false, full: true })
  })

  it('combines "full" with pathIds', () => {
    expect(parsePathIds('1,2,full')).toEqual({ pathIds: [1, 2], full: true })
  })

  it('combines "full" with "all"', () => {
    expect(parsePathIds('all,full')).toEqual({ pathIds: true, full: true })
  })

  it('is case-insensitive for "full"', () => {
    expect(parsePathIds('FULL,1')).toEqual({ pathIds: [1], full: true })
  })

  it('ignores non-numeric tokens alongside pathIds', () => {
    expect(parsePathIds('1,x')).toEqual({ pathIds: [1], full: false })
  })

  it('returns no pathIds for empty input', () => {
    expect(parsePathIds('')).toEqual({ pathIds: false, full: false })
    expect(parsePathIds(undefined)).toEqual({ pathIds: false, full: false })
  })
})
