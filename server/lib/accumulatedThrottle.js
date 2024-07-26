function accumulatedThrottle (callback, wait) {
  let timeoutID
  let accumulated = []

  return function (...args) {
    accumulated.push(args)

    if (!timeoutID) {
      timeoutID = setTimeout(function () {
        callback(accumulated)
        accumulated = []

        clearTimeout(timeoutID)
        timeoutID = undefined
      }, wait)
    }
  }
}

module.exports = accumulatedThrottle
