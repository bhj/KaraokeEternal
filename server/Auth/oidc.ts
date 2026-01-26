import * as client from 'openid-client'
import crypto from 'crypto'
import getLogger from '../lib/Log.js'

const log = getLogger('OIDC')

// Cached OIDC configuration
let cachedConfig: client.Configuration | null = null

/**
 * Get or discover the OIDC configuration from the issuer.
 */
export async function getOidcConfig(): Promise<client.Configuration> {
  if (cachedConfig) {
    return cachedConfig
  }

  const issuerUrl = process.env.KES_OIDC_ISSUER_URL
  const clientId = process.env.KES_OIDC_CLIENT_ID
  const clientSecret = process.env.KES_OIDC_CLIENT_SECRET

  if (!issuerUrl || !clientId || !clientSecret) {
    throw new Error('OIDC not configured: missing KES_OIDC_ISSUER_URL, KES_OIDC_CLIENT_ID, or KES_OIDC_CLIENT_SECRET')
  }

  log.info('Discovering OIDC configuration from %s', issuerUrl)

  cachedConfig = await client.discovery(
    new URL(issuerUrl),
    clientId,
    clientSecret,
  )

  return cachedConfig
}

/**
 * Check if OIDC is configured.
 */
export function isOidcConfigured(): boolean {
  return !!(
    process.env.KES_OIDC_ISSUER_URL &&
    process.env.KES_OIDC_CLIENT_ID &&
    process.env.KES_OIDC_CLIENT_SECRET
  )
}

/**
 * Generate a random state string for CSRF protection.
 */
export function generateState(): string {
  return crypto.randomBytes(32).toString('base64url')
}

/**
 * Generate PKCE code_verifier.
 */
export function generateCodeVerifier(): string {
  return client.randomPKCECodeVerifier()
}

/**
 * Calculate PKCE code_challenge from code_verifier.
 */
export async function calculateCodeChallenge(codeVerifier: string): Promise<string> {
  return client.calculatePKCECodeChallenge(codeVerifier)
}

/**
 * Build the authorization URL for login.
 */
export async function buildAuthorizationUrl(
  redirectUri: string,
  state: string,
  codeVerifier: string,
): Promise<string> {
  const config = await getOidcConfig()
  const codeChallenge = await calculateCodeChallenge(codeVerifier)

  const params = new URLSearchParams({
    redirect_uri: redirectUri,
    scope: 'openid profile email groups',
    state: state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  })

  return client.buildAuthorizationUrl(config, params).href
}

/**
 * Exchange authorization code for tokens.
 * @param callbackUrl - The full callback URL including code and state query params
 * @param codeVerifier - The PKCE code verifier
 */
export async function exchangeCode(
  callbackUrl: string,
  codeVerifier: string,
): Promise<client.TokenEndpointResponse & client.TokenEndpointResponseHelpers> {
  const config = await getOidcConfig()

  // authorizationCodeGrant expects the full callback URL with query params
  return client.authorizationCodeGrant(config, new URL(callbackUrl), {
    pkceCodeVerifier: codeVerifier,
  })
}

/**
 * Validate redirect URI to prevent open redirect attacks.
 * Only allows relative paths starting with /.
 */
export function validateRedirectUri(redirect: string | undefined | null): string {
  if (!redirect || typeof redirect !== 'string') {
    return '/'
  }

  // Must start with / and not be a protocol-relative URL (//)
  if (!redirect.startsWith('/') || redirect.startsWith('//')) {
    return '/'
  }

  // Block javascript: and other protocol URLs
  if (redirect.includes(':')) {
    return '/'
  }

  // Block path traversal
  if (redirect.includes('..')) {
    return '/'
  }

  return redirect
}

/**
 * Extract user claims from token response.
 */
export function extractUserClaims(tokenResponse: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers): {
  sub: string
  username: string
  name: string
  email?: string
  groups: string[]
  isAdmin: boolean
  isGuest: boolean
} {
  const claims = tokenResponse.claims()

  if (!claims) {
    throw new Error('No claims in token response')
  }

  const sub = claims.sub
  const username = (claims.preferred_username as string) || (claims.email as string) || sub
  const name = (claims.name as string) || username
  const email = claims.email as string | undefined

  // Groups can come as array or pipe-separated string
  let groups: string[] = []
  if (Array.isArray(claims.groups)) {
    groups = claims.groups as string[]
  } else if (typeof claims.groups === 'string') {
    groups = claims.groups.split('|').map(g => g.trim()).filter(g => g)
  }

  const adminGroup = process.env.KES_ADMIN_GROUP || 'admin'
  const guestGroup = process.env.KES_GUEST_GROUP || 'karaoke-guests'

  return {
    sub,
    username,
    name,
    email,
    groups,
    isAdmin: groups.includes(adminGroup),
    isGuest: groups.includes(guestGroup),
  }
}

/**
 * Build the end session URL for logout.
 */
export async function buildEndSessionUrl(
  idToken?: string,
  postLogoutRedirectUri?: string,
): Promise<string | null> {
  if (!isOidcConfigured()) {
    return null
  }

  try {
    const config = await getOidcConfig()
    const params = new URLSearchParams()

    if (idToken) {
      params.set('id_token_hint', idToken)
    }
    if (postLogoutRedirectUri) {
      params.set('post_logout_redirect_uri', postLogoutRedirectUri)
    }

    return client.buildEndSessionUrl(config, params).href
  } catch {
    return null
  }
}

/**
 * Clear the cached OIDC configuration (useful for testing).
 */
export function clearOidcCache(): void {
  cachedConfig = null
}
