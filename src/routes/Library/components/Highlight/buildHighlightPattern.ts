const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * Build a single case-insensitive regex with a capturing group that matches any
 * of the query tokens. Returns null when the query is empty so callers can
 * short-circuit rendering.
 */
const buildHighlightPattern = (filterStr: string): RegExp | null => {
  const tokens = filterStr.trim().split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return null
  return new RegExp(`(${tokens.map(escapeRegExp).join('|')})`, 'gi')
}

export default buildHighlightPattern
