import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock the logger before importing router (logger not initialized in test env)
vi.mock('../lib/Log.js', () => ({
  default: () => ({ verbose: vi.fn(), info: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}))

import { isUrlAllowed, isContentTypeAllowed, MAX_SIZE_BYTES } from './router.js'

describe('VideoProxy', () => {
  describe('isUrlAllowed', () => {
    it('allows https URLs with public hostnames', () => {
      expect(isUrlAllowed('https://archive.org/download/item/file.mp4')).toBe(true)
      expect(isUrlAllowed('https://ia600206.us.archive.org/29/items/file.mp4')).toBe(true)
      expect(isUrlAllowed('https://example.com/video.webm')).toBe(true)
    })

    it('rejects non-https protocols', () => {
      expect(isUrlAllowed('http://example.com/video.mp4')).toBe(false)
      expect(isUrlAllowed('ftp://example.com/video.mp4')).toBe(false)
      expect(isUrlAllowed('file:///etc/passwd')).toBe(false)
      expect(isUrlAllowed('data:text/html,<script>alert(1)</script>')).toBe(false)
    })

    it('rejects private/loopback IPs (SSRF prevention)', () => {
      expect(isUrlAllowed('https://127.0.0.1/video.mp4')).toBe(false)
      expect(isUrlAllowed('https://127.0.0.42/video.mp4')).toBe(false)
      expect(isUrlAllowed('https://10.0.0.1/video.mp4')).toBe(false)
      expect(isUrlAllowed('https://10.255.255.255/video.mp4')).toBe(false)
      expect(isUrlAllowed('https://172.16.0.1/video.mp4')).toBe(false)
      expect(isUrlAllowed('https://172.31.255.255/video.mp4')).toBe(false)
      expect(isUrlAllowed('https://192.168.0.1/video.mp4')).toBe(false)
      expect(isUrlAllowed('https://192.168.255.255/video.mp4')).toBe(false)
      expect(isUrlAllowed('https://0.0.0.0/video.mp4')).toBe(false)
      expect(isUrlAllowed('https://[::1]/video.mp4')).toBe(false)
    })

    it('allows non-private 172.x addresses', () => {
      expect(isUrlAllowed('https://172.15.0.1/video.mp4')).toBe(true)
      expect(isUrlAllowed('https://172.32.0.1/video.mp4')).toBe(true)
    })

    it('rejects invalid URLs', () => {
      expect(isUrlAllowed('')).toBe(false)
      expect(isUrlAllowed('not-a-url')).toBe(false)
      expect(isUrlAllowed('https://')).toBe(false)
    })

    it('rejects localhost', () => {
      expect(isUrlAllowed('https://localhost/video.mp4')).toBe(false)
      expect(isUrlAllowed('https://localhost:3000/video.mp4')).toBe(false)
    })
  })

  describe('isContentTypeAllowed', () => {
    it('allows video/* MIME types', () => {
      expect(isContentTypeAllowed('video/mp4')).toBe(true)
      expect(isContentTypeAllowed('video/webm')).toBe(true)
      expect(isContentTypeAllowed('video/ogg')).toBe(true)
      expect(isContentTypeAllowed('video/mp4; charset=utf-8')).toBe(true)
    })

    it('allows audio/* MIME types', () => {
      expect(isContentTypeAllowed('audio/mpeg')).toBe(true)
      expect(isContentTypeAllowed('audio/ogg')).toBe(true)
    })

    it('rejects non-media MIME types', () => {
      expect(isContentTypeAllowed('text/html')).toBe(false)
      expect(isContentTypeAllowed('application/json')).toBe(false)
      expect(isContentTypeAllowed('application/javascript')).toBe(false)
      expect(isContentTypeAllowed('image/png')).toBe(false)
    })

    it('rejects null/empty content type', () => {
      expect(isContentTypeAllowed(null)).toBe(false)
      expect(isContentTypeAllowed('')).toBe(false)
    })
  })

  describe('MAX_SIZE_BYTES', () => {
    it('is 500MB', () => {
      expect(MAX_SIZE_BYTES).toBe(500 * 1024 * 1024)
    })
  })
})
