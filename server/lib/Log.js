const log = require('electron-log/node')
const LEVELS = [false, 'error', 'warn', 'info', 'verbose', 'debug']

class Logger {
  static #instance

  static init (logId, cfg) {
    // defaults
    log.transports.console.level = 'debug'
    log.transports.file.level = false
    log.transports.file.fileName = logId + '.log'

    for (const transport in cfg) {
      log.transports[transport].level = LEVELS[cfg[transport]]
    }

    Logger.#instance = log
    return log
  }

  static getLogger (scope = '') {
    if (!Logger.#instance) throw new Error('logger not initialized')
    return Logger.#instance.scope(scope)
  }
}

// default export
module.exports = Logger.getLogger

// for each process/worker to initialize their logger
module.exports.initLogger = Logger.init
