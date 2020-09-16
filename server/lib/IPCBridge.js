const log = require('./Log').getLogger('IPC')
const {
  _ERROR,
  _SUCCESS,
} = require('../../shared/actionTypes')

const PROCESS_NAME = process.env.KF_CHILD_PROCESS || 'main'
const children = []
let handlers = {}
const reqs = {}
const isParent = typeof process.env.KF_CHILD_PROCESS === 'undefined' // @todo
const isChild = !isParent
let actionId = 0

class IPCBridge {
  static send (action) {
    // log.debug(`${PROCESS_NAME} send: `, action.type)

    if (isChild) {
      process.send(action)
      return
    }

    if (!children.length) throw new Error('no child processes')
    children.forEach(p => p.send(action))
  }

  static req (action) {
    const id = ++actionId
    const promise = new Promise((resolve, reject) => {
      reqs[id] = { resolve, reject }
    })

    action = {
      ...action,
      meta: {
        ...action.meta,
        ipcId: id,
        ipcName: PROCESS_NAME,
      }
    }

    this.send(action)

    return promise
  }

  static _handle (action) {
    const { error, meta, type } = action

    // is it an ACK for an outstanding request?
    if (meta && meta.ipcName === PROCESS_NAME && reqs[meta.ipcId]) {
      if (error) {
        reqs[meta.ipcId].reject(error)
      } else {
        reqs[meta.ipcId].resolve(action.payload)
      }

      // log.debug(`${PROCESS_NAME} ack:`, type)

      delete reqs[meta.ipcId]
      return
    }

    // log.debug(`${PROCESS_NAME} rcv:`, type)

    // handle request
    if (!type || typeof handlers[type] !== 'function') {
      log.debug(`${PROCESS_NAME} no handler for action: ${type}`)
      return
    }

    // @todo handle non-promises?
    handlers[type](action).then(res => {
      if (meta && !meta.noAck) {
        this.send({
          ...action,
          type: type + _SUCCESS,
          payload: res,
        })
      }
    }).catch(err => {
      this.send({
        ...action,
        type: type + _ERROR,
        error: err,
      })

      log.debug(`${PROCESS_NAME} error in ipc action ${type}: ${err.message}`)
    })
  }

  static addChild (p) {
    // message from child process
    p.on('message', action => this._handle(action))
    children.push(p)
  }

  static removeChild (p) { children.splice(children.indexOf(p), 1) }

  // @todo make real middleware?
  static use (obj) {
    handlers = {
      ...handlers,
      ...obj,
    }
  }
}

module.exports = IPCBridge

// make sure IPC channel stays open
if (isChild) {
  process.on('message', IPCBridge._handle)
}
