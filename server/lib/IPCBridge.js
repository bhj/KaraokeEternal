const log = require('./Log').getLogger('IPC')
const {
  _ERROR,
  _SUCCESS,
} = require('../../shared/actionTypes')

const PROCESS_NAME = process.env.KF_CHILD_PROCESS || 'main'
let handlers = {}
const reqs = {}
const pSubs = []
const isParent = typeof process.env.KF_CHILD_PROCESS === 'undefined' // @todo
const isChild = !isParent
let actionId = 0

class IPCBridge {
  static subscribe (p) {
    p.on('message', action => {
      // from child process
      this._handle(action)
    })

    pSubs.push(p)
  }

  static unsubscribe (p) {
    pSubs.splice(pSubs.indexOf(p), 1)
  }

  static emit (action) {
    // log.debug(`${PROCESS_NAME} emit: `, action.type)

    if (isChild) {
      process.send(action)
      return
    }

    if (!pSubs.length) throw new Error('no subscribers')
    pSubs.forEach(p => p.send(action))
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

    this.emit(action)

    return promise
  }

  static _handle (action) {
    const { error, meta, type } = action
    // log.debug(`${PROCESS_NAME} rcv:`, type)

    // is it an ACK for an outstanding request?
    if (meta?.ipcName === PROCESS_NAME && reqs[meta?.ipcId]) {
      if (error) {
        reqs[meta.ipcId].reject(error)
      } else {
        reqs[meta.ipcId].resolve(action.payload)
      }

      delete reqs[meta.ipcId]
      return
    }

    // handle request
    if (!type || typeof handlers[type] !== 'function') {
      log.debug(`${PROCESS_NAME} no handler for action: ${type}`)
      return
    }

    // @todo handle non-promises?
    handlers[type](action).then(res => {
      if (!meta?.noAck) {
        IPCBridge.emit({
          ...action,
          type: type + _SUCCESS,
          payload: res,
        })
      }
    }).catch(err => {
      IPCBridge.emit({
        ...action,
        type: type + _ERROR,
        error: err,
      })

      log.debug(`${PROCESS_NAME} error in ipc action ${type}: ${err.message}`)
    })
  }

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
