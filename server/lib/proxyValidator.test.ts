import { describe, it, expect } from 'vitest'
import { createProxyValidator } from './proxyValidator.js'

describe('proxyValidator', () => {
  describe('when KES_REQUIRE_PROXY is false', () => {
    it('should allow all requests', () => {
      const validate = createProxyValidator({ KES_REQUIRE_PROXY: 'false' })
      expect(validate('1.2.3.4')).toBe(true)
      expect(validate('192.168.1.100')).toBe(true)
      expect(validate('10.0.0.1')).toBe(true)
    })
  })

  describe('when KES_REQUIRE_PROXY is true', () => {
    describe('loopback addresses', () => {
      it('should always allow IPv4 loopback', () => {
        const validate = createProxyValidator({ KES_REQUIRE_PROXY: 'true' })
        expect(validate('127.0.0.1')).toBe(true)
        expect(validate('127.0.0.2')).toBe(true)
        expect(validate('127.255.255.255')).toBe(true)
      })

      it('should always allow IPv6 loopback', () => {
        const validate = createProxyValidator({ KES_REQUIRE_PROXY: 'true' })
        expect(validate('::1')).toBe(true)
      })

      it('should allow IPv6-mapped IPv4 loopback', () => {
        const validate = createProxyValidator({ KES_REQUIRE_PROXY: 'true' })
        expect(validate('::ffff:127.0.0.1')).toBe(true)
      })
    })

    describe('without trusted proxies configured', () => {
      it('should reject non-loopback addresses', () => {
        const validate = createProxyValidator({ KES_REQUIRE_PROXY: 'true' })
        expect(validate('192.168.1.1')).toBe(false)
        expect(validate('10.0.0.1')).toBe(false)
        expect(validate('8.8.8.8')).toBe(false)
      })
    })

    describe('with single IP trusted proxy', () => {
      it('should allow the exact trusted IP', () => {
        const validate = createProxyValidator({
          KES_REQUIRE_PROXY: 'true',
          KES_TRUSTED_PROXIES: '192.168.1.1',
        })
        expect(validate('192.168.1.1')).toBe(true)
      })

      it('should reject other IPs', () => {
        const validate = createProxyValidator({
          KES_REQUIRE_PROXY: 'true',
          KES_TRUSTED_PROXIES: '192.168.1.1',
        })
        expect(validate('192.168.1.2')).toBe(false)
        expect(validate('10.0.0.1')).toBe(false)
      })
    })

    describe('with CIDR range trusted proxy', () => {
      it('should allow IPs within the CIDR range', () => {
        const validate = createProxyValidator({
          KES_REQUIRE_PROXY: 'true',
          KES_TRUSTED_PROXIES: '192.168.1.0/24',
        })
        expect(validate('192.168.1.1')).toBe(true)
        expect(validate('192.168.1.100')).toBe(true)
        expect(validate('192.168.1.254')).toBe(true)
      })

      it('should reject IPs outside the CIDR range', () => {
        const validate = createProxyValidator({
          KES_REQUIRE_PROXY: 'true',
          KES_TRUSTED_PROXIES: '192.168.1.0/24',
        })
        expect(validate('192.168.2.1')).toBe(false)
        expect(validate('10.0.0.1')).toBe(false)
      })

      it('should handle /16 CIDR ranges', () => {
        const validate = createProxyValidator({
          KES_REQUIRE_PROXY: 'true',
          KES_TRUSTED_PROXIES: '10.0.0.0/16',
        })
        expect(validate('10.0.0.1')).toBe(true)
        expect(validate('10.0.255.255')).toBe(true)
        expect(validate('10.1.0.1')).toBe(false)
      })
    })

    describe('with multiple trusted proxies', () => {
      it('should allow IPs matching any trusted proxy', () => {
        const validate = createProxyValidator({
          KES_REQUIRE_PROXY: 'true',
          KES_TRUSTED_PROXIES: '192.168.1.0/24,10.0.0.5',
        })
        expect(validate('192.168.1.100')).toBe(true)
        expect(validate('10.0.0.5')).toBe(true)
      })

      it('should reject IPs not matching any trusted proxy', () => {
        const validate = createProxyValidator({
          KES_REQUIRE_PROXY: 'true',
          KES_TRUSTED_PROXIES: '192.168.1.0/24,10.0.0.5',
        })
        expect(validate('172.16.0.1')).toBe(false)
        expect(validate('10.0.0.6')).toBe(false)
      })
    })

    describe('IPv6 support', () => {
      it('should handle IPv6 addresses in trusted proxies', () => {
        const validate = createProxyValidator({
          KES_REQUIRE_PROXY: 'true',
          KES_TRUSTED_PROXIES: '2001:db8::1',
        })
        expect(validate('2001:db8::1')).toBe(true)
        expect(validate('2001:db8::2')).toBe(false)
      })

      it('should handle IPv6 CIDR ranges', () => {
        const validate = createProxyValidator({
          KES_REQUIRE_PROXY: 'true',
          KES_TRUSTED_PROXIES: '2001:db8::/32',
        })
        expect(validate('2001:db8::1')).toBe(true)
        expect(validate('2001:db8:1::1')).toBe(true)
        expect(validate('2001:db9::1')).toBe(false)
      })
    })

    describe('IPv6-mapped IPv4 normalization', () => {
      it('should normalize ::ffff: prefix and match IPv4 rules', () => {
        const validate = createProxyValidator({
          KES_REQUIRE_PROXY: 'true',
          KES_TRUSTED_PROXIES: '192.168.1.0/24',
        })
        expect(validate('::ffff:192.168.1.100')).toBe(true)
        expect(validate('::ffff:10.0.0.1')).toBe(false)
      })
    })

    describe('edge cases', () => {
      it('should handle whitespace in trusted proxies list', () => {
        const validate = createProxyValidator({
          KES_REQUIRE_PROXY: 'true',
          KES_TRUSTED_PROXIES: '192.168.1.1 , 10.0.0.1',
        })
        expect(validate('192.168.1.1')).toBe(true)
        expect(validate('10.0.0.1')).toBe(true)
      })

      it('should ignore invalid CIDR entries', () => {
        const validate = createProxyValidator({
          KES_REQUIRE_PROXY: 'true',
          KES_TRUSTED_PROXIES: 'invalid,192.168.1.1,also-invalid',
        })
        expect(validate('192.168.1.1')).toBe(true)
        expect(validate('192.168.1.2')).toBe(false)
      })

      it('should handle empty trusted proxies string', () => {
        const validate = createProxyValidator({
          KES_REQUIRE_PROXY: 'true',
          KES_TRUSTED_PROXIES: '',
        })
        // Only loopback should work
        expect(validate('127.0.0.1')).toBe(true)
        expect(validate('192.168.1.1')).toBe(false)
      })
    })
  })

  describe('default behavior based on NODE_ENV', () => {
    it('should default to disabled in development', () => {
      const validate = createProxyValidator({ NODE_ENV: 'development' })
      expect(validate('8.8.8.8')).toBe(true)
    })

    it('should default to enabled in production', () => {
      const validate = createProxyValidator({ NODE_ENV: 'production' })
      expect(validate('8.8.8.8')).toBe(false)
      expect(validate('127.0.0.1')).toBe(true)
    })
  })
})
