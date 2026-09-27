import net from 'node:net'

// Preset CIDR groups usable in KES_PROXY_TRUST. Only stable, well-known RFC
// ranges are hardcoded; anything else is supplied as explicit IPs/CIDRs.
const PRESETS: Record<string, string[]> = {
  loopback: ['127.0.0.0/8', '::1/128'],
  private: [
    '10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16', '169.254.0.0/16',
    'fc00::/7', 'fe80::/10',
  ],
}

// Normalize an IPv4-mapped IPv6 address (e.g. ::ffff:127.0.0.1) to plain IPv4.
// net.BlockList.check() already maps such addresses to IPv4 rules when given an
// explicit family, so this isn't strictly needed for isTrusted — but it keeps
// the client IP that getClientIp returns in canonical dotted form for logging
// and rate limiting.
function normalizeIp (ip: string): string {
  if (typeof ip !== 'string') return ''
  const v4 = ip.replace(/^::ffff:/i, '')
  return net.isIPv4(v4) ? v4 : ip
}

// Add one IP or CIDR to the block list, throwing on anything unparseable
// (incl. a prefix outside 0..32 / 0..128, which addSubnet rejects).
function addEntry (blockList: net.BlockList, entry: string): void {
  if (entry.includes('/')) {
    const [base, prefixStr] = entry.split('/')
    const prefix = parseInt(prefixStr, 10)
    const family = net.isIP(base) // 0 = invalid, else 4 or 6
    if (!family || Number.isNaN(prefix)) throw new Error(`invalid CIDR: ${entry}`)
    blockList.addSubnet(base, prefix, family === 6 ? 'ipv6' : 'ipv4')
  } else {
    const family = net.isIP(entry)
    if (!family) throw new Error(`invalid IP: ${entry}`)
    blockList.addAddress(entry, family === 6 ? 'ipv6' : 'ipv4')
  }
}

export interface ProxyTrust {
  /** Whether reverse-proxy mode is on (KES_PROXY_TRUST was set) */
  enabled: boolean
  /** Human-readable trust rules that were accepted (net.BlockList.rules) */
  rules: readonly string[]
  /** Original KES_PROXY_TRUST entries that couldn't be parsed, so the caller
   *  can fail fast rather than trust a partial set */
  invalid: readonly string[]
  /** True if the given IP is one of the configured trusted proxies */
  isTrusted (ip: string): boolean
  /** Resolve the real client IP given the socket peer, X-Forwarded-For, and an
   *  optional trusted override header value (e.g. CF-Connecting-IP) */
  getClientIp (remoteAddress: string, xForwardedFor: string | undefined, overrideIp?: string): string
}

export function createProxyTrust (spec: string | undefined): ProxyTrust {
  const enabled = typeof spec === 'string' && spec.trim() !== ''
  const blockList = new net.BlockList()
  const invalid: string[] = []

  if (enabled) {
    const tokens = spec.split(',').map(t => t.trim()).filter(Boolean)

    for (const token of tokens) {
      // a preset expands to known-good CIDRs; any other token is a literal IP/CIDR
      const items = Object.hasOwn(PRESETS, token) ? PRESETS[token] : [token]
      try {
        for (const entry of items) addEntry(blockList, entry)
      } catch {
        invalid.push(token)
      }
    }
  }

  function isTrusted (ip: string): boolean {
    if (!enabled) return false
    const norm = normalizeIp(ip)
    const family = net.isIP(norm)
    return family !== 0 && blockList.check(norm, family === 6 ? 'ipv6' : 'ipv4')
  }

  function getClientIp (remoteAddress: string, xForwardedFor: string | undefined, overrideIp?: string): string {
    const remote = normalizeIp(remoteAddress)
    if (!enabled) return remote

    // A trusted proxy may name the real client directly (e.g. CF-Connecting-IP);
    // callers only pass this once the peer is confirmed trusted.
    if (overrideIp) {
      const norm = normalizeIp(overrideIp.trim())
      if (net.isIP(norm)) return norm
    }

    // Walk from the socket peer leftward through X-Forwarded-For (reversed): the
    // first address that isn't a trusted proxy is the real client. This ignores
    // any client-spoofed left-hand entries, which a fixed hop count would trust.
    const forwarded = (xForwardedFor || '')
      .split(',')
      .map(s => normalizeIp(s.trim()))
      .filter(Boolean)
      .reverse()

    const chain = [remote, ...forwarded]
    for (const addr of chain) {
      if (!isTrusted(addr)) return addr
    }
    // every hop was a trusted proxy; fall back to the left-most claimed address
    return chain[chain.length - 1] || remote
  }

  return { enabled, rules: blockList.rules, invalid, isTrusted, getClientIp }
}
