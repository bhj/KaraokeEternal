import { describe, it, expect } from 'vitest'
import { buildSsoLoginUrl, getSsoRedirectUrl } from './sso'

describe('SignedOutView SSO helpers', () => {
  it('buildSsoLoginUrl should use redirect param for app-managed OIDC', () => {
    const url = buildSsoLoginUrl('/api/auth/login', '/account?redirect=/library')
    expect(url).toBe('/api/auth/login?redirect=%2Faccount%3Fredirect%3D%2Flibrary')
  })

  it('buildSsoLoginUrl should use rd param for Authentik outpost', () => {
    const url = buildSsoLoginUrl('/outpost.goauthentik.io/start/', '/account?redirect=/library')
    expect(url).toBe('/outpost.goauthentik.io/start/?rd=%2Faccount%3Fredirect%3D%2Flibrary')
  })

  it('getSsoRedirectUrl should return null when config is missing or disabled', () => {
    expect(getSsoRedirectUrl(null, '/account?redirect=/library')).toBeNull()
    expect(getSsoRedirectUrl({ ssoMode: false, ssoLoginUrl: '/api/auth/login' }, '/account?redirect=/library')).toBeNull()
    expect(getSsoRedirectUrl({ ssoMode: true, ssoLoginUrl: null }, '/account?redirect=/library')).toBeNull()
  })

  it('getSsoRedirectUrl should build a login URL when enabled', () => {
    const url = getSsoRedirectUrl({ ssoMode: true, ssoLoginUrl: '/api/auth/login' }, '/account?redirect=/library')
    expect(url).toBe('/api/auth/login?redirect=%2Faccount%3Fredirect%3D%2Flibrary')
  })
})
