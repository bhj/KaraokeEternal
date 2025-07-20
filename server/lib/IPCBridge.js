import getLogger from './Log.js'
import { _ERROR, _SUCCESS } from '../../shared/actionTypes.ts'

const log = getLogger('IPCBridge')
const PROCESS_NAME = process.env.KES_CHILD_PROCESS || 'main'
const isParent = typeof process.env.KES_CHILD_PROCESS === 'undefined' // @todo
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor

class IPCParent {
  static children = new Map()
  static handlers = {}

  static send (action, pid) {
    // log.debug(`${PROCESS_NAME} emit: `, action.type)

    if (!this.children.size) throw new Error('no child processes')

    if (!pid) {
      this.children.forEach(p => p.send(action))
      return
    }

    const subprocess = this.children.get(pid)
    if (subprocess) subprocess.send(action)
  }

  // 'this' keyword won't work when this method is passed as the
  // message handler callback, so using the class name (IPCParent)
  static handle (action) {
    const { meta, type } = action

    // log.debug(`${PROCESS_NAME} rcv:`, type)

    if (!type || typeof IPCParent.handlers[type] !== 'function') {
      log.verbose(`${PROCESS_NAME}: no handler for action: ${type}`)
      return
    }

    // synchronous handler: just fire and forget
    if (!(IPCParent.handlers[type] instanceof AsyncFunction)) {
      IPCParent.handlers[type](action)
      return
    }

    // async handler: emit the result back to child
    IPCParent.handlers[type](action).then((res) => {
      IPCParent.send({
        ...action,
        type: type + _SUCCESS,
        payload: res,
      }, meta?.pid)

      return
    }).catch((err) => {
      IPCParent.send({
        ...action,
        type: type + _ERROR,
        error: err,
      }, meta?.pid)

      log.error(`${PROCESS_NAME}: error in ipc action ${type}: ${err.message}`)
    })
  }

  static addChild (subprocess) {
    // parent: handle messages from child process
    subprocess.on('message', action => this.handle(action))
    this.children.set(subprocess.pid, subprocess)
  }

  static removeChild (subprocess) {
    this.children.delete(subprocess.pid)
  }

  static use (obj) {
    this.handlers = {
      ...this.handlers,
      ...obj,
    }
  }
}

class IPCChild {
  static handlers = {}
  static requests = {}
  static reqId = 0

  static send (action) {
    // console.log(`${PROCESS_NAME} emit: `, action.type)
    process.send(action)
  }

  // 'this' keyword won't work when this method is passed as the
  // message handler callback, so using the class name (IPCChild)
  static handle (action) {
    const { error, meta, type } = action

    // is this a response to a pending request?
    if (meta?.pid === process.pid && IPCChild.requests[meta.reqId]) {
      if (error) {
        IPCChild.requests[meta.reqId].reject(error)
      } else {
        IPCChild.requests[meta.reqId].resolve(action.payload)
      }

      // console.log(`${PROCESS_NAME} ack:`, type)

      delete IPCChild.requests[meta.ipcId]
      return
    }

    // console.log(`${PROCESS_NAME} rcv:`, type)

    // handle request
    if (!type || typeof IPCChild.handlers[type] !== 'function') {
      log.verbose(`${PROCESS_NAME}: no handler for action: ${type}`)
      return
    }

    IPCChild.handlers[type](action)
  }

  // used by child processes only
  static req (action) {
    const promise = new Promise((resolve, reject) => {
      this.requests[++this.reqId] = { resolve, reject }
    })

    action = {
      ...action,
      meta: {
        ...action.meta,
        reqId: this.reqId,
        pid: process.pid,
      },
    }

    this.send(action)

    return promise
  }

  static use (obj) {
    this.handlers = {
      ...this.handlers,
      ...obj,
    }
  }
}

export default isParent ? IPCParent : IPCChild

if (!isParent) {
  // child: handle messages from parent process
  // this also prevents child processes from automatically exiting
  process.on('message', IPCChild.handle)
}
