import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { extractUserClaims } from './oidc.js'

/**
 * Minimal stub that satisfies the TokenEndpointResponse & TokenEndpointResponseHelpers
 * shape enough for extractUserClaims to work.
 */
function fakeTokenResponse (claimsData: Record<string, unknown>) {
  return {
    claims: () => claimsData,
  } as any
}

describe('extractUserClaims', () => {
  beforeEach(() => {
    vi.stubEnv('KES_ADMIN_GROUP', 'admin')
    vi.stubEnv('KES_GUEST_GROUP', 'karaoke-guests')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('parses pipe-separated groups string', () => {
    const result = extractUserClaims(fakeTokenResponse({
      sub: 'user1',
      preferred_username: 'alice',
      name: 'Alice',
      groups: 'admin|editors|karaoke-guests',
    }))

    expect(result.groups).toEqual(['admin', 'editors', 'karaoke-guests'])
    expect(result.isAdmin).toBe(true)
    expect(result.isGuest).toBe(true)
  })

  it('parses comma-separated groups string', () => {
    const result = extractUserClaims(fakeTokenResponse({
      sub: 'user2',
      preferred_username: 'bob',
      name: 'Bob',
      groups: 'admin,editors,karaoke-guests',
    }))

    expect(result.groups).toEqual(['admin', 'editors', 'karaoke-guests'])
    expect(result.isAdmin).toBe(true)
    expect(result.isGuest).toBe(true)
  })

  it('handles array groups', () => {
    const result = extractUserClaims(fakeTokenResponse({
      sub: 'user3',
      preferred_username: 'carol',
      name: 'Carol',
      groups: ['admin', 'editors'],
    }))

    expect(result.groups).toEqual(['admin', 'editors'])
    expect(result.isAdmin).toBe(true)
    expect(result.isGuest).toBe(false)
  })

  it('detects admin/guest correctly with comma separator', () => {
    const result = extractUserClaims(fakeTokenResponse({
      sub: 'user4',
      preferred_username: 'dave',
      name: 'Dave',
      groups: 'viewers,karaoke-guests',
    }))

    expect(result.isAdmin).toBe(false)
    expect(result.isGuest).toBe(true)
  })

  it('handles mixed comma and pipe separators', () => {
    const result = extractUserClaims(fakeTokenResponse({
      sub: 'user5',
      preferred_username: 'eve',
      name: 'Eve',
      groups: 'admin,editors|karaoke-guests',
    }))

    expect(result.groups).toEqual(['admin', 'editors', 'karaoke-guests'])
    expect(result.isAdmin).toBe(true)
    expect(result.isGuest).toBe(true)
  })
})
