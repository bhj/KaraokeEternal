class DateTime {
  static durationToSeconds (str) {
    const p = str.split(':')
    let s = 0
    let m = 1

    while (p.length > 0) {
      s += m * parseInt(p.pop(), 10)
      m *= 60
    }

    return s
  }
}

module.exports = DateTime
