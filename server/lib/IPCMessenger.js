const {
  _ERROR,
  _SUCCESS,
} = require('../../shared/actionTypes')

class IPCMessenger {
  constructor (processName) {
    this.name = processName
    this.log = console.log
    this.actionId = 0
    this.handlers = {}
    this.refs = {}

    // parent process only
    if (!process.env.KF_CHILD_PROCESS) {
      // handle child process actions
      process.on('scannerWorker', action => {
        const { type } = action

        // handle request
        if (!type || typeof this.handlers[type] !== 'function') {
          this.log('no handler for action: %s', type)
          return
        }

        this.handlers[type](action).then(res => {
          process.emit('serverWorker', {
            ...action,
            type: type + _SUCCESS,
            payload: res,
          })
        }).catch(err => {
          process.emit('serverWorker', {
            ...action,
            type: type + _ERROR,
            error: err,
          })

          this.log(`error in ipc action ${type}: ${err.message}`)
        })
      })
    }

    // child process only
    if (process.env.KF_CHILD_PROCESS) {
      process.on('message', action => {
        const { error, meta } = action

        if (this.refs[meta?.ipcActionId]) {
          if (error) {
            this.refs[meta.ipcActionId].reject(error)
          } else {
            this.refs[meta.ipcActionId].resolve(action.payload)
          }

          delete this.refs[meta.ipcActionId]
        }
      })
    }
  }

  // child to parent (only children have process.send())
  send (action) {
    const id = ++this.actionId
    const promise = new Promise((resolve, reject) => {
      this.refs[id] = { resolve, reject }
    })

    process.send({
      ...action,
      meta: {
        ...action.meta,
        ipcActionId: id,
      },
    })

    return promise
  }

  // @todo make real middleware?
  use (handlers) {
    this.handlers = {
      ...this.handlers,
      ...handlers,
    }
  }
}

module.exports = IPCMessenger
