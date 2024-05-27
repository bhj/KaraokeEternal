const path = require('path')

/**
 * Gets the normalized file extension, in lowercase and including the period.
 *
 * @param {string} filename The filename to extract the extension from.
 * @returns {string} The extension in lowercase with a period, or an empty string.
 */
const getExt = (filename) => path.extname(filename).toLowerCase()

function parsePathIds (str) {
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

module.exports = {
  getExt,
  parsePathIds,
}
