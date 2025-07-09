import path from 'path'
import crypto from 'crypto'

/**
 * Gets the normalized file extension, in lowercase and including the period.
 *
 * @param {string} filename The filename to extract the extension from.
 * @returns {string} The extension in lowercase with a period, or an empty string.
 */
export const getExt = filename => path.extname(filename).toLowerCase()

export const parsePathIds = (str) => {
  const nums = []

  // multiple ids?
  if (str && str.includes(',')) {
    const parts = str.split(',')

    for (const part of parts) {
      const n = parseInt(part.trim(), 10)
      if (!isNaN(n)) nums.push(n)
    }
  } else {
    // single id?
    const n = parseInt(str, 10)

    if (!isNaN(n)) nums.push(n)
  }

  if (nums.length) return nums

  return !!str
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
