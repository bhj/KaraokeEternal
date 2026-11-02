import getLogger from './Log.js'
import { _ERROR, _SUCCESS } from '../../shared/actionTypes.js'

const log = getLogger('IPCBridge')
const PROCESS_NAME = process.env.KES_CHILD_PROCESS || 'main'
const isParent = typeof process.env.KES_CHILD_PROCESS === 'undefined' // @todo

class IPCParent {
  static children = new Map()
  static handlers = {}
  // Pending parent-issued requests awaiting child responses.
  // Keyed by reqId; value tracks pid so removeChild() can reject them.
  static requests: Record<number, { resolve: (v: unknown) => void, reject: (err: unknown) => void, pid: number }> = {}
  static reqId = 0

  static send (action, pid?) {
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
    const { error, meta, type } = action

    // log.debug(`${PROCESS_NAME} rcv:`, type)

    // Is this a reply to one of our outbound parent → child requests?
    // meta.parent === true identifies it as ours (set by IPCParent.req and
    // preserved through the child's auto-reply).
    if (meta?.parent && meta?.reqId && IPCParent.requests[meta.reqId]) {
      const pending = IPCParent.requests[meta.reqId]
      delete IPCParent.requests[meta.reqId]
      if (type?.endsWith(_ERROR)) pending.reject(error)
      else pending.resolve(action.payload)
      return
    }

    if (!type || typeof IPCParent.handlers[type] !== 'function') {
      log.verbose(`${PROCESS_NAME}: no handler for action: ${type}`)
      return
    }

    // synchronous handler: just fire and forget
    const res = IPCParent.handlers[type](action)

    if (res instanceof Promise) {
      res.then((payload) => {
        if (meta?.reqId) {
          IPCParent.send({
            ...action,
            type: type + _SUCCESS,
            payload,
          }, meta?.pid)
        }
        return null
      }).catch((err) => {
        if (meta?.reqId) {
          IPCParent.send({
            ...action,
            type: type + _ERROR,
            error: err,
          }, meta?.pid)
        }

        log.error(`${PROCESS_NAME}: error in ipc action ${type}: ${err.message}`)
      })
      return
    }

    if (meta?.reqId) {
      IPCParent.send({
        ...action,
        type: type + _SUCCESS,
        payload: res,
      }, meta?.pid)
    }
  }

  // Parent → child request/response. Mirrors IPCChild.req. The target child's
  // handler should return a Promise; the bridge auto-routes the +_SUCCESS /
  // +_ERROR reply back to the returned promise here.
  // The pid arg is optional only for type-compatibility with IPCChild.req
  // (the union-typed default export); at runtime it is required.
  static req (action: { type: string, payload?: unknown }, pid?: number): Promise<unknown> {
    if (pid === undefined) {
      return Promise.reject(new Error('IPCParent.req requires a target pid'))
    }
    if (!this.children.has(pid)) {
      return Promise.reject(new Error(`req: no child with pid ${pid}`))
    }

    const reqId = ++this.reqId
    const promise = new Promise<unknown>((resolve, reject) => {
      this.requests[reqId] = { resolve, reject, pid }
    })

    this.send({
      ...action,
      meta: {
        ...(action as { meta?: object }).meta,
        reqId,
        pid,
        parent: true,
      },
    }, pid)

    return promise
  }

  static addChild (subprocess) {
    // parent: handle messages from child process
    subprocess.on('message', action => this.handle(action))
    this.children.set(subprocess.pid, subprocess)
  }

  static removeChild (subprocess) {
    this.children.delete(subprocess.pid)

    // Reject any pending requests targeting this child so callers don't hang.
    for (const [reqId, pending] of Object.entries(this.requests)) {
      if (pending.pid === subprocess.pid) {
        pending.reject(new Error(`child process ${subprocess.pid} exited before responding`))
        delete this.requests[Number(reqId)]
      }
    }
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
    // meta.parent === true means parent → child request; ignore in this branch.
    if (!meta?.parent && meta?.pid === process.pid && IPCChild.requests[meta.reqId]) {
      if (error) {
        IPCChild.requests[meta.reqId].reject(error)
      } else {
        IPCChild.requests[meta.reqId].resolve(action.payload)
      }

      // console.log(`${PROCESS_NAME} ack:`, type)

      delete IPCChild.requests[meta.reqId]
      return
    }

    // console.log(`${PROCESS_NAME} rcv:`, type)

    // handle request
    if (!type || typeof IPCChild.handlers[type] !== 'function') {
      log.verbose(`${PROCESS_NAME}: no handler for action: ${type}`)
      return
    }

    const res = IPCChild.handlers[type](action)

    if (res instanceof Promise) {
      res.then((payload) => {
        if (meta?.reqId) {
          IPCChild.send({
            ...action,
            type: type + _SUCCESS,
            payload,
          })
        }
        return null
      }).catch((err) => {
        if (meta?.reqId) {
          IPCChild.send({
            ...action,
            type: type + _ERROR,
            error: err,
          })
        }

        log.error(`${PROCESS_NAME}: error in ipc action ${type}: ${err.message}`)
      })
      return
    }

    if (meta?.reqId) {
      IPCChild.send({
        ...action,
        type: type + _SUCCESS,
        payload: res,
      })
    }
  }

  // used by child processes only. The second arg matches IPCParent.req's
  // signature so the union-typed default export has a consistent shape;
  // the child ignores it (child requests are always to the parent).
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static req (action: { type: string, payload?: unknown, meta?: object }, _pid?: number): Promise<unknown> {
    const promise = new Promise((resolve, reject) => {
      this.requests[++this.reqId] = { resolve, reject }
    })

    const stamped = {
      ...action,
      meta: {
        ...action.meta,
        reqId: this.reqId,
        pid: process.pid,
      },
    }

    this.send(stamped)

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
