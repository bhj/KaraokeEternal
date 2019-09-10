// https://github.com/jcoreio/async-throttle
//
// The MIT License (MIT)
//
// Copyright (c) 2016-present Andy Edwards
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
//

const delay = (ms) => new Promise(resolve => setTimeout(resolve, Math.max(ms, 0) || 0))

module.exports = function throttle (
  fn,
  wait,
  options = {}
) {
  const getNextArgs = options.getNextArgs || ((prev, next) => next)

  let nextArgs
  let lastPromise = delay(0)
  let nextPromise = null
  let lastInvokeTime = NaN

  function invoke () {
    lastInvokeTime = Date.now()
    nextPromise = null
    const args = nextArgs
    if (!args) throw new Error('unexpected error: nextArgs is null')
    nextArgs = null
    lastPromise = fn(...args)
    return lastPromise
  }

  return async function (...args) {
    nextArgs = nextArgs
      ? getNextArgs(nextArgs, args)
      : args
    if (!nextPromise) {
      nextPromise = Promise.all([
        lastPromise,
        delay(lastInvokeTime + wait - Date.now())
      ]).then(invoke, invoke)
    }
    return nextPromise
  }
}
