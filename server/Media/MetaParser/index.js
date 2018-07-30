const defaultMiddleware = require('./defaultMiddleware')
const { composeSync } = require('ctx-compose')

module.exports = function (cfg = {}) {
  const parser = typeof cfg === 'function'
    ? composeSync([
      defaultMiddleware.wrapperMiddleware,
      ...cfg(defaultMiddleware),
    ])
    : composeSync([
      defaultMiddleware.wrapperMiddleware,
      ...defaultMiddleware.preMiddleware,
      ...defaultMiddleware.parseMiddleware,
      ...defaultMiddleware.postMiddleware,
    ])

  return function (str) {
    return parser({ str, cfg })
  }
}
