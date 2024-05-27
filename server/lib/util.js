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
  parsePathIds,
}
