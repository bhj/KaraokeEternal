const log = require('electron-log')
log.transports.file.level = false // disable by default
log.transports.console.level = false // disable by default

const util = require('util')
const stripAnsi = require('strip-ansi')
const levels = [false, 'error', 'warn', 'info', 'verbose', 'debug']
const colors = {
  error: '\x1b[1;31m', // red
  warn: '\x1b[1;33m', // yellow
  info: '\x1b[1;34m', // blue
  verbose: '',
  debug: '',
  reset: '\x1b[0m',
}

log.transports.file.format = (msg) => {
  const text = stripAnsi(util.format.apply(null, msg.data))
  return `${msg.date.toLocaleString()} [${msg.level}] ${text}`
}

log.transports.console.format = function (msg) {
  const text = util.format.apply(null, msg.data)
  return colors[msg.level] +
    `${msg.date.toLocaleString()} [${msg.level}] ` +
    colors.reset +
    text
}

if (process.env.KF_CHILD_PROCESS) {
  log.transports.file.fileName = process.env.KF_CHILD_PROCESS + '.log'
}

class Log {
  static set (transport, level = Infinity) {
    log.transports[transport].level = level
    return this
  }

  static getLogger (prefix) {
    if (log.transports.file.level === false && log.transports.console.level === false) {
      throw new Error('no open log transports')
    }

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
