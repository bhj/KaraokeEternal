import { describe, it, expect, afterEach } from 'vitest'

describe('GET /api/prefs/public', () => {
  const originalEnv = { ...process.env }

  afterEach(() => {
    // Restore original env vars
    process.env = { ...originalEnv }
  })

  describe('SSO configuration', () => {
    it('should include ssoMode: true when Authentik URL is configured', async () => {
      process.env.KES_AUTHENTIK_PUBLIC_URL = 'https://auth.example.com'

      // Import fresh router module
      const routerModule = await import('./router.js')
      const router = routerModule.default

      // Find the /public endpoint handler
      const publicLayer = (router as unknown as { stack: Array<{ path: string, methods: string[], stack: Array<(ctx: unknown, next: () => Promise<void>) => Promise<void>> }> }).stack
        .find(l => l.path === '/api/prefs/public' && l.methods.includes('GET'))

      expect(publicLayer).toBeDefined()

      const ctx = {
        body: undefined as unknown,
      }

      const handler = publicLayer!.stack[publicLayer!.stack.length - 1]
      await handler(ctx, async () => {})

      expect((ctx.body as Record<string, unknown>).ssoMode).toBe(true)
    })

    it('should include ssoMode: false when Authentik URL is not configured', async () => {
      delete process.env.KES_AUTHENTIK_PUBLIC_URL

      const routerModule = await import('./router.js')
      const router = routerModule.default

      const publicLayer = (router as unknown as { stack: Array<{ path: string, methods: string[], stack: Array<(ctx: unknown, next: () => Promise<void>) => Promise<void>> }> }).stack
        .find(l => l.path === '/api/prefs/public' && l.methods.includes('GET'))

      expect(publicLayer).toBeDefined()

      const ctx = {
        body: undefined as unknown,
      }

      const handler = publicLayer!.stack[publicLayer!.stack.length - 1]
      await handler(ctx, async () => {})

      expect((ctx.body as Record<string, unknown>).ssoMode).toBe(false)
    })

    it('should include ssoLoginUrl derived from Authentik URL', async () => {
      process.env.KES_AUTHENTIK_PUBLIC_URL = 'https://auth.example.com'

      const routerModule = await import('./router.js')
      const router = routerModule.default

      const publicLayer = (router as unknown as { stack: Array<{ path: string, methods: string[], stack: Array<(ctx: unknown, next: () => Promise<void>) => Promise<void>> }> }).stack
        .find(l => l.path === '/api/prefs/public' && l.methods.includes('GET'))

      expect(publicLayer).toBeDefined()

      const ctx = {
        body: undefined as unknown,
      }

      const handler = publicLayer!.stack[publicLayer!.stack.length - 1]
      await handler(ctx, async () => {})

      // ssoLoginUrl should be the Authentik outpost start URL (relative path)
      expect((ctx.body as Record<string, unknown>).ssoLoginUrl).toBe('/outpost.goauthentik.io/start/')
    })

    it('should include ssoLoginUrl: null when Authentik is not configured', async () => {
      delete process.env.KES_AUTHENTIK_PUBLIC_URL

      const routerModule = await import('./router.js')
      const router = routerModule.default

      const publicLayer = (router as unknown as { stack: Array<{ path: string, methods: string[], stack: Array<(ctx: unknown, next: () => Promise<void>) => Promise<void>> }> }).stack
        .find(l => l.path === '/api/prefs/public' && l.methods.includes('GET'))

      expect(publicLayer).toBeDefined()

      const ctx = {
        body: undefined as unknown,
      }

      const handler = publicLayer!.stack[publicLayer!.stack.length - 1]
      await handler(ctx, async () => {})

      expect((ctx.body as Record<string, unknown>).ssoLoginUrl).toBe(null)
    })
  })
})
