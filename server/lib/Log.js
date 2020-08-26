const log = require('electron-log')
const _levels = [false, 'error', 'warn', 'info', 'verbose', 'debug']
const util = require('util')
const stripAnsi = require('strip-ansi')
const colors = {
  error: '\x1b[1;31m', // red
  warn: '\x1b[1;33m', // yellow
  info: '\x1b[1;34m', // blue
  verbose: '',
  debug: '',
  reset: '\x1b[0m',
}

// console defaults
log.transports.console.level = 'debug'
log.transports.console.format = function (msg) {
  const text = util.format.apply(null, msg.data)
  const lvl = ('[' + msg.level + ']').padStart(9, ' ')
  return `${colors[msg.level]}${msg.date.toLocaleString()} ${lvl}${colors.reset} ${text}`
}

// file defaults
log.transports.file.level = false
log.transports.file.fileName = (process.env.KF_CHILD_PROCESS || 'server') + '.log'
log.transports.file.format = (msg) => {
  const text = stripAnsi(util.format.apply(null, msg.data))
  return `${msg.date.toLocaleString()} [${msg.level}] ${text}`
}

class Log {
  static set (transport, userLevel, defaultLevel) {
    if (typeof userLevel !== 'number') userLevel = parseInt(userLevel, 10)

    // resolve level by using the default if the user-provided value is invalid
    if (isNaN(userLevel) || typeof _levels[userLevel] === 'undefined') {
      log.transports[transport].level = _levels[defaultLevel]
    } else {
      log.transports[transport].level = _levels[userLevel]
    }

    return this
  }

  static getLogger (prefix) {
    return {
      error: (txt, ...args) => log.error(prefix + ': ' + txt, ...args),
      warn: (txt, ...args) => log.warn(prefix + ': ' + txt, ...args),
      info: (txt, ...args) => log.info(prefix + ': ' + txt, ...args),
      verbose: (txt, ...args) => log.verbose(prefix + ': ' + txt, ...args),
      debug: (txt, ...args) => log.debug(prefix + ': ' + txt, ...args),
    }
  }
}

module.exports = Log
