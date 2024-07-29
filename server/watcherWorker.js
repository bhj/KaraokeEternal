import fs from 'fs'
import pathLib from 'path'
import { initLogger } from './lib/Log.js'
import accumulatedThrottle from './lib/accumulatedThrottle.js'
import fileTypes from './Media/fileTypes.js'
import {
  WATCHER_WORKER_EVENT,
  WATCHER_WORKER_WATCH
} from '../shared/actionTypes.js'

const env = JSON.parse(process.env.KES_ENV_JSON)
const log = initLogger('scanner', {
  console: {
    level: env.KES_SCANNER_CONSOLE_LEVEL ?? (env.NODE_ENV === 'development' ? 5 : 4),
    useStyles: env.KES_CONSOLE_COLORS ?? undefined,
  },
  file: {
    level: env.KES_SCANNER_LOG_LEVEL ?? (env.NODE_ENV === 'development' ? 0 : 3),
  }
}).scope(`watcher[${process.pid}]`)

const refs = []
const searchExts = Object.keys(fileTypes).filter(ext => fileTypes[ext].scan !== false)

;(async function () {
  const { default: IPC } = await import('./lib/IPCBridge.js')

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
        log.info('  => %s', entities[pathId].path)

        const cb = accumulatedThrottle((events) => {
          const event = events.find(([_, filename]) => searchExts.includes(pathLib.extname(filename).toLowerCase()))
          if (!event) return

          log.info('event in path: %s (filename=%s) (type=%s)', entities[pathId].path, event[1], event[0])

          IPC.send({
            type: WATCHER_WORKER_EVENT,
            payload: { pathId },
          })
        }, 1000)

        const ref = fs.watch(entities[pathId].path, { recursive: true }, cb)
        refs.push(ref)
      })
    },
  })
})()
