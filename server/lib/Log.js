import log from 'electron-log/node.js'
const LEVELS = [false, 'error', 'warn', 'info', 'verbose', 'debug']

class Logger {
  static #instance

  static init (logId, cfg) {
    // defaults
    log.transports.console.level = 'debug'
    log.transports.file.level = false
    log.transports.file.fileName = logId + '.log'

    for (const transport in cfg) {
      for (const key in cfg[transport]) {
        if (key === 'level') log.transports[transport].level = LEVELS[cfg[transport].level]
        else log.transports[transport][key] = cfg[transport][key]
      }
    }

    Logger.#instance = log
    return log
  }

  static getLogger (scope = '') {
    if (!Logger.#instance) throw new Error('logger not initialized')
    return Logger.#instance.scope(scope)
  }
}

// for each process/worker to initialize their logger
export const initLogger = Logger.init

// default export
export default Logger.getLogger
