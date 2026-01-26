import { describe, it, expect } from 'vitest'
import { generateState, validateRedirectUri, isOidcConfigured } from './oidc.js'

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
})
