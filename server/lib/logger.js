const util = require('util')
const log = require('electron-log')
const stripAnsi = require('strip-ansi')
const config = require('../../project.config')
const levels = [false, 'error', 'warn', 'info', 'verbose', 'debug']
const colors = {
  error: '\x1b[1;31m', // red
  warn: '\x1b[1;33m', // yellow
  info: '\x1b[1;34m', // blue
  verbose: '',
  debug: '',
  reset: '\x1b[0m',
}

if (typeof levels[config.logLevel] !== 'undefined') {
  log.transports.file.level = levels[config.logLevel]
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

function getLogger (prefix) {
  return {
    error: (txt, ...args) => log.error(prefix + ': ' + txt, ...args),
    warn: (txt, ...args) => log.warn(prefix + ': ' + txt, ...args),
    info: (txt, ...args) => log.info(prefix + ': ' + txt, ...args),
    verbose: (txt, ...args) => log.verbose(prefix + ': ' + txt, ...args),
    debug: (txt, ...args) => log.debug(prefix + ': ' + txt, ...args),
    levels,
  }
}

module.exports = getLogger
