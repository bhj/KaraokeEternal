const fs = require('fs')
const log = require('./lib/Log')(`watcher[${process.pid}]`)
const debounce = require('./lib/debounce')
const IPC = require('./lib/IPCBridge')
const {
  WATCHER_WORKER_EVENT,
  WATCHER_WORKER_WATCH,
} = require('../shared/actionTypes')

const refs = []

IPC.use({
  [WATCHER_WORKER_WATCH]: ({ payload }) => {
    while (refs.length) {
      const ref = refs.shift()
      ref.close()
    }

    log.info('watching %s folder(s):', payload.paths.result.length)

    Object.values(payload.paths.entities).forEach(({ path, pathId }) => {
      log.verbose('  -> %s', path)

      fs.watch(path, { recursive: true }, debounce((eventType, filename) => {
        log.info('event in path: %s (filename=%s) (type=%s)', path, filename, eventType)

        IPC.send({
          type: WATCHER_WORKER_EVENT,
          payload: { pathId },
        })
      }, 3000))
    })
  },
})
