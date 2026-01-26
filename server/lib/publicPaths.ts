/**
 * Public API paths that don't require authentication.
 * These paths are exempt from the API gatekeeper middleware.
 */
export const PUBLIC_API_PATHS = [
  '/api/login',
  '/api/logout',
  '/api/guest/join',
  '/api/rooms/join', // Smart QR + validate (covers /api/rooms/join/*)
  '/api/setup',
  '/api/prefs/public',
  '/api/auth/login', // OIDC login initiation
  '/api/auth/callback', // OIDC callback handler
]

/**
 * Check if a request path is a public API path that doesn't require authentication.
 * Handles URL path prefixes (e.g., /karaoke/api/login when KES_URL_PATH=/karaoke/).
 */
export function isPublicApiPath(requestPath: string, urlPath: string): boolean {
  // Normalize urlPath to always end with /
  const normalizedUrlPath = urlPath.replace(/\/?$/, '/')

  for (const publicPath of PUBLIC_API_PATHS) {
    // Build the full path with prefix (e.g., /karaoke/api/login)
    // publicPath starts with /api, so we need to join them correctly
    const fullPath = normalizedUrlPath + publicPath.slice(1) // Remove leading / from publicPath

    if (requestPath === fullPath || requestPath.startsWith(fullPath + '/') || requestPath.startsWith(fullPath + '?')) {
      return true
    }
  }

  return false
}
