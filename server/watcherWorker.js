const { initLogger } = require('./lib/Log')
const log = initLogger('scanner', {
  console: {
    level: process.env.KES_SCANNER_CONSOLE_LEVEL ?? (process.env.NODE_ENV === 'development' ? 5 : 4),
    useStyles: process.KES_CONSOLE_COLORS ?? undefined,
  },
  file: {
    level: process.env.KES_SCANNER_LOG_LEVEL ?? (process.env.NODE_ENV === 'development' ? 0 : 3),
  }
}).scope(`watcher[${process.pid}]`)

const fs = require('fs')
const pathLib = require('path')
const debounce = require('./lib/debounce')
const IPC = require('./lib/IPCBridge')
const fileTypes = require('./Media/fileTypes')
const {
  WATCHER_WORKER_EVENT,
  WATCHER_WORKER_WATCH,
} = require('../shared/actionTypes')

const refs = []
const searchExts = Object.keys(fileTypes).filter(ext => fileTypes[ext].scan !== false)

IPC.use({
  [WATCHER_WORKER_WATCH]: ({ payload }) => {
    while (refs.length) {
      const ref = refs.shift()
      ref.close()
    }

    const { result, entities } = payload.paths
    const pathIds = result.filter(pathId => entities[pathId]?.prefs?.isWatchingEnabled)

    if (!pathIds.length) {
      log.info('no paths with watching enabled; exiting')
      process.exit(0) // eslint-disable-line n/no-process-exit
    }

    log.info('watching %s path(s):', pathIds.length)

    pathIds.forEach(pathId => {
      log.verbose('  => %s', entities[pathId].path)

      const ref = fs.watch(entities[pathId].path, { recursive: true }, debounce((eventType, filename) => {
        if (!searchExts.includes(pathLib.extname(filename).toLowerCase())) {
          return
        }

        log.info('event in path: %s (filename=%s) (type=%s)', entities[pathId].path, filename, eventType)

        IPC.send({
          type: WATCHER_WORKER_EVENT,
          payload: { pathId },
        })
      }, 3000))

      refs.push(ref)
    })
  },
})
