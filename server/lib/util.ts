import path from 'path'
import crypto from 'crypto'

/**
 * Gets the normalized file extension, in lowercase and including the period.
 *
 * @param {string} filename The filename to extract the extension from.
 * @returns {string} The extension in lowercase with a period, or an empty string.
 */
export const getExt = filename => path.extname(filename).toLowerCase()

/**
 * Parses a scan spec: a comma-separated list of pathIds, "all", and/or "full".
 *
 * @param {string} str The scan spec to parse.
 * @returns {{ pathIds: number[] | boolean, full: boolean }} pathIds is an array
 *   of ids, or a boolean (true when only non-numeric tokens like "all" remain).
 */
export const parsePathIds = (str) => {
  const parts = str ? String(str).split(',').map(p => p.trim()) : []
  const full = parts.some(p => p.toLowerCase() === 'full')
  const rest = parts.filter(p => p.toLowerCase() !== 'full')
  const nums = rest.map(p => parseInt(p, 10)).filter(n => !isNaN(n))

  return {
    full,
    pathIds: nums.length ? nums : !!rest.length,
  }
}

export const randomChars = (length) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const bytes = crypto.randomBytes(length)
  let result = ''

  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length]
  }

  return result
}
