import { Readable } from 'stream'
import KoaRouter from '@koa/router'
import getLogger from '../lib/Log.js'

const log = getLogger('VideoProxy')
const router = new KoaRouter({ prefix: '/api/video-proxy' })

export const MAX_SIZE_BYTES = 500 * 1024 * 1024 // 500 MB
const TIMEOUT_MS = 15_000

const PRIVATE_IP_PATTERNS = [
  /^127\./,          // 127.0.0.0/8
  /^10\./,           // 10.0.0.0/8
  /^192\.168\./,     // 192.168.0.0/16
  /^0\.0\.0\.0$/,    // 0.0.0.0
]

/**
 * Check if a hostname is a private/loopback IP or localhost (SSRF prevention).
 */
function isPrivateHost (hostname: string): boolean {
  if (hostname === 'localhost' || hostname === '[::1]') return true
  // Strip brackets for IPv6
  const bare = hostname.replace(/^\[|\]$/g, '')
  if (bare === '::1') return true

  for (const pattern of PRIVATE_IP_PATTERNS) {
    if (pattern.test(bare)) return true
  }

  // 172.16.0.0 – 172.31.255.255
  const m172 = /^172\.(\d+)\./.exec(bare)
  if (m172) {
    const second = parseInt(m172[1], 10)
    if (second >= 16 && second <= 31) return true
  }

  return false
}

/**
 * Validate that a URL is allowed to be proxied.
 * Exported for unit testing.
 */
export function isUrlAllowed (raw: string): boolean {
  let parsed: URL
  try {
    parsed = new URL(raw)
  } catch {
    return false
  }

  if (parsed.protocol !== 'https:') return false
  if (!parsed.hostname) return false
  if (isPrivateHost(parsed.hostname)) return false

  return true
}

/**
 * Validate that a Content-Type header value is an allowed media type.
 * Exported for unit testing.
 */
export function isContentTypeAllowed (ct: string | null): boolean {
  if (!ct) return false
  // Extract MIME type before any parameters (e.g. "; charset=utf-8")
  const mime = ct.split(';')[0].trim().toLowerCase()
  return mime.startsWith('video/') || mime.startsWith('audio/')
}

// GET /api/video-proxy?url=<encoded-url>
router.get('/', async (ctx) => {
  if (!ctx.user?.userId) {
    ctx.throw(401)
  }

  const url = typeof ctx.query.url === 'string' ? ctx.query.url : ''
  if (!isUrlAllowed(url)) {
    ctx.throw(400, 'Invalid or disallowed URL')
  }

  const fetchHeaders: Record<string, string> = {}
  const clientRange = ctx.get('Range')
  if (clientRange) {
    fetchHeaders.Range = clientRange
  }

  let res: Response
  try {
    res = await fetch(url, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      redirect: 'follow',
      headers: fetchHeaders,
    })
  } catch (err) {
    ctx.throw(502, `Upstream fetch failed: ${(err as Error).message}`)
    return // unreachable but satisfies TS
  }

  if (!res.ok && res.status !== 206) {
    ctx.throw(502, `Upstream returned ${res.status}`)
    return
  }

  const contentType = res.headers.get('content-type')
  if (!isContentTypeAllowed(contentType)) {
    // Consume body to avoid dangling connection
    await res.body?.cancel()
    ctx.throw(403, 'Upstream content type not allowed')
    return
  }

  const contentLength = res.headers.get('content-length')
  if (contentLength) {
    const size = parseInt(contentLength, 10)
    if (size > MAX_SIZE_BYTES) {
      await res.body?.cancel()
      ctx.throw(413, 'Upstream resource too large')
      return
    }
    ctx.set('Content-Length', contentLength)
  }

  ctx.set('Content-Type', contentType!)
  ctx.set('Accept-Ranges', 'bytes')

  if (res.status === 206) {
    ctx.status = 206
    const contentRange = res.headers.get('content-range')
    if (contentRange) {
      ctx.set('Content-Range', contentRange)
    }
  }

  log.verbose('proxying %s (%sMB): %s', contentType, contentLength ? (parseInt(contentLength, 10) / 1_000_000).toFixed(2) : '?', url)

  // Convert Web ReadableStream to Node.js Readable for Koa compatibility
  ctx.body = Readable.fromWeb(res.body as import('stream/web').ReadableStream)
})

export default router
