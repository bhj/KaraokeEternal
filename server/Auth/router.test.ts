import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { generateState, validateRedirectUri, isOidcConfigured, validatePostLogoutRedirectUri } from './oidc.js'

describe('OIDC Utilities', () => {
  describe('generateState', () => {
    it('should generate a random state string', () => {
      const state1 = generateState()
      const state2 = generateState()

      expect(state1).toBeDefined()
      expect(typeof state1).toBe('string')
      expect(state1.length).toBeGreaterThan(20)
      // States should be unique
      expect(state1).not.toBe(state2)
    })
  })

  describe('validateRedirectUri', () => {
    it('should allow relative paths', () => {
      expect(validateRedirectUri('/library')).toBe('/library')
      expect(validateRedirectUri('/library?roomId=123')).toBe('/library?roomId=123')
      expect(validateRedirectUri('/')).toBe('/')
    })

    it('should reject absolute URLs (open redirect prevention)', () => {
      expect(validateRedirectUri('https://evil.com/steal')).toBe('/')
      expect(validateRedirectUri('http://evil.com')).toBe('/')
      expect(validateRedirectUri('//evil.com')).toBe('/')
      expect(validateRedirectUri('javascript:alert(1)')).toBe('/')
    })

    it('should handle empty or undefined redirect', () => {
      expect(validateRedirectUri('')).toBe('/')
      expect(validateRedirectUri(undefined)).toBe('/')
      expect(validateRedirectUri(null as unknown as string)).toBe('/')
    })

    it('should handle path traversal attempts', () => {
      expect(validateRedirectUri('../etc/passwd')).toBe('/')
      expect(validateRedirectUri('/foo/../../../etc/passwd')).toBe('/')
    })
  })

  describe('isOidcConfigured', () => {
    it('should return false when env vars are not set', () => {
      // Env vars are not set in test environment
      expect(isOidcConfigured()).toBe(false)
    })
  })

  describe('validatePostLogoutRedirectUri - CRITICAL: Open Redirect Prevention', () => {
    let originalPublicUrl: string | undefined

    beforeEach(() => {
      originalPublicUrl = process.env.KES_PUBLIC_URL
    })

    afterEach(() => {
      if (originalPublicUrl !== undefined) {
        process.env.KES_PUBLIC_URL = originalPublicUrl
      } else {
        delete process.env.KES_PUBLIC_URL
      }
    })

    it('should return null when KES_PUBLIC_URL is not configured', () => {
      delete process.env.KES_PUBLIC_URL
      expect(validatePostLogoutRedirectUri('https://anything.com/')).toBeNull()
    })

    it('should allow URIs that start with KES_PUBLIC_URL', () => {
      process.env.KES_PUBLIC_URL = 'https://karaoke.example.com'
      expect(validatePostLogoutRedirectUri('https://karaoke.example.com')).toBe('https://karaoke.example.com')
      expect(validatePostLogoutRedirectUri('https://karaoke.example.com/')).toBe('https://karaoke.example.com/')
      expect(validatePostLogoutRedirectUri('https://karaoke.example.com/library')).toBe('https://karaoke.example.com/library')
    })

    it('should reject URIs that do not start with KES_PUBLIC_URL', () => {
      process.env.KES_PUBLIC_URL = 'https://karaoke.example.com'
      expect(validatePostLogoutRedirectUri('https://evil.com')).toBeNull()
      expect(validatePostLogoutRedirectUri('https://karaoke.example.com.evil.com')).toBeNull()
      expect(validatePostLogoutRedirectUri('https://attacker.com/https://karaoke.example.com')).toBeNull()
    })

    it('should reject null and undefined URIs', () => {
      process.env.KES_PUBLIC_URL = 'https://karaoke.example.com'
      expect(validatePostLogoutRedirectUri(null)).toBeNull()
      expect(validatePostLogoutRedirectUri(undefined)).toBeNull()
      expect(validatePostLogoutRedirectUri('')).toBeNull()
    })

    it('should handle protocol-relative URLs as attacks', () => {
      process.env.KES_PUBLIC_URL = 'https://karaoke.example.com'
      expect(validatePostLogoutRedirectUri('//evil.com')).toBeNull()
    })
  })
})
