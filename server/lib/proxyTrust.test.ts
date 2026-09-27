import { describe, it, expect } from 'vitest'
import { createProxyTrust } from './proxyTrust.js'

describe('createProxyTrust', () => {
  describe('disabled (no spec)', () => {
    it('is disabled for undefined or empty spec', () => {
      expect(createProxyTrust(undefined).enabled).toBe(false)
      expect(createProxyTrust('').enabled).toBe(false)
      expect(createProxyTrust('  ').enabled).toBe(false)
    })

    it('trusts nothing', () => {
      const trust = createProxyTrust(undefined)
      expect(trust.isTrusted('127.0.0.1')).toBe(false)
    })

    it('returns the socket peer and ignores headers', () => {
      const trust = createProxyTrust(undefined)
      expect(trust.getClientIp('203.0.113.50', '6.6.6.6', '7.7.7.7')).toBe('203.0.113.50')
    })

    it('normalizes an IPv4-mapped IPv6 peer', () => {
      const trust = createProxyTrust(undefined)
      expect(trust.getClientIp('::ffff:192.168.1.7', undefined)).toBe('192.168.1.7')
    })
  })

  describe('presets', () => {
    it('loopback matches 127.0.0.0/8 and ::1 only', () => {
      const trust = createProxyTrust('loopback')
      expect(trust.isTrusted('127.0.0.1')).toBe(true)
      expect(trust.isTrusted('127.5.5.5')).toBe(true)
      expect(trust.isTrusted('::1')).toBe(true)
      expect(trust.isTrusted('192.168.1.1')).toBe(false)
      expect(trust.isTrusted('203.0.113.4')).toBe(false)
    })

    it('private matches RFC1918, link-local and ULA ranges', () => {
      const trust = createProxyTrust('private')
      expect(trust.isTrusted('10.1.2.3')).toBe(true)
      expect(trust.isTrusted('172.16.0.1')).toBe(true)
      expect(trust.isTrusted('172.31.255.255')).toBe(true)
      expect(trust.isTrusted('192.168.1.1')).toBe(true)
      expect(trust.isTrusted('169.254.10.10')).toBe(true)
      expect(trust.isTrusted('fc00::1')).toBe(true)
      expect(trust.isTrusted('fe80::1')).toBe(true)
      expect(trust.isTrusted('127.0.0.1')).toBe(false)
      expect(trust.isTrusted('172.32.0.1')).toBe(false)
      expect(trust.isTrusted('8.8.8.8')).toBe(false)
    })
  })

  describe('explicit entries', () => {
    it('accepts a single IP', () => {
      const trust = createProxyTrust('203.0.113.4')
      expect(trust.isTrusted('203.0.113.4')).toBe(true)
      expect(trust.isTrusted('203.0.113.5')).toBe(false)
    })

    it('accepts a CIDR', () => {
      const trust = createProxyTrust('203.0.113.0/24')
      expect(trust.isTrusted('203.0.113.99')).toBe(true)
      expect(trust.isTrusted('203.0.114.1')).toBe(false)
    })

    it('combines presets and explicit entries', () => {
      const trust = createProxyTrust('loopback, 203.0.113.4')
      expect(trust.isTrusted('127.0.0.1')).toBe(true)
      expect(trust.isTrusted('203.0.113.4')).toBe(true)
      expect(trust.invalid).toEqual([])
      expect(trust.rules.length).toBeGreaterThan(0)
    })

    it('matches an IPv4-mapped IPv6 peer against IPv4 rules', () => {
      const trust = createProxyTrust('loopback')
      expect(trust.isTrusted('::ffff:127.0.0.1')).toBe(true)
    })
  })

  describe('invalid entries', () => {
    it('collects unparseable tokens without throwing', () => {
      const trust = createProxyTrust('loopback,nope,10.0.0.0/8')
      expect(trust.invalid).toEqual(['nope'])
      expect(trust.isTrusted('10.1.1.1')).toBe(true)
    })

    it('rejects an out-of-range CIDR prefix', () => {
      const trust = createProxyTrust('10.0.0.0/99')
      expect(trust.invalid).toEqual(['10.0.0.0/99'])
      expect(trust.rules).toEqual([])
    })
  })

  describe('getClientIp', () => {
    it('returns the peer itself when the peer is untrusted', () => {
      const trust = createProxyTrust('loopback')
      expect(trust.getClientIp('203.0.113.50', '1.2.3.4')).toBe('203.0.113.50')
    })

    it('returns the client behind a single trusted proxy', () => {
      const trust = createProxyTrust('loopback')
      expect(trust.getClientIp('127.0.0.1', '203.0.113.9')).toBe('203.0.113.9')
    })

    it('ignores client-spoofed left-hand X-Forwarded-For entries', () => {
      const trust = createProxyTrust('loopback')
      expect(trust.getClientIp('127.0.0.1', '6.6.6.6, 203.0.113.9')).toBe('203.0.113.9')
    })

    it('walks through chained trusted proxies', () => {
      const trust = createProxyTrust('loopback,private')
      expect(trust.getClientIp('127.0.0.1', '203.0.113.9, 10.0.0.5')).toBe('203.0.113.9')
    })

    it('falls back to the left-most address when every hop is trusted', () => {
      const trust = createProxyTrust('loopback,private')
      expect(trust.getClientIp('127.0.0.1', '10.0.0.5')).toBe('10.0.0.5')
    })

    it('normalizes IPv4-mapped X-Forwarded-For entries', () => {
      const trust = createProxyTrust('loopback')
      expect(trust.getClientIp('127.0.0.1', '::ffff:203.0.113.9')).toBe('203.0.113.9')
    })

    it('prefers a valid override header (e.g. CF-Connecting-IP)', () => {
      const trust = createProxyTrust('loopback')
      expect(trust.getClientIp('127.0.0.1', '10.0.0.5', '198.51.100.7')).toBe('198.51.100.7')
    })

    it('ignores an invalid override header value', () => {
      const trust = createProxyTrust('loopback')
      expect(trust.getClientIp('127.0.0.1', '203.0.113.9', 'garbage')).toBe('203.0.113.9')
    })
  })
})
