import net from 'net'

interface ParsedCIDR {
  ip: string
  prefixLen: number
  version: 4 | 6
}

/**
 * Parse CIDR notation (e.g., "192.168.1.0/24") into structured form
 */
function parseCIDR (cidr: string): ParsedCIDR | null {
  const trimmed = cidr.trim()
  const parts = trimmed.split('/')

  if (parts.length === 1) {
    // Single IP, not CIDR
    const version = net.isIP(parts[0])
    if (!version) return null
    return {
      ip: parts[0],
      prefixLen: version === 4 ? 32 : 128,
      version: version as 4 | 6,
    }
  }

  if (parts.length !== 2) return null

  const ip = parts[0]
  const prefixLen = parseInt(parts[1], 10)
  const version = net.isIP(ip)

  if (!version || isNaN(prefixLen)) return null
  if (version === 4 && (prefixLen < 0 || prefixLen > 32)) return null
  if (version === 6 && (prefixLen < 0 || prefixLen > 128)) return null

  return { ip, prefixLen, version: version as 4 | 6 }
}

/**
 * Expand IPv6 shorthand (e.g., "::1" -> "0000:0000:0000:0000:0000:0000:0000:0001")
 */
function expandIPv6 (ip: string): string {
  // Handle IPv4-mapped IPv6 (e.g., ::ffff:192.168.1.1)
  if (ip.includes('.')) {
    const lastColon = ip.lastIndexOf(':')
    const ipv4Part = ip.slice(lastColon + 1)
    const ipv4Parts = ipv4Part.split('.').map(Number)
    const hex1 = ((ipv4Parts[0] << 8) + ipv4Parts[1]).toString(16).padStart(4, '0')
    const hex2 = ((ipv4Parts[2] << 8) + ipv4Parts[3]).toString(16).padStart(4, '0')
    ip = ip.slice(0, lastColon + 1) + hex1 + ':' + hex2
  }

  const parts = ip.split('::')
  if (parts.length === 1) {
    // No :: shorthand, just pad each segment
    return ip.split(':').map(p => p.padStart(4, '0')).join(':')
  }

  const left = parts[0] ? parts[0].split(':') : []
  const right = parts[1] ? parts[1].split(':') : []
  const missing = 8 - left.length - right.length
  const middle = Array(missing).fill('0000')

  return [...left, ...middle, ...right].map(p => p.padStart(4, '0')).join(':')
}

/**
 * Convert IP string to BigInt for bitwise comparison
 */
function ipToBigInt (ip: string, version: 4 | 6): bigint {
  if (version === 4) {
    const parts = ip.split('.').map(Number)
    return BigInt((parts[0] << 24) >>> 0)
      + BigInt((parts[1] << 16) >>> 0)
      + BigInt((parts[2] << 8) >>> 0)
      + BigInt(parts[3])
  }

  // IPv6
  const expanded = expandIPv6(ip)
  const parts = expanded.split(':')
  let result = BigInt(0)
  for (const part of parts) {
    result = (result << BigInt(16)) + BigInt(parseInt(part, 16))
  }
  return result
}

/**
 * Check if IP is within CIDR range
 */
function ipInCIDR (ip: string, cidr: ParsedCIDR): boolean {
  const ipVersion = net.isIP(ip)
  if (!ipVersion || ipVersion !== cidr.version) {
    return false
  }

  const ipBigInt = ipToBigInt(ip, cidr.version)
  const cidrBigInt = ipToBigInt(cidr.ip, cidr.version)
  const bits = cidr.version === 4 ? 32 : 128
  const shiftAmount = BigInt(bits - cidr.prefixLen)

  if (cidr.prefixLen === 0) {
    return true // /0 matches everything
  }

  const mask = ((BigInt(1) << BigInt(bits)) - BigInt(1)) << shiftAmount

  return (ipBigInt & mask) === (cidrBigInt & mask)
}

/**
 * Check if IP is loopback (127.0.0.0/8 or ::1)
 */
function isLoopback (ip: string): boolean {
  const version = net.isIP(ip)
  if (version === 4) {
    return ip.startsWith('127.')
  }
  if (version === 6) {
    const expanded = expandIPv6(ip)
    return expanded === '0000:0000:0000:0000:0000:0000:0000:0001'
  }
  return false
}

/**
 * Normalize IPv6-mapped IPv4 addresses (::ffff:192.168.1.1 -> 192.168.1.1)
 */
function normalizeIP (ip: string): string {
  if (ip.startsWith('::ffff:')) {
    const ipv4Part = ip.slice(7)
    // Check if it's actually an IPv4 address
    if (net.isIPv4(ipv4Part)) {
      return ipv4Part
    }
  }
  return ip
}

/**
 * Create a proxy validator function based on environment configuration
 */
export function createProxyValidator (
  env: Record<string, string | undefined>,
): (remoteAddress: string) => boolean {
  const isDev = env.NODE_ENV === 'development'

  // Determine if proxy enforcement is enabled
  const requireProxy = env.KES_REQUIRE_PROXY !== undefined
    ? env.KES_REQUIRE_PROXY === 'true'
    : !isDev // Default: true in prod, false in dev

  // Parse trusted proxies
  const trustedProxiesRaw = env.KES_TRUSTED_PROXIES || ''
  const trustedProxies = trustedProxiesRaw
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .map(parseCIDR)
    .filter((c): c is ParsedCIDR => c !== null)

  return function validateProxySource (remoteAddress: string): boolean {
    if (!requireProxy) {
      return true
    }

    // Normalize IPv6-mapped IPv4
    const ip = normalizeIP(remoteAddress)

    // Always allow loopback for local development
    if (isLoopback(ip)) {
      return true
    }

    // Check against trusted proxies
    for (const cidr of trustedProxies) {
      if (ipInCIDR(ip, cidr)) {
        return true
      }
    }

    return false
  }
}
