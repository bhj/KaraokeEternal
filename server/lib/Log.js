const util = require('util')
const _levels = [false, 'error', 'warn', 'info', 'verbose', 'debug']
let _defaultInstance

class Log {
  constructor (logId, cfg) {
    this.logger = require('electron-log').create(logId)

    // defaults
    this.logger.transports.console.level = 'debug'
    this.logger.transports.file.level = false
    this.logger.transports.file.fileName = logId + '.log'

    for (const transport in cfg) {
      this.logger.transports[transport].level = cfg[transport]
    }
  }

  setDefaultInstance () {
    _defaultInstance = this
    return this
  }

  static resolve (userLevel, defaultLevel) {
    return typeof _levels[userLevel] === 'undefined'
      ? _levels[defaultLevel]
      : _levels[userLevel]
  }
}

class IPCLog {
  constructor (scope = '') {
    const IPC = require('./IPCBridge')
    const { SCANNER_WORKER_LOG } = require('../../shared/actionTypes')
    const send = (level, str, ...args) => {
      IPC.send({
        type: SCANNER_WORKER_LOG,
        payload: {
          level,
          msg: `${scope ? scope + ': ' : ''}${util.format(str, ...args)}`,
        },
        meta: {
          noAck: true,
        }
      })
    }

    return {
      error: send.bind(this, 'error'),
      warn: send.bind(this, 'warn'),
      info: send.bind(this, 'info'),
      verbose: send.bind(this, 'verbose'),
      debug: send.bind(this, 'debug'),
    }
  }
}

function getLogger (scope = '') {
  if (!_defaultInstance) throw new Error('no default logger instance')
  return _defaultInstance.logger.scope(scope)
}

function getIPCLogger (scope = '') {
  return new IPCLog(scope)
}

// default export
module.exports = process.env.KES_CHILD_PROCESS ? getIPCLogger : getLogger

// used by main.js to instantiate the loggers
module.exports.Log = Log
